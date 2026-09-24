import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from 'wagmi';

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const connectInjected = () => {
    const injectedConnector =
      connectors.find((c) => c.id === 'injected') || connectors[0];
    if (injectedConnector) connect({ connector: injectedConnector });
  };

  return {
    address,
    isConnected,
    chain,
    chainId,
    balance,
    connect: connectInjected,
    disconnect,
    isPending,
    error,
    connectors,
  };
}