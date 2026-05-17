import { StyleSheet, Text, View } from "react-native";

import { palette } from "../theme/palette";
import type { DashboardPool } from "../types/uniswap";

type PoolCardProps = {
  pool: DashboardPool;
};

const rangeStatusLabel: Record<NonNullable<DashboardPool["rangeStatus"]>, string> = {
  below: "Below",
  "in-range": "In",
  above: "Above"
};

const extractCurrentPriceValue = (label?: string) => {
  if (!label) {
    return "n/a";
  }

  const parts = label.split("=");
  return parts.length > 1 ? parts[1].trim() : label;
};

const positionStateLabel: Record<NonNullable<DashboardPool["positionState"]>, string> = {
  active: "Active",
  inactive: "Inactive",
  farmed: "Farmed"
};

const Cell = ({
  title,
  value,
  flex = 1
}: {
  title: string;
  value: string;
  flex?: number;
}) => (
  <View style={[styles.cell, { flex }]}>
    <Text style={styles.cellTitle}>{title}</Text>
    <Text style={styles.cellValue} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const RangeCell = ({
  min,
  max,
  now,
  progress,
  status
}: {
  min: string;
  max: string;
  now: string;
  progress: number;
  status: string;
}) => (
  <View style={[styles.cell, styles.rangeCell]}>
    <View style={styles.rangeHeader}>
      <Text style={styles.cellTitle}>Range</Text>
      <Text style={styles.rangeStatus}>{status}</Text>
    </View>
    <View style={styles.rangeTrack}>
      <View style={[styles.rangeFill, { width: `${progress * 100}%` }]} />
      <View style={[styles.rangeMarker, { left: `${progress * 100}%` }]} />
    </View>
    <View style={styles.rangeLabels}>
      <Text style={styles.rangeEdge} numberOfLines={1}>
        {min}
      </Text>
      <Text style={styles.rangeNow} numberOfLines={1}>
        {now}
      </Text>
      <Text style={[styles.rangeEdge, styles.rangeEdgeRight]} numberOfLines={1}>
        {max}
      </Text>
    </View>
  </View>
);

export const PoolCard = ({ pool }: PoolCardProps) => {
  const progress = Math.max(0, Math.min(1, pool.rangeProgress ?? 0.5));
  const isInactive = pool.positionState === "inactive";
  const feesValue =
    isInactive
      ? "No uncollected fees"
      : pool.uncollectedFee0Label && pool.uncollectedFee1Label
      ? `${pool.uncollectedFee0Label}\n${pool.uncollectedFee1Label}`
      : pool.uncollectedFee0Label ?? "Not available";
  const currentRangeValue = extractCurrentPriceValue(pool.currentPriceLabel);
  const status = pool.rangeStatus ? rangeStatusLabel[pool.rangeStatus] : "n/a";
  const stateValue = pool.positionState ? positionStateLabel[pool.positionState] : "Active";
  const token0Value = isInactive ? "No liquidity" : pool.positionAmount0Label ?? "n/a";
  const token1Value = isInactive ? "No liquidity" : pool.positionAmount1Label ?? "n/a";
  const farmValue =
    pool.farmRewardLabel ??
    (pool.dex === "PancakeSwap" ? (isInactive ? "No CAKE reward" : "0.00 CAKE") : undefined);
  const rangeMin = isInactive ? "Closed" : pool.rangeMinLabel ?? "n/a";
  const rangeMax = isInactive ? "Closed" : pool.rangeMaxLabel ?? "n/a";
  const rangeCurrent = isInactive ? "No active range" : currentRangeValue;
  const rangeStatusValue = isInactive ? "Closed" : status;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Cell
          title={`${pool.dex} ${pool.chain}`}
          value={`${pool.token0Symbol}/${pool.token1Symbol} | ${pool.feeTier}\n${pool.liquidityLabel}`}
          flex={1.15}
        />
        <Cell title="State" value={stateValue} flex={0.62} />
        <Cell title={pool.token0Symbol} value={token0Value} />
        <Cell title={pool.token1Symbol} value={token1Value} />
        <Cell title="Fees" value={feesValue} flex={1.1} />
        {farmValue ? (
          <Cell title="Farm" value={farmValue} flex={0.9} />
        ) : null}
        <RangeCell
          min={rangeMin}
          max={rangeMax}
          now={rangeCurrent}
          progress={progress}
          status={rangeStatusValue}
        />
        {isInactive ? (
          <>
            <Cell title="Raw liquidity" value={pool.debugLiquidityLabel ?? "n/a"} flex={0.95} />
            <Cell title="Raw tokensOwed" value={pool.debugTokensOwedLabel ?? "n/a"} flex={1.2} />
            <Cell title="Raw pendingCake" value={pool.debugPendingCakeLabel ?? "n/a"} flex={1.0} />
          </>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: "rgba(255, 253, 247, 0.98)",
    borderWidth: 1,
    borderColor: palette.line,
    overflow: "hidden"
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  cell: {
    borderRadius: 12,
    backgroundColor: "#fff7ec",
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 72
  },
  cellTitle: {
    color: palette.muted,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 3
  },
  cellValue: {
    color: palette.ink,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700"
  },
  rangeCell: {
    flex: 1.5,
    justifyContent: "space-between"
  },
  rangeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2
  },
  rangeStatus: {
    color: palette.teal,
    fontSize: 9,
    fontWeight: "700"
  },
  rangeTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#f2d6c7",
    overflow: "hidden",
    position: "relative",
    marginVertical: 5
  },
  rangeFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: palette.coral
  },
  rangeMarker: {
    position: "absolute",
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 999,
    marginLeft: -5,
    backgroundColor: palette.ink,
    borderWidth: 2,
    borderColor: "#fff7ec"
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4
  },
  rangeEdge: {
    color: palette.muted,
    fontSize: 9,
    flex: 1
  },
  rangeNow: {
    color: palette.ink,
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    flex: 1.1
  },
  rangeEdgeRight: {
    textAlign: "right"
  }
});
