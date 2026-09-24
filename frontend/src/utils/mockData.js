export const mockStrategies = [
  {
    id: 'aave-usdc',
    name: 'Aave V3',
    asset: 'USDC',
    apy: 4.2,
    tvl: 1_250_000,
    risk: 'low',
    allocation: 45,
    address: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    color: '#00ffa3',
  },
  {
    id: 'compound-usdc',
    name: 'Compound V3',
    asset: 'USDC',
    apy: 3.8,
    tvl: 820_000,
    risk: 'low',
    allocation: 30,
    address: '0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA',
    color: '#00d4ff',
  },
  {
    id: 'uniswap-eth-usdc',
    name: 'Uniswap V3',
    asset: 'ETH/USDC',
    apy: 12.5,
    tvl: 2_100_000,
    risk: 'medium',
    allocation: 15,
    address: '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443',
    color: '#a855f7',
  },
  {
    id: 'radiant-usdc',
    name: 'Radiant',
    asset: 'USDC',
    apy: 6.1,
    tvl: 540_000,
    risk: 'medium',
    allocation: 10,
    address: '0x8E7a5A4B2c7c6aC7c7a2C7D9b0b0b0b0b0b0b0b0',
    color: '#ff2d92',
  },
];

export const mockPortfolio = {
  totalDeposited: 12450.5,
  totalEarnings: 342.18,
  currentApy: 5.42,
  activeStrategy: 'Aave V3',
  change24h: 0.84,
  allocation: [
    { name: 'Aave V3', value: 45, color: '#00ffa3' },
    { name: 'Compound V3', value: 30, color: '#00d4ff' },
    { name: 'Uniswap V3', value: 15, color: '#a855f7' },
    { name: 'Radiant', value: 10, color: '#ff2d92' },
  ],
};

export const mockAgentStatus = {
  active: true,
  lastRebalance: Date.now() - 2 * 60 * 60 * 1000,
  decisionsCount: 47,
  uptimeHours: 312,
  riskTolerance: 'balanced',
  maxPerStrategy: 50,
};

export const mockAgentLogs = [
  {
    id: 'log-1',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    type: 'rebalance',
    message: 'Moved 15% USDC from Compound → Aave (APY diff +0.4%)',
  },
  {
    id: 'log-2',
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    type: 'scan',
    message: 'Scanned 12 yield opportunities across 4 protocols',
  },
  {
    id: 'log-3',
    timestamp: Date.now() - 14 * 60 * 60 * 1000,
    type: 'risk',
    message: 'Detected ETH/USDC impermanent loss above threshold, reduced exposure',
  },
  {
    id: 'log-4',
    timestamp: Date.now() - 26 * 60 * 60 * 1000,
    type: 'rebalance',
    message: 'Increased Uniswap V3 allocation by 5% (fees up 22%)',
  },
  {
    id: 'log-5',
    timestamp: Date.now() - 48 * 60 * 60 * 1000,
    type: 'info',
    message: 'Agent initialized with balanced risk profile',
  },
];

export const mockHistory = [
  {
    id: 'tx-1',
    type: 'deposit',
    amount: 5000,
    asset: 'USDC',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    txHash: '0xabc123...def456',
  },
  {
    id: 'tx-2',
    type: 'rebalance',
    amount: 1200,
    asset: 'USDC',
    from: 'Compound V3',
    to: 'Aave V3',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    txHash: '0x789ghi...012jkl',
  },
  {
    id: 'tx-3',
    type: 'deposit',
    amount: 7450.5,
    asset: 'USDC',
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
    txHash: '0x345mno...678pqr',
  },
  {
    id: 'tx-4',
    type: 'rebalance',
    amount: 800,
    asset: 'USDC',
    from: 'Aave V3',
    to: 'Uniswap V3',
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    txHash: '0x901stu...234vwx',
  },
];

export const mockChatHistory = [
  {
    id: 'msg-1',
    role: 'agent',
    content:
      'Hi! I\u2019m your Yield Pilot agent. Ask me things like "What\u2019s the best USDC yield right now?" or "Rebalance to lower risk."',
    timestamp: Date.now() - 60_000,
  },
];