import type { CookieConfig } from "../../../server/config";

export function getCookieName(config: CookieConfig, suffix: string): string {
  return `sb-${config.projectRef}-${suffix}`;
}

function normalizeCookieDomain(domain?: string): string | undefined {
  if (!domain) return undefined;
  const isIPv4 =
    /^\d{1,3}(\.\d{1,3}){3}$/.test(domain) &&
    domain.split(".").every((part) => {
      const num = Number(part);
      return num >= 0 && num <= 255;
    });
  const isIPv6 = domain.includes(":");

  if (
    domain === "localhost" ||
    domain.endsWith(".localhost") ||
    isIPv4 ||
    isIPv6
  ) {
    return undefined;
  }

  return domain;
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
