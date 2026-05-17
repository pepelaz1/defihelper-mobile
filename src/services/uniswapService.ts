import { Token } from "@uniswap/sdk-core";
import { Pool, Position, tickToPrice } from "@uniswap/v3-sdk";
import { Contract, formatUnits, JsonRpcProvider } from "ethers";
import { mockDashboardData } from "../data/mockPools";
import type { DashboardData, DashboardPool } from "../types/uniswap";
import { formatPriceRatio, formatTokenAmount, formatUsd, normalizeWallet } from "../utils/format";

const DATA_MODE = process.env.EXPO_PUBLIC_UNISWAP_DATA_MODE ?? "live";
const ETHEREUM_SUBGRAPH_URL =
  process.env.EXPO_PUBLIC_UNISWAP_V3_SUBGRAPH_URL ??
  "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";
const ARBITRUM_SUBGRAPH_URL =
  process.env.EXPO_PUBLIC_UNISWAP_V3_ARBITRUM_SUBGRAPH_URL ??
  "https://api.thegraph.com/subgraphs/id/FQ6JYszEKApsBpAmiHesRsd9Ygc6mzmpNRANeVQFYoVX";
const ETHEREUM_RPC_URL = process.env.EXPO_PUBLIC_ETHEREUM_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
const ARBITRUM_RPC_URL = process.env.EXPO_PUBLIC_ARBITRUM_RPC_URL ?? "https://arb1.arbitrum.io/rpc";
const OPTIMISM_RPC_URL = process.env.EXPO_PUBLIC_OPTIMISM_RPC_URL ?? "https://optimism-rpc.publicnode.com";
const POLYGON_RPC_URL = process.env.EXPO_PUBLIC_POLYGON_RPC_URL ?? "https://polygon-bor-rpc.publicnode.com";
const BNB_RPC_URL = process.env.EXPO_PUBLIC_BNB_RPC_URL ?? "https://bsc-rpc.publicnode.com";
const AVALANCHE_RPC_URL = process.env.EXPO_PUBLIC_AVALANCHE_RPC_URL ?? "https://avalanche-c-chain-rpc.publicnode.com";

type ChainConfig = {
  chainId: number;
  chainKey: string;
  chainLabel: string;
  dexLabel: string;
  dexScreenerKey: string;
  factoryAddress: string;
  masterChefAddress?: string;
  positionManagerAddress: string;
  rpcUrl: string;
  subgraphUrl?: string;
};

type LoadDashboardOptions = {
  includePancakeBnb?: boolean;
};

const CHAIN_CONFIGS: ChainConfig[] = [
  {
    chainId: 1,
    chainKey: "ethereum",
    chainLabel: "Ethereum",
    dexLabel: "Uniswap",
    dexScreenerKey: "ethereum",
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    positionManagerAddress: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    rpcUrl: ETHEREUM_RPC_URL,
    subgraphUrl: ETHEREUM_SUBGRAPH_URL
  },
  {
    chainId: 42161,
    chainKey: "arbitrum",
    chainLabel: "Arbitrum",
    dexLabel: "Uniswap",
    dexScreenerKey: "arbitrum",
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    positionManagerAddress: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    rpcUrl: ARBITRUM_RPC_URL,
    subgraphUrl: ARBITRUM_SUBGRAPH_URL
  },
  {
    chainId: 10,
    chainKey: "optimism",
    chainLabel: "Optimism",
    dexLabel: "Uniswap",
    dexScreenerKey: "optimism",
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    positionManagerAddress: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    rpcUrl: OPTIMISM_RPC_URL
  },
  {
    chainId: 137,
    chainKey: "polygon",
    chainLabel: "Polygon",
    dexLabel: "Uniswap",
    dexScreenerKey: "polygon",
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    positionManagerAddress: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    rpcUrl: POLYGON_RPC_URL
  },
  {
    chainId: 56,
    chainKey: "bnb",
    chainLabel: "BNB Chain",
    dexLabel: "Uniswap",
    dexScreenerKey: "bsc",
    factoryAddress: "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7",
    positionManagerAddress: "0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613",
    rpcUrl: BNB_RPC_URL
  },
  {
    chainId: 43114,
    chainKey: "avalanche",
    chainLabel: "Avalanche",
    dexLabel: "Uniswap",
    dexScreenerKey: "avalanche",
    factoryAddress: "0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD",
    positionManagerAddress: "0x655C406EBFa14EE2006250925e54ec43AD184f8B",
    rpcUrl: AVALANCHE_RPC_URL
  },
  {
    chainId: 56,
    chainKey: "bnb-pancake",
    chainLabel: "BNB Chain",
    dexLabel: "PancakeSwap",
    dexScreenerKey: "bsc",
    factoryAddress: "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865",
    masterChefAddress: "0x556B9306565093C855AEA9AE92A594704c2Cd59e",
    positionManagerAddress: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    rpcUrl: BNB_RPC_URL
  }
];

