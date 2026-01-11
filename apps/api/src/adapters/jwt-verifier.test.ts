import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createJWTVerifier } from "./jwt-verifier";
import type { SupabaseConfig } from "../domain/config";
import { SignJWT } from "jose";

describe("createJWTVerifier", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("with HS256 (JWT secret)", () => {
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

      // Create a valid JWT token
      const token = await new SignJWT({
        sub: "user-123",
        aud: "authenticated",
        role: "authenticated",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("https://example.supabase.co/auth/v1")
        .setAudience("authenticated")
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode(secret));

      const result = await verifier.verify(token);

      expect(result.sub).toBe("user-123");
      expect(result.aud).toBe("authenticated");
      expect(result.role).toBe("authenticated");
    });

    it("should reject invalid JWT signature", async () => {
      const secret = "test-secret-key-at-least-32-chars-long-for-hs256";
      const wrongSecret = "wrong-secret-key-at-least-32-chars-long!!!!!";

      const config: SupabaseConfig = {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        audience: "authenticated",
        jwtSecret: secret,
        jwtAlgs: ["HS256"],
      };

      const verifier = createJWTVerifier(config);

      // Create token with wrong secret
      const token = await new SignJWT({
        sub: "user-123",
        aud: "authenticated",
        role: "authenticated",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("https://example.supabase.co/auth/v1")
        .setAudience("authenticated")
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode(wrongSecret));

      await expect(verifier.verify(token)).rejects.toThrow();
    });

    it("should reject JWT with wrong issuer", async () => {
      const secret = "test-secret-key-at-least-32-chars-long-for-hs256";
      const config: SupabaseConfig = {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        audience: "authenticated",
        jwtSecret: secret,
        jwtAlgs: ["HS256"],
      };

      const verifier = createJWTVerifier(config);

      // Create token with wrong issuer
      const token = await new SignJWT({
        sub: "user-123",
        aud: "authenticated",
        role: "authenticated",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("https://wrong.example.com/auth/v1")
        .setAudience("authenticated")
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode(secret));

      await expect(verifier.verify(token)).rejects.toThrow();
    });

    it("should reject JWT with wrong audience", async () => {
      const secret = "test-secret-key-at-least-32-chars-long-for-hs256";
      const config: SupabaseConfig = {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        audience: "authenticated",
        jwtSecret: secret,
        jwtAlgs: ["HS256"],
      };

      const verifier = createJWTVerifier(config);

      // Create token with wrong audience
      const token = await new SignJWT({
        sub: "user-123",
        aud: "wrong-audience",
        role: "authenticated",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("https://example.supabase.co/auth/v1")
        .setAudience("wrong-audience")
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode(secret));

      await expect(verifier.verify(token)).rejects.toThrow();
    });

    it("should handle JWT with no sub claim", async () => {
      const secret = "test-secret-key-at-least-32-chars-long-for-hs256";
      const config: SupabaseConfig = {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        audience: "authenticated",
        jwtSecret: secret,
        jwtAlgs: ["HS256"],
      };

      const verifier = createJWTVerifier(config);

      // Create token without sub
      const token = await new SignJWT({
        aud: "authenticated",
        role: "authenticated",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("https://example.supabase.co/auth/v1")
        .setAudience("authenticated")
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode(secret));

      const result = await verifier.verify(token);

      expect(result.sub).toBeUndefined();
      expect(result.aud).toBe("authenticated");
      expect(result.role).toBe("authenticated");
    });

    it("should handle JWT with non-string aud", async () => {
      const secret = "test-secret-key-at-least-32-chars-long-for-hs256";
      const config: SupabaseConfig = {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        audience: "authenticated",
        jwtSecret: secret,
        jwtAlgs: ["HS256"],
      };

      const verifier = createJWTVerifier(config);

      // Create token with array audience (jose will accept this)
      const token = await new SignJWT({
        sub: "user-123",
        role: "authenticated",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuer("https://example.supabase.co/auth/v1")
        .setAudience(["authenticated", "other"])
        .setExpirationTime("1h")
        .sign(new TextEncoder().encode(secret));

      const result = await verifier.verify(token);

      expect(result.sub).toBe("user-123");
      // When aud is an array, it won't be a string
      expect(result.aud).toBeUndefined();
      expect(result.role).toBe("authenticated");
    });
  });

  describe("configuration", () => {
    it("should use default algorithm when no jwtAlgs and no jwtSecret", () => {
      const config: SupabaseConfig = {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        audience: "authenticated",
        jwtSecret: undefined,
        jwtAlgs: [],
      };

      // Just creating the verifier shouldn't throw
      expect(() => createJWTVerifier(config)).not.toThrow();
    });

    it("should use HS256 when jwtSecret is provided but no jwtAlgs", () => {
      const config: SupabaseConfig = {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        audience: "authenticated",
        jwtSecret: "test-secret-key-at-least-32-chars-long-for-hs256",
        jwtAlgs: [],
      };

      expect(() => createJWTVerifier(config)).not.toThrow();
    });

    it("should use specified algorithms when provided", () => {
      const config: SupabaseConfig = {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        audience: "authenticated",
        jwtSecret: "test-secret",
        jwtAlgs: ["HS256", "RS256"],
      };

      expect(() => createJWTVerifier(config)).not.toThrow();
    });
  });
});
