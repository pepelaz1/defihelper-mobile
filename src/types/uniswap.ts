export type DashboardPool = {
  dex: string;
  chain: string;
  chainKey: string;
  feeTier: string;
  currentPriceLabel?: string;
  inversePriceLabel?: string;
  liquidityLabel: string;
  poolAddress: string;
  positionState?: "active" | "inactive" | "farmed";
  positionAmount0Label?: string;
  positionAmount1Label?: string;
  positionValueUsd: number;
  positionValueLabel: string;
  positionCount: number;
  rangeMaxLabel?: string;
  rangeMinLabel?: string;
  rangeProgress?: number;
  rangeStatus?: "below" | "in-range" | "above";
  token0Symbol: string;
  token1Symbol: string;
  totalValueLockedUsd: number;
  totalValueLockedLabel: string;
  farmRewardLabel?: string;
  debugLiquidityLabel?: string;
  debugTokensOwedLabel?: string;
  debugPendingCakeLabel?: string;
  uncollectedFee0Label?: string;
  uncollectedFee1Label?: string;
  volumeUsdLabel: string;
  walletAddress: string;
};

export type DashboardData = {
  meta: {
    mode: "live" | "mock";
    sourceLabel: string;
  };
  pools: DashboardPool[];
  summary: {
    poolCount: number;
    totalPositionValueLabel: string;
    walletCount: number;
  };
};