type GraphPosition = {
  collectedFeesToken0: string;
  collectedFeesToken1: string;
  depositedToken0: string;
  depositedToken1: string;
  id: string;
  pool: {
    feeTier: string;
    id: string;
    totalValueLockedUSD: string;
    token0: {
      derivedETH: string;
      symbol: string;
    };
    token1: {
      derivedETH: string;
      symbol: string;
    };
    volumeUSD: string;
  };
  withdrawnToken0: string;
  withdrawnToken1: string;
};

type GraphPayload = {
  bundle: {
    ethPriceUSD: string;
  } | null;
  positions: GraphPosition[];
};

type OnchainPosition = {
  currentPriceLabel: string;
  debugLiquidityLabel?: string;
  debugPendingCakeLabel?: string;
  debugTokensOwedLabel?: string;
  fee: number;
  farmRewardLabel?: string;
  id: string;
  inversePriceLabel: string;
  poolAddress: string;
  positionState: "active" | "inactive" | "farmed";
  positionAmount0Label: string;
  positionAmount1Label: string;
  rangeMaxLabel: string;
  rangeMinLabel: string;
  rangeProgress: number;
  rangeStatus: "below" | "in-range" | "above";
  token0Symbol: string;
  token1Symbol: string;
  totalValueLockedLabel: string;
  totalValueLockedUsd: number;
  uncollectedFee0Label?: string;
  uncollectedFee1Label?: string;
  volumeUsdLabel: string;
};

type DexScreenerPairResponse = {
  pair?: {
    liquidity?: {
      usd?: number;
    };
    volume?: {
      h24?: number;
    };
  };
  pairs?: Array<{
    liquidity?: {
      usd?: number;
    };
    volume?: {
      h24?: number;
    };
  }>;
};

const positionManagerAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)"
];
const erc20Abi = ["function symbol() view returns (string)", "function decimals() view returns (uint8)"];
const factoryAbi = ["function getPool(address tokenA, address tokenB, uint24 fee) view returns (address)"];
const poolAbi = [
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool)",
  "function liquidity() view returns (uint128)",
  "function feeGrowthGlobal0X128() view returns (uint256)",
  "function feeGrowthGlobal1X128() view returns (uint256)",
  "function ticks(int24 tick) view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128, int56 tickCumulativeOutside, uint160 secondsPerLiquidityOutsideX128, uint32 secondsOutside, bool initialized)"
];
const masterChefV3Abi = [
  "event Deposit(address indexed from, uint256 pid, uint256 tokenId, uint256 liquidity, int24 tickLower, int24 tickUpper)",
  "event Withdraw(address indexed from, address indexed to, uint256 pid, uint256 tokenId)",
  "function userPositionInfos(uint256 tokenId) view returns (uint128 liquidity, uint128 boostLiquidity, int24 tickLower, int24 tickUpper, uint256 rewardGrowthInside, uint256 reward, address user, uint256 pid, uint256 boostMultiplier)",
  "function pendingCake(uint256 tokenId) view returns (uint256 reward)"
];
const Q128 = 1n << 128n;
const UINT256_MOD = 1n << 256n;
const DIRECT_PANCAKE_TOKEN_IDS: Record<string, string[]> = {
  [normalizeWallet("0xf528a8ad312a6330ec42591bc53954f021ee697e")]: ["6637559"]
};
const CHAIN_FETCH_TIMEOUT_MS = 8_000;

