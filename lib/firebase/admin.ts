import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import {
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

function getAdminCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

function createAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const credentials = getAdminCredentials();

  return initializeApp({
    credential: cert(credentials),
    projectId: credentials.projectId,
  });
}

export const firebaseAdminApp: App = createAdminApp();
export const adminAuth: Auth = getAuth(firebaseAdminApp);
export const adminDb: Firestore = getFirestore(firebaseAdminApp);