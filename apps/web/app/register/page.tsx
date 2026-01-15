"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { RegisterRequestSchema } from "@repo/validators/auth";
import { getSafeRedirect } from "../../lib/redirect";
import { apiFetch } from "../lib/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const redirectTo = getSafeRedirect(searchParams.get("redirect"));

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const parsed = RegisterRequestSchema.safeParse({
      email,
      password,
      displayName,
      redirectTo,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form");
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
        let message = "Failed to create account";
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

      const json: unknown = JSON.parse(text);

      if (isRecord(json) && json.needsEmailConfirmation === true) {
        setSuccess(
          "Check your email to confirm your account. After confirming, please sign in.",
        );
        setLoading(false);
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
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      setSuccess("Account created successfully. Please sign in to continue.");
      setLoading(false);
    } catch {
      setError("An unexpected error occurred");
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
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-muted-foreground">
            Sign up with your email. You may need to confirm via email.
          </p>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href={loginHref} className="underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              Display name
            </label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
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
              Confirm password
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

          {success && (
            <div className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-3 rounded-md">
              {success}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
