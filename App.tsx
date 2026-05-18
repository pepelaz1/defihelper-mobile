import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { PoolCard } from "./src/components/PoolCard";
import { WalletComposer } from "./src/components/WalletComposer";
import { useWalletPools } from "./src/hooks/useWalletPools";
import { palette } from "./src/theme/palette";
import type { DashboardPool } from "./src/types/uniswap";
import { normalizeWallet } from "./src/utils/format";

const BLOCKED_SYSTEM_WALLETS = new Set([
  normalizeWallet("0x1F98431c8aD98523631AE4a59f267346ea31F984"),
  normalizeWallet("0xC36442b4a4522E871399CD717aBDD847Ab11FE88"),
  normalizeWallet("0x46A15B0b27311cedF172AB29E4f4766fbE7F4364"),
  normalizeWallet("0x556B9306565093C855AEA9AE92A594704c2Cd59e")
]);
const STORAGE_KEY = "defihelper.wallets";

const sanitizeWallets = (items: string[]) =>
  [...new Set(items.map(normalizeWallet).filter((wallet) => wallet && !BLOCKED_SYSTEM_WALLETS.has(wallet)))];

export default function App() {
  const [wallets, setWallets] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const { data, isLoading, error, refresh } = useWalletPools(wallets);

  useEffect(() => {
    const loadPersistedWallets = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (!storedValue) {
          return;
        }

        const parsedWallets = JSON.parse(storedValue) as string[];

        if (!Array.isArray(parsedWallets) || parsedWallets.length === 0) {
          return;
        }

        const normalizedWallets = sanitizeWallets(parsedWallets);
        setWallets(normalizedWallets);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedWallets));
      } finally {
        setIsBootstrapping(false);
      }
    };

    loadPersistedWallets();
  }, []);

  const poolsByWallet = useMemo(() => {
    const groups = new Map<string, DashboardPool[]>();

    for (const wallet of wallets) {
      groups.set(normalizeWallet(wallet), []);
    }

    for (const pool of data?.pools ?? []) {
      const normalizedWallet = normalizeWallet(pool.walletAddress);
      const current = groups.get(normalizedWallet) ?? [];
      current.push(pool);
      groups.set(normalizedWallet, current);
    }

    return [...groups.entries()];
  }, [data?.pools, wallets]);

  const persistWallets = async (nextWallets: string[]) => {
    const sanitizedWallets = sanitizeWallets(nextWallets);
    setWallets(sanitizedWallets);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedWallets));
  };

  const addWallet = async () => {
    const nextWallet = normalizeWallet(draft);

    if (!nextWallet) {
      return;
    }

    const nextWallets = [...wallets, nextWallet];
    await persistWallets(nextWallets);
    setDraft("");
  };

  const removeWallet = (walletToRemove: string) => {
    Alert.alert(
      "Remove wallet?",
      `Delete ${walletToRemove} from the dashboard list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const nextWallets = wallets.filter((wallet) => wallet !== walletToRemove);
            await persistWallets(nextWallets);
          }
        }
      ]
    );
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
          <WalletComposer
            value={draft}
            onChangeText={setDraft}
            onAdd={addWallet}
            onRemove={removeWallet}
            wallets={wallets}
          />

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Wallet Positions</Text>
              <Text style={styles.sectionCopy}>
                {data?.meta.mode === "mock"
                  ? "Mock data is shown right now. Switch to live mode for real positions."
                  : "Live positions from supported DEXes and EVM chains."}
              </Text>
            </View>
            <Pressable style={[styles.refreshButton, isLoading && styles.refreshButtonDisabled]} onPress={refresh} disabled={isLoading}>
              <Text style={styles.refreshButtonText}>{isLoading ? "Refreshing..." : "Refresh"}</Text>
            </Pressable>
          </View>

          {(isLoading || isBootstrapping) && !data ? (
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

          {poolsByWallet.map(([walletAddress, walletPools]) => (
            <View key={walletAddress} style={styles.walletSection}>
              <View style={styles.walletHeader}>
                <Text style={styles.walletTitle}>{walletAddress}</Text>
                <Text style={styles.walletCount}>{walletPools.length} positions</Text>
              </View>

              {walletPools.length ? (
                walletPools.map((pool) => (
                  <PoolCard key={`${pool.poolAddress}-${pool.walletAddress}-${pool.liquidityLabel}`} pool={pool} />
                ))
              ) : (
                <View style={styles.stateCard}>
                  <Text style={styles.stateTitle}>No positions found for this wallet</Text>
                </View>
              )}
            </View>
          ))}

          {!isLoading && data?.pools.length === 0 ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>No positions found</Text>
              <Text style={styles.stateCopy}>
                Check the wallet address, or confirm that the wallet really has active Uniswap V3 LP positions in the supported networks.
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 14
  },
  walletSection: {
    gap: 8
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  walletTitle: {
    flex: 1,
    color: palette.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  walletCount: {
    color: palette.teal,
    fontWeight: "700",
    fontSize: 13
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-end"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.ink
  },
  sectionCopy: {
    maxWidth: 250,
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2
  },
  refreshButton: {
    backgroundColor: palette.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999
  },
  refreshButtonDisabled: {
    opacity: 0.7
  },
  refreshButtonText: {
    color: palette.canvas,
    fontWeight: "700",
    fontSize: 13
  },
  stateCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(31, 52, 65, 0.08)",
    alignItems: "center",
    gap: 10
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.ink,
    textAlign: "center"
  },
  stateCopy: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.muted,
    textAlign: "center"
  },
  errorCard: {
    borderRadius: 18,
    padding: 14,
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
