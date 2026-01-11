import type { CorsConfig } from "../../../domain/config";

const FALLBACK_ORIGIN = "http://localhost:3000";

export function resolveWebOrigin(
  candidates: Array<string | undefined | null>,
  corsConfig: CorsConfig,
): string {
  for (const candidate of candidates) {
    if (candidate && corsConfig.allowedOrigins.includes(candidate)) {
      return candidate;
    }
  }

  return corsConfig.allowedOrigins[0] ?? FALLBACK_ORIGIN;
}
