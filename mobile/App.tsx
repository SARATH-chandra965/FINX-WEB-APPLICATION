import React, { useCallback, useEffect, useRef, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Image, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, useColorScheme, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import HomeScreen from "./src/screens/HomeScreen";
import ScanScreen from "./src/screens/ScanScreen";
import ResultScreen from "./src/screens/ResultScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import SafetyScreen from "./src/screens/SafetyScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import AssistantScreen from "./src/screens/AssistantScreen";
import AppLogo from "./src/components/AppLogo";
import { getThemeColors, ThemeProvider, type ThemeColors } from "./src/theme/ThemeContext";
import { translate, type TranslationKey } from "./src/constants/translations";
import { analyzeWithBackend, hasBackendConfiguration } from "./src/services/api";
import { analyzeContent } from "./src/services/scamDetector";
import { clearHistory as clearStoredHistory, clearProfilePhoto, loadHistory, loadLanguage, loadProfilePhoto, loadTheme, saveHistory, saveLanguage, saveProfilePhoto, saveTheme } from "./src/services/storage";
import { authErrorKey, requestPasswordReset, signIn, signOutUser, signUp, subscribeToAuth } from "./src/services/auth";
import { isFirebaseConfigured } from "./src/services/firebase";
import type { User } from "@firebase/auth";
import type { AuthScreen } from "./src/types/auth";
import type { AppRoute, InputType, Language, ScanHistoryRecord, ScanInput, ScanResult, ThemePreference } from "./src/types/scam";

const primaryRoutes: AppRoute[] = ["Home", "Scan", "Result", "History"];
const routeKeys: Record<AppRoute, TranslationKey> = {
  Home: "home", Scan: "scan", Result: "result", History: "history", Assistant: "assistant", Safety: "safety", Profile: "profile",
};
const routeIcons: Record<AppRoute, keyof typeof Feather.glyphMap> = {
  Home: "home", Scan: "search", Result: "check-circle", History: "clock", Assistant: "message-circle", Safety: "shield", Profile: "user",
};

export default function App() {
  const [route, setRoute] = useState<AppRoute>("Home");
  const [language, setLanguage] = useState<Language>("en");
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [history, setHistory] = useState<ScanHistoryRecord[]>([]);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [inputType, setInputType] = useState<InputType>("message");
  const [scanning, setScanning] = useState(false);
  const [ready, setReady] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const scanLock = useRef(false);
  const lastSubmission = useRef<ScanInput | null>(null);
  const historyRef = useRef<ScanHistoryRecord[]>([]);
  const systemScheme = useColorScheme();
  const colors = getThemeColors(themePreference, systemScheme);
  const styles = createStyles(colors);
  const t = (key: TranslationKey) => translate(language, key);

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      const notices: string[] = [];
      try {
        const savedLanguage = await loadLanguage();
        if (mounted) setLanguage(savedLanguage);
      } catch {
        notices.push(translate("en", "prefsLoadError"));
      }
      try {
        const savedTheme = await loadTheme();
        if (mounted) setThemePreference(savedTheme);
      } catch {
        notices.push(translate("en", "themeLoadError"));
      }
      try {
        const savedHistory = await loadHistory();
        if (mounted) {
          historyRef.current = savedHistory;
          setHistory(savedHistory);
        }
      } catch {
        notices.push(translate("en", "historyLoadError"));
      }
      try {
        const savedPhoto = await loadProfilePhoto();
        if (mounted) setProfilePhotoUri(savedPhoto);
      } catch {
        notices.push(translate("en", "profilePhotoLoadError"));
      }
      if (mounted) {
        setNotice(notices.length ? notices.join(" ") : null);
        setReady(true);
      }
    };
    void initialize();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((authenticatedUser) => {
      setUser(authenticatedUser);
      if (authenticatedUser) {
        setAuthScreen(null);
        setAuthError(null);
      }
    });
    return () => unsubscribe?.();
  }, []);

  const chooseScan = useCallback((type: InputType) => {
    setInputType(type);
    setScanError(null);
    setRoute("Scan");
  }, []);

  const startScan = async (type: InputType, content: string) => {
    if (scanLock.current) return;
    scanLock.current = true;
    setScanning(true);
    setScanError(null);
    setNotice(null);
    setShowRetry(false);
    lastSubmission.current = hasBackendConfiguration() ? { type, content } : null;
    try {
      let analysis;
      if (hasBackendConfiguration()) {
        try {
          analysis = await analyzeWithBackend({ type, content, language });
          lastSubmission.current = null;
        } catch {
          analysis = analyzeContent({ type, content });
          setNotice(t("onlineUnavailable"));
          setShowRetry(true);
        }
      } else {
        analysis = analyzeContent({ type, content });
      }
      const now = new Date().toISOString();
      const completed: ScanResult = { ...analysis, id: `${Date.now()}`, analyzedAt: now };
      setResult(completed);
      const record: ScanHistoryRecord = {
        id: completed.id,
        inputType: type,
        score: completed.score,
        level: completed.level,
        explanation: completed.summary,
        method: completed.method,
        scannedAt: now,
      };
      const nextHistory = [record, ...historyRef.current].slice(0, 100);
      historyRef.current = nextHistory;
      setHistory(nextHistory);
      try {
        await saveHistory(nextHistory);
      } catch {
        setNotice(t("historySaveError"));
      }
      setRoute("Result");
    } catch (error) {
      setScanError(error instanceof Error ? error.message : t("scanError"));
    } finally {
      scanLock.current = false;
      setScanning(false);
    }
  };

  const retryOnline = async () => {
    const submission = lastSubmission.current;
    if (!submission || scanLock.current) return;
    scanLock.current = true;
    setScanning(true);
    setNotice(null);
    setShowRetry(false);
    try {
      const analysis = await analyzeWithBackend({ ...submission, language });
      lastSubmission.current = null;
      const now = new Date().toISOString();
      const completed: ScanResult = { ...analysis, id: `${Date.now()}`, analyzedAt: now };
      setResult(completed);
      const record: ScanHistoryRecord = {
        id: completed.id,
        inputType: submission.type,
        score: completed.score,
        level: completed.level,
        explanation: completed.summary,
        method: completed.method,
        scannedAt: now,
      };
      const nextHistory = [record, ...historyRef.current.filter((item) => item.id !== result?.id)].slice(0, 100);
      historyRef.current = nextHistory;
      setHistory(nextHistory);
      try {
        await saveHistory(nextHistory);
      } catch {
        setNotice(t("onlineHistorySaveError"));
      }
    } catch {
      setNotice(t("retryError"));
      setShowRetry(true);
    } finally {
      scanLock.current = false;
      setScanning(false);
    }
  };

  const runAuthAction = async (action: () => Promise<void>) => {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError(null);
    try {
      await action();
    } catch (error) {
      setAuthError(t(authErrorKey(error)));
    } finally {
      setAuthBusy(false);
    }
  };

  const changeLanguage = async (next: Language) => {
    setLanguage(next);
    try {
      await saveLanguage(next);
      setNotice(null);
    } catch {
      setNotice(t("languageSaveError"));
    }
  };

  const changeTheme = async (next: ThemePreference) => {
    setThemePreference(next);
    try {
      await saveTheme(next);
      setNotice(null);
    } catch {
      setNotice(t("themeSaveError"));
    }
  };

  const clearHistory = async () => {
    try {
      await clearStoredHistory();
      historyRef.current = [];
      setHistory([]);
      setNotice(t("historyCleared"));
    } catch {
      setNotice(t("historyDeleteError"));
    }
  };

  const pickProfilePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setNotice(t("profilePhotoPermissionDenied"));
        return;
      }
      const selection = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });
      if (selection.canceled) return;
      const uri = selection.assets[0]?.uri;
      if (!uri) throw new Error("Image picker returned no photo URI.");
      await saveProfilePhoto(uri);
      setProfilePhotoUri(uri);
      setNotice(null);
    } catch {
      setNotice(t("profilePhotoSaveError"));
    }
  };

  const removeProfilePhoto = async () => {
    try {
      await clearProfilePhoto();
      setProfilePhotoUri(null);
      setNotice(null);
    } catch {
      setNotice(t("profilePhotoSaveError"));
    }
  };

  if (!ready) {
    return <SafeAreaView style={styles.loading}><AppLogo size={68} /><ActivityIndicator size="large" color={colors.blue} /><Text style={styles.loadingText}>{t("loadingPreferences")}</Text></SafeAreaView>;
  }

  return (
    <ThemeProvider preference={themePreference}>
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={themePreference === "dark" || (themePreference === "system" && systemScheme === "dark") ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <View style={styles.header}>
        <AppLogo size={42} />
        <View style={styles.brandCopy}>
          <Text style={styles.brand}>{t("brand")}</Text>
          <Text style={styles.tagline}>{t("tagline")}</Text>
        </View>
        {!authScreen && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("assistant")}
            onPress={() => setRoute("Assistant")}
            style={[styles.profileButton, route === "Assistant" && styles.navSelected]}
          >
            <Feather name={routeIcons.Assistant} size={19} color={route === "Assistant" ? colors.blue : colors.secondaryText} />
          </Pressable>
        )}
        {!authScreen && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("profile")}
            onPress={() => setRoute("Profile")}
            style={[styles.profileButton, route === "Profile" && styles.navSelected]}
          >
            {profilePhotoUri
              ? <Image source={{ uri: profilePhotoUri }} style={styles.headerAvatar} />
              : <Feather name={routeIcons.Profile} size={19} color={route === "Profile" ? colors.blue : colors.secondaryText} />}
          </Pressable>
        )}
      </View>
      {!!notice && (
        <View style={styles.noticeBox}>
          <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text>
          {showRetry && (
            <Pressable accessibilityRole="button" onPress={retryOnline} disabled={scanning} style={styles.retryButton}>
              <Text style={styles.retryText}>{scanning ? t("retrying") : t("retryOnline")}</Text>
            </Pressable>
          )}
        </View>
      )}
      <View style={styles.main}>
       <View style={[styles.content, !authScreen && styles.contentWithNav]}>
        {authScreen === "login" && <LoginScreen
          language={language} configured={isFirebaseConfigured} busy={authBusy} error={authError}
          onLogin={(email, password) => { void runAuthAction(() => signIn(email, password)); }}
          onSignup={() => { setAuthError(null); setAuthScreen("signup"); }}
          onForgotPassword={() => { setAuthError(null); setResetSent(false); setAuthScreen("forgot-password"); }}
          onContinueGuest={() => { setAuthScreen(null); setRoute("Home"); }}
        />}
        {authScreen === "signup" && <SignupScreen
          language={language} configured={isFirebaseConfigured} busy={authBusy} error={authError}
          onSignup={(name, email, password) => { void runAuthAction(() => signUp(name, email, password)); }}
          onLogin={() => { setAuthError(null); setAuthScreen("login"); }}
        />}
        {authScreen === "forgot-password" && <ForgotPasswordScreen
          language={language} configured={isFirebaseConfigured} busy={authBusy} error={authError} sent={resetSent}
          onReset={(email) => { void runAuthAction(async () => { await requestPasswordReset(email); setResetSent(true); }); }}
          onLogin={() => { setAuthError(null); setAuthScreen("login"); }}
        />}
        {!authScreen && route === "Home" && <HomeScreen language={language} history={history} onNavigate={setRoute} onChooseScan={chooseScan} />}
        {!authScreen && route === "Scan" && <ScanScreen key={inputType} language={language} initialType={inputType} scanning={scanning} onlineConfigured={hasBackendConfiguration()} error={scanError} onSubmit={startScan} />}
        {!authScreen && route === "Result" && <ResultScreen language={language} result={result} onScanAgain={() => chooseScan(inputType)} onHome={() => setRoute("Home")} />}
        {!authScreen && route === "History" && <HistoryScreen language={language} history={history} onClear={clearHistory} />}
        {!authScreen && route === "Assistant" && <AssistantScreen language={language} />}
        {!authScreen && route === "Safety" && <SafetyScreen language={language} />}
        {!authScreen && route === "Profile" && <ProfileScreen
          language={language} historyCount={history.length} user={user} authError={authError}
          profilePhotoUri={profilePhotoUri} onPickProfilePhoto={() => { void pickProfilePhoto(); }}
          onRemoveProfilePhoto={() => { void removeProfilePhoto(); }}
          themePreference={themePreference} onThemeChange={changeTheme}
          onLanguageChange={changeLanguage} onClearHistory={clearHistory}
          onSignIn={() => { setAuthError(null); setAuthScreen("login"); }}
          onSignOut={() => { void runAuthAction(async () => { await signOutUser(); setNotice(null); }); }}
        />}
       </View>
      {!authScreen && <View style={styles.nav}>
        {primaryRoutes.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: route === item }}
            onPress={() => setRoute(item)}
            style={[styles.navItem, route === item && styles.navSelected]}
          >
            <Feather name={routeIcons[item]} size={19} color={route === item ? colors.blue : colors.secondaryText} />
            <Text style={[styles.navLabel, route === item && styles.navLabelSelected]}>{t(routeKeys[item])}</Text>
          </Pressable>
        ))}
      </View>}
      </View>
    </SafeAreaView>
    </ThemeProvider>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: 12 },
  loadingText: { color: colors.navy, fontWeight: "700" },
  header: { width: "100%", maxWidth: 760, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, gap: 11 },
  brandCopy: { flex: 1 },
  brand: { color: colors.navy, fontSize: 19, fontWeight: "900", letterSpacing: 1.5 },
  tagline: { color: colors.secondaryText, fontSize: 12, marginTop: 2 },
  noticeBox: { maxWidth: 760, width: "92%", alignSelf: "center", padding: 10, borderRadius: 10, backgroundColor: colors.paleWarning, marginBottom: 4, gap: 7 },
  notice: { color: colors.text, fontSize: 14, lineHeight: 20 },
  retryButton: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start", paddingHorizontal: 10 },
  retryText: { color: colors.blue, fontWeight: "800", fontSize: 14 },
  main: { flex: 1, position: "relative" },
  content: { flex: 1 },
  contentWithNav: { paddingTop: 72 },
  nav: { position: "absolute", zIndex: 10, elevation: 8, top: 8, left: 12, right: 12, maxWidth: 720, minHeight: 64, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, shadowColor: colors.navy, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 12 },
  navItem: { flex: 1, minWidth: 0, minHeight: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, paddingVertical: 4, borderRadius: 14, gap: 1 },
  navSelected: { backgroundColor: colors.paleBlue },
  navLabel: { color: colors.secondaryText, fontSize: 10, fontWeight: "700" },
  navLabelSelected: { color: colors.blue },
  profileButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
}); }
