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
    const spokenText = [
      translateRiskSummary(language, result.level),
      ...localizedSignals,
      ...translateRecommendations(language, result.level),
    ].join(". ");
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
      <Text style={styles.title}>{t("result")}</Text>
      <Text style={styles.text}>{t("noHistory")}</Text>
      <PrimaryButton label={t("scanNow")} onPress={onScanAgain} />
    </View>
  );

  const tone = result.level === "high" ? colors.red : result.level === "medium" ? colors.amber : colors.green;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>{t("result")}</Text>
      <View style={styles.panel}>
        <RiskBadge level={result.level} label={t(riskLabelKey[result.level])} />
        <Text style={[styles.score, { color: tone }]}>{result.score}<Text style={styles.outOf}> / 100</Text></Text>
        <Text style={styles.text}>{t("score")} · {result.method === "local-rules" ? t("offline") : result.method === "ai-provider" ? t("aiService") : t("online")}</Text>
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
        <Text accessibilityRole="header" style={styles.section}>{t("whyFlagged")}</Text>
        {result.signals.length === 0 ? <Text style={styles.text}>{t("noSignals")}</Text> : result.signals.map((signal) => {
          const localized = translateSignal(language, signal);
          return (
            <View key={signal.id} style={styles.signal}>
              <Text style={styles.signalTitle}>• {localized.title}</Text>
              <Text style={styles.text}>{localized.explanation}</Text>
            </View>
          );
        })}
        <Text accessibilityRole="header" style={styles.section}>{t("whatNext")}</Text>
        {translateRecommendations(language, result.level).map((recommendation, index) => <Text key={`${index}-${recommendation}`} style={styles.recommendation}>• {recommendation}</Text>)}
      </View>
      <Text style={styles.disclaimer}>{t("disclaimer")}</Text>
      <PrimaryButton label={t("scanAgain")} onPress={onScanAgain} />
      <PrimaryButton label={t("backHome")} variant="secondary" onPress={onHome} />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 18, paddingBottom: 28, gap: 12 },
  title: { color: colors.navy, fontSize: 27, fontWeight: "900" },
  panel: { backgroundColor: colors.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border },
  score: { fontSize: 46, fontWeight: "900", marginTop: 14 },
  outOf: { fontSize: 18, color: colors.secondaryText, fontWeight: "600" },
  text: { color: colors.secondaryText, fontSize: 13, lineHeight: 20, marginTop: 4 },
  summary: { color: colors.navy, fontSize: 17, fontWeight: "800", lineHeight: 25, marginTop: 12 },
  listenButton: { minHeight: 46, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paleBlue },
  listenLabel: { color: colors.blue, fontSize: 14, fontWeight: "800" },
  speechHint: { color: colors.secondaryText, fontSize: 12, lineHeight: 18, marginTop: 5 },
  track: { height: 8, overflow: "hidden", backgroundColor: colors.border, borderRadius: 8, marginTop: 14 },
  fill: { height: "100%", borderRadius: 8 },
  section: { color: colors.navy, fontSize: 16, fontWeight: "800", marginTop: 22, marginBottom: 8 },
  signal: { paddingVertical: 8, borderBottomColor: colors.border, borderBottomWidth: 1 },
  signalTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  recommendation: { color: colors.text, fontSize: 13, lineHeight: 20, marginBottom: 7 },
  disclaimer: { color: colors.secondaryText, fontSize: 12, lineHeight: 19 },
}); }