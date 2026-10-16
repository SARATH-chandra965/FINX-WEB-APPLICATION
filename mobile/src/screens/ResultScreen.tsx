import React, { useEffect, useState } from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import Feather from "@expo/vector-icons/Feather";
import * as Speech from "expo-speech";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import RiskBadge, { riskLabelKey } from "../components/RiskBadge";
import { translate, translateRecommendations, translateRiskSummary, translateSignal, type TranslationKey } from "../constants/translations";
import type { Language, ScanResult } from "../types/scam";

interface ResultScreenProps {
  language: Language;
  result: ScanResult | null;
  onScanAgain: () => void;
  onHome: () => void;
}

export default function ResultScreen({ language, result, onScanAgain, onHome }: ResultScreenProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [speaking, setSpeaking] = useState(false);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const t = (key: TranslationKey) => translate(language, key);
  useEffect(() => () => { void Speech.stop(); }, []);

  const toggleSpeech = async () => {
    setSpeechUnavailable(false);
    if (speaking) {
      try {
        await Speech.stop();
        setSpeaking(false);
      } catch {
        setSpeechUnavailable(true);
      }
      return;
    }
    if (!result) return;
    const languageCode: Record<Language, string> = {
      en: "en-IN", te: "te-IN", hi: "hi-IN", ta: "ta-IN", kn: "kn-IN",
    };
    const localizedSignals = result.signals.map((signal) => {
      const localized = translateSignal(language, signal);
      return `${localized.title}. ${localized.explanation}`;
    });
    const localizedSpokenText = [
      translateRiskSummary(language, result.level),
      ...localizedSignals,
      ...translateRecommendations(language, result.level),
    ].join(". ");
    const spokenText = result.method === "ai-provider" && result.speechText
      ? `${translateRiskSummary(language, result.level)}. ${result.speechText}`
      : localizedSpokenText;
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const languagePrefix = languageCode[language].split("-")[0];
      if (!voices.some((voice) => voice.language.toLowerCase().startsWith(languagePrefix))) {
        setSpeechUnavailable(true);
        return;
      }
      setSpeaking(true);
      Speech.speak(spokenText, {
        language: languageCode[language],
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => { setSpeaking(false); setSpeechUnavailable(true); },
      });
    } catch {
      setSpeechUnavailable(true);
    }
  };
  if (!result) return (
    <View style={styles.page}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}><Feather name="activity" size={20} color={colors.blue} /></View>
        <Text style={styles.title}>{t("result")}</Text>
      </View>
      <Text style={styles.text}>{t("noHistory")}</Text>
      <PrimaryButton label={t("scanNow")} icon="search" onPress={onScanAgain} />
    </View>
  );

  const tone = result.level === "high" ? colors.red : result.level === "medium" ? colors.amber : colors.green;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}><Feather name="activity" size={20} color={colors.blue} /></View>
        <Text style={styles.title}>{t("result")}</Text>
      </View>
      <View style={styles.panel}>
        <View style={styles.resultHeader}>
          <View style={[styles.riskIcon, { backgroundColor: result.level === "high" ? colors.paleRed : result.level === "medium" ? colors.paleAmber : colors.paleGreen }]}>
            <Feather name={result.level === "low" ? "shield" : "alert-triangle"} size={21} color={tone} />
          </View>
          <View style={styles.riskCopy}>
            <Text style={styles.resultEyebrow}>{t("result")}</Text>
            <RiskBadge level={result.level} label={t(riskLabelKey[result.level])} />
          </View>
          <Text style={[styles.score, { color: tone }]}>{result.score}<Text style={styles.outOf}>/100</Text></Text>
        </View>
        <Text style={styles.text}>{t(result.method === "ai-provider" ? "aiScore" : "score")} · {result.method === "local-rules" ? t("offline") : result.method === "ai-provider" ? t("aiService") : t("online")}</Text>
        {result.analysisNote === "ai-fallback" && <Text accessibilityRole="alert" style={styles.fallbackNote}>{t("aiFallback")}</Text>}
        <Text style={styles.summary}>{translateRiskSummary(language, result.level)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(speaking ? "stopListening" : "listen")}
          onPress={() => { void toggleSpeech(); }}
          style={styles.listenButton}
        >
          <Feather name={speaking ? "square" : "volume-2"} size={18} color={colors.blue} />
          <Text style={styles.listenLabel}>{t(speaking ? "stopListening" : "listen")}</Text>
        </Pressable>
        {speechUnavailable && <Text accessibilityRole="alert" style={styles.speechHint}>{t("speechUnavailable")}</Text>}
        <View style={styles.track}><View style={[styles.fill, { width: `${result.score}%`, backgroundColor: tone }]} /></View>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}><Feather name="alert-circle" size={15} color={colors.blue} /></View>
          <Text accessibilityRole="header" style={styles.section}>{t("whyFlagged")}</Text>
        </View>
        {result.signals.length === 0 ? <View style={styles.noSignals}><Feather name="check-circle" size={18} color={colors.green} /><Text style={styles.noSignalsText}>{t("noSignals")}</Text></View> : result.signals.map((signal) => {
          const localized = translateSignal(language, signal);
          return (
            <View key={signal.id} style={styles.signal}>
              <View style={styles.signalTitleRow}><Feather name="alert-triangle" size={15} color={colors.amber} /><Text style={styles.signalTitle}>{localized.title}</Text></View>
              <Text style={styles.text}>{localized.explanation}</Text>
            </View>
          );
        })}
        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}><Feather name="check-square" size={15} color={colors.blue} /></View>
          <Text accessibilityRole="header" style={styles.section}>{t("whatNext")}</Text>
        </View>
        {translateRecommendations(language, result.level).map((recommendation, index) => (
          <View key={`${index}-${recommendation}`} style={styles.recommendationRow}>
            <Feather name="check" size={15} color={colors.blue} />
            <Text style={styles.recommendation}>{recommendation}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.disclaimer}>{t("disclaimer")}</Text>
      <PrimaryButton label={t("scanAgain")} icon="refresh-cw" onPress={onScanAgain} />
      <PrimaryButton label={t("backHome")} icon="home" variant="secondary" onPress={onHome} />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 18, paddingBottom: 34, gap: 12 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 3 },
  headingIcon: { width: 47, height: 47, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.paleBlue },
  title: { color: colors.navy, fontSize: 25, fontWeight: "900" },
  panel: { backgroundColor: colors.white, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.border, gap: 4 },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 5 },
  riskIcon: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  riskCopy: { flex: 1, gap: 5, alignItems: "flex-start" },
  resultEyebrow: { color: colors.secondaryText, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  score: { fontSize: 25, fontWeight: "900" },
  outOf: { fontSize: 11, color: colors.secondaryText, fontWeight: "700" },
  text: { color: colors.secondaryText, fontSize: 13, lineHeight: 20, marginTop: 4 },
  fallbackNote: { color: colors.amber, backgroundColor: colors.paleAmber, padding: 10, borderRadius: 11, fontSize: 12, lineHeight: 18, marginTop: 5 },
  summary: { color: colors.navy, fontSize: 17, fontWeight: "800", lineHeight: 25, marginTop: 12 },
  listenButton: { minHeight: 46, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paleBlue },
  listenLabel: { color: colors.blue, fontSize: 14, fontWeight: "800" },
  speechHint: { color: colors.secondaryText, fontSize: 12, lineHeight: 18, marginTop: 5 },
  track: { height: 8, overflow: "hidden", backgroundColor: colors.border, borderRadius: 8, marginTop: 14 },
  fill: { height: "100%", borderRadius: 8 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 5 },
  sectionIcon: { width: 27, height: 27, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: colors.paleBlue },
  section: { color: colors.navy, fontSize: 15, fontWeight: "800" },
  noSignals: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 13, backgroundColor: colors.paleGreen, marginTop: 4 },
  noSignalsText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
  signal: { paddingVertical: 11, borderBottomColor: colors.border, borderBottomWidth: 1 },
  signalTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  signalTitle: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "700" },
  recommendationRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 7 },
  recommendation: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20 },
  disclaimer: { color: colors.secondaryText, fontSize: 12, lineHeight: 19 },
}); }