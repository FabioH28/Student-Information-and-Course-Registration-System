import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { login as apiLogin, LoginResponse } from "@/lib/api";

interface AuthUser {
  role: string;
  require_password_change: boolean;
  email: string;
  display_name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<LoginResponse>;
  signOut: () => void;
  clearPasswordChange: () => void;
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
    const authUser: AuthUser = {
      role: data.role,
      require_password_change: data.require_password_change,
      email: data.email,
      display_name: data.display_name,
    };
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(authUser));
    setToken(data.access_token);
    setUser(authUser);
    return data;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const clearPasswordChange = useCallback(() => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, require_password_change: false };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, clearPasswordChange }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
