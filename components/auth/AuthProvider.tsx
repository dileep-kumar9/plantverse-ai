"use client";

import {
  getIdToken,
  onIdTokenChanged,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getFirebaseAuth } from "@/lib/firebase/client";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  photoURL?: string | null;
  role: "user" | "admin";
  emailVerified: boolean;
};

type AuthContextValue = {
  firebaseUser: User | null;
  user: AuthUser | null;
  loading: boolean;
  sessionReady: boolean;
  sessionError: string | null;
  establishSession: (firebaseUser?: User, acceptedLegal?: boolean) => Promise<AuthUser>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function responseError(response: Response): Promise<Error> {
  try {
    const payload = (await response.json()) as { error?: unknown; code?: unknown };
    const error = new Error(
      typeof payload.error === "string"
        ? payload.error
        : "Unable to update your authentication session.",
    );
    Object.assign(error, {
      code: typeof payload.code === "string" ? payload.code : undefined,
      status: response.status,
    });
    return error;
  } catch {
    return new Error("Unable to update your authentication session.");
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const readSession = useCallback(async (): Promise<AuthUser | null> => {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { user?: AuthUser };
    return payload.user ?? null;
  }, []);

  const establishSession = useCallback(
    async (candidate?: User, acceptedLegal = false): Promise<AuthUser> => {
      const currentUser = candidate ?? getFirebaseAuth().currentUser;
      if (!currentUser) throw new Error("Sign in before creating a session.");
      const idToken = await getIdToken(currentUser, true);
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ idToken, acceptedLegal }),
      });
      if (!response.ok) throw await responseError(response);
      const payload = (await response.json()) as { user: AuthUser };
      setFirebaseUser(currentUser);
      setUser(payload.user);
      setSessionReady(true);
      setSessionError(null);
      return payload.user;
    },
    [],
  );

  const refresh = useCallback(async (): Promise<void> => {
    setSessionError(null);
    const serverUser = await readSession();
    if (serverUser) {
      setUser(serverUser);
      setSessionReady(true);
      return;
    }

    const currentUser = getFirebaseAuth().currentUser;
    if (!currentUser || !currentUser.emailVerified) {
      setUser(null);
      setSessionReady(false);
      return;
    }

    try {
      await establishSession(currentUser, false);
    } catch (error) {
      setUser(null);
      setSessionReady(false);
      const code = (error as { code?: string }).code;
      if (code !== "CONSENT_REQUIRED") {
        setSessionError(error instanceof Error ? error.message : "Unable to restore your session.");
      }
    }
  }, [establishSession, readSession]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    let active = true;
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (!active) return;
      setFirebaseUser(currentUser);
      try {
        if (!currentUser) {
          setUser(null);
          setSessionReady(false);
        } else {
          await refresh();
        }
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [refresh]);

  const logout = useCallback(async (): Promise<void> => {
    setSessionError(null);
    try {
      await signOut(getFirebaseAuth());
    } finally {
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
      }).catch(() => undefined);
      setFirebaseUser(null);
      setUser(null);
      setSessionReady(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      user,
      loading,
      sessionReady,
      sessionError,
      establishSession,
      refresh,
      logout,
    }),
    [
      firebaseUser,
      user,
      loading,
      sessionReady,
      sessionError,
      establishSession,
      refresh,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
