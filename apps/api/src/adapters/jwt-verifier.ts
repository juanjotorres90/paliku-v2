import type { JWTVerifierPort } from "../application/ports";
import type { SupabaseConfig } from "../domain/config";
import { jwtVerify, createRemoteJWKSet } from "jose";

export function createJWTVerifier(config: SupabaseConfig): JWTVerifierPort {
  const { url, audience, jwtSecret, jwtAlgs } = config;
  const supabaseOrigin = new URL(url).origin;
  const issuer = `${supabaseOrigin}/auth/v1`;

  const algorithms =
    jwtAlgs.length > 0 ? jwtAlgs : jwtSecret ? ["HS256"] : ["RS256", "ES256"];

  const JWKS = createRemoteJWKSet(
    new URL("/auth/v1/.well-known/jwks.json", supabaseOrigin),
  );

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
      : await jwtVerify(token, JWKS, verifyOptions);

    return {
      sub: typeof payload.sub === "string" ? payload.sub : undefined,
      aud: typeof payload.aud === "string" ? payload.aud : undefined,
      role: typeof payload.role === "string" ? payload.role : undefined,
    };
  }

  return { verify };
}