const fetchDexScreenerMetrics = async (chainKey: string, poolAddress: string) => {
  if (!poolAddress || poolAddress === "Unavailable" || /^0x0{40}$/i.test(poolAddress)) {
    return null;
  }

  const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chainKey}/${poolAddress}`);

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as DexScreenerPairResponse;
  const pair = payload.pair ?? payload.pairs?.[0];

  if (!pair) {
    return null;
  }

  return {
    liquidityUsd: Number(pair.liquidity?.usd ?? 0),
    volume24hUsd: Number(pair.volume?.h24 ?? 0)
  };
};

const walletPositionsQuery = `
  query WalletPositions($owner: Bytes!) {
    bundle(id: "1") {
      ethPriceUSD
    }
    positions(
      first: 50
      where: { owner: $owner, liquidity_gt: "0" }
      orderBy: depositedToken0
      orderDirection: desc
    ) {
      id
      depositedToken0
      depositedToken1
      collectedFeesToken0
      collectedFeesToken1
      withdrawnToken0
      withdrawnToken1
      pool {
        id
        feeTier
        totalValueLockedUSD
        volumeUSD
        token0 {
          symbol
          derivedETH
        }
        token1 {
          symbol
          derivedETH
        }
      }
    }
  }
`;

const fetchWalletPositions = async (subgraphUrl: string, owner: string): Promise<GraphPayload> => {
  const response = await fetch(subgraphUrl, {
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

  return payload.data as GraphPayload;
};

const subtractInUint256 = (left: bigint, right: bigint) => {
  const difference = left - right;
  return difference >= 0n ? difference : difference + UINT256_MOD;
};

const computeUncollectedFees = ({
  currentTick,
  feeGrowthGlobal0X128,
  feeGrowthGlobal1X128,
  feeGrowthInside0LastX128,
  feeGrowthInside1LastX128,
  liquidity,
  tickLower,
  tickLowerData,
  tickUpper,
  tickUpperData,
  tokensOwed0,
  tokensOwed1
}: {
  currentTick: number;
  feeGrowthGlobal0X128: bigint;
  feeGrowthGlobal1X128: bigint;
  feeGrowthInside0LastX128: bigint;
  feeGrowthInside1LastX128: bigint;
  liquidity: bigint;
  tickLower: number;
  tickLowerData: { feeGrowthOutside0X128: bigint; feeGrowthOutside1X128: bigint };
  tickUpper: number;
  tickUpperData: { feeGrowthOutside0X128: bigint; feeGrowthOutside1X128: bigint };
  tokensOwed0: bigint;
  tokensOwed1: bigint;
}) => {
  const feeGrowthBelow0 =
    currentTick >= tickLower
      ? tickLowerData.feeGrowthOutside0X128
      : subtractInUint256(feeGrowthGlobal0X128, tickLowerData.feeGrowthOutside0X128);
  const feeGrowthBelow1 =
    currentTick >= tickLower
      ? tickLowerData.feeGrowthOutside1X128
      : subtractInUint256(feeGrowthGlobal1X128, tickLowerData.feeGrowthOutside1X128);
  const feeGrowthAbove0 =
    currentTick < tickUpper
      ? tickUpperData.feeGrowthOutside0X128
      : subtractInUint256(feeGrowthGlobal0X128, tickUpperData.feeGrowthOutside0X128);
  const feeGrowthAbove1 =
    currentTick < tickUpper
      ? tickUpperData.feeGrowthOutside1X128
      : subtractInUint256(feeGrowthGlobal1X128, tickUpperData.feeGrowthOutside1X128);
  const feeGrowthInside0X128 = subtractInUint256(
    subtractInUint256(feeGrowthGlobal0X128, feeGrowthBelow0),
    feeGrowthAbove0
  );
  const feeGrowthInside1X128 = subtractInUint256(
    subtractInUint256(feeGrowthGlobal1X128, feeGrowthBelow1),
    feeGrowthAbove1
  );
  const accruedFee0 =
    (liquidity * subtractInUint256(feeGrowthInside0X128, feeGrowthInside0LastX128)) / Q128;
  const accruedFee1 =
    (liquidity * subtractInUint256(feeGrowthInside1X128, feeGrowthInside1LastX128)) / Q128;

  return {
    fee0: tokensOwed0 + accruedFee0,
    fee1: tokensOwed1 + accruedFee1
  };
};

const getWalletPositionIds = async (
  positionManager: Contract,
  walletAddress: string
) => {
  const balance = Number(await positionManager.balanceOf(walletAddress).catch(() => 0n));

  return Promise.all(
    Array.from({ length: balance }, async (_, index) =>
      String(await positionManager.tokenOfOwnerByIndex(walletAddress, index))
    )
  );
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(fallback), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const fetchOnchainPositionsForChain = async (
  walletAddress: string,
  chainConfig: ChainConfig
): Promise<DashboardPool[]> => {
  const provider = new JsonRpcProvider(chainConfig.rpcUrl);
  const positionManager = new Contract(chainConfig.positionManagerAddress, positionManagerAbi, provider);
  const factory = new Contract(chainConfig.factoryAddress, factoryAbi, provider);
  const walletPositionIds = await getWalletPositionIds(positionManager, walletAddress);
  const masterChef =
    chainConfig.masterChefAddress
      ? new Contract(chainConfig.masterChefAddress, masterChefV3Abi, provider)
      : null;
  const directKnownIds =
    chainConfig.dexLabel === "PancakeSwap" && chainConfig.chainKey === "bnb-pancake"
      ? DIRECT_PANCAKE_TOKEN_IDS[normalizeWallet(walletAddress)] ?? []
      : [];
  const positionIds = [...new Set([...walletPositionIds, ...directKnownIds])];

  const positions: Array<OnchainPosition | null> = await Promise.all(
    positionIds.map(async (positionId) => {
      const owner = await positionManager.ownerOf(BigInt(positionId)).catch(() => "0x0000000000000000000000000000000000000000");
      const position = await positionManager.positions(BigInt(positionId));
      const farmPositionInfo = masterChef
        ? await masterChef.userPositionInfos(BigInt(positionId)).catch(() => null)
        : null;
      const pendingCakeRaw = masterChef
        ? await masterChef.pendingCake(BigInt(positionId)).catch(() => 0n)
        : 0n;
      const isFarmed =
        farmPositionInfo &&
        farmPositionInfo.user &&
        farmPositionInfo.user !== "0x0000000000000000000000000000000000000000";
      const isOwnedByWallet = String(owner).toLowerCase() === walletAddress.toLowerCase();
      const isOwnedByMasterChef =
        Boolean(chainConfig.masterChefAddress) &&
        String(owner).toLowerCase() === String(chainConfig.masterChefAddress).toLowerCase();
      const belongsToWalletThroughFarm =
        isOwnedByMasterChef &&
        Boolean(farmPositionInfo?.user) &&
        String(farmPositionInfo.user).toLowerCase() === walletAddress.toLowerCase();

      if (!isOwnedByWallet && !belongsToWalletThroughFarm) {
        return null;
      }

      const isInactive = BigInt(position.liquidity) === 0n && !isFarmed;

      if (isInactive) {
        return null;
      }

      const token0 = new Contract(position.token0, erc20Abi, provider);
      const token1 = new Contract(position.token1, erc20Abi, provider);

      const [token0Symbol, token1Symbol, token0Decimals, token1Decimals, poolAddress] = await Promise.all([
        token0.symbol().catch(() => "TOKEN0"),
        token1.symbol().catch(() => "TOKEN1"),
        token0.decimals().catch(() => 18),
        token1.decimals().catch(() => 18),
        factory.getPool(position.token0, position.token1, position.fee).catch(() => "Unavailable")
      ]);
      const metrics = await fetchDexScreenerMetrics(chainConfig.dexScreenerKey, String(poolAddress)).catch(() => null);
      const poolContract = new Contract(String(poolAddress), poolAbi, provider);
      const [slot0, poolLiquidity, feeGrowthGlobal0X128, feeGrowthGlobal1X128, tickLowerData, tickUpperData] = await Promise.all([
        poolContract.slot0(),
        poolContract.liquidity(),
        poolContract.feeGrowthGlobal0X128(),
        poolContract.feeGrowthGlobal1X128(),
        poolContract.ticks(position.tickLower),
        poolContract.ticks(position.tickUpper)
      ]);
      const token0Instance = new Token(chainConfig.chainId, position.token0, Number(token0Decimals), String(token0Symbol));
      const token1Instance = new Token(chainConfig.chainId, position.token1, Number(token1Decimals), String(token1Symbol));
      const pool = new Pool(
        token0Instance,
        token1Instance,
        Number(position.fee),
        String(slot0.sqrtPriceX96),
        String(poolLiquidity),
        Number(slot0.tick)
      );
      const positionSnapshot = new Position({
        pool,
        liquidity: String(position.liquidity),
        tickLower: Number(position.tickLower),
        tickUpper: Number(position.tickUpper)
      });
      const currentPrice = Number(pool.token0Price.toSignificant(8));
      const inversePrice = Number(pool.token1Price.toSignificant(8));
      const rangeMin = Number(tickToPrice(token0Instance, token1Instance, Number(position.tickLower)).toSignificant(8));
      const rangeMax = Number(tickToPrice(token0Instance, token1Instance, Number(position.tickUpper)).toSignificant(8));
      const currentTick = Number(slot0.tick);
      const tickLower = Number(position.tickLower);
      const tickUpper = Number(position.tickUpper);
      const rangeWidth = tickUpper - tickLower;
      const rangeProgress =
        rangeWidth === 0 ? 0.5 : Math.max(0, Math.min(1, (currentTick - tickLower) / rangeWidth));
      const rangeStatus =
        currentTick < tickLower ? "below" : currentTick > tickUpper ? "above" : "in-range";
      const amount0 = Number(positionSnapshot.amount0.toSignificant(8));
      const amount1 = Number(positionSnapshot.amount1.toSignificant(8));
      const { fee0, fee1 } = computeUncollectedFees({
        currentTick,
        feeGrowthGlobal0X128: BigInt(feeGrowthGlobal0X128),
        feeGrowthGlobal1X128: BigInt(feeGrowthGlobal1X128),
        feeGrowthInside0LastX128: BigInt(position.feeGrowthInside0LastX128),
        feeGrowthInside1LastX128: BigInt(position.feeGrowthInside1LastX128),
        liquidity: BigInt(position.liquidity),
        tickLower,
        tickLowerData: {
          feeGrowthOutside0X128: BigInt(tickLowerData.feeGrowthOutside0X128),
          feeGrowthOutside1X128: BigInt(tickLowerData.feeGrowthOutside1X128)
        },
        tickUpper,
        tickUpperData: {
          feeGrowthOutside0X128: BigInt(tickUpperData.feeGrowthOutside0X128),
          feeGrowthOutside1X128: BigInt(tickUpperData.feeGrowthOutside1X128)
        },
        tokensOwed0: BigInt(position.tokensOwed0),
        tokensOwed1: BigInt(position.tokensOwed1)
      });
      const uncollectedFee0 = Number(formatUnits(fee0, Number(token0Decimals)));
      const uncollectedFee1 = Number(formatUnits(fee1, Number(token1Decimals)));
      const rawTokensOwed0 = Number(formatUnits(position.tokensOwed0, Number(token0Decimals)));
      const rawTokensOwed1 = Number(formatUnits(position.tokensOwed1, Number(token1Decimals)));

      return {
        currentPriceLabel: `1 ${token0Symbol} = ${formatPriceRatio(currentPrice)} ${token1Symbol}`,
        debugLiquidityLabel: String(position.liquidity),
        debugPendingCakeLabel: `${formatTokenAmount(Number(formatUnits(pendingCakeRaw, 18)))} CAKE`,
        debugTokensOwedLabel: `${formatTokenAmount(rawTokensOwed0)} ${token0Symbol} | ${formatTokenAmount(rawTokensOwed1)} ${token1Symbol}`,
        fee: Number(position.fee),
        farmRewardLabel:
          pendingCakeRaw > 0n
            ? `${formatTokenAmount(Number(formatUnits(pendingCakeRaw, 18)))} CAKE`
            : isFarmed
              ? "0.00 CAKE"
              : undefined,
        id: positionId,
        inversePriceLabel: `1 ${token1Symbol} = ${formatPriceRatio(inversePrice)} ${token0Symbol}`,
        poolAddress: String(poolAddress),
        positionAmount0Label: `${formatTokenAmount(amount0)} ${token0Symbol}`,
        positionAmount1Label: `${formatTokenAmount(amount1)} ${token1Symbol}`,
        positionState: isFarmed ? "farmed" : isInactive ? "inactive" : "active",
        rangeMaxLabel: formatPriceRatio(rangeMax),
        rangeMinLabel: formatPriceRatio(rangeMin),
        rangeProgress,
        rangeStatus,
        token0Symbol: String(token0Symbol),
        token1Symbol: String(token1Symbol),
        totalValueLockedLabel:
          metrics?.liquidityUsd && metrics.liquidityUsd > 0 ? formatUsd(metrics.liquidityUsd) : "Unavailable",
        totalValueLockedUsd: metrics?.liquidityUsd ?? 0,
        uncollectedFee0Label: `${formatTokenAmount(uncollectedFee0)} ${token0Symbol}`,
        uncollectedFee1Label: `${formatTokenAmount(uncollectedFee1)} ${token1Symbol}`,
        volumeUsdLabel:
          metrics?.volume24hUsd && metrics.volume24hUsd > 0 ? formatUsd(metrics.volume24hUsd) : "Unavailable"
      } satisfies OnchainPosition;
    })
  );

  const activePositions = positions.filter((position): position is OnchainPosition => position !== null);

  return activePositions.map((position) => {
      return {
        dex: chainConfig.dexLabel,
        chain: chainConfig.chainLabel,
        chainKey: chainConfig.chainKey,
        currentPriceLabel: position.currentPriceLabel,
        debugLiquidityLabel: position.debugLiquidityLabel,
        debugPendingCakeLabel: position.debugPendingCakeLabel,
        debugTokensOwedLabel: position.debugTokensOwedLabel,
        feeTier: `${(position.fee / 10000).toFixed(2)}%`,
        inversePriceLabel: position.inversePriceLabel,
        liquidityLabel: `Position NFT #${position.id}`,
        poolAddress: position.poolAddress,
        positionState: position.positionState,
        positionAmount0Label: position.positionAmount0Label,
        positionAmount1Label: position.positionAmount1Label,
        positionCount: 1,
        positionValueUsd: 0,
        positionValueLabel: `${position.positionAmount0Label} + ${position.positionAmount1Label}`,
        rangeMaxLabel: position.rangeMaxLabel,
        rangeMinLabel: position.rangeMinLabel,
        rangeProgress: position.rangeProgress,
        rangeStatus: position.rangeStatus,
        token0Symbol: position.token0Symbol,
        token1Symbol: position.token1Symbol,
        totalValueLockedUsd: position.totalValueLockedUsd,
        totalValueLockedLabel: position.totalValueLockedLabel,
        farmRewardLabel: position.farmRewardLabel,
        uncollectedFee0Label: position.uncollectedFee0Label,
        uncollectedFee1Label: position.uncollectedFee1Label,
        volumeUsdLabel: position.volumeUsdLabel,
        walletAddress
      } satisfies DashboardPool;
    });
};

