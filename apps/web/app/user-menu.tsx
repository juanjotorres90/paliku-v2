"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { apiFetch, apiFetchWithRefresh } from "./lib/api";

interface ProfileMeResponse {
  email: string;
  profile: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export function UserMenu() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [profile, setProfile] = useState<ProfileMeResponse | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await apiFetchWithRefresh("/profile/me");

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setProfile(null);
            setLoading(false);
            return;
          }

          setLoadError(true);
          setLoading(false);
          return;
        }

        const json = await response.json();
        setProfile(json);
        setLoading(false);
      } catch {
        setLoadError(true);
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiFetch("/auth/signout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (loadError) {
    return (
      <button
        type="button"
        disabled
        className="rounded-full opacity-50 cursor-not-allowed"
        aria-label="User menu unavailable"
      >
        <Avatar size="sm" fallback={<span className="font-medium">?</span>} />
      </button>
    );
  }

  if (!profile) {
    return (
      <Link
        href="/login"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Sign in
      </Link>
    );
  }

  const initials = profile.profile.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          aria-label="User menu"
        >
          <Avatar
            src={profile.profile.avatarUrl ?? undefined}
            size="sm"
            fallback={<span className="font-medium">{initials}</span>}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile.profile.displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile/settings" className="w-full cursor-pointer">
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-destructive focus:text-destructive"
        >
          {loggingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
