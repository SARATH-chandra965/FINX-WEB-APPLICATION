import React from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import Feather from "@expo/vector-icons/Feather";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { User } from "@firebase/auth";
import PrimaryButton from "../components/PrimaryButton";
import { translate, type TranslationKey } from "../constants/translations";
import type { Language, ThemePreference } from "../types/scam";

interface ProfileScreenProps {
  language: Language;
  historyCount: number;
  user: User | null;
  authError: string | null;
  profilePhotoUri: string | null;
  onPickProfilePhoto: () => void;
  onRemoveProfilePhoto: () => void;
  onLanguageChange: (language: Language) => void;
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onClearHistory: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

const languages: { value: Language; label: TranslationKey }[] = [
  { value: "en", label: "english" }, { value: "te", label: "telugu" },
  { value: "hi", label: "hindi" }, { value: "ta", label: "tamil" }, { value: "kn", label: "kannada" },
];
const themes: { value: ThemePreference; label: TranslationKey; icon: keyof typeof Feather.glyphMap }[] = [
  { value: "light", label: "lightMode", icon: "sun" },
  { value: "dark", label: "darkMode", icon: "moon" },
  { value: "system", label: "systemMode", icon: "smartphone" },
];

export default function ProfileScreen({ language, historyCount, user, authError, profilePhotoUri, onPickProfilePhoto, onRemoveProfilePhoto, onLanguageChange, themePreference, onThemeChange, onClearHistory, onSignIn, onSignOut }: ProfileScreenProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const t = (key: TranslationKey) => translate(language, key);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.pageHeading}>
        <View style={styles.pageIcon}><Feather name="user" size={21} color={colors.blue} /></View>
        <View>
          <Text style={styles.title}>{t("profile")}</Text>
          <Text style={styles.pageSubtitle}>{t("settings")}</Text>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("changeProfilePhoto")}
            onPress={onPickProfilePhoto}
            style={styles.avatarButton}
          >
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} accessibilityLabel={t("profilePhoto")} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{initialFor(user?.displayName || user?.email)}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}><Feather name="camera" size={14} color={colors.onWhite} /></View>
          </Pressable>
          <View style={styles.profileDetails}>
            <Text style={styles.heading}>{t("account")}</Text>
            <Text style={styles.body}>{user ? user.displayName || user.email : t("guestMode")}</Text>
            <Pressable accessibilityRole="button" onPress={onPickProfilePhoto} style={styles.photoAction}>
              <Feather name="edit-2" size={13} color={colors.blue} />
              <Text style={styles.photoActionText}>{t("changeProfilePhoto")}</Text>
            </Pressable>
            {!!profilePhotoUri && (
              <Pressable accessibilityRole="button" onPress={onRemoveProfilePhoto} style={styles.photoAction}>
                <Feather name="trash-2" size={13} color={colors.red} />
                <Text style={[styles.photoActionText, styles.removePhotoText]}>{t("removeProfilePhoto")}</Text>
              </Pressable>
            )}
          </View>
        </View>
        {!!authError && <Text accessibilityRole="alert" style={styles.error}>{authError}</Text>}
        {user
          ? <PrimaryButton label={t("signOut")} icon="log-out" variant="secondary" onPress={onSignOut} />
          : <PrimaryButton label={t("signIn")} icon="log-in" onPress={onSignIn} />}
      </View>
      <View style={styles.card}>
        <SectionHeading icon="globe" title={t("selectLanguage")} />
        <View style={styles.options}>
          {languages.map(({ value, label }) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ selected: language === value }}
              onPress={() => onLanguageChange(value)}
              style={[styles.option, language === value && styles.selected]}
            >
              <Text style={[styles.optionText, language === value && styles.selectedText]}>{t(label)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.settingHeading}>
          <Feather name="sliders" size={18} color={colors.blue} />
          <Text style={styles.heading}>{t("appearance")}</Text>
        </View>
        <View style={styles.options}>
          {themes.map(({ value, label, icon }) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ selected: themePreference === value }}
              onPress={() => onThemeChange(value)}
              style={[styles.option, themePreference === value && styles.selected]}
            >
              <Feather name={icon} size={17} color={themePreference === value ? colors.blue : colors.secondaryText} />
              <Text style={[styles.optionText, themePreference === value && styles.selectedText]}>{t(label)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Info icon="lock" title={t("privacy")} description={t("privacyText")} />
      <Info icon="shield" title={t("about")} description={t("backendPrivacy")} />
      <View style={styles.card}>
        <SectionHeading icon="clock" title={t("history")} />
        <View style={styles.historySummary}>
          <Feather name="activity" size={18} color={colors.blue} />
          <Text style={styles.historyCount}>{historyCount}</Text>
          <Text style={styles.body}>{t("recentScans")}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onClearHistory}
          style={[styles.clearButton, historyCount === 0 && styles.disabledButton]}
          disabled={historyCount === 0}
        >
          <Feather name="trash-2" size={15} color={historyCount === 0 ? colors.secondaryText : colors.red} />
          <Text style={[styles.clearText, historyCount === 0 && styles.muted]}>{t("clearHistory")}</Text>
        </Pressable>
      </View>
      <Info icon="info" title={t("about")} description={t("aboutText")} />
      <Text style={styles.version}>{t("version")}</Text>
    </ScrollView>
  );
}

