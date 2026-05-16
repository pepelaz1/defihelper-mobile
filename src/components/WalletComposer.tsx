import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { palette } from "../theme/palette";
import { shortAddress } from "../utils/format";

type WalletComposerProps = {
  onApply: () => void;
  onChangeText: (value: string) => void;
  value: string;
  wallets: string[];
};

export const WalletComposer = ({
  onApply,
  onChangeText,
  value,
  wallets
}: WalletComposerProps) => (
  <View style={styles.card}>
    <Text style={styles.label}>Wallet List</Text>
    <Text style={styles.copy}>
      Paste one or more EVM wallet addresses. Separate them with new lines, spaces, or commas.
    </Text>
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      multiline
      onChangeText={onChangeText}
      placeholder="0x1234..."
      placeholderTextColor="#8a948f"
      style={styles.input}
      value={value}
    />
    <View style={styles.tags}>
      {wallets.map((wallet) => (
        <View key={wallet} style={styles.tag}>
          <Text style={styles.tagText}>{shortAddress(wallet)}</Text>
        </View>
      ))}
    </View>
    <Pressable onPress={onApply} style={styles.button}>
      <Text style={styles.buttonText}>Update dashboard</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    backgroundColor: palette.card,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.line,
    gap: 12
  },
  label: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.ink
  },
  copy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20
  },
  input: {
    minHeight: 120,
    borderRadius: 22,
    backgroundColor: "#fffdf8",
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: palette.ink,
    borderWidth: 1,
    borderColor: palette.line,
    textAlignVertical: "top"
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: palette.tealSoft
  },
  tagText: {
    color: palette.teal,
    fontWeight: "700"
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: palette.coral,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999
  },
  buttonText: {
    color: "#fffaf2",
    fontWeight: "800"
  }
});
