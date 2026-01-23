import type { CookieConfig } from "../../../server/config";
import { normalizeCookieDomain } from "../../../server/cookie";

export function getCookieName(config: CookieConfig, suffix: string): string {
  return `sb-${config.projectRef}-${suffix}`;
}

export function getCookieOptions(config: CookieConfig, secure: boolean) {
  return {
    domain: normalizeCookieDomain(config.domain),
    maxAge: 60 * 60 * 24 * 7,
    path: "/" as const,
    sameSite: "lax" as const,
    secure,
    httpOnly: true,
  };
}
