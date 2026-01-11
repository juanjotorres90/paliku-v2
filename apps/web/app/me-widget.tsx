"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";

interface MeResponse {
  userId: string;
  aud?: string;
  role?: string;
}

export function MeWidget() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MeResponse | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function fetchMe() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";
        const response = await fetch(`${apiUrl}/me`, {
          credentials: "include",
        });

        if (response.status === 401) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          const text = await response.text();
          setError(`API error: ${response.status} - ${text}`);
          setLoading(false);
          return;
        }

        const json = await response.json();
        setData(json);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch /me");
        setLoading(false);
      }
    }

    fetchMe();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";
      await fetch(`${apiUrl}/auth/signout`, {
        method: "POST",
        credentials: "include",
      });
      router.replace("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-md bg-muted/50">
        <p className="text-sm text-muted-foreground">Loading /me...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-md bg-destructive/10 space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-md bg-muted/50 space-y-3">
      <div>
        <h3 className="font-semibold text-sm mb-2">GET /me response:</h3>
        <pre className="text-xs bg-background p-2 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </Button>
        <Link href="/profile/settings">
          <Button variant="outline" size="sm">
            Profile Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}
