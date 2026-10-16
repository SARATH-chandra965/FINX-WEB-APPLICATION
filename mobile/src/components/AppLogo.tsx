import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Image, Platform, StyleSheet, View } from "react-native";

interface AppLogoProps {
  size?: number;
}

export default function AppLogo({ size = 48 }: AppLogoProps) {
  const entrance = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    const updateMotionPreference = (reduced: boolean) => {
      if (!mounted) return;
      setReduceMotion(reduced);
      if (reduced) entrance.setValue(1);
      else Animated.timing(entrance, { toValue: 1, duration: 360, useNativeDriver: Platform.OS !== "web" }).start();
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(updateMotionPreference).catch(() => updateMotionPreference(true));
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", updateMotionPreference);
    return () => {
      mounted = false;
      subscription.remove();
      entrance.stopAnimation();
    };
  }, [entrance]);

  return (
    <Animated.View style={[
      styles.frame,
      { width: size, height: size, borderRadius: size * 0.27 },
      { opacity: reduceMotion ? 1 : entrance, transform: [{ scale: reduceMotion ? 1 : entrance.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] },
    ]}>
      <Image
        source={require("../../assets/icon.png")}
        style={{ width: size, height: size, borderRadius: size * 0.27 }}
        resizeMode="contain"
        accessibilityLabel="FINX shield and F logo"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden" },
});
