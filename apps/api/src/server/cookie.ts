/**
 * Returns undefined for localhost, IP addresses, and hostnames that shouldn't have a domain set.
 * Otherwise returns the domain as-is for cookie scoping.
 */
export function normalizeCookieDomain(domain?: string): string | undefined {
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

/**
 * Extracts the parent domain for cross-subdomain cookie sharing.
 * Returns undefined for localhost and IP addresses.
 * For "foo.bar.example.com" returns ".bar.example.com".
 */
export function getCookieDomainForSharing(
  hostname: string,
): string | undefined {
  const normalized = normalizeCookieDomain(hostname);
  if (!normalized) return undefined;

  const parts = normalized.split(".").filter(Boolean);
  if (parts.length <= 2) return hostname;
  return parts.slice(1).join(".");
}
