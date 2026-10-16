import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "@firebase/app";
import { getAuth, initializeAuth, type Auth } from "@firebase/auth";
import { Platform } from "react-native";
import type { FirebaseClientConfig } from "../types/auth";

const config: FirebaseClientConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

class NativeAsyncStoragePersistence {
  static readonly type = "LOCAL" as const;
  readonly type = "LOCAL" as const;

  async _isAvailable(): Promise<boolean> {
    const key = "@finx/firebase-auth-storage-check";
    try {
      await AsyncStorage.setItem(key, "1");
      await AsyncStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  async _set(key: string, value: unknown): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async _get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value === null ? null : JSON.parse(value) as T;
  }

  async _remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  _addListener(_key: string, _listener: (value: unknown) => void): void {}
  _removeListener(_key: string, _listener: (value: unknown) => void): void {}
}

let firebaseAuth: Auth | null = null;

if (isFirebaseConfigured) {
  const app = getApps().length ? getApp() : initializeApp(config);
  try {
    firebaseAuth = Platform.OS === "web"
      ? getAuth(app)
      : initializeAuth(app, { persistence: NativeAsyncStoragePersistence });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "auth/already-initialized") {
      firebaseAuth = getAuth(app);
    } else {
      throw error;
    }
  }
}

export const auth = firebaseAuth;
