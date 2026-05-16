export type DashboardPool = {
  chain: string;
  feeTier: string;
  liquidityLabel: string;
  poolAddress: string;
  positionValueUsd: number;
  positionValueLabel: string;
  positionCount: number;
  token0Symbol: string;
  token1Symbol: string;
  totalValueLockedUsd: number;
  totalValueLockedLabel: string;
  volumeUsdLabel: string;
  walletAddress: string;
};

export type DashboardData = {
  meta: {
    mode: "live" | "mock";
  };
  pools: DashboardPool[];
  summary: {
    poolCount: number;
    totalPositionValueLabel: string;
    walletCount: number;
  };
};
