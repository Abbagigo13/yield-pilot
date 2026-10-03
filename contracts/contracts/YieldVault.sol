// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./IStrategy.sol";

/**
 * @title YieldVault
 * @notice Share-based vault that routes deposits to whitelisted yield strategies.
 *         An AI agent (restricted controller role) can only:
 *           - allocate idle funds to a whitelisted strategy
 *           - move funds between two whitelisted strategies (if APY delta is met)
 *           - pull funds from a strategy back to the vault
 *         The agent can NEVER send funds to an arbitrary address.
 *         New strategies must wait `strategyDelay` before the owner can activate them.
 */
contract YieldVault is Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    uint256 public constant BPS = 10_000;
    uint256 public constant MAX_STRATEGIES = 10;
    uint256 public constant MINIMUM_SHARES = 1_000; // locked forever, blocks inflation attack
    address private constant DEAD = address(0xdead);

    // ============ Immutable config ============
    IERC20 public immutable asset;
    uint256 public immutable strategyDelay; // seconds between propose and activate

    // ============ State ============
    address public agent;

    /// Risk limit: max share of total assets allowed in ONE strategy (basis points)
    uint256 public maxStrategyBps = 5_000; // 50%

    /// Risk limit: new strategy APY must beat old strategy APY by at least this (basis points)
    uint256 public minApyDeltaBps = 50; // 0.50%

    uint256 public totalShares;
    mapping(address => uint256) public shares;

    mapping(address => bool) public isStrategy;
    address[] public strategies;
    mapping(address => uint256) public pendingStrategyTime; // 0 = not proposed

    // ============ Events ============
    event Deposited(address indexed user, uint256 assets, uint256 shares);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares);
    event StrategyProposed(address indexed strategy, uint256 activatableAt);
    event StrategyProposalCancelled(address indexed strategy);
    event StrategyAdded(address indexed strategy);
    event StrategyRemoved(address indexed strategy);
    event Allocated(address indexed strategy, uint256 amount);
    event Deallocated(address indexed strategy, uint256 amount);
    event Rebalanced(address indexed from, address indexed to, uint256 amount);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);
    event MaxStrategyBpsUpdated(uint256 bps);
    event MinApyDeltaBpsUpdated(uint256 bps);
    event EmergencyExit();

    // ============ Errors ============
    error NotAgent();
    error NotStrategy();
    error ZeroAddress();
    error ZeroAmount();
    error ZeroShares();
    error DepositTooSmall();
    error InsufficientShares();
    error InsufficientLiquidity();
    error InvalidRiskLimit();
    error ExceedsRiskLimit();
    error ApyDeltaTooLow();
    error SameStrategy();
    error AlreadyStrategy();
    error NotProposed();
    error DelayNotElapsed();
    error TooManyStrategies();
    error StrategyNotEmpty();

    constructor(address _asset, address _owner, uint256 _strategyDelay) Ownable(_owner) {
        if (_asset == address(0)) revert ZeroAddress();
        asset = IERC20(_asset);
        strategyDelay = _strategyDelay;
    }

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    // ============ Admin ============
    function setAgent(address _agent) external onlyOwner {
        if (_agent == address(0)) revert ZeroAddress();
        emit AgentUpdated(agent, _agent);
        agent = _agent;
    }

    function setMaxStrategyBps(uint256 _bps) external onlyOwner {
        if (_bps == 0 || _bps > BPS) revert InvalidRiskLimit();
        maxStrategyBps = _bps;
        emit MaxStrategyBpsUpdated(_bps);
    }

    function setMinApyDeltaBps(uint256 _bps) external onlyOwner {
        if (_bps > BPS) revert InvalidRiskLimit();
        minApyDeltaBps = _bps;
        emit MinApyDeltaBpsUpdated(_bps);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ---- Strategy whitelist (propose -> wait -> activate) ----
    function proposeStrategy(address _strategy) external onlyOwner {
        if (_strategy == address(0)) revert ZeroAddress();
        if (isStrategy[_strategy]) revert AlreadyStrategy();
        uint256 activatableAt = block.timestamp + strategyDelay;
        pendingStrategyTime[_strategy] = activatableAt == 0 ? 1 : activatableAt;
        emit StrategyProposed(_strategy, activatableAt);
    }

    function cancelStrategy(address _strategy) external onlyOwner {
        if (pendingStrategyTime[_strategy] == 0) revert NotProposed();
        delete pendingStrategyTime[_strategy];
        emit StrategyProposalCancelled(_strategy);
    }

    function activateStrategy(address _strategy) external onlyOwner {
        uint256 t = pendingStrategyTime[_strategy];
        if (t == 0) revert NotProposed();
        if (block.timestamp < t) revert DelayNotElapsed();
        if (strategies.length >= MAX_STRATEGIES) revert TooManyStrategies();
        delete pendingStrategyTime[_strategy];
        isStrategy[_strategy] = true;
        strategies.push(_strategy);
        emit StrategyAdded(_strategy);
    }

    /// A strategy must be emptied (deallocated) before it can be removed.
    function removeStrategy(address _strategy) external onlyOwner {
        if (!isStrategy[_strategy]) revert NotStrategy();
        if (IStrategy(_strategy).totalAssets() != 0) revert StrategyNotEmpty();
        isStrategy[_strategy] = false;

        uint256 len = strategies.length;
        for (uint256 i = 0; i < len; i++) {
            if (strategies[i] == _strategy) {
                strategies[i] = strategies[len - 1];
                strategies.pop();
                break;
            }
        }
        emit StrategyRemoved(_strategy);
    }

    /// Emergency: pause the vault and pull everything from all strategies back to idle.
    /// Withdrawals stay open while paused.
    function emergencyExit() external onlyOwner nonReentrant {
        if (!paused()) _pause();
        uint256 len = strategies.length;
        for (uint256 i = 0; i < len; i++) {
            address s = strategies[i];
            uint256 bal = IStrategy(s).totalAssets();
            if (bal > 0) {
                // one broken strategy must not block the rest
                try IStrategy(s).withdraw(bal) returns (uint256) {} catch {}
            }
        }
        emit EmergencyExit();
    }

    // ============ User Actions ============
    function deposit(uint256 amount) external nonReentrant whenNotPaused returns (uint256 minted) {
        if (amount == 0) revert ZeroAmount();

        uint256 assetsBefore = totalAssets();
        uint256 balBefore = asset.balanceOf(address(this));
        asset.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = asset.balanceOf(address(this)) - balBefore; // fee-on-transfer safe

        if (totalShares == 0) {
            if (received <= MINIMUM_SHARES) revert DepositTooSmall();
            minted = received - MINIMUM_SHARES;
            shares[DEAD] = MINIMUM_SHARES;
            totalShares = received;
        } else {
            minted = (received * totalShares) / assetsBefore;
            if (minted == 0) revert ZeroShares();
            totalShares += minted;
        }

        shares[msg.sender] += minted;
        emit Deposited(msg.sender, received, minted);
    }

    /// @param shareAmount number of vault shares to burn
    function withdraw(uint256 shareAmount) external nonReentrant returns (uint256 assets) {
        if (shareAmount == 0) revert ZeroAmount();
        if (shares[msg.sender] < shareAmount) revert InsufficientShares();

        assets = (shareAmount * totalAssets()) / totalShares;
        if (assets == 0) revert ZeroAmount();

        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;

        _ensureLiquidity(assets);
        asset.safeTransfer(msg.sender, assets);
        emit Withdrawn(msg.sender, assets, shareAmount);
    }

    // ============ Agent Actions ============
    /// Idle vault funds -> strategy
    function allocate(address strategy, uint256 amount) external onlyAgent whenNotPaused nonReentrant {
        if (!isStrategy[strategy]) revert NotStrategy();
        if (amount == 0) revert ZeroAmount();
        if (asset.balanceOf(address(this)) < amount) revert InsufficientLiquidity();

        _depositToStrategy(strategy, amount);
        _checkCap(strategy);
        emit Allocated(strategy, amount);
    }

    /// Strategy -> idle vault funds
    function deallocate(address strategy, uint256 amount) external onlyAgent nonReentrant {
        if (!isStrategy[strategy]) revert NotStrategy();
        if (amount == 0) revert ZeroAmount();

        IStrategy(strategy).withdraw(amount);
        emit Deallocated(strategy, amount);
    }

    /// Strategy A -> strategy B (both must be whitelisted, APY must improve enough)
    function rebalance(address from, address to, uint256 amount) external onlyAgent whenNotPaused nonReentrant {
        if (from == to) revert SameStrategy();
        if (!isStrategy[from] || !isStrategy[to]) revert NotStrategy();
        if (amount == 0) revert ZeroAmount();
        if (IStrategy(to).apyBps() < IStrategy(from).apyBps() + minApyDeltaBps) revert ApyDeltaTooLow();

        uint256 balBefore = asset.balanceOf(address(this));
        IStrategy(from).withdraw(amount);
        uint256 received = asset.balanceOf(address(this)) - balBefore;

        _depositToStrategy(to, received);
        _checkCap(to);
        emit Rebalanced(from, to, received);
    }

    // ============ Views ============
    /// Idle balance + value held in every strategy
    function totalAssets() public view returns (uint256 total) {
        total = asset.balanceOf(address(this));
        uint256 len = strategies.length;
        for (uint256 i = 0; i < len; i++) {
            total += IStrategy(strategies[i]).totalAssets();
        }
    }

    function convertToAssets(uint256 shareAmount) public view returns (uint256) {
        if (totalShares == 0) return shareAmount;
        return (shareAmount * totalAssets()) / totalShares;
    }

    function convertToShares(uint256 assetAmount) public view returns (uint256) {
        uint256 ta = totalAssets();
        if (totalShares == 0 || ta == 0) return assetAmount;
        return (assetAmount * totalShares) / ta;
    }

    /// A user's balance in underlying asset terms (includes earned yield)
    function balanceOf(address user) external view returns (uint256) {
        return convertToAssets(shares[user]);
    }

    function strategiesLength() external view returns (uint256) {
        return strategies.length;
    }

    function getStrategies() external view returns (address[] memory) {
        return strategies;
    }

    // ============ Internal ============
    function _depositToStrategy(address strategy, uint256 amount) internal {
        asset.forceApprove(strategy, amount);
        IStrategy(strategy).deposit(amount);
        asset.forceApprove(strategy, 0);
    }

    /// Cumulative cap: the strategy's TOTAL value must stay <= maxStrategyBps of total assets
    function _checkCap(address strategy) internal view {
        if (IStrategy(strategy).totalAssets() * BPS > totalAssets() * maxStrategyBps) {
            revert ExceedsRiskLimit();
        }
    }

    /// Pull funds back from strategies if the vault doesn't hold enough idle cash
    function _ensureLiquidity(uint256 needed) internal {
        uint256 idle = asset.balanceOf(address(this));
        if (idle >= needed) return;

        uint256 len = strategies.length;
        for (uint256 i = 0; i < len; i++) {
            address s = strategies[i];
            uint256 shortfall = needed - idle;
            uint256 avail = IStrategy(s).totalAssets();
            uint256 toPull = shortfall < avail ? shortfall : avail;
            if (toPull > 0) {
                IStrategy(s).withdraw(toPull);
            }
            idle = asset.balanceOf(address(this));
            if (idle >= needed) return;
        }
        revert InsufficientLiquidity();
    }
}
