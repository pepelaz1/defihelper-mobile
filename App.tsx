import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { PoolCard } from "./src/components/PoolCard";
import { StatCard } from "./src/components/StatCard";
import { WalletComposer } from "./src/components/WalletComposer";
import { useWalletPools } from "./src/hooks/useWalletPools";
import { palette } from "./src/theme/palette";

const DEFAULT_WALLETS = [
  "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
];

export default function App() {
  const [wallets, setWallets] = useState(DEFAULT_WALLETS);
  const [draft, setDraft] = useState(DEFAULT_WALLETS.join("\n"));
  const { data, isLoading, error, refresh } = useWalletPools(wallets);

  const stats = useMemo(() => {
    if (!data) {
      return [
        { label: "Wallets", value: `${wallets.length}` },
        { label: "Active Pools", value: "0" },
        { label: "Est. Value", value: "$0" }
      ];
    }

    return [
      { label: "Wallets", value: `${data.summary.walletCount}` },
      { label: "Active Pools", value: `${data.summary.poolCount}` },
      { label: "Est. Value", value: data.summary.totalPositionValueLabel }
    ];
  }, [data, wallets.length]);

  const applyWallets = () => {
    const nextWallets = draft
      .split(/[\n, ]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    setWallets(nextWallets);
  };

  return (
    <LinearGradient
      colors={[palette.canvas, "#f8f3e8", "#efe4cf"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={palette.ink} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Uniswap Liquidity Dashboard</Text>
            <Text style={styles.title}>Track wallets, pools, and LP positions in one mobile dashboard.</Text>
            <Text style={styles.subtitle}>
              The app accepts a list of EVM wallets, loads Uniswap V3 liquidity positions, and turns them into a clean dashboard view.
            </Text>
          </View>

          <WalletComposer
            value={draft}
            onChangeText={setDraft}
            onApply={applyWallets}
            wallets={wallets}
          />

          <View style={styles.statGrid}>
            {stats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Pools Overview</Text>
              <Text style={styles.sectionCopy}>
                {data?.meta.mode === "mock"
                  ? "Mock data is shown right now. Add a GraphQL endpoint to see live positions."
                  : "Live data was loaded from the configured Uniswap GraphQL endpoint."}
              </Text>
            </View>
            <Pressable style={styles.refreshButton} onPress={refresh}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </Pressable>
          </View>

          {isLoading && !data ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="large" color={palette.sunset} />
              <Text style={styles.stateTitle}>Loading wallet positions...</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Could not load live data</Text>
              <Text style={styles.errorCopy}>{error}</Text>
            </View>
          ) : null}

          {data?.pools.map((pool) => (
            <PoolCard key={`${pool.poolAddress}-${pool.walletAddress}`} pool={pool} />
          ))}

          {!isLoading && data?.pools.length === 0 ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>No positions found</Text>
              <Text style={styles.stateCopy}>
                Check the wallet addresses or switch the data source to a live endpoint.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 18
  },
  hero: {
    backgroundColor: "rgba(255, 251, 243, 0.86)",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(31, 52, 65, 0.08)"
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: palette.teal,
    marginBottom: 10,
    fontWeight: "700"
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    color: palette.ink,
    fontWeight: "800",
    marginBottom: 10
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.muted
  },
  statGrid: {
    gap: 12
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center"
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.ink
  },
  sectionCopy: {
    maxWidth: 250,
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4
  },
  refreshButton: {
    backgroundColor: palette.ink,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999
  },
  refreshButtonText: {
    color: palette.canvas,
    fontWeight: "700"
  },
  stateCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(31, 52, 65, 0.08)",
    alignItems: "center",
    gap: 10
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.ink,
    textAlign: "center"
  },
  stateCopy: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.muted,
    textAlign: "center"
  },
  errorCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#fff0eb",
    borderWidth: 1,
    borderColor: "#efb8a5",
    gap: 6
  },
  errorTitle: {
    color: palette.error,
    fontWeight: "800",
    fontSize: 16
  },
  errorCopy: {
    color: "#8f4e3f",
    fontSize: 14,
    lineHeight: 20
  }
});
