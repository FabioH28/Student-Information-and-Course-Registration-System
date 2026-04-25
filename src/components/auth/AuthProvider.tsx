import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  AuthSession,
  AuthStorageKind,
  SessionUser,
  clearStoredAuthSession,
  getStoredAuthSession,
  persistAuthSession,
  replaceStoredAuthSession,
  subscribeToAuthChanges,
} from "@/lib/auth";

interface AuthContextValue {
  session: AuthSession | null;
  user: SessionUser | null;
  isAuthenticated: boolean;
  login: (session: AuthSession, rememberMe: boolean) => void;
  updateSession: (session: AuthSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredAuthSession());

  useEffect(() => subscribeToAuthChanges(() => setSession(getStoredAuthSession())), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      login: (nextSession: AuthSession, rememberMe: boolean) => {
        const storageKind: AuthStorageKind = rememberMe ? "local" : "session";
        persistAuthSession(nextSession, storageKind);
      },
      updateSession: (nextSession: AuthSession) => {
        replaceStoredAuthSession(nextSession);
      },
      logout: () => {
        clearStoredAuthSession();
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

