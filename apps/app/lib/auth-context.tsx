import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiFetch, getApiUrl } from "./api";
import { secureStorage, type AuthTokens } from "./secure-storage";

type AuthState = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  state: AuthState;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{
    ok: boolean;
    error?: string;
    needsEmailConfirmation?: boolean;
  }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");

  // Check for existing tokens on mount
  useEffect(() => {
    (async () => {
      try {
        const tokens = await secureStorage.getTokens();
        if (tokens?.accessToken && tokens.refreshToken) {
          setState("authenticated");
        } else {
          if (tokens?.accessToken && !tokens.refreshToken) {
            await secureStorage.clearTokens();
          }
          setState("unauthenticated");
        }
      } catch {
        setState("unauthenticated");
      }
    })();
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ ok: boolean; error?: string }> => {
      const apiUrl = getApiUrl();

      // Debug logging for development
      if (__DEV__) {
        console.log("[Auth] Attempting login to:", `${apiUrl}/auth/login`);
      }

      try {
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const text = await response.text();

        if (__DEV__) {
          console.log("[Auth] Response status:", response.status);
        }

        if (!response.ok) {
          let message = "Failed to sign in";
          if (text) {
            try {
              const json = JSON.parse(text) as { error?: string };
              if (typeof json.error === "string") {
                message = json.error;
              }
            } catch {
              // JSON parse failed, use default message
            }
          }
          return { ok: false, error: message };
        }

        const data = JSON.parse(text) as {
          ok: boolean;
          tokens?: AuthTokens;
        };

        if (!data.ok || !data.tokens) {
          return { ok: false, error: "Invalid response from server" };
        }

        await secureStorage.setTokens(data.tokens);
        setState("authenticated");

        return { ok: true };
      } catch (err) {
        if (__DEV__) {
          console.error("[Auth] Login error:", err);
        }
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : "An unexpected error occurred",
        };
      }
    },
    [],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
    ): Promise<{
      ok: boolean;
      error?: string;
      needsEmailConfirmation?: boolean;
    }> => {
      const response = await apiFetch<{
        ok: boolean;
        needsEmailConfirmation?: boolean;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      });

      if (!response.ok) {
        return { ok: false, error: response.error ?? "Registration failed" };
      }

      const needsEmailConfirmation =
        response.data?.needsEmailConfirmation ?? false;

      // If no email confirmation needed, we need to log in manually
      if (!needsEmailConfirmation) {
        const loginResult = await login(email, password);
        if (!loginResult.ok) {
          return {
            ok: false,
            error: loginResult.error ?? "Auto-login after registration failed",
          };
        }
      }

      return { ok: true, needsEmailConfirmation };
    },
    [login],
  );

  const logout = useCallback(async () => {
    // Call signout endpoint to clear server-side session (optional, mainly for web)
    try {
      await apiFetch("/auth/signout", { method: "POST" });
    } catch {
      // Ignore errors - we're logging out anyway
    }

    await secureStorage.clearTokens();
    setState("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ state, login, register, logout }),
    [state, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
