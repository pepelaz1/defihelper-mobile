import { useCallback, useEffect, useRef, useState } from "react";

import { loadDashboardData } from "../services/uniswapService";
import type { DashboardData } from "../types/uniswap";

export const useWalletPools = (wallets: string[]) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const fastData = await loadDashboardData(wallets, { includePancakeBnb: false });

      if (requestIdRef.current !== requestId) {
        return;
      }

      setData(fastData);

      const fullData = await loadDashboardData(wallets, { includePancakeBnb: true });

      if (requestIdRef.current !== requestId) {
        return;
      }

      setData(fullData);
    } catch (cause) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      const message = cause instanceof Error ? cause.message : "Unknown error";
      setError(message);
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
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
