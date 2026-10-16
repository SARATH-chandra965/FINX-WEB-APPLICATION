import React, { useState } from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppLogo from "../components/AppLogo";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { translate, type TranslationKey } from "../constants/translations";
import type { Language } from "../types/scam";

interface SignupScreenProps {
  language: Language;
  configured: boolean;
  busy: boolean;
  error: string | null;
  onSignup: (name: string, email: string, password: string) => void;
  onLogin: () => void;
}

export default function SignupScreen({ language, configured, busy, error, onSignup, onLogin }: SignupScreenProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const t = (key: TranslationKey) => translate(language, key);

  const submit = () => {
    if (!accepted) { setValidation(t("acceptTerms")); return; }
    if (password !== confirm) { setValidation(t("passwordMismatch")); return; }
    if (password.length < 6) { setValidation(t("passwordTooShort")); return; }
    setValidation(null);
    onSignup(name.trim(), email.trim(), password);
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <AppLogo size={58} />
        <Text style={styles.title}>{t("createAccount")}</Text>
        <InputField label={t("fullName")} value={name} onChangeText={setName} autoComplete="name" textContentType="name" editable={!busy} />
        <InputField label={t("email")} value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" editable={!busy} />
        <InputField label={t("password")} value={password} onChangeText={setPassword} secureToggle showPasswordLabel={t("showPassword")} hidePasswordLabel={t("hidePassword")} autoComplete="new-password" textContentType="newPassword" editable={!busy} />
        <InputField label={t("confirmPassword")} value={confirm} onChangeText={setConfirm} secureToggle showPasswordLabel={t("showPassword")} hidePasswordLabel={t("hidePassword")} autoComplete="new-password" textContentType="newPassword" editable={!busy} />
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: accepted }} onPress={() => setAccepted((value) => !value)} style={styles.terms}>
          <View style={[styles.checkbox, accepted && styles.checked]}><Text style={styles.checkMark}>{accepted ? "✓" : ""}</Text></View>
          <Text style={styles.termsText}>{t("termsAcknowledgment")}</Text>
        </Pressable>
        {!!(validation || error) && <Text accessibilityRole="alert" style={styles.error}>{validation ?? error}</Text>}
        {!configured && <Text accessibilityRole="alert" style={styles.notice}>{t("firebaseNotConfigured")}</Text>}
        <PrimaryButton label={t("signUp")} disabled={!configured || !name.trim() || !email.trim() || !password || !confirm} loading={busy} onPress={submit} />
        <Pressable accessibilityRole="button" onPress={onLogin} style={styles.linkButton}><Text style={styles.link}>{t("backToLogin")}</Text></Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 18 },
  card: { width: "100%", maxWidth: 460, gap: 13, padding: 22, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  title: { color: colors.navy, fontSize: 25, fontWeight: "900" },
  terms: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 6 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: colors.secondaryText, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  checked: { backgroundColor: colors.blue, borderColor: colors.blue },
  checkMark: { color: colors.onWhite, fontWeight: "900" },
  termsText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  error: { color: colors.red, fontSize: 13, lineHeight: 19 },
  notice: { color: colors.text, fontSize: 13, lineHeight: 20, backgroundColor: colors.paleWarning, padding: 12, borderRadius: 12 },
  linkButton: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  link: { color: colors.blue, fontSize: 14, fontWeight: "700" },
}); }
