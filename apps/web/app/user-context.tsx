"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
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

interface User {
  email: string;
  profile: Profile;
}

interface UserContextValue {
  user: User | null;
  loading: boolean;
  error: boolean;
  refreshUser: () => Promise<void>;
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
      setUser(json);
      setLoading(false);
      setError(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}
