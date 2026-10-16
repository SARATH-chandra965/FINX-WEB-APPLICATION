import React from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import Feather from "@expo/vector-icons/Feather";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import RiskBadge, { riskLabelKey } from "../components/RiskBadge";
import { translate, translateRiskSummary, type TranslationKey } from "../constants/translations";
import type { InputType, Language, ScanHistoryRecord } from "../types/scam";

interface HistoryScreenProps {
  language: Language;
  history: ScanHistoryRecord[];
  onClear: () => void;
}

const typeKeys: Record<InputType, TranslationKey> = { message: "typeMessage", url: "typeUrl", transcript: "typeTranscript" };

export default function HistoryScreen({ language, history, onClear }: HistoryScreenProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const t = (key: TranslationKey) => translate(language, key);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.heading}>
        <View style={styles.headingIcon}><Feather name="clock" size={21} color={colors.blue} /></View>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{t("history")}</Text>
          <Text style={styles.subtitle}>{history.length} {t("homeScans").toLowerCase()}</Text>
        </View>
      </View>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Feather name="inbox" size={23} color={colors.blue} /></View>
          <Text style={styles.emptyTitle}>{t("homeEmptyTitle")}</Text>
          <Text style={styles.body}>{t("noHistory")}</Text>
        </View>
      ) : (
        <>
          {history.map((item) => (
            <View key={item.id} style={styles.record}>
              <View style={styles.row}>
                <View style={styles.recordIdentity}>
                  <View style={styles.recordIcon}><Feather name={item.inputType === "url" ? "link" : item.inputType === "transcript" ? "phone" : "message-circle"} size={16} color={colors.blue} /></View>
                  <Text style={styles.recordTitle}>{t(typeKeys[item.inputType])} · {item.score}/100</Text>
                </View>
                <RiskBadge level={item.level} label={t(riskLabelKey[item.level])} />
              </View>
              <Text style={styles.body}>{translateRiskSummary(language, item.level)}</Text>
              <Text style={styles.meta}>{new Date(item.scannedAt).toLocaleString()} · {item.method === "local-rules" ? t("offline") : t("online")}</Text>
            </View>
          ))}
          <PrimaryButton label={t("clearHistory")} icon="trash-2" variant="secondary" onPress={onClear} />
        </>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 18, gap: 13 },
  heading: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 3 },
  headingIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.paleBlue },
  headingCopy: { flex: 1, gap: 2 },
  title: { color: colors.navy, fontSize: 25, fontWeight: "900" },
  subtitle: { color: colors.secondaryText, fontSize: 12 },
  empty: { alignItems: "center", gap: 8, padding: 24, borderRadius: 19, backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1 },
  emptyIcon: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.paleBlue, marginBottom: 3 },
  emptyTitle: { color: colors.navy, fontSize: 15, fontWeight: "800" },
  record: { gap: 9, padding: 15, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.border },
  recordIdentity: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  recordIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: colors.paleBlue },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  recordTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" },
  body: { color: colors.secondaryText, fontSize: 13, lineHeight: 19 },
  meta: { color: colors.secondaryText, fontSize: 11 },
}); }