import { StyleSheet, Text, View } from "react-native";

import { palette } from "../theme/palette";
import type { DashboardPool } from "../types/uniswap";
import { shortAddress } from "../utils/format";

type PoolCardProps = {
  pool: DashboardPool;
};

export const PoolCard = ({ pool }: PoolCardProps) => (
  <View style={styles.card}>
    <View style={styles.topRow}>
      <View>
        <Text style={styles.pair}>
          {pool.token0Symbol}/{pool.token1Symbol}
        </Text>
        <Text style={styles.meta}>
          {pool.chain} | fee {pool.feeTier}
        </Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{pool.liquidityLabel}</Text>
      </View>
    </View>

    <View style={styles.metricRow}>
      <View style={styles.metric}>
        <Text style={styles.metricLabel}>Wallet</Text>
        <Text style={styles.metricValue}>{shortAddress(pool.walletAddress)}</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.metricLabel}>Pool TVL</Text>
        <Text style={styles.metricValue}>{pool.totalValueLockedLabel}</Text>
      </View>
    </View>

    <View style={styles.metricRow}>
      <View style={styles.metric}>
        <Text style={styles.metricLabel}>Volume total</Text>
        <Text style={styles.metricValue}>{pool.volumeUsdLabel}</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.metricLabel}>Estimated value</Text>
        <Text style={styles.metricValue}>{pool.positionValueLabel}</Text>
      </View>
    </View>

    <View style={styles.footer}>
      <Text style={styles.footerLabel}>Pool</Text>
      <Text style={styles.footerValue}>{shortAddress(pool.poolAddress)}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    backgroundColor: "rgba(255, 253, 247, 0.96)",
    padding: 18,
    borderWidth: 1,
    borderColor: palette.line,
    gap: 16
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  pair: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.ink
  },
  meta: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 4
  },
  badge: {
    borderRadius: 999,
    backgroundColor: palette.coralSoft,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  badgeText: {
    color: palette.sunset,
    fontWeight: "700",
    fontSize: 12
  },
  metricRow: {
    flexDirection: "row",
    gap: 12
  },
  metric: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#fff7ec",
    padding: 14
  },
  metricLabel: {
    color: palette.muted,
    fontSize: 12,
    marginBottom: 6
  },
  metricValue: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: "700"
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: palette.line
  },
  footerLabel: {
    color: palette.muted
  },
  footerValue: {
    color: palette.teal,
    fontWeight: "700"
  }
});
