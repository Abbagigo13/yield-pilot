// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Test ERC20 for local and testnet deployments. Anyone can mint.
 *         Do NOT use in production.
 */
contract MockERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
    {}

    /// @notice Public faucet-style mint for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}