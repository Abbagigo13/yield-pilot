import { createConfig, http } from 'wagmi';
import { injected, metaMask } from 'wagmi/connectors';
import { defineChain } from 'viem';

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.chain.robinhood.com'] },
    public: { http: ['https://rpc.testnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Explorer',
      url: 'https://explorer.testnet.chain.robinhood.com',
    },
  },
  testnet: true,
});

export const arbitrumSepolia = defineChain({
  id: 421614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] },
    public: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [robinhoodTestnet, arbitrumSepolia],
  connectors: [injected(), metaMask()],
  transports: {
    [robinhoodTestnet.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});