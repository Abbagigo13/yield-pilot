// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../IStrategy.sol";

/// @notice TEST/DEMO ONLY. Holds the asset and reports a configurable APY.
///         Simulate yield by sending extra tokens to this contract.
contract MockStrategy is IStrategy {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    address public immutable vault;
    uint256 public apy;

    error OnlyVault();

    constructor(address _asset, address _vault, uint256 _apyBps) {
        asset = IERC20(_asset);
        vault = _vault;
        apy = _apyBps;
    }

    modifier onlyVault() {
        if (msg.sender != vault) revert OnlyVault();
        _;
    }

    function deposit(uint256 amount) external onlyVault {
        asset.safeTransferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) external onlyVault returns (uint256) {
        asset.safeTransfer(vault, amount);
        return amount;
    }

    function totalAssets() external view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    function apyBps() external view returns (uint256) {
        return apy;
    }

    function setApy(uint256 _apyBps) external {
        apy = _apyBps;
    }
}
