import React, { useState } from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppLogo from "../components/AppLogo";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { translate, type TranslationKey } from "../constants/translations";
import type { Language } from "../types/scam";

interface ForgotPasswordScreenProps {
  language: Language;
  configured: boolean;
  busy: boolean;
  error: string | null;
  sent: boolean;
  onReset: (email: string) => void;
  onLogin: () => void;
}

export default function ForgotPasswordScreen({ language, configured, busy, error, sent, onReset, onLogin }: ForgotPasswordScreenProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [email, setEmail] = useState("");
  const t = (key: TranslationKey) => translate(language, key);
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <AppLogo size={58} />
        <Text style={styles.title}>{t("resetPassword")}</Text>
        <InputField label={t("email")} value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" editable={!busy} />
        {sent && <Text accessibilityRole="alert" style={styles.success}>{t("resetSent")}</Text>}
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <PrimaryButton label={t("resetPassword")} disabled={!configured || !email.trim()} loading={busy} onPress={() => onReset(email.trim())} />
        <Pressable accessibilityRole="button" onPress={onLogin} style={styles.back}><Text style={styles.link}>{t("backToLogin")}</Text></Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 18 },
  card: { width: "100%", maxWidth: 440, gap: 16, padding: 22, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.navy, fontSize: 26, fontWeight: "900" },
  success: { color: colors.green, backgroundColor: colors.paleGreen, fontSize: 14, lineHeight: 21, padding: 12, borderRadius: 12 },
  error: { color: colors.red, fontSize: 13, lineHeight: 19 },
  back: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  link: { color: colors.blue, fontSize: 14, fontWeight: "700" },
}); }
