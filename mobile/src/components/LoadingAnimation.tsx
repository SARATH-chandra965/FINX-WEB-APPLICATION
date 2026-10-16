import React from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import { ActivityIndicator, Animated, StyleSheet, Text, View } from "react-native";
import useScanAnimation from "../hooks/useScanAnimation";

interface LoadingAnimationProps {
  label: string;
}

export default function LoadingAnimation({ label }: LoadingAnimationProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { progress, running } = useScanAnimation(true);
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel={label}>
      {running ? (
        <Animated.View style={{ transform: [{ scale }] }}>
          <ActivityIndicator size="large" color={colors.blue} />
        </Animated.View>
      ) : (
        <View style={styles.staticIndicator}><Text style={styles.staticMark}>F</Text></View>
      )}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  wrap: { alignItems: "center", gap: 12, padding: 24, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.navy, fontSize: 14, fontWeight: "700", textAlign: "center" },
  staticIndicator: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: colors.paleBlue },
  staticMark: { color: colors.blue, fontSize: 20, fontWeight: "900" },
}); }