import React from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import Feather from "@expo/vector-icons/Feather";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ScanCard from "../components/ScanCard";
import PrimaryButton from "../components/PrimaryButton";
import RiskBadge, { riskLabelKey } from "../components/RiskBadge";
import { translate, type TranslationKey } from "../constants/translations";
import type { AppRoute, Language, ScanHistoryRecord } from "../types/scam";

interface HomeScreenProps {
  language: Language;
  history: ScanHistoryRecord[];
  onNavigate: (route: AppRoute) => void;
  onChooseScan: (type: "message" | "url" | "transcript") => void;
}

export default function HomeScreen({ language, history, onNavigate, onChooseScan }: HomeScreenProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const t = (key: TranslationKey) => translate(language, key);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{t("welcome")}</Text>
        <Text style={styles.title}>{t("headline")}</Text>
        <Text style={styles.intro}>{t("intro")}</Text>
        <View style={styles.heroActions}>
          <PrimaryButton label={t("scanNow")} onPress={() => onChooseScan("message")} style={styles.heroButton} />
          <PrimaryButton label={t("assistant")} onPress={() => onNavigate("Assistant")} variant="secondary" style={styles.heroButton} />
        </View>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{t("inputType")}</Text>
      </View>
      <View style={styles.cards}>
        <ScanCard title={t("scanMessage")} description={t("checkMessageDescription")} icon="message-circle" onPress={() => onChooseScan("message")} />
        <ScanCard title={t("scanUrl")} description={t("checkLinkDescription")} icon="link" onPress={() => onChooseScan("url")} />
        <ScanCard title={t("scanTranscript")} description={t("checkTranscriptDescription")} icon="phone" onPress={() => onChooseScan("transcript")} />
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{t("recentScans")}</Text>
        {history.length > 0 && (
          <Pressable accessibilityRole="button" onPress={() => onNavigate("History")} style={styles.linkButton}>
            <Text style={styles.link}>{t("history")}</Text>
            <Feather name="chevron-right" size={16} color={colors.blue} />
          </Pressable>
        )}
      </View>
      {history.length === 0 ? (
        <View style={styles.empty}><Text style={styles.body}>{t("noHistory")}</Text></View>
      ) : history.slice(0, 3).map((record) => (
        <View key={record.id} style={styles.historyRow}>
          <View style={styles.historyCopy}>
            <Text style={styles.historyTitle}>{record.inputType.toUpperCase()} · {record.score}/100</Text>
            <Text style={styles.body}>{new Date(record.scannedAt).toLocaleString()}</Text>
          </View>
          <RiskBadge level={record.level} label={t(riskLabelKey[record.level])} />
        </View>
      ))}

      <View style={styles.tip}>
        <Text style={styles.tipTitle}>{t("tips")}</Text>
        <Text style={styles.body}>{t("safetyIntro")}</Text>
        <Pressable accessibilityRole="button" onPress={() => onNavigate("Safety")} style={styles.linkButton}>
          <Text style={styles.link}>{t("safety")}</Text>
          <Feather name="chevron-right" size={16} color={colors.blue} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 18, paddingBottom: 28, gap: 15 },
  hero: { padding: 24, borderRadius: 24, backgroundColor: colors.darkHero },
  eyebrow: { color: colors.onNavyMuted, fontSize: 12, fontWeight: "700" },
  title: { color: colors.onWhite, fontSize: 34, fontWeight: "900", marginTop: 12, lineHeight: 41 },
  intro: { color: colors.onNavy, fontSize: 14, lineHeight: 21, marginTop: 10 },
  heroButton: { marginTop: 20, alignSelf: "flex-start", minWidth: 160 },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 5 },
  sectionTitle: { color: colors.navy, fontSize: 19, fontWeight: "800" },
  cards: { gap: 10 },
  empty: { padding: 20, borderRadius: 16, backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1 },
  body: { color: colors.secondaryText, fontSize: 13, lineHeight: 20 },
  link: { color: colors.blue, fontSize: 13, fontWeight: "700", paddingVertical: 4 },
  linkButton: { flexDirection: "row", alignItems: "center", gap: 2 },
  historyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, backgroundColor: colors.white, padding: 14, borderRadius: 15, borderWidth: 1, borderColor: colors.border },
  historyCopy: { flex: 1, gap: 4 },
  historyTitle: { color: colors.navy, fontSize: 13, fontWeight: "800" },
  tip: { backgroundColor: colors.paleBlue, borderRadius: 18, padding: 18, gap: 8 },
  tipTitle: { color: colors.navy, fontSize: 15, fontWeight: "800" },
}); }