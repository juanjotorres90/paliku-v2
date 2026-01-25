"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { RegisterRequestSchema } from "@repo/validators/auth";
import { getSafeRedirect } from "../../../lib/redirect";
import { apiFetch, apiFetchWithRefresh } from "../../lib/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const finalNext = getSafeRedirect(searchParams.get("redirect"));
    const postRegister = `/welcome?next=${encodeURIComponent(finalNext)}`;

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      setLoading(false);
      return;
    }

    const parsed = RegisterRequestSchema.safeParse({
      email,
      password,
      displayName,
      redirectTo: postRegister,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("invalidForm"));
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const text = await response.text();

      if (!response.ok) {
        let message = t("failedToCreateAccount");
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

      let json: unknown = {};
      try {
        json = text ? (JSON.parse(text) as unknown) : {};
      } catch {
        json = {};
      }

      if (isRecord(json) && json.needsEmailConfirmation === true) {
        router.replace(
          `/auth/check-email?next=${encodeURIComponent(finalNext)}`,
        );
        return;
      }

      const loginResponse = await apiFetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: parsed.data.email,
          password: parsed.data.password,
        }),
      });

      if (loginResponse.ok) {
        // After successful auto-login, fetch settings to establish locale cookie
        // This ensures the UI renders in the user's preferred language
        try {
          await apiFetchWithRefresh("/settings/me");
        } catch {
          // Settings fetch failure should not block registration
          console.warn("Failed to fetch settings after registration");
        }

        router.replace(postRegister);
        router.refresh();
        return;
      }

      // Auto-login failed - redirect to login with the welcome flow preserved
      router.replace(`/login?redirect=${encodeURIComponent(postRegister)}`);
    } catch {
      setError(t("unexpectedError"));
      setLoading(false);
    }
  };

  const redirectParam = getSafeRedirect(searchParams.get("redirect"));
  const loginHref =
    redirectParam === "/"
      ? "/login"
      : `/login?redirect=${encodeURIComponent(redirectParam)}`;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Image
            src="/logo.svg"
            alt="Paliku logo"
            width={166}
            height={64}
            priority
            className="mx-auto"
          />
          <h1 className="text-2xl font-bold">{t("createAccount")}</h1>
          <p className="text-muted-foreground">{t("signUpDescription")}</p>
          <p className="text-sm text-muted-foreground">
            {t("alreadyHaveAccount")}{" "}
            <Link href={loginHref} className="underline underline-offset-4">
              {t("signIn")}
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              {t("displayName")}
            </label>
            <Input
              id="displayName"
              type="text"
              placeholder={t("yourName")}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

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
              placeholder="•••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              {t("confirmPassword")}
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="•••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? t("creatingAccount") : t("createAccount")}
          </Button>
        </form>
      </div>
    </main>
  );
}

function RegisterPageFallback() {
  const t = useTranslations("common");
  return <div>{t("loading")}</div>;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
