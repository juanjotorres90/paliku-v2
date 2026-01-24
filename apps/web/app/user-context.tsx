"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  applyTheme,
  getResolvedTheme,
  getStoredTheme,
  getSystemTheme,
  setTheme,
  type Theme,
} from "@repo/ui/theme";
import { apiFetchWithRefresh } from "./lib/api";

interface Profile {
  id: string;
  displayName: string;
  bio: string;
  location: string;
  intents: string[];
  isPublic: boolean;
  avatarUrl: string | null;
  updatedAt: string;
}

interface Settings {
  locale: string;
  theme: Theme;
}

interface SettingsResult {
  settings: Settings;
  source: "server" | "fallback";
}

interface User {
  email: string;
  profile: Profile;
  settings: Settings;
}

interface UserContextValue {
  user: User | null;
  loading: boolean;
  error: boolean;
  refreshUser: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export { UserContext };

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

const DEFAULT_SETTINGS: Settings = {
  locale: "en",
  theme: "system",
};

async function fetchSettings(): Promise<SettingsResult> {
  try {
    const response = await apiFetchWithRefresh("/settings/me");

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized");
      }
      console.warn("Failed to fetch settings, using defaults");
      return { settings: DEFAULT_SETTINGS, source: "fallback" };
    }

    const settings = (await response.json()) as Settings;
    return { settings, source: "server" };
  } catch {
    console.warn("Failed to fetch settings, using defaults");
    return { settings: DEFAULT_SETTINGS, source: "fallback" };
  }
}

function applyUserTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  applyTheme(resolved);
  setTheme(theme);
}

// Get the stored theme value (light, dark, or null for system)
function getInitialTheme(): Theme {
  const stored = getStoredTheme();
  return stored ?? "system";
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();
  const currentLocale = useLocale();

  // Track the initially applied theme to avoid flickering on API response
  const initialThemeRef = useRef<Theme>(getInitialTheme());

  // Apply theme immediately on mount to prevent FOUC
  // This uses the stored theme from localStorage (managed by next-themes)
  useEffect(() => {
    const resolved = getResolvedTheme();
    applyTheme(resolved);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiFetchWithRefresh("/profile/me");

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setUser(null);
          setLoading(false);
          setError(false);
          return;
        }

        setError(true);
        setLoading(false);
        return;
      }

      const json = await response.json();
      const { settings, source } = await fetchSettings();

      // Only apply theme if server setting differs from initial stored value
      // This prevents flickering when themes match
      if (source === "server" && settings.theme !== initialThemeRef.current) {
        applyUserTheme(settings.theme);
        initialThemeRef.current = settings.theme;
      }

      // Detect locale mismatch and refresh if needed
      // The API sets the locale cookie, so we need to refresh to get the new locale
      if (source === "server" && settings.locale !== currentLocale) {
        router.refresh();
      }

      setUser({ ...json, settings });
      setLoading(false);
      setError(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, [currentLocale, router]);

  const refreshSettings = useCallback(async () => {
    try {
      const { settings, source } = await fetchSettings();

      // Only apply theme if server setting differs from stored value
      if (source === "server" && settings.theme !== initialThemeRef.current) {
        applyUserTheme(settings.theme);
        initialThemeRef.current = settings.theme;
      }

      // Detect locale mismatch and refresh if needed
      // The API sets the locale cookie, so we need to refresh to get the new locale
      if (source === "server" && settings.locale !== currentLocale) {
        router.refresh();
      }

      setUser((prev) => (prev ? { ...prev, settings } : null));
    } catch (err) {
      console.warn("Settings refresh failed:", err);
    }
  }, [currentLocale, router]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider
      value={{ user, loading, error, refreshUser, refreshSettings }}
    >
      {children}
    </UserContext.Provider>
  );
}
