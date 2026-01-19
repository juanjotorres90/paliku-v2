import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SignJWT } from "jose";
import { createJWTVerifier } from "./jwt-verifier.adapter";
import type { SupabaseConfig } from "../../../server/config";

describe("createJWTVerifier", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should verify valid JWT with secret", async () => {
    const secret = "test-secret-key-at-least-32-chars-long-for-hs256";
    const config: SupabaseConfig = {
      url: "https://example.supabase.co",
      anonKey: "anon-key",
      audience: "authenticated",
      jwtSecret: secret,
      jwtAlgs: ["HS256"],
    };

    const verifier = createJWTVerifier(config);

    const token = await new SignJWT({ role: "authenticated" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-123")
      .setAudience("authenticated")
      .setIssuer("https://example.supabase.co/auth/v1")
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(secret));

    const payload = await verifier.verify(token);

    expect(payload.sub).toBe("user-123");
  });
});
