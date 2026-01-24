import { setCookie } from "hono/cookie";
import type { Context } from "hono";
import type { CookieConfig } from "../../../server/config";
import { getCookieName, getCookieOptions } from "../../auth/http/cookies";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@repo/i18n";

/**
 * Long-lived cookie max age (1 year in seconds)
 */
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Determine if the request is secure (HTTPS)
 */
function isSecureRequest(c: Context): boolean {
  const forwardedProto = c.req.header("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }
  return new URL(c.req.url).protocol === "https:";
}

/**
 * Set the locale cookie on the response.
 *
 * Validates the locale and falls back to DEFAULT_LOCALE if invalid.
 * Uses the same cookie naming pattern as auth cookies: sb-{projectRef}-locale
 *
 * @param c - Hono context
 * @param config - Cookie configuration
 * @param locale - Locale value to set (will be validated)
 */
export function setLocaleCookie(
  c: Context,
  config: CookieConfig,
  locale: string,
): void {
  // Validate locale, fall back to default if invalid
  const validLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;

  const cookieName = getCookieName(config, "locale");
  const cookieOptions = {
    ...getCookieOptions(config, isSecureRequest(c)),
    maxAge: LOCALE_COOKIE_MAX_AGE,
    httpOnly: true,
  };

  setCookie(c, cookieName, validLocale, cookieOptions);
}

/**
 * Get the locale cookie name for testing purposes.
 * This is useful for verifying the cookie is set correctly.
 *
 * @param config - Cookie configuration
 * @returns The locale cookie name
 */
export function getLocaleCookieName(config: CookieConfig): string {
  return getCookieName(config, "locale");
}
