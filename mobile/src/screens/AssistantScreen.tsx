import React, { useEffect, useRef, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import * as Speech from "expo-speech";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { translate, type TranslationKey } from "../constants/translations";
import { askGemini, type AssistantMessage } from "../services/assistantApi";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import type { Language } from "../types/scam";

interface AssistantScreenProps {
  language: Language;
}

const speechLocales: Record<Language, string> = {
  en: "en-IN",
  te: "te-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  kn: "kn-IN",
};

export default function AssistantScreen({ language }: AssistantScreenProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [recognizing, setRecognizing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState(false);
  const [ttsError, setTtsError] = useState(false);
  const mounted = useRef(true);
  const sendLock = useRef(false);
  const t = (key: TranslationKey) => translate(language, key);

  useSpeechRecognitionEvent("start", () => setRecognizing(true));
  useSpeechRecognitionEvent("end", () => setRecognizing(false));
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) setDraft(transcript);
  });
  useSpeechRecognitionEvent("error", () => {
    setRecognizing(false);
    setSpeechError(true);
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      ExpoSpeechRecognitionModule.abort();
      void Speech.stop();
    };
  }, []);

  const toggleRecognition = async () => {
    setSpeechError(false);
    if (recognizing) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setSpeechError(true);
        return;
      }
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        setSpeechError(true);
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: speechLocales[language],
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
      });
    } catch {
      setSpeechError(true);
    }
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || sendLock.current || content.length > 1_500) return;
    sendLock.current = true;
    setError(null);
    setSending(true);
    const conversation: AssistantMessage[] = [...messages.slice(-11), { role: "user", content }];
    try {
      const reply = await askGemini({ messages: conversation, language });
      if (!mounted.current) return;
      const updatedConversation: AssistantMessage[] = [...conversation, { role: "assistant", content: reply }];
      setMessages(updatedConversation.slice(-12));
      setDraft("");
      setTtsError(false);
      Speech.speak(reply, {
        language: speechLocales[language],
        onError: () => setTtsError(true),
      });
    } catch (requestError) {
      if (mounted.current) setError(requestError instanceof Error ? requestError.message : t("assistantError"));
    } finally {
      sendLock.current = false;
      if (mounted.current) setSending(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.intro}>
        <View style={styles.titleRow}>
          <View style={styles.icon}><Feather name="message-circle" size={22} color={colors.blue} /></View>
          <View style={styles.titleCopy}>
            <Text accessibilityRole="header" style={styles.title}>{t("assistantTitle")}</Text>
            <View style={styles.secureTag}><Feather name="lock" size={11} color={colors.green} /><Text style={styles.secureText}>{t("privacy")}</Text></View>
          </View>
        </View>
        <Text style={styles.body}>{t("assistantIntro")}</Text>
        <Text style={styles.privacy}>{t("assistantPrivacy")}</Text>
      </View>

      <ScrollView style={styles.conversation} contentContainerStyle={styles.messageList} keyboardShouldPersistTaps="handled">
        {messages.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Feather name="shield" size={22} color={colors.blue} /></View>
            <Text style={styles.emptyText}>{t("assistantWelcome")}</Text>
          </View>
        )}
        {messages.map((message, index) => (
          <View key={`${index}-${message.role}`} style={[styles.bubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}>
            {message.role === "assistant" && <View style={styles.messageIcon}><Feather name="shield" size={13} color={colors.blue} /></View>}
            <Text style={[styles.messageText, message.role === "user" && styles.userMessageText]}>{message.content}</Text>
            {message.role === "assistant" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("listen")}
                onPress={() => {
                  setTtsError(false);
                  Speech.speak(message.content, { language: speechLocales[language], onError: () => setTtsError(true) });
                }}
                style={styles.replay}
              >
                <Feather name="volume-2" size={16} color={colors.blue} />
              </Pressable>
            )}
          </View>
        ))}
        {sending && <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}><ActivityIndicator size="small" color={colors.blue} /><Text style={styles.body}>{t("assistantThinking")}</Text></View>}
      </ScrollView>

      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {speechError && <Text accessibilityRole="alert" style={styles.error}>{t("assistantSpeechError")}</Text>}
      {ttsError && <Text accessibilityRole="alert" style={styles.error}>{t("assistantTtsError")}</Text>}
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(recognizing ? "assistantStopListening" : "assistantListen")}
          accessibilityState={{ disabled: sending, busy: recognizing }}
          disabled={sending}
          onPress={() => { void toggleRecognition(); }}
          style={[styles.micButton, recognizing && styles.micActive, sending && styles.disabled]}
        >
          <Feather name={recognizing ? "square" : "mic"} size={20} color={recognizing ? colors.red : colors.blue} />
        </Pressable>
        <TextInput
          accessibilityLabel={t("assistantDraft")}
          editable={!sending}
          maxLength={1_500}
          multiline
          onChangeText={setDraft}
          onSubmitEditing={() => { void sendMessage(); }}
          placeholder={t("assistantPlaceholder")}
          placeholderTextColor={colors.secondaryText}
          returnKeyType="send"
          style={[styles.input, styles.composer]}
          value={draft}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("assistantSend")}
          accessibilityState={{ disabled: sending || !draft.trim() || draft.length > 1_500, busy: sending }}
          disabled={sending || !draft.trim() || draft.length > 1_500}
          onPress={() => { void sendMessage(); }}
          style={[styles.sendButton, (sending || !draft.trim() || draft.length > 1_500) && styles.disabled]}
        >
          {sending ? <ActivityIndicator color={colors.onWhite} size="small" /> : <Feather name="arrow-up" size={20} color={colors.onWhite} />}
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { flex: 1, width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 18, paddingBottom: 14, gap: 10 },
  intro: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 16, gap: 9 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 45, height: 45, borderRadius: 15, backgroundColor: colors.paleBlue, alignItems: "center", justifyContent: "center" },
  titleCopy: { flex: 1, gap: 3 },
  title: { color: colors.navy, fontSize: 18, fontWeight: "800" },
  secureTag: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  secureText: { color: colors.green, fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  body: { color: colors.secondaryText, fontSize: 13, lineHeight: 19 },
  privacy: { color: colors.secondaryText, fontSize: 11, lineHeight: 16 },
  conversation: { flex: 1 },
  messageList: { flexGrow: 1, justifyContent: "flex-end", paddingVertical: 8, gap: 11 },
  empty: { alignItems: "center", justifyContent: "center", gap: 10, padding: 28 },
  emptyIcon: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: colors.paleBlue },
  emptyText: { color: colors.secondaryText, fontSize: 14, textAlign: "center", lineHeight: 21 },
  bubble: { maxWidth: "90%", padding: 13, borderRadius: 17 },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.blue, borderBottomRightRadius: 5 },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 5 },
  messageIcon: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: colors.paleBlue, marginBottom: 6 },
  messageText: { color: colors.text, fontSize: 14, lineHeight: 21 },
  userMessageText: { color: colors.onWhite },
  replay: { alignSelf: "flex-end", marginTop: 8, padding: 4 },
  loadingBubble: { flexDirection: "row", alignItems: "center", gap: 8 },
  error: { color: colors.red, fontSize: 13, lineHeight: 18, paddingHorizontal: 4 },
  controls: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  micButton: { width: 50, height: 50, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: 17 },
  micActive: { backgroundColor: colors.paleRed, borderColor: colors.red },
  input: { minHeight: 50, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.inputSurface, fontSize: 14, textAlignVertical: "top" },
  composer: { flex: 1 },
  sendButton: { width: 50, height: 50, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: colors.blue },
  disabled: { opacity: 0.5 },
}); }