const buildPoolCard = (
  walletAddress: string,
  chainKey: string,
  chainLabel: string,
  positions: GraphPosition[],
  ethPriceUsd: number
): DashboardPool => {
  const pool = positions[0].pool;
  const token0PriceUsd = Number(pool.token0.derivedETH || 0) * ethPriceUsd;
  const token1PriceUsd = Number(pool.token1.derivedETH || 0) * ethPriceUsd;

  const estimatedPositionValue = positions.reduce((sum, position) => {
    const netToken0 =
      Number(position.depositedToken0) -
      Number(position.withdrawnToken0) -
      Number(position.collectedFeesToken0);
    const netToken1 =
      Number(position.depositedToken1) -
      Number(position.withdrawnToken1) -
      Number(position.collectedFeesToken1);

    const token0Usd = Math.max(netToken0, 0) * token0PriceUsd;
    const token1Usd = Math.max(netToken1, 0) * token1PriceUsd;

    return sum + token0Usd + token1Usd;
  }, 0);

  return {
    dex: "Uniswap",
    chain: chainLabel,
    chainKey,
    feeTier: `${(Number(pool.feeTier) / 10000).toFixed(2)}%`,
    liquidityLabel: `${positions.length} active position${positions.length > 1 ? "s" : ""}`,
    poolAddress: pool.id,
    positionCount: positions.length,
    positionValueUsd: estimatedPositionValue,
    positionValueLabel: estimatedPositionValue > 0 ? formatUsd(estimatedPositionValue) : "Unavailable",
    token0Symbol: pool.token0.symbol,
    token1Symbol: pool.token1.symbol,
    totalValueLockedUsd: Number(pool.totalValueLockedUSD),
    totalValueLockedLabel: formatUsd(Number(pool.totalValueLockedUSD)),
    volumeUsdLabel: formatUsd(Number(pool.volumeUSD)),
    walletAddress
  };
};

