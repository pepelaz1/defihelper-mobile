import type { DashboardData } from "../types/uniswap";

export const mockDashboardData: DashboardData = {
  meta: {
    mode: "mock"
  },
  summary: {
    walletCount: 2,
    poolCount: 3,
    totalPositionValueLabel: "$428.4K"
  },
  pools: [
    {
      chain: "Ethereum",
      feeTier: "0.30%",
      liquidityLabel: "1 active position",
      poolAddress: "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
      positionCount: 1,
      positionValueUsd: 186100,
      positionValueLabel: "$186.1K",
      token0Symbol: "USDC",
      token1Symbol: "ETH",
      totalValueLockedUsd: 185400000,
      totalValueLockedLabel: "$185.4M",
      volumeUsdLabel: "$96.3M",
      walletAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    },
    {
      chain: "Ethereum",
      feeTier: "0.05%",
      liquidityLabel: "2 active positions",
      poolAddress: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640",
      positionCount: 2,
      positionValueUsd: 154800,
      positionValueLabel: "$154.8K",
      token0Symbol: "USDC",
      token1Symbol: "USDT",
      totalValueLockedUsd: 312000000,
      totalValueLockedLabel: "$312.0M",
      volumeUsdLabel: "$143.7M",
      walletAddress: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
    },
    {
      chain: "Ethereum",
      feeTier: "1.00%",
      liquidityLabel: "1 active position",
      poolAddress: "0xcbcdf9626bc03e24f779434178a73a0b4bad62ed",
      positionCount: 1,
      positionValueUsd: 87500,
      positionValueLabel: "$87.5K",
      token0Symbol: "WBTC",
      token1Symbol: "ETH",
      totalValueLockedUsd: 68400000,
      totalValueLockedLabel: "$68.4M",
      volumeUsdLabel: "$18.9M",
      walletAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    }
  ]
};
