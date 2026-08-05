import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedMessaging: Messaging | null | undefined;

function assertClientConfiguration(): void {
  const required = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.messagingSenderId,
    firebaseConfig.appId,
  ];

  if (required.some((value) => !value)) {
    throw new Error(
      "Firebase browser configuration is incomplete. Check NEXT_PUBLIC_FIREBASE_* environment variables.",
    );
  }
}

export function getFirebaseClientApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  assertClientConfiguration();
  cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return cachedApp;
}

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  cachedAuth = getAuth(getFirebaseClientApp());
  return cachedAuth;
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (cachedMessaging !== undefined) return cachedMessaging;
  if (typeof window === "undefined" || !(await isSupported())) {
    cachedMessaging = null;
    return null;
  }
  cachedMessaging = getMessaging(getFirebaseClientApp());
  return cachedMessaging;
}
