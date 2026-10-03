// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IStrategy
 * @notice Minimal interface a yield strategy adapter must expose to YieldVault.
 *         The strategy pulls the asset from the vault on deposit() and sends it
 *         back to the vault (msg.sender) on withdraw().
 */
interface IStrategy {
    /// @notice Pull `amount` of the vault asset from msg.sender (vault) and put it to work.
    function deposit(uint256 amount) external;

    /// @notice Send `amount` of the asset back to msg.sender (vault). Returns amount sent.
    function withdraw(uint256 amount) external returns (uint256);

    /// @notice Total value (principal + yield) the vault currently has in this strategy.
    function totalAssets() external view returns (uint256);

    /// @notice Current APY of this strategy, in basis points (500 = 5.00%).
    function apyBps() external view returns (uint256);
}
