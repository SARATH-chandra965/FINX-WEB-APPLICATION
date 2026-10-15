/**
 * FINX Firebase Authentication Module
 * Manages Firebase App & Auth lifecycle:
 * - Email & Password Sign In / Sign Up
 * - Google Sign-In via Popup
 * - Password Reset Email
 * - Reactive Auth State Observer & Session Cache
 * - Offline Demo Mode Fallback
 */

// Default or Local Firebase Configuration
const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyDEMO-KEY-REPLACE-WITH-YOUR-KEY",
    authDomain: "finx-scam-shield.firebaseapp.com",
    projectId: "finx-scam-shield",
    storageBucket: "finx-scam-shield.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

let firebaseApp = null;
let firebaseAuth = null;
let isFirebaseConfigured = false;

// Retrieve Active Firebase Config from localStorage or Server Defaults
function getActiveFirebaseConfig() {
    try {
        const saved = localStorage.getItem('finx_firebase_config');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.apiKey && !parsed.apiKey.includes("DEMO-KEY")) {
                return { config: parsed, isCustom: true };
            }
        }
    } catch (e) {
        console.warn("Could not read saved Firebase config:", e);
    }
    return { config: DEFAULT_FIREBASE_CONFIG, isCustom: false };
}

// Initialize Firebase SDK
function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn("Firebase SDK script not loaded yet.");
        return false;
    }

    try {
        const { config, isCustom } = getActiveFirebaseConfig();
        isFirebaseConfigured = isCustom;

        if (!firebase.apps || firebase.apps.length === 0) {
            firebaseApp = firebase.initializeApp(config);
        } else {
            firebaseApp = firebase.app();
        }

        firebaseAuth = firebase.auth();

        // Listen for auth state changes
        firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    photoURL: user.photoURL || null,
                    isAnonymous: user.isAnonymous
                };
                localStorage.setItem('finx_user', JSON.stringify(userData));
                window.dispatchEvent(new CustomEvent('finx:auth-change', { detail: { user: userData, loggedIn: true } }));
            } else {
                // If demo user is not set, clear
                if (!localStorage.getItem('finx_demo_user')) {
                    localStorage.removeItem('finx_user');
                }
                window.dispatchEvent(new CustomEvent('finx:auth-change', { detail: { user: null, loggedIn: false } }));
            }
        });

        return true;
    } catch (err) {
        console.warn("Firebase init note:", err.message);
        return false;
    }
}

// Normalize Email or Mobile Number
function normalizeIdentifier(input) {
    if (!input) return { email: '', display: '', isPhone: false };
    const raw = String(input).trim();
    if (raw.includes('@')) {
        return { email: raw, display: raw, isPhone: false };
    }
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.length >= 7) {
        return {
            email: `sms_${digits}@finx.local`,
            display: raw.startsWith('+') ? raw : (digits.length === 10 ? `+91 ${digits}` : digits),
            isPhone: true,
            digits: digits
        };
    }
    return { email: raw, display: raw, isPhone: false };
}

// Sign Up with Email or Number and Password
async function signUpWithIdentifier(identifier, password, confirmPassword) {
    if (!identifier || !password) {
        throw new Error("Please enter your email or mobile number and password.");
    }
    if (confirmPassword !== undefined && confirmPassword !== null && confirmPassword !== '') {
        if (password !== confirmPassword) {
            throw new Error("Passwords do not match. Please verify your password.");
        }
    }
    if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
    }
    const norm = normalizeIdentifier(identifier);
    return await signUpWithEmail(norm.email, password, norm.display);
}

// Sign In with Email or Number and Password
async function signInWithIdentifier(identifier, password) {
    if (!identifier || !password) {
        throw new Error("Please enter your email or mobile number and password.");
    }
    const norm = normalizeIdentifier(identifier);
    const user = await signInWithEmail(norm.email, password);
    if (norm.isPhone && user) {
        user.displayName = norm.display;
        localStorage.setItem('finx_user', JSON.stringify(user));
    }
    return user;
}

// Sign Up with Email and Password
async function signUpWithEmail(email, password, displayName) {
    if (!email || !password) {
        throw new Error("Please enter both email and password.");
    }
    if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
    }

    // Check if using demo key
    const { isCustom } = getActiveFirebaseConfig();
    if (!isCustom) {
        // Safe interactive demo user creation
        const demoUser = {
            uid: "demo-" + Date.now(),
            email: email,
            displayName: displayName || email.split('@')[0],
            photoURL: null,
            isDemo: true
        };
        localStorage.setItem('finx_user', JSON.stringify(demoUser));
        localStorage.setItem('finx_demo_user', 'true');
        window.dispatchEvent(new CustomEvent('finx:auth-change', { detail: { user: demoUser, loggedIn: true } }));
        return demoUser;
    }

    if (!firebaseAuth) initFirebase();
    const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    if (displayName && cred.user) {
        await cred.user.updateProfile({ displayName: displayName });
    }
    return cred.user;
}

