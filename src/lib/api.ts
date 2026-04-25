import { AuthSession, clearStoredAuthSession, getStoredAuthSession, replaceStoredAuthSession } from "@/lib/auth";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

let refreshPromise: Promise<AuthSession | null> | null = null;

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function refreshStoredSession(): Promise<AuthSession | null> {
  const currentSession = getStoredAuthSession();
  if (!currentSession) {
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: currentSession.refresh_token,
      }),
    });

    const payload = (await parseResponseBody(response)) as AuthSession | { detail?: string } | null;

    if (!response.ok || !payload || typeof payload !== "object" || !("access_token" in payload)) {
      clearStoredAuthSession();
      return null;
    }

    replaceStoredAuthSession(payload);
    return payload;
  })()
    .catch(() => {
      clearStoredAuthSession();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retryOnUnauthorized = true): Promise<T> {
  const session = getStoredAuthSession();
  const headers = new Headers(init.headers);

  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && retryOnUnauthorized && session?.refresh_token) {
    const refreshedSession = await refreshStoredSession();
    if (refreshedSession) {
      return apiRequest<T>(path, init, false);
    }
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuthSession();
    }

    const detail =
      typeof payload === "object" && payload && "detail" in payload && typeof payload.detail === "string"
        ? payload.detail
        : response.statusText || "Request failed.";
    throw new ApiError(detail, response.status, payload);
  }

  return payload as T;
}

export function apiGet<T>(path: string) {
  return apiRequest<T>(path);
}

export function apiPost<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
