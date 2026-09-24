import axios from 'axios';
import {
  mockPortfolio,
  mockStrategies,
  mockAgentStatus,
  mockHistory,
  mockAgentLogs,
  mockChatHistory,
} from './mockData';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Flip to false once the backend is live
const USE_MOCK = true;

const delay = (ms = 250) => new Promise((res) => setTimeout(res, ms));

export async function getPortfolio(_address) {
  if (USE_MOCK) {
    await delay();
    return mockPortfolio;
  }
  const { data } = await client.get(`/portfolio/${_address}`);
  return data;
}

export async function getStrategies() {
  if (USE_MOCK) {
    await delay();
    return mockStrategies;
  }
  const { data } = await client.get('/strategies');
  return data;
}

export async function getAgentStatus() {
  if (USE_MOCK) {
    await delay();
    return mockAgentStatus;
  }
  const { data } = await client.get('/agent/status');
  return data;
}

export async function getAgentLogs() {
  if (USE_MOCK) {
    await delay();
    return mockAgentLogs;
  }
  const { data } = await client.get('/agent/logs');
  return data;
}

export async function startAgent() {
  if (USE_MOCK) {
    await delay();
    return { ok: true };
  }
  const { data } = await client.post('/agent/start');
  return data;
}

export async function stopAgent() {
  if (USE_MOCK) {
    await delay();
    return { ok: true };
  }
  const { data } = await client.post('/agent/stop');
  return data;
}

export async function getHistory(_address) {
  if (USE_MOCK) {
    await delay();
    return mockHistory;
  }
  const { data } = await client.get(`/history/${_address}`);
  return data;
}

export async function sendChatMessage(_message) {
  if (USE_MOCK) {
    await delay(600);
    return {
      role: 'agent',
      content: `I scanned 12 pools. Best USDC yield right now is Aave V3 at 4.2% APY. Want me to rebalance?`,
      timestamp: Date.now(),
    };
  }
  const { data } = await client.post('/agent/chat', { message: _message });
  return data;
}

export { mockChatHistory };