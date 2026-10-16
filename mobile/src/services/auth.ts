import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
  type Unsubscribe,
} from "@firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";

function requireAuth() {
  if (!isFirebaseConfigured || !auth) throw new Error("firebase/not-configured");
  return auth;
}

export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe | null {
  if (!isFirebaseConfigured || !auth) return null;
  return onAuthStateChanged(auth, callback);
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
}

export async function signUp(name: string, email: string, password: string): Promise<void> {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
  if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(requireAuth(), email.trim());
}

export async function signOutUser(): Promise<void> {
  await signOut(requireAuth());
}

export function authErrorKey(error: unknown): "firebaseNotConfigured" | "authError" {
  if (error && typeof error === "object" && "code" in error && error.code === "firebase/not-configured") {
    return "firebaseNotConfigured";
  }
  return "authError";
}
