export interface SessionUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  status: string;
  roles: string[];
  primary_role: string | null;
  must_change_password?: boolean;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  user: SessionUser;
}

export type AuthStorageKind = "local" | "session";

const AUTH_STORAGE_KEY = "cis.auth";
const AUTH_EVENT_NAME = "cis-auth-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function parseSession(rawValue: string | null): AuthSession | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as AuthSession;
    if (!parsed?.access_token || !parsed?.refresh_token || !parsed?.user) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function getStorage(kind: AuthStorageKind): Storage | null {
  if (!isBrowser()) {
    return null;
  }

  return kind === "local" ? window.localStorage : window.sessionStorage;
}

function dispatchAuthChange() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export function getStoredAuthSession(): AuthSession | null {
  const localSession = parseSession(getStorage("local")?.getItem(AUTH_STORAGE_KEY) ?? null);
  if (localSession) {
    return localSession;
  }

  return parseSession(getStorage("session")?.getItem(AUTH_STORAGE_KEY) ?? null);
}

export function getStoredAuthStorageKind(): AuthStorageKind | null {
  if (parseSession(getStorage("local")?.getItem(AUTH_STORAGE_KEY) ?? null)) {
    return "local";
  }

  if (parseSession(getStorage("session")?.getItem(AUTH_STORAGE_KEY) ?? null)) {
    return "session";
  }

  return null;
}

export function persistAuthSession(session: AuthSession, kind: AuthStorageKind = "local") {
  const targetStorage = getStorage(kind);
  const alternateStorage = getStorage(kind === "local" ? "session" : "local");

  alternateStorage?.removeItem(AUTH_STORAGE_KEY);
  targetStorage?.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  dispatchAuthChange();
}

export function replaceStoredAuthSession(session: AuthSession) {
  const existingKind = getStoredAuthStorageKind() ?? "local";
  persistAuthSession(session, existingKind);
}

export function clearStoredAuthSession() {
  getStorage("local")?.removeItem(AUTH_STORAGE_KEY);
  getStorage("session")?.removeItem(AUTH_STORAGE_KEY);
  dispatchAuthChange();
}

export function subscribeToAuthChanges(callback: () => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === AUTH_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(AUTH_EVENT_NAME, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

