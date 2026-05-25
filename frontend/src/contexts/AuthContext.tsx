import { createContext, useContext, useMemo, useState } from "react";

import { LoginResponse, login } from "@/lib/api";


interface AuthUser {
  id?: number;
  email: string;
  name: string;
  role: string;
  require_password_change?: boolean;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<LoginResponse>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUser(): AuthUser | null {
  const raw = localStorage.getItem("cis.user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState<AuthUser | null>(() => readUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      signIn: async (email, password) => {
        const data = await login(email, password);
        const nextToken = data.token ?? data.access_token;
        const nextUser: AuthUser = {
          id: data.user?.id,
          email: data.email,
          name: data.display_name,
          role: data.role,
          require_password_change: data.require_password_change,
        };
        localStorage.setItem("token", nextToken);
        localStorage.setItem("cis.user", JSON.stringify(nextUser));
        setToken(nextToken);
        setUser(nextUser);
        return data;
      },
      signOut: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("cis.user");
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