const fetchWalletPoolsForChain = async (
  walletAddress: string,
  chainConfig: ChainConfig
): Promise<DashboardPool[]> => {
  const onchainPools = await withTimeout(
    fetchOnchainPositionsForChain(walletAddress, chainConfig).catch(() => []),
    CHAIN_FETCH_TIMEOUT_MS,
    []
  );

  if (onchainPools.length) {
    return onchainPools;
  }

  if (!chainConfig.subgraphUrl) {
    return [];
  }

  const ownerPayload = await fetchWalletPositions(chainConfig.subgraphUrl, walletAddress).catch(
    () => ({ bundle: null, positions: [] as GraphPosition[] }) satisfies GraphPayload
  );

  const positionsMap = new Map<string, GraphPosition>();

  for (const position of ownerPayload.positions) {
    positionsMap.set(position.id, position);
  }

  const positions = [...positionsMap.values()];
  const ethPriceUsd = Number(ownerPayload.bundle?.ethPriceUSD || 0);

  const poolsByAddress = positions.reduce<Record<string, GraphPosition[]>>((acc, position) => {
    const key = position.pool.id;
    acc[key] = acc[key] ? [...acc[key], position] : [position];
    return acc;
  }, {});

  return Object.values(poolsByAddress).map((poolPositions) =>
    buildPoolCard(walletAddress, chainConfig.chainKey, chainConfig.chainLabel, poolPositions, ethPriceUsd)
  );
};

