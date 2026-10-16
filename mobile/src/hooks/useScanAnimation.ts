import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform } from "react-native";

export default function useScanAnimation(active: boolean) {
  const progress = useRef(new Animated.Value(0)).current;
  const [running, setRunning] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    const updatePreference = (reduced: boolean) => {
      if (mounted) setReduceMotion(reduced);
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(updatePreference).catch(() => updatePreference(true));
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", updatePreference);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!active || reduceMotion) {
      progress.stopAnimation();
      progress.setValue(reduceMotion ? 1 : 0);
      setRunning(false);
      return;
    }
    setRunning(true);
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: Platform.OS !== "web",
      })
    );
    loop.start();
    return () => {
      loop.stop();
      progress.stopAnimation();
    };
  }, [active, progress, reduceMotion]);

  return { progress, running };
}