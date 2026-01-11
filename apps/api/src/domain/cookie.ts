export function getCookieDomainForSharing(
  hostname: string,
): string | undefined {
  if (hostname === "localhost" || hostname.endsWith(".localhost"))
    return undefined;
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length <= 2) return hostname;
  return parts.slice(1).join(".");
}
