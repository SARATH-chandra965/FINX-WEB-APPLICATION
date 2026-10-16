import React, { useState } from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppLogo from "../components/AppLogo";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { translate, type TranslationKey } from "../constants/translations";
import type { Language } from "../types/scam";

interface LoginScreenProps {
  language: Language;
  configured: boolean;
  busy: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => void;
  onSignup: () => void;
  onForgotPassword: () => void;
  onContinueGuest: () => void;
}

export default function LoginScreen({ language, configured, busy, error, onLogin, onSignup, onForgotPassword, onContinueGuest }: LoginScreenProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const t = (key: TranslationKey) => translate(language, key);
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <AppLogo size={64} />
        <Text style={styles.title}>{t("signIn")}</Text>
        <Text style={styles.subtitle}>{t("guestMode")}</Text>
        {!configured && <Text accessibilityRole="alert" style={styles.notice}>{t("firebaseNotConfigured")}</Text>}
        <InputField label={t("email")} value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" editable={!busy} />
        <InputField label={t("password")} value={password} onChangeText={setPassword} secureToggle showPasswordLabel={t("showPassword")} hidePasswordLabel={t("hidePassword")} autoComplete="password" textContentType="password" editable={!busy} />
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <PrimaryButton label={t("signIn")} onPress={() => onLogin(email.trim(), password)} disabled={!configured || !email.trim() || !password} loading={busy} style={styles.primary} />
        <Pressable accessibilityRole="button" onPress={onForgotPassword} style={styles.linkButton}><Text style={styles.link}>{t("forgotPassword")}</Text></Pressable>
        <View style={styles.divider} />
        <PrimaryButton label={t("signUp")} variant="secondary" onPress={onSignup} disabled={!configured || busy} />
        <Pressable accessibilityRole="button" onPress={onContinueGuest} style={styles.linkButton}><Text style={styles.link}>{t("backHome")}</Text></Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 18 },
  card: { width: "100%", maxWidth: 440, gap: 15, padding: 22, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.navy, fontSize: 27, fontWeight: "900" },
  subtitle: { color: colors.secondaryText, fontSize: 14, lineHeight: 21 },
  notice: { color: colors.text, fontSize: 13, lineHeight: 20, backgroundColor: colors.paleWarning, padding: 12, borderRadius: 12 },
  error: { color: colors.red, fontSize: 13, lineHeight: 19 },
  primary: { marginTop: 3 },
  linkButton: { alignSelf: "center", minHeight: 48, justifyContent: "center", paddingHorizontal: 12 },
  link: { color: colors.blue, fontSize: 14, fontWeight: "700", textAlign: "center" },
  divider: { height: 1, backgroundColor: colors.border },
}); }
