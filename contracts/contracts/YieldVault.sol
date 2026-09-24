// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title YieldVault
 * @notice A simple vault that holds user deposits and routes them to whitelisted
 *         yield strategies. The AI agent (via a controller role) can trigger
 *         rebalancing between strategies.
 */
contract YieldVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;

    // Agent address allowed to trigger rebalances
    address public agent;

    // Total assets held by the vault
    uint256 public totalDeposits;

    // User balances
    mapping(address => uint256) public balances;

    // Whitelisted strategy addresses
    mapping(address => bool) public isStrategy;

    // Risk limit: max % of total deposits allowed in a single strategy (basis points)
    uint256 public maxStrategyBps = 5000; // 50%

    // Current active strategy
    address public activeStrategy;

    // ============ Events ============
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event StrategyAdded(address indexed strategy);
    event StrategyRemoved(address indexed strategy);
    event Rebalanced(address indexed from, address indexed to, uint256 amount);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);

    // ============ Errors ============
    error NotAgent();
    error NotStrategy();
    error ZeroAmount();
    error InsufficientBalance();
    error InvalidRiskLimit();

    constructor(address _asset, address _owner) Ownable(_owner) {
        asset = IERC20(_asset);
    }

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    // ============ Admin ============
    function setAgent(address _agent) external onlyOwner {
        emit AgentUpdated(agent, _agent);
        agent = _agent;
    }

    function setMaxStrategyBps(uint256 _bps) external onlyOwner {
        if (_bps > 10000) revert InvalidRiskLimit();
        maxStrategyBps = _bps;
    }

    function addStrategy(address _strategy) external onlyOwner {
        isStrategy[_strategy] = true;
        emit StrategyAdded(_strategy);
    }

    function removeStrategy(address _strategy) external onlyOwner {
        isStrategy[_strategy] = false;
        emit StrategyRemoved(_strategy);
    }

    // ============ User Actions ============
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        asset.safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        totalDeposits += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (balances[msg.sender] < amount) revert InsufficientBalance();
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        asset.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // ============ Agent Actions ============
    function rebalance(address newStrategy, uint256 amount) external onlyAgent {
        if (!isStrategy[newStrategy]) revert NotStrategy();
        if (amount > (totalDeposits * maxStrategyBps) / 10000) revert InvalidRiskLimit();

        emit Rebalanced(activeStrategy, newStrategy, amount);
        activeStrategy = newStrategy;
    }
}