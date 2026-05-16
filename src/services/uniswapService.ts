import { mockDashboardData } from "../data/mockPools";
import type { DashboardData, DashboardPool } from "../types/uniswap";
import { formatUsd, normalizeWallet } from "../utils/format";

const DATA_MODE = process.env.EXPO_PUBLIC_UNISWAP_DATA_MODE ?? "mock";
const SUBGRAPH_URL = process.env.EXPO_PUBLIC_UNISWAP_V3_SUBGRAPH_URL ?? "";

type GraphPosition = {
  depositedToken0: string;
  depositedToken1: string;
  id: string;
  pool: {
    feeTier: string;
    id: string;
    totalValueLockedUSD: string;
    token0: {
      symbol: string;
    };
    token1: {
      symbol: string;
    };
    volumeUSD: string;
  };
  withdrawnToken0: string;
  withdrawnToken1: string;
};

const walletPositionsQuery = `
  query WalletPositions($owner: String!) {
    positions(
      first: 50
      where: { owner: $owner, liquidity_gt: "0" }
      orderBy: depositedToken0
      orderDirection: desc
    ) {
      id
      depositedToken0
      depositedToken1
      withdrawnToken0
      withdrawnToken1
      pool {
        id
        feeTier
        totalValueLockedUSD
        volumeUSD
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
    }
  }
`;

const fetchWalletPositions = async (owner: string): Promise<GraphPosition[]> => {
  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: walletPositionsQuery,
      variables: {
        owner
      }
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "Unknown GraphQL error");
  }

  return payload.data.positions as GraphPosition[];
};

const buildPoolCard = (walletAddress: string, positions: GraphPosition[]): DashboardPool => {
  const pool = positions[0].pool;
  const estimatedPositionValue = positions.reduce((sum, position) => {
    const netToken0 = Number(position.depositedToken0) - Number(position.withdrawnToken0);
    const netToken1 = Number(position.depositedToken1) - Number(position.withdrawnToken1);

    return sum + Math.abs(netToken0) * 1000 + Math.abs(netToken1) * 1000;
  }, 0);

  return {
    chain: "Ethereum",
    feeTier: `${(Number(pool.feeTier) / 10000).toFixed(2)}%`,
    liquidityLabel: `${positions.length} active position${positions.length > 1 ? "s" : ""}`,
    poolAddress: pool.id,
    positionCount: positions.length,
    positionValueUsd: estimatedPositionValue,
    positionValueLabel: formatUsd(estimatedPositionValue),
    token0Symbol: pool.token0.symbol,
    token1Symbol: pool.token1.symbol,
    totalValueLockedUsd: Number(pool.totalValueLockedUSD),
    totalValueLockedLabel: formatUsd(Number(pool.totalValueLockedUSD)),
    volumeUsdLabel: formatUsd(Number(pool.volumeUSD)),
    walletAddress
  };
};

export const loadDashboardData = async (wallets: string[]): Promise<DashboardData> => {
  const normalizedWallets = wallets.map(normalizeWallet).filter(Boolean);

  if (!normalizedWallets.length) {
    return {
      meta: {
        mode: DATA_MODE === "live" ? "live" : "mock"
      },
      pools: [],
      summary: {
        poolCount: 0,
        totalPositionValueLabel: "$0",
        walletCount: 0
      }
    };
  }

  if (DATA_MODE !== "live" || !SUBGRAPH_URL) {
    return {
      ...mockDashboardData,
      summary: {
        ...mockDashboardData.summary,
        walletCount: normalizedWallets.length
      }
    };
  }

  const walletResults = await Promise.all(
    normalizedWallets.map(async (walletAddress) => {
      const positions = await fetchWalletPositions(walletAddress);

      const poolsByAddress = positions.reduce<Record<string, GraphPosition[]>>((acc, position) => {
        const key = position.pool.id;
        acc[key] = acc[key] ? [...acc[key], position] : [position];
        return acc;
      }, {});

      return Object.values(poolsByAddress).map((poolPositions) =>
        buildPoolCard(walletAddress, poolPositions)
      );
    })
  );

  const pools = walletResults.flat().sort((left, right) => right.totalValueLockedUsd - left.totalValueLockedUsd);
  const totalPositionValue = pools.reduce((sum, pool) => sum + pool.positionValueUsd, 0);

  return {
    meta: {
      mode: "live"
    },
    pools,
    summary: {
      poolCount: pools.length,
      totalPositionValueLabel: formatUsd(totalPositionValue),
      walletCount: normalizedWallets.length
    }
  };
};
