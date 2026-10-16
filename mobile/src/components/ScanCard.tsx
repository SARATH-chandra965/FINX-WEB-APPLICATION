import React from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ScanCardProps {
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
}

export default function ScanCard({ title, description, icon, onPress, accessibilityLabel }: ScanCardProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}><Feather name={icon} size={20} color={colors.blue} /></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.blue} />
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  card: { width: "100%", flexDirection: "row", alignItems: "center", padding: 16, gap: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.white },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.paleBlue, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 },
  title: { color: colors.navy, fontSize: 15, fontWeight: "800" },
  description: { color: colors.secondaryText, fontSize: 12, marginTop: 4, lineHeight: 18 },
  pressed: { opacity: 0.8 },
}); }