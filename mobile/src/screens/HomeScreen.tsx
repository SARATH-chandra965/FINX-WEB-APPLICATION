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
  const flaggedCount = history.filter((record) => record.level !== "low").length;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{t("welcome")}</Text>
            <Text style={styles.title}>{t("headline")}</Text>
          </View>
          <View style={styles.heroIcon}><Feather name="shield" size={27} color={colors.onWhite} /></View>
        </View>
        <Text style={styles.intro}>{t("intro")}</Text>
        <View style={styles.trustTag}>
          <Feather name="check-circle" size={14} color={colors.onNavyMuted} />
          <Text style={styles.trustText}>{t("privacy")}</Text>
        </View>
        <View style={styles.heroActions}>
          <PrimaryButton label={t("scanNow")} icon="search" onPress={() => onChooseScan("message")} style={styles.heroButton} />
          <PrimaryButton label={t("assistant")} icon="message-circle" onPress={() => onNavigate("Assistant")} variant="secondary" style={styles.heroButton} />
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.paleBlue }]}><Feather name="activity" size={17} color={colors.blue} /></View>
          <Text style={styles.statValue}>{history.length}</Text>
          <Text style={styles.statLabel}>{t("homeScans")}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.paleAmber }]}><Feather name="alert-triangle" size={17} color={colors.amber} /></View>
          <Text style={styles.statValue}>{flaggedCount}</Text>
          <Text style={styles.statLabel}>{t("homeAlerts")}</Text>
        </View>
      </View>

      <View style={styles.sectionHead}>
        <View style={styles.sectionHeading}>
          <View style={styles.headingIcon}><Feather name="search" size={16} color={colors.blue} /></View>
          <Text style={styles.sectionTitle}>{t("inputType")}</Text>
        </View>
      </View>
      <View style={styles.cards}>
        <ScanCard title={t("scanMessage")} description={t("checkMessageDescription")} icon="message-circle" onPress={() => onChooseScan("message")} />
        <ScanCard title={t("scanUrl")} description={t("checkLinkDescription")} icon="link" onPress={() => onChooseScan("url")} />
        <ScanCard title={t("scanTranscript")} description={t("checkTranscriptDescription")} icon="phone" onPress={() => onChooseScan("transcript")} />
      </View>

      <View style={styles.sectionHead}>
        <View style={styles.sectionHeading}>
          <View style={styles.headingIcon}><Feather name="clock" size={16} color={colors.blue} /></View>
          <Text style={styles.sectionTitle}>{t("recentScans")}</Text>
        </View>
        {history.length > 0 && (
          <Pressable accessibilityRole="button" onPress={() => onNavigate("History")} style={styles.linkButton}>
            <Text style={styles.link}>{t("history")}</Text>
            <Feather name="chevron-right" size={16} color={colors.blue} />
          </Pressable>
        )}
      </View>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Feather name="search" size={21} color={colors.blue} /></View>
          <View style={styles.emptyCopy}>
            <Text style={styles.emptyTitle}>{t("homeEmptyTitle")}</Text>
            <Text style={styles.body}>{t("noHistory")}</Text>
          </View>
        </View>
      ) : history.slice(0, 3).map((record) => (
        <View key={record.id} style={styles.historyRow}>
          <View style={styles.recordIcon}><Feather name={record.inputType === "url" ? "link" : record.inputType === "transcript" ? "phone" : "message-circle"} size={17} color={colors.blue} /></View>
          <View style={styles.historyCopy}>
            <Text style={styles.historyTitle}>{t(record.inputType === "url" ? "typeUrl" : record.inputType === "transcript" ? "typeTranscript" : "typeMessage")} · {record.score}/100</Text>
            <Text style={styles.body}>{new Date(record.scannedAt).toLocaleString()}</Text>
          </View>
          <RiskBadge level={record.level} label={t(riskLabelKey[record.level])} />
        </View>
      ))}

      <View style={styles.tip}>
        <View style={styles.tipIcon}><Feather name="shield" size={20} color={colors.blue} /></View>
        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>{t("tips")}</Text>
          <Text style={styles.body}>{t("safetyIntro")}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => onNavigate("Safety")} style={styles.linkButton}>
          <Text style={styles.link}>{t("safety")}</Text>
          <Feather name="chevron-right" size={16} color={colors.blue} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 18, paddingBottom: 34, gap: 17 },
  hero: { padding: 22, borderRadius: 26, backgroundColor: colors.darkHero, gap: 12, overflow: "hidden" },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  heroCopy: { flex: 1 },
  heroIcon: { width: 54, height: 54, borderRadius: 19, backgroundColor: colors.blue, borderWidth: 1, borderColor: colors.accentBlue, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: colors.onNavyMuted, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  title: { color: colors.onWhite, fontSize: 30, fontWeight: "900", marginTop: 8, lineHeight: 36 },
  intro: { color: colors.onNavy, fontSize: 14, lineHeight: 21 },
  trustTag: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, backgroundColor: "#FFFFFF14", paddingHorizontal: 10, paddingVertical: 7 },
  trustText: { color: colors.onNavyMuted, fontSize: 11, fontWeight: "700" },
  heroButton: { flex: 1, minWidth: 145 },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 3 },
  stats: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, minHeight: 92, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: 9 },
  statIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 11 },
  statValue: { color: colors.navy, fontSize: 21, fontWeight: "900" },
  statLabel: { width: "100%", color: colors.secondaryText, fontSize: 12, fontWeight: "700", marginTop: 1 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 3 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
  headingIcon: { width: 29, height: 29, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: colors.paleBlue },
  sectionTitle: { color: colors.navy, fontSize: 17, fontWeight: "800" },
  cards: { gap: 10 },
  empty: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 18, backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1 },
  emptyIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.paleBlue },
  emptyCopy: { flex: 1, gap: 3 },
  emptyTitle: { color: colors.navy, fontSize: 13, fontWeight: "800" },
  body: { color: colors.secondaryText, fontSize: 13, lineHeight: 20 },
  link: { color: colors.blue, fontSize: 13, fontWeight: "700", paddingVertical: 4 },
  linkButton: { flexDirection: "row", alignItems: "center", gap: 2 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.white, padding: 13, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  recordIcon: { width: 37, height: 37, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.paleBlue },
  historyCopy: { flex: 1, gap: 4 },
  historyTitle: { color: colors.navy, fontSize: 13, fontWeight: "800" },
  tip: { backgroundColor: colors.paleBlue, borderRadius: 19, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  tipIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: colors.white },
  tipCopy: { flex: 1, gap: 5 },
  tipTitle: { color: colors.navy, fontSize: 15, fontWeight: "800" },
}); }