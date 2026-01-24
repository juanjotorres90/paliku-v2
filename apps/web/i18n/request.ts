import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
  loadMessages,
} from "@repo/i18n";

/**
 * Get locale cookie name based on project ref from env
 * This must match the API's cookie naming convention: sb-{projectRef}-locale
 */
function getLocaleCookieName(): string {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl) : null;
  const projectRef = supabaseOrigin?.hostname.split(".")[0] ?? "default";
  return `sb-${projectRef}-locale`;
}

/**
 * Parse Accept-Language header and find best matching locale.
 *
 * @param acceptLanguage - The Accept-Language header value
 * @returns Best matching locale code or DEFAULT_LOCALE
 */
function parseAcceptLanguage(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const parts = lang.trim().split(";q=");
      const code = parts[0];
      if (!code) return null;
      const qPart = parts[1];
      const quality = qPart ? parseFloat(qPart) : 1;
      return { code: code.toLowerCase(), quality };
    })
    .filter((lang): lang is { code: string; quality: number } => lang !== null)
    .sort((a, b) => b.quality - a.quality);

  // Try to find exact match first (e.g., "en" -> "en")
  for (const lang of languages) {
    if (isLocale(lang.code)) {
      return lang.code as Locale;
    }
  }

  // Try to find match by language prefix (e.g., "en-US" -> "en")
  for (const lang of languages) {
    const prefix = lang.code.split("-")[0];
    if (prefix && isLocale(prefix)) {
      return prefix as Locale;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Get the current locale from cookie, Accept-Language header, or default.
 *
 * Priority:
 * 1. Locale cookie (set by API for authed users, or guest locale endpoint)
 * 2. Accept-Language header (for guests without cookie)
 * 3. DEFAULT_LOCALE
 */
async function getResolvedLocale(): Promise<Locale> {
  const headersList = await headers();

  // First, try to get locale from cookie
  const localeCookieName = getLocaleCookieName();
  const cookieHeader = headersList.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const localeCookie = cookies.find((c) =>
    c.startsWith(`${localeCookieName}=`),
  );

  if (localeCookie) {
    const cookieValue = localeCookie.split("=")[1];
    if (cookieValue && isLocale(cookieValue)) {
      return cookieValue as Locale;
    }
  }

  // Second, try Accept-Language header
  const acceptLanguage = headersList.get("accept-language");
  return parseAcceptLanguage(acceptLanguage);
}

export default getRequestConfig(async () => {
  // Get locale from cookie, Accept-Language header, or default
  const locale = await getResolvedLocale();

  // Load messages for the resolved locale
  const messages = await loadMessages(locale);

  return {
    locale,
    messages,
    timeZone: "UTC",
    now: new Date(),
  };
});
