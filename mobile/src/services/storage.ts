import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Language, ScanHistoryRecord, ThemePreference } from "../types/scam";

const HISTORY_KEY = "@finx/history/v1";
const LANGUAGE_KEY = "@finx/language/v1";
const THEME_KEY = "@finx/theme/v1";
const PROFILE_PHOTO_KEY = "@finx/profile-photo/v1";
const MAX_PROFILE_PHOTO_URI_LENGTH = 4_096;

export async function loadHistory(): Promise<ScanHistoryRecord[]> {
  const serialized = await AsyncStorage.getItem(HISTORY_KEY);
  if (!serialized) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    throw new Error("Saved scan history is corrupted and could not be read.");
  }
  if (!Array.isArray(parsed) || !parsed.every(isHistoryRecord)) {
    throw new Error("Saved scan history has an invalid format.");
  }
  return parsed;
}

export async function saveHistory(records: ScanHistoryRecord[]): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(records));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

export async function loadLanguage(): Promise<Language> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (value === "en" || value === "te" || value === "hi" || value === "ta" || value === "kn") return value;
  return "en";
}

export async function saveLanguage(language: Language): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}

export async function loadTheme(): Promise<ThemePreference> {
  const value = await AsyncStorage.getItem(THEME_KEY);
  if (value === "light" || value === "dark" || value === "system") return value;
  return "light";
}

export async function saveTheme(theme: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, theme);
}

export async function loadProfilePhoto(): Promise<string | null> {
  const uri = await AsyncStorage.getItem(PROFILE_PHOTO_KEY);
  if (uri === null) return null;
  if (!uri.trim() || uri.length > MAX_PROFILE_PHOTO_URI_LENGTH) {
    throw new Error("Saved profile photo reference is invalid.");
  }
  return uri;
}

export async function saveProfilePhoto(uri: string): Promise<void> {
  const normalized = uri.trim();
  if (!normalized || normalized.length > MAX_PROFILE_PHOTO_URI_LENGTH) {
    throw new Error("Profile photo reference is invalid or too long.");
  }
  await AsyncStorage.setItem(PROFILE_PHOTO_KEY, normalized);
}

export async function clearProfilePhoto(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_PHOTO_KEY);
}

function isHistoryRecord(value: unknown): value is ScanHistoryRecord {
  if (!value || typeof value !== "object") return false;
  if (!("id" in value) || typeof value.id !== "string") return false;
  if (!("inputType" in value) || (value.inputType !== "message" && value.inputType !== "url" && value.inputType !== "transcript")) return false;
  if (!("score" in value) || typeof value.score !== "number" || value.score < 0 || value.score > 100) return false;
  if (!("level" in value) || (value.level !== "low" && value.level !== "medium" && value.level !== "high")) return false;
  if (!("explanation" in value) || typeof value.explanation !== "string") return false;
  if (!("method" in value) || (value.method !== "local-rules" && value.method !== "backend-rules" && value.method !== "ai-provider")) return false;
  return "scannedAt" in value && typeof value.scannedAt === "string";
}