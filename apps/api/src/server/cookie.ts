export function getCookieDomainForSharing(
  hostname: string,
): string | undefined {
  const isIPv4 =
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) &&
    hostname.split(".").every((part) => {
      const num = Number(part);
      return num >= 0 && num <= 255;
    });
  const isIPv6 = hostname.includes(":");

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    isIPv4 ||
    isIPv6
  )
    return undefined;
  const parts = hostname.split(".").filter(Boolean);
  if (parts.length <= 2) return hostname;
  return parts.slice(1).join(".");
}