export const loadDashboardData = async (
  wallets: string[],
  options: LoadDashboardOptions = {}
): Promise<DashboardData> => {
  const normalizedWallets = wallets.map(normalizeWallet).filter(Boolean);
  const activeChainConfigs = (options.includePancakeBnb ?? true)
    ? CHAIN_CONFIGS
    : CHAIN_CONFIGS.filter((chainConfig) => chainConfig.chainKey !== "bnb-pancake");

  if (!normalizedWallets.length) {
    return {
      meta: {
        mode: DATA_MODE === "mock" ? "mock" : "live",
        sourceLabel:
          DATA_MODE === "mock"
            ? "Mock dataset"
            : "Uniswap V3 on-chain positions: Ethereum, Arbitrum, Optimism, Polygon, BNB, Avalanche"
      },
      pools: [],
      summary: {
        poolCount: 0,
        totalPositionValueLabel: "$0",
        walletCount: 0
      }
    };
  }

  if (DATA_MODE === "mock") {
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
      const chainResults = await Promise.allSettled(
        activeChainConfigs.map((chainConfig) => fetchWalletPoolsForChain(walletAddress, chainConfig))
      );

      const fulfilledResults = chainResults
        .filter((result): result is PromiseFulfilledResult<DashboardPool[]> => result.status === "fulfilled")
        .flatMap((result) => result.value);
      const rejectedResults = chainResults
        .filter((result): result is PromiseRejectedResult => result.status === "rejected")
        .map((result) => result.reason);

      if (!fulfilledResults.length && rejectedResults.length) {
        throw new Error(
          rejectedResults
            .map((reason) => (reason instanceof Error ? reason.message : String(reason)))
            .join(" | ")
        );
      }

      return fulfilledResults;
    })
  );

  const pools = walletResults
    .flat()
    .sort((left, right) => right.totalValueLockedUsd - left.totalValueLockedUsd);
  const totalPositionValue = pools.reduce((sum, pool) => sum + pool.positionValueUsd, 0);

  return {
    meta: {
      mode: "live",
      sourceLabel: "Uniswap V3 on-chain positions: Ethereum, Arbitrum, Optimism, Polygon, BNB, Avalanche"
    },
    pools,
    summary: {
      poolCount: pools.length,
      totalPositionValueLabel: totalPositionValue > 0 ? formatUsd(totalPositionValue) : "Unavailable",
      walletCount: normalizedWallets.length
    }
  };
};
