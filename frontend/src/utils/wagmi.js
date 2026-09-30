import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import {
  metaMask,
  injected,
  coinbaseWallet,
  walletConnect,
} from 'wagmi/connectors';

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

// WalletConnect requires a public project ID from https://cloud.walletconnect.com
const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || 'demo-project-id';

export const wagmiConfig = createConfig({
  chains: [robinhoodTestnet, arbitrumSepolia],
  connectors: [
    metaMask({
      dappMetadata: { name: 'Yield Pilot', url: 'https://yieldpilot.xyz' },
    }),
    coinbaseWallet({
      appName: 'Yield Pilot',
      appLogoUrl: 'https://yieldpilot.xyz/logo.png',
    }),
    walletConnect({ projectId: WC_PROJECT_ID, showQrModal: true }),
    injected({ target: 'okxWallet' }),
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [robinhoodTestnet.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
  multiInjectedProviderDiscovery: true,
});