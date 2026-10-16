import React, { useState } from "react";
import { useThemeColors, type ThemeColors } from "../theme/ThemeContext";
import Feather from "@expo/vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import LoadingAnimation from "../components/LoadingAnimation";
import PrimaryButton from "../components/PrimaryButton";
import { translate, type TranslationKey } from "../constants/translations";
import { recognizeImageText } from "../services/imageOcr";
import type { InputType, Language } from "../types/scam";

interface ScanScreenProps {
  language: Language;
  initialType: InputType;
  scanning: boolean;
  onlineConfigured: boolean;
  error: string | null;
  onSubmit: (type: InputType, content: string) => void;
}

const inputTypes: InputType[] = ["message", "url", "transcript"];
const labelKeys: Record<InputType, TranslationKey> = { message: "typeMessage", url: "typeUrl", transcript: "typeTranscript" };
const typeIcons: Record<InputType, keyof typeof Feather.glyphMap> = { message: "message-circle", url: "link", transcript: "phone" };

export default function ScanScreen({ language, initialType, scanning, onlineConfigured, error, onSubmit }: ScanScreenProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [type, setType] = useState<InputType>(initialType);
  const [content, setContent] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [readingImage, setReadingImage] = useState(false);
  const t = (key: TranslationKey) => translate(language, key);

  const readImage = async (source: "camera" | "library") => {
    if (readingImage || scanning) return;
    setOcrError(null);
    setValidation(null);
    setReadingImage(true);
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setOcrError(t("cameraPermissionDenied"));
          return;
        }
      }
      const selected = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
      if (selected.canceled || !selected.assets[0]) return;

      const extracted = await recognizeImageText(selected.assets[0].uri, language);
      const cleaned = extracted.trim();
      if (!cleaned) {
        setOcrError(t("ocrNoText"));
        return;
      }
      if (cleaned.length > 10_000) {
        setValidation(t("inputTooLong"));
        return;
      }
      setContent(cleaned);
    } catch {
      setOcrError(t("ocrFailed"));
    } finally {
      setReadingImage(false);
    }
  };

  const submit = () => {
    if (!content.trim()) {
      setValidation(t("emptyInput"));
      return;
    }
    if (content.length > 10_000) {
      setValidation(t("inputTooLong"));
      return;
    }
    setValidation(null);
    onSubmit(type, content.trim());
  };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}><Feather name="search" size={21} color={colors.blue} /></View>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{t("scan")}</Text>
          <Text style={styles.subtitle}>{t("intro")}</Text>
        </View>
      </View>
      <View style={styles.panel}>
        <View style={styles.sectionHeading}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.label}>{t("inputType")}</Text>
        </View>
        <View style={styles.typeOptions}>
          {inputTypes.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ selected: type === item }}
              onPress={() => setType(item)}
              style={[styles.typeOption, type === item && styles.typeSelected]}
            >
              <Feather name={typeIcons[item]} size={16} color={type === item ? colors.blue : colors.secondaryText} />
              <Text style={[styles.typeText, type === item && styles.typeTextSelected]}>{t(labelKeys[item])}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.cameraHeader}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
          <Feather name="camera" size={17} color={colors.blue} />
          <Text style={styles.label}>{t("cameraScan")}</Text>
        </View>
        <Text style={styles.cameraHint}>{t("ocrPrivacy")}</Text>
        {Platform.OS === "web" ? (
          <Text style={styles.cameraHint}>{t("cameraNativeOnly")}</Text>
        ) : (
          <View style={styles.cameraActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: scanning || readingImage, busy: readingImage }}
              disabled={scanning || readingImage}
              onPress={() => { void readImage("camera"); }}
              style={({ pressed }) => [styles.cameraButton, pressed && styles.cameraPressed, (scanning || readingImage) && styles.cameraDisabled]}
            >
              <Feather name="camera" size={18} color={colors.blue} />
              <Text style={styles.cameraButtonText}>{t(readingImage ? "readingPhoto" : "takePhoto")}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: scanning || readingImage, busy: readingImage }}
              disabled={scanning || readingImage}
              onPress={() => { void readImage("library"); }}
              style={({ pressed }) => [styles.cameraButton, pressed && styles.cameraPressed, (scanning || readingImage) && styles.cameraDisabled]}
            >
              <Feather name="image" size={18} color={colors.blue} />
              <Text style={styles.cameraButtonText}>{t("choosePhoto")}</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.sectionHeading}>
          <Text style={styles.stepNumber}>3</Text>
          <Text accessibilityRole="header" style={styles.label}>{t("pasteContent")}</Text>
        </View>
        <TextInput
          accessibilityLabel={t("pasteContent")}
          value={content}
          onChangeText={(value) => { setContent(value); setValidation(null); }}
          editable={!scanning && !readingImage}
          multiline
          textAlignVertical="top"
          maxLength={10_000}
          autoCapitalize={type === "url" ? "none" : "sentences"}
          keyboardType={type === "url" ? "url" : "default"}
          placeholder={t("placeholder")}
          placeholderTextColor={colors.secondaryText}
          style={[styles.input, type === "url" && styles.urlInput]}
        />
        <Text style={styles.counter}>{content.length}/10,000</Text>
        {readingImage && <LoadingAnimation label={t("readingPhoto")} />}
        {!!(validation || error || ocrError) && <Text accessibilityRole="alert" style={styles.error}>{validation ?? ocrError ?? error}</Text>}
        <View style={styles.actions}>
          <PrimaryButton variant="secondary" icon="x" label={t("clear")} disabled={scanning || readingImage || !content} onPress={() => { setContent(""); setValidation(null); setOcrError(null); }} style={styles.clearButton} />
          <PrimaryButton icon="shield" label={t("analyze")} disabled={!content.trim() || scanning || readingImage} loading={scanning} onPress={submit} style={styles.submitButton} />
        </View>
      </View>
      {scanning && <LoadingAnimation label={t(onlineConfigured ? "scanningOnline" : "scanning")} />}
      <Text style={styles.privacy}>{t("privacyText")}</Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { width: "100%", maxWidth: 760, alignSelf: "center", padding: 18, gap: 15 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 3 },
  headingIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.paleBlue },
  headingCopy: { flex: 1, gap: 3 },
  title: { color: colors.navy, fontSize: 25, fontWeight: "900" },
  subtitle: { color: colors.secondaryText, fontSize: 13, lineHeight: 19 },
  panel: { backgroundColor: colors.white, padding: 17, borderRadius: 21, borderWidth: 1, borderColor: colors.border, gap: 13 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  stepNumber: { width: 25, height: 25, textAlign: "center", textAlignVertical: "center", overflow: "hidden", borderRadius: 9, backgroundColor: colors.paleBlue, color: colors.blue, fontSize: 12, fontWeight: "900" },
  stepNumberText: { color: colors.blue, fontSize: 12, fontWeight: "900" },
  label: { color: colors.navy, fontSize: 14, fontWeight: "800" },
  typeOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 5 },
  typeOption: { minHeight: 47, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.inputSurface },
  typeSelected: { backgroundColor: colors.paleBlue, borderColor: colors.blue },
  typeText: { color: colors.secondaryText, fontSize: 12, fontWeight: "700" },
  typeTextSelected: { color: colors.blue },
  cameraHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cameraHint: { color: colors.secondaryText, fontSize: 12, lineHeight: 18 },
  cameraActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cameraButton: { flexGrow: 1, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.paleBlue },
  cameraButtonText: { color: colors.blue, fontSize: 13, fontWeight: "800" },
  cameraPressed: { opacity: 0.75 },
  cameraDisabled: { opacity: 0.5 },
  input: { minHeight: 190, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputSurface, borderRadius: 16, padding: 15, color: colors.text, fontSize: 14, lineHeight: 21 },
  urlInput: { minHeight: 100 },
  counter: { alignSelf: "flex-end", color: colors.secondaryText, fontSize: 11 },
  error: { color: colors.red, fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: "row", gap: 10 },
  clearButton: { flex: 1 },
  submitButton: { flex: 2 },
  privacy: { color: colors.secondaryText, fontSize: 12, lineHeight: 19, marginTop: 4 },
}); }