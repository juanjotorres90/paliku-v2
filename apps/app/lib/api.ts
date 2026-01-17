import Constants from "expo-constants";

import { secureStorage, type AuthTokens } from "./secure-storage";

function getApiUrl(): string {
  // Check for explicit API URL configuration first
  const configuredUrl =
    Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  // In Expo Go development, use the hostUri to get the dev machine's IP
  // This allows the app running on a physical device to reach the API on the dev machine
  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;

  if (hostUri) {
    // hostUri is like "192.168.1.100:8081" - extract the IP
    const host = hostUri.split(":")[0];
    if (host) {
      const apiUrl = `http://${host}:3002`;
      if (__DEV__) {
        console.log("[API] Using development API URL:", apiUrl);
      }
      return apiUrl;
    }
  }

  // Fallback for web or when hostUri is not available
  if (__DEV__) {
    console.log("[API] Falling back to localhost:3002");
  }
  return "http://localhost:3002";
}

function normalizePath(path: string): string {
  if (!path) return "/";
  if (path.startsWith("/")) return path;
  return `/${path}`;
}

let refreshInFlight: Promise<AuthTokens | null> | null = null;
let refreshFailedUntilMs = 0;

async function refreshSession(): Promise<AuthTokens | null> {
  const now = Date.now();
  if (now < refreshFailedUntilMs) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) {
        refreshFailedUntilMs = Date.now() + 60_000;
        await secureStorage.clearTokens();
        return null;
      }

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        refreshFailedUntilMs = Date.now() + 60_000;
        await secureStorage.clearTokens();
        return null;
      }

      const data = (await response.json()) as {
        ok: boolean;
        tokens?: AuthTokens;
      };

      if (!data.ok || !data.tokens) {
        refreshFailedUntilMs = Date.now() + 60_000;
        await secureStorage.clearTokens();
        return null;
      }

      await secureStorage.setTokens(data.tokens);
      refreshFailedUntilMs = 0;
      return data.tokens;
    } catch {
      refreshFailedUntilMs = Date.now() + 60_000;
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * Make an authenticated API request.
 * Automatically includes the access token in the Authorization header.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}${normalizePath(path)}`;

  const accessToken = await secureStorage.getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...init?.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });

    const text = await response.text();
    let data: T | undefined;

    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        // Response is not JSON
      }
    }

    if (!response.ok) {
      const errorData = data as { error?: string } | undefined;
      return {
        ok: false,
        error:
          errorData?.error ?? `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return {
      ok: true,
      data,
      status: response.status,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    };
  }
}

/**
 * Make an authenticated API request with automatic token refresh on 401.
 */
export async function apiFetchWithRefresh<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const normalizedPath = normalizePath(path);

  // Don't try to refresh for auth endpoints
  if (normalizedPath.startsWith("/auth/")) {
    return apiFetch<T>(normalizedPath, init);
  }

  const firstResponse = await apiFetch<T>(normalizedPath, init);

  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  // Try to refresh the token
  const newTokens = await refreshSession();
  if (!newTokens) {
    return firstResponse;
  }

  // Retry the request with the new token
  return apiFetch<T>(normalizedPath, init);
}

export { getApiUrl };
