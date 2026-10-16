import React from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
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
      <Text style={styles.title}>{t("history")}</Text>
      {history.length === 0 ? (
        <View style={styles.empty}><Text style={styles.body}>{t("noHistory")}</Text></View>
      ) : (
        <>
          {history.map((item) => (
            <View key={item.id} style={styles.record}>
              <View style={styles.row}>
                <Text style={styles.recordTitle}>{t(typeKeys[item.inputType])} · {item.score}/100</Text>
                <RiskBadge level={item.level} label={t(riskLabelKey[item.level])} />
              </View>
              <Text style={styles.body}>{translateRiskSummary(language, item.level)}</Text>
              <Text style={styles.meta}>{new Date(item.scannedAt).toLocaleString()} · {item.method === "local-rules" ? t("offline") : t("online")}</Text>
            </View>
          ))}
          <PrimaryButton label={t("clearHistory")} variant="secondary" onPress={onClear} />
        </>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 18, gap: 12 },
  title: { color: colors.navy, fontSize: 27, fontWeight: "900", marginBottom: 4 },
  empty: { padding: 20, borderRadius: 16, backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1 },
  record: { gap: 9, padding: 16, backgroundColor: colors.white, borderRadius: 17, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  recordTitle: { color: colors.navy, fontSize: 14, fontWeight: "800" },
  body: { color: colors.secondaryText, fontSize: 13, lineHeight: 19 },
  meta: { color: colors.secondaryText, fontSize: 11 },
}); }