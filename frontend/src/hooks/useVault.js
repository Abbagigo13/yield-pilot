import { useCallback, useMemo } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACTS, VAULT_ABI, ERC20_ABI } from '../utils/contracts';

export function useVault() {
  const { address } = useAccount();
  const chainId = useChainId();

  const config = useMemo(() => {
    if (chainId === 46630) return CONTRACTS.robinhoodTestnet;
    if (chainId === 421614) return CONTRACTS.arbitrumSepolia;
    return null;
  }, [chainId]);

  const vaultAddress = config?.vault;
  const usdcAddress = config?.usdc;

  /* ---------- Reads ---------- */

  const { data: usdcBalance, refetch: refetchUsdc } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!usdcAddress },
  });

  const { data: usdcDecimals } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: !!usdcAddress },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && vaultAddress ? [address, vaultAddress] : undefined,
    query: { enabled: !!address && !!vaultAddress && !!usdcAddress },
  });

  const { data: vaultBalance, refetch: refetchVault } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!vaultAddress },
  });

    const { data: userShares, refetch: refetchShares } = useReadContract({
    address: vaultAddress,
    abi: VAULT_ABI,
    functionName: 'shares',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!vaultAddress },
  });

  const decimals = usdcDecimals ?? 18;

  const formatted = useMemo(
    () => ({
      wallet: usdcBalance ? Number(formatUnits(usdcBalance, decimals)) : 0,
      vault: vaultBalance ? Number(formatUnits(vaultBalance, decimals)) : 0,
      allowance: allowance ? Number(formatUnits(allowance, decimals)) : 0,
    }),
    [usdcBalance, vaultBalance, allowance, decimals]
  );

  /* ---------- Writes ---------- */

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const approve = useCallback(
    (amount) => {
      if (!usdcAddress || !vaultAddress) return;
      const parsed = parseUnits(amount.toString(), decimals);
      writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [vaultAddress, parsed],
      });
    },
    [usdcAddress, vaultAddress, decimals, writeContract]
  );

  const deposit = useCallback(
    (amount) => {
      if (!vaultAddress) return;
      const parsed = parseUnits(amount.toString(), decimals);
      writeContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [parsed],
      });
    },
    [vaultAddress, decimals, writeContract]
  );

    const withdraw = useCallback(
    (amount) => {
      if (!vaultAddress || !vaultBalance || !userShares) return;
      const parsed = parseUnits(amount.toString(), decimals);
      const sharesToBurn =
        parsed >= vaultBalance
          ? userShares
          : (parsed * userShares) / vaultBalance;
      if (sharesToBurn === 0n) return;
      writeContract({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [sharesToBurn],
      });
    },
    [vaultAddress, vaultBalance, userShares, decimals, writeContract]
  );
    const refetchAll = useCallback(() => {
    refetchUsdc();
    refetchAllowance();
    refetchVault();
    refetchShares();
  }, [refetchUsdc, refetchAllowance, refetchVault, refetchShares]);

  return {
    isConnected: !!address,
    address,
    chainId,
    config,
    balances: formatted,
    decimals,
    approve,
    deposit,
    withdraw,
    refetchAll,
    txHash,
    isPending: isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    resetWrite,
  };
}