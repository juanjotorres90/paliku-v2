import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SignJWT } from "jose";
import { createJWTVerifier } from "./jwt-verifier.adapter";
import type { SupabaseConfig } from "../../../server/config";

describe("createJWTVerifier", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("with secret key (HS256)", () => {
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
      expect(payload.aud).toBe("authenticated");
      expect(payload.role).toBe("authenticated");
    });

    it("should verify valid JWT with default algorithm when secret provided", async () => {
      const secret = "test-secret-key-at-least-32-chars-long-for-hs256";
      const config: SupabaseConfig = {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        audience: "authenticated",
        jwtSecret: secret,
        jwtAlgs: [],
      };

      const verifier = createJWTVerifier(config);

      const token = await new SignJWT({ role: "authenticated" })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("user-456")
        .setAudience("authenticated")
        .setIssuer("https://example.supabase.co/auth/v1")
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode(secret));

      const payload = await verifier.verify(token);

      expect(payload.sub).toBe("user-456");
    });

    it("should reject JWT with wrong algorithm", async () => {
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
        .setProtectedHeader({ alg: "HS512" })
        .setSubject("user-789")
        .setAudience("authenticated")
        .setIssuer("https://example.supabase.co/auth/v1")
        .setExpirationTime("2h")
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

      const token = await new SignJWT({ role: "authenticated" })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("user-789")
        .setAudience("wrong-audience")
        .setIssuer("https://example.supabase.co/auth/v1")
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode(secret));

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

      const token = await new SignJWT({ role: "authenticated" })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("user-789")
        .setAudience("authenticated")
        .setIssuer("https://wrong.supabase.co/auth/v1")
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode(secret));

      await expect(verifier.verify(token)).rejects.toThrow();
    });
  });

  describe("payload extraction", () => {
    it("should extract all payload fields", async () => {
      const secret = "test-secret-key-at-least-32-chars-long-for-hs256";
      const config: SupabaseConfig = {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        audience: "authenticated",
        jwtSecret: secret,
        jwtAlgs: ["HS256"],
      };

      const verifier = createJWTVerifier(config);

      const token = await new SignJWT({
        role: "authenticated",
        custom_field: "value",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("user-123")
        .setAudience("authenticated")
        .setIssuer("https://example.supabase.co/auth/v1")
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode(secret));

      const payload = await verifier.verify(token);

      expect(payload.sub).toBe("user-123");
      expect(payload.aud).toBe("authenticated");
      expect(payload.role).toBe("authenticated");
    });

    it("should handle missing sub field", async () => {
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
        .setAudience("authenticated")
        .setIssuer("https://example.supabase.co/auth/v1")
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode(secret));

      const payload = await verifier.verify(token);

      expect(payload.sub).toBeUndefined();
    });

    it("should handle non-string sub field", async () => {
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
        .setSubject(123 as unknown as string)
        .setAudience("authenticated")
        .setIssuer("https://example.supabase.co/auth/v1")
        .setExpirationTime("2h")
        .sign(new TextEncoder().encode(secret));

      const payload = await verifier.verify(token);

      expect(payload.sub).toBeUndefined();
    });
  });
});
