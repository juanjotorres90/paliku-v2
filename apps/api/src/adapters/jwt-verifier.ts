import type { JWTVerifierPort } from "../application/ports";
import type { SupabaseConfig } from "../domain/config";
import { jwtVerify, createRemoteJWKSet, type JWTVerifyGetKey } from "jose";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function createJWTVerifier(config: SupabaseConfig): JWTVerifierPort {
  const { url, audience, jwtSecret, jwtAlgs } = config;
  const supabaseOrigin = new URL(url).origin;
  const issuer = `${supabaseOrigin}/auth/v1`;

  const algorithms =
    jwtAlgs.length > 0 ? jwtAlgs : jwtSecret ? ["HS256"] : ["RS256", "ES256"];

  type RemoteJWKSetArgs = Parameters<JWTVerifyGetKey>;
  let jwks: JWTVerifyGetKey | undefined;
  let jwksPromise: Promise<JWTVerifyGetKey> | undefined;

  function createFallbackJWKSet(urls: URL[]): JWTVerifyGetKey {
    const candidates = urls.map((url) => createRemoteJWKSet(url));
    let selected: JWTVerifyGetKey | undefined;

    return async (...args: RemoteJWKSetArgs) => {
      if (selected) return selected(...args);

      let lastError: unknown;
      for (const candidate of candidates) {
        try {
          const key = await candidate(...args);
          selected = candidate;
          return key;
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError ?? new Error("Unable to resolve JWKS");
    };
  }

  async function discoverJwksUrl(): Promise<URL | undefined> {
    const discoveryUrls = [
      new URL("/auth/v1/.well-known/openid-configuration", supabaseOrigin),
      new URL("/auth/v1/oidc/.well-known/openid-configuration", supabaseOrigin),
    ];

    for (const discoveryUrl of discoveryUrls) {
      try {
        const response = await fetch(discoveryUrl.toString(), {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) continue;

        const json: unknown = await response.json();
        const jwksUri =
          isRecord(json) && typeof json.jwks_uri === "string"
            ? json.jwks_uri
            : undefined;
        if (!jwksUri) continue;

        return new URL(jwksUri, supabaseOrigin);
      } catch {
        continue;
      }
    }

    return undefined;
  }

  async function getJWKS(): Promise<JWTVerifyGetKey> {
    if (jwks) return jwks;
    if (jwksPromise) return jwksPromise;

    jwksPromise = (async () => {
      const discoveredJwksUrl = await discoverJwksUrl();
      const urls = [
        ...(discoveredJwksUrl ? [discoveredJwksUrl] : []),
        new URL("/auth/v1/oidc/.well-known/jwks.json", supabaseOrigin),
        new URL("/auth/v1/oidc/keys", supabaseOrigin),
        new URL("/auth/v1/.well-known/jwks.json", supabaseOrigin),
        new URL("/auth/v1/certs", supabaseOrigin),
      ];

      const uniqueUrls = [
        ...new Map(urls.map((url) => [url.href, url])).values(),
      ];

      return createFallbackJWKSet(uniqueUrls);
    })();

    jwks = await jwksPromise;
    return jwks;
  }

  async function verify(token: string) {
    const verifyOptions = {
      issuer,
      audience,
      algorithms,
      clockTolerance: "5s" as const,
    };

    const { payload } = jwtSecret
      ? await jwtVerify(
          token,
          new TextEncoder().encode(jwtSecret),
          verifyOptions,
        )
      : await jwtVerify(token, await getJWKS(), verifyOptions);

    return {
      sub: typeof payload.sub === "string" ? payload.sub : undefined,
      aud: typeof payload.aud === "string" ? payload.aud : undefined,
      role: typeof payload.role === "string" ? payload.role : undefined,
    };
  }

  return { verify };
}
