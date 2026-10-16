import React from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import { StyleSheet, Text, View } from "react-native";
import type { RiskLevel } from "../types/scam";
import type { TranslationKey } from "../constants/translations";

interface RiskBadgeProps {
  level: RiskLevel;
  label: string;
}

export const riskLabelKey: Record<RiskLevel, TranslationKey> = {
  low: "low",
  medium: "medium",
  high: "high",
};

export default function RiskBadge({ level, label }: RiskBadgeProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const color = level === "high" ? colors.red : level === "medium" ? colors.amber : colors.green;
  const background = level === "high" ? colors.paleRed : level === "medium" ? colors.paleAmber : colors.paleGreen;
  return (
    <View style={[styles.badge, { backgroundColor: background }]} accessibilityLabel={label}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  badge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 20 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: "800" },
}); }