// Sign In with Email and Password
async function signInWithEmail(email, password) {
    if (!email || !password) {
        throw new Error("Please enter both email and password.");
    }

    // Check if using demo mode
    const { isCustom } = getActiveFirebaseConfig();
    if (!isCustom) {
        const demoUser = {
            uid: "demo-user-101",
            email: email,
            displayName: email.split('@')[0],
            photoURL: null,
            isDemo: true
        };
        localStorage.setItem('finx_user', JSON.stringify(demoUser));
        localStorage.setItem('finx_demo_user', 'true');
        window.dispatchEvent(new CustomEvent('finx:auth-change', { detail: { user: demoUser, loggedIn: true } }));
        return demoUser;
    }

    if (!firebaseAuth) initFirebase();
    const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
    return cred.user;
}

// Sign In with Google Popup
async function signInWithGoogle() {
    const { isCustom } = getActiveFirebaseConfig();
    if (!isCustom) {
        const demoUser = {
            uid: "google-demo-" + Date.now(),
            email: "user@gmail.com",
            displayName: "Demo Google User",
            photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c",
            isDemo: true
        };
        localStorage.setItem('finx_user', JSON.stringify(demoUser));
        localStorage.setItem('finx_demo_user', 'true');
        window.dispatchEvent(new CustomEvent('finx:auth-change', { detail: { user: demoUser, loggedIn: true } }));
        return demoUser;
    }

    if (!firebaseAuth) initFirebase();
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    const result = await firebaseAuth.signInWithPopup(provider);
    return result.user;
}

// Password Reset Email
async function sendPasswordReset(email) {
    if (!email) {
        throw new Error("Please enter your email address to receive reset instructions.");
    }
    const { isCustom } = getActiveFirebaseConfig();
    if (!isCustom) {
        return "Demo reset link dispatched to " + email;
    }
    if (!firebaseAuth) initFirebase();
    await firebaseAuth.sendPasswordResetEmail(email);
    return "Password reset email sent. Please check your inbox.";
}

// Sign Out
async function signOutUser() {
    localStorage.removeItem('finx_user');
    localStorage.removeItem('finx_demo_user');
    if (firebaseAuth) {
        try {
            await firebaseAuth.signOut();
        } catch (e) {
            console.warn("Sign out note:", e);
        }
    }
    window.dispatchEvent(new CustomEvent('finx:auth-change', { detail: { user: null, loggedIn: false } }));
}

// Get Current User
function getCurrentUser() {
    try {
        const cached = localStorage.getItem('finx_user');
        if (cached) return JSON.parse(cached);
    } catch (e) {
        console.warn("Error reading cached user:", e);
    }
    if (firebaseAuth && firebaseAuth.currentUser) {
        const u = firebaseAuth.currentUser;
        return {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName || u.email.split('@')[0],
            photoURL: u.photoURL
        };
    }
    return null;
}

// Save Custom Firebase Credentials
function saveCustomFirebaseConfig(config) {
    if (!config || !config.apiKey || !config.projectId) {
        throw new Error("apiKey and projectId are required.");
    }
    localStorage.setItem('finx_firebase_config', JSON.stringify(config));
    if (firebase.apps && firebase.apps.length > 0) {
        firebase.apps.forEach(app => app.delete());
    }
    return initFirebase();
}

// Map Firebase Error Codes to Friendly Explanations
function getFriendlyAuthError(err) {
    if (!err || !err.code) return err.message || "An authentication error occurred.";
    switch (err.code) {
        case 'auth/invalid-email':
            return "Please enter a valid email address.";
        case 'auth/user-disabled':
            return "This account has been disabled. Please contact support.";
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return "Incorrect email or password. Please try again.";
        case 'auth/email-already-in-use':
            return "An account with this email already exists. Try signing in instead.";
        case 'auth/weak-password':
            return "Please choose a stronger password (at least 6 characters).";
        case 'auth/popup-closed-by-user':
            return "Sign-in cancelled: The Google popup window was closed.";
        case 'auth/popup-blocked':
            return "Google sign-in popup was blocked by browser. Please allow popups for this site.";
        case 'auth/network-request-failed':
            return "Network connection issue. Please check your internet connection.";
        case 'auth/too-many-requests':
            return "Too many unsuccessful attempts. Please wait a moment before trying again.";
        default:
            return err.message;
    }
}

// Automatically Initialize on script execution
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initFirebase();
    });
}

