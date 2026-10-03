import { parseAbi } from 'viem';
export const CONTRACTS = {
robinhoodTestnet: {
    chainId: 46630,
    usdc: "0x251bEa83FCf334a292Ac25006Acc3889e394587B",
    vault: "0xC1117e87618C5789734C43839F2F45800CB22796",
  },
  arbitrumSepolia: {
    chainId: 421614,
    usdc: "",
    vault: "",
  },
};

export const VAULT_ABI = parseAbi([
  'function deposit(uint256 amount) returns (uint256)',
  'function withdraw(uint256 shareAmount) returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function shares(address) view returns (uint256)',
  'function totalAssets() view returns (uint256)',
  'function totalShares() view returns (uint256)',
  'function convertToShares(uint256) view returns (uint256)',
  'function getStrategies() view returns (address[])',
  'function asset() view returns (address)',
]);

export const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
    'function mint(address to, uint256 amount)',
]);