import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { palette } from "../theme/palette";
import { shortAddress } from "../utils/format";

type WalletComposerProps = {
  onAdd: () => void;
  onChangeText: (value: string) => void;
  onRemove: (wallet: string) => void;
  value: string;
  wallets: string[];
};

export const WalletComposer = ({
  onAdd,
  onChangeText,
  onRemove,
  value,
  wallets
}: WalletComposerProps) => (
  <View style={styles.card}>
    <Text style={styles.label}>Wallet List</Text>
    <Text style={styles.copy}>
      Add one EVM wallet at a time.
    </Text>
    <View style={styles.inputRow}>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder="0x1234..."
        placeholderTextColor="#8a948f"
        style={styles.input}
        value={value}
      />
      <Pressable onPress={onAdd} style={styles.button}>
        <Text style={styles.buttonText}>Add</Text>
      </Pressable>
    </View>
    <View style={styles.tags}>
      {wallets.map((wallet) => (
        <View key={wallet} style={styles.tag}>
          <Text style={styles.tagText}>{shortAddress(wallet)}</Text>
          <Pressable onPress={() => onRemove(wallet)} hitSlop={8} style={styles.removeButton}>
            <Text style={styles.removeText}>x</Text>
          </Pressable>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: palette.card,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.line,
    gap: 10
  },
  label: {
    fontSize: 16,
    fontWeight: "800",
    color: palette.ink
  },
  copy: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 17
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  input: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#fffdf8",
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: palette.ink,
    borderWidth: 1,
    borderColor: palette.line,
    fontSize: 13,
    lineHeight: 18
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: palette.tealSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  tagText: {
    color: palette.teal,
    fontWeight: "700",
    fontSize: 12
  },
  removeButton: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(30, 111, 114, 0.14)",
    alignItems: "center",
    justifyContent: "center"
  },
  removeText: {
    color: palette.teal,
    fontWeight: "800",
    fontSize: 11,
    lineHeight: 12
  },
  button: {
    backgroundColor: palette.coral,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999
  },
  buttonText: {
    color: "#fffaf2",
    fontWeight: "800",
    fontSize: 13
  }
});
