import { StyleSheet, Text, View } from "react-native";

import { palette } from "../theme/palette";

type StatCardProps = {
  label: string;
  value: string;
};

export const StatCard = ({ label, value }: StatCardProps) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "rgba(255, 250, 241, 0.9)",
    borderWidth: 1,
    borderColor: palette.line
  },
  label: {
    color: palette.muted,
    fontSize: 13,
    marginBottom: 8
  },
  value: {
    color: palette.ink,
    fontSize: 26,
    fontWeight: "800"
  }
});
