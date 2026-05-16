import { useCallback, useEffect, useState } from "react";

import { loadDashboardData } from "../services/uniswapService";
import type { DashboardData } from "../types/uniswap";

export const useWalletPools = (wallets: string[]) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextData = await loadDashboardData(wallets);
      setData(nextData);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [wallets]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    error,
    isLoading,
    refresh
  };
};
