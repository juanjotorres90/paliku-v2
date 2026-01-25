"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { LoginRequestSchema } from "@repo/validators/auth";
import { getSafeRedirect } from "../../../lib/redirect";
import { apiFetch, apiFetchWithRefresh } from "../../lib/api";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parsed = LoginRequestSchema.safeParse({ email, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t("invalidForm"));
        setLoading(false);
        return;
      }

      const response = await apiFetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const text = await response.text();

      if (!response.ok) {
        let message = t("loginFailed");
        if (text) {
          try {
            const json: unknown = JSON.parse(text);
            if (isRecord(json) && typeof json.error === "string") {
              message = json.error;
            }
          } catch {
            // JSON parse failed, use default message
          }
        }

        setError(message);
        setLoading(false);
        return;
      }

      // After successful login, fetch settings to establish locale cookie
      // This ensures the UI renders in the user's preferred language
      try {
        await apiFetchWithRefresh("/settings/me");
      } catch {
        // Settings fetch failure should not block login
        console.warn("Failed to fetch settings after login");
      }

      const redirectTo = getSafeRedirect(searchParams.get("redirect"));
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError(t("unexpectedError"));
      setLoading(false);
    }
  };

  const redirectParam = getSafeRedirect(searchParams.get("redirect"));
  const verified = searchParams.get("verified") === "true";
  const registerHref =
    redirectParam === "/"
      ? "/register"
      : `/register?redirect=${encodeURIComponent(redirectParam)}`;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("signIn")}</h1>
          <p className="text-muted-foreground mt-2">{t("signInDescription")}</p>
          {verified && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 bg-green-50 dark:bg-green-950 p-2 rounded-md">
              {t("emailVerified")}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {t("newHere")}{" "}
            <Link href={registerHref} className="underline underline-offset-4">
              {t("createAccount")}
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t("email")}
            </label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t("password")}
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("signingIn") : t("signIn")}
          </Button>
        </form>
      </div>
    </main>
  );
}

function LoginPageFallback() {
  const t = useTranslations("common");
  return <div>{t("loading")}</div>;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