function initialFor(value: string | null | undefined): string {
  return value?.trim().charAt(0).toUpperCase() || "F";
}

function SectionHeading({ icon, title }: { icon: keyof typeof Feather.glyphMap; title: string }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.settingHeading}>
      <View style={styles.sectionIcon}><Feather name={icon} size={16} color={colors.blue} /></View>
      <Text style={styles.heading}>{title}</Text>
    </View>
  );
}

function Info({ icon, title, description }: { icon: keyof typeof Feather.glyphMap; title: string; description: string }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return <View style={styles.card}><SectionHeading icon={icon} title={title} /><Text style={styles.body}>{description}</Text></View>;
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 18, paddingBottom: 34, gap: 13 },
  pageHeading: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 2 },
  pageIcon: { width: 47, height: 47, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.paleBlue },
  title: { color: colors.navy, fontSize: 25, fontWeight: "900" },
  pageSubtitle: { color: colors.secondaryText, fontSize: 12, marginTop: 2 },
  card: { padding: 17, borderRadius: 19, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, gap: 11 },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 15 },
  avatarButton: { width: 76, height: 76, borderRadius: 38, position: "relative" },
  avatarImage: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.paleBlue },
  avatarFallback: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", backgroundColor: colors.paleBlue, borderWidth: 1, borderColor: colors.border },
  avatarInitial: { color: colors.blue, fontSize: 30, fontWeight: "900" },
  cameraBadge: { position: "absolute", right: -2, bottom: -2, width: 27, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.blue, borderWidth: 2, borderColor: colors.white },
  profileDetails: { flex: 1, gap: 4 },
  photoAction: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 4 },
  photoActionText: { color: colors.blue, fontSize: 12, fontWeight: "800" },
  removePhotoText: { color: colors.red },
  heading: { color: colors.navy, fontSize: 15, fontWeight: "800" },
  body: { color: colors.secondaryText, fontSize: 13, lineHeight: 20 },
  error: { color: colors.red, fontSize: 13, lineHeight: 20 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { flexGrow: 1, minWidth: 90, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 11, alignItems: "center", justifyContent: "center", gap: 5 },
  settingHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  sectionIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.paleBlue },
  selected: { borderColor: colors.blue, backgroundColor: colors.paleBlue },
  optionText: { color: colors.secondaryText, fontSize: 14, fontWeight: "700" },
  selectedText: { color: colors.blue },
  historySummary: { flexDirection: "row", alignItems: "center", gap: 9 },
  historyCount: { color: colors.navy, fontSize: 19, fontWeight: "900" },
  clearButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: colors.paleRed },
  disabledButton: { backgroundColor: colors.secondaryBackground },
  clearText: { color: colors.red, fontSize: 13, fontWeight: "700" },
  muted: { color: colors.secondaryText },
  version: { color: colors.secondaryText, fontSize: 12, textAlign: "center", margin: 8 },
}); }