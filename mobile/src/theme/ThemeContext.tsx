import React, { createContext, useContext, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import lightColors from "../constants/colors";
import type { ThemePreference } from "../types/scam";

export type ThemeColors = { [Key in keyof typeof lightColors]: string };

const darkColors: ThemeColors = {
  ...lightColors,
  navy: "#E6ECFF",
  darkHero: "#080F1E",
  background: "#0B1220",
  white: "#141E30",
  onWhite: "#FFFFFF",
  text: "#E5EAF4",
  secondaryText: "#A5B1C5",
  border: "#29364B",
  paleBlue: "#1B2B49",
  paleGreen: "#14372A",
  paleAmber: "#3A2E18",
  paleRed: "#3A2025",
  secondaryBackground: "#1A2943",
  paleWarning: "#3A2E18",
  paleDanger: "#3A2025",
  inputSurface: "#101A2B",
  onNavyMuted: "#BCC9E8",
  onNavy: "#D1D9EA",
};

const PaletteContext = createContext<ThemeColors>(lightColors);

export function getThemeColors(preference: ThemePreference, systemScheme: "light" | "dark" | null | undefined): ThemeColors {
  return preference === "dark" || (preference === "system" && systemScheme === "dark") ? darkColors : lightColors;
}

export function ThemeProvider({ preference, children }: { preference: ThemePreference; children: ReactNode }) {
  const systemScheme = useColorScheme();
  const palette = getThemeColors(preference, systemScheme);
  return <PaletteContext.Provider value={palette}>{children}</PaletteContext.Provider>;
}

export function useThemeColors(): ThemeColors {
  return useContext(PaletteContext);
}
