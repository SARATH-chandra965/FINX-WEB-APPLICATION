import React, { type ReactNode } from "react";
import type { User } from "@firebase/auth";
import { Text, View } from "react-native";
import { useThemeColors } from "../theme/ThemeContext";

interface AuthGuardProps {
  user: User | null;
  children: ReactNode;
  fallback: ReactNode;
}

export default function AuthGuard({ user, children, fallback }: AuthGuardProps) {
  const colors = useThemeColors();
  return user ? <>{children}</> : (
    <View accessibilityLabel="Sign-in required" style={{ padding: 16, borderRadius: 14, backgroundColor: colors.secondaryBackground }}>
      <Text style={{ color: colors.navy, fontSize: 14, lineHeight: 21 }}>{fallback}</Text>
    </View>
  );
}
