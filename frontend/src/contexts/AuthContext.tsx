import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { login as apiLogin, LoginResponse } from "@/lib/api";

interface AuthUser {
  role: string;
  require_password_change: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<LoginResponse>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify({ role: data.role, require_password_change: data.require_password_change }));
    setToken(data.access_token);
    setUser({ role: data.role, require_password_change: data.require_password_change });
    return data;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
