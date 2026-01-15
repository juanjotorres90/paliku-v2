export function getSafeRedirect(value: string | null | undefined): string {
  if (!value) return "/";

  const trimmed = value.trim();
  if (!trimmed) return "/";

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("//") || lower.startsWith("/\\")) {
    return "/";
  }

  // Only allow same-origin absolute paths ("/...").
  if (!trimmed.startsWith("/")) {
    return "/";
  }

  try {
    const base = "http://localhost";
    const parsed = new URL(trimmed, base);

    // Reject absolute URLs and protocol-relative redirects.
    if (parsed.origin !== base) {
      return "/";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}
