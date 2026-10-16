import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  variant?: "primary" | "secondary";
  icon?: keyof typeof Feather.glyphMap;
  style?: ViewStyle;
}

export default function PrimaryButton({
  label, onPress, disabled = false, loading = false, accessibilityLabel, variant = "primary", icon, style,
}: PrimaryButtonProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" ? styles.primary : styles.secondary,
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={variant === "primary" ? colors.onWhite : colors.blue} /> : (
        <>
          {icon && <Feather name={icon} size={17} color={variant === "primary" ? colors.onWhite : colors.blue} />}
          <Text style={[styles.label, variant === "primary" ? styles.primaryLabel : styles.secondaryLabel]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  button: { minHeight: 52, paddingHorizontal: 18, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  primary: { backgroundColor: colors.blue, shadowColor: colors.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 8, elevation: 2 },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 15, fontWeight: "700" },
  primaryLabel: { color: colors.onWhite },
  secondaryLabel: { color: colors.navy },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
}); }