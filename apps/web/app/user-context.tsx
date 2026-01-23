"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  applyTheme,
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

async function fetchSettings(): Promise<Settings> {
  const response = await apiFetchWithRefresh("/settings/me");

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch settings");
  }

  return response.json() as Promise<Settings>;
}

function applyUserTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  applyTheme(resolved);
  setTheme(theme);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
      const settings = await fetchSettings();
      applyUserTheme(settings.theme);
      setUser({ ...json, settings });
      setLoading(false);
      setError(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const settings = await fetchSettings();
      applyUserTheme(settings.theme);
      setUser((prev) => (prev ? { ...prev, settings } : null));
    } catch {
      // Silently fail for settings refresh
    }
  }, []);

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
