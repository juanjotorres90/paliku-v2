import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSupabaseAuthAdapter } from "./supabase-auth.adapter";
import type { SupabaseConfig } from "../../../server/config";
import type { HttpClient } from "../../../shared/infrastructure/http-client";
import {
  ConflictError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
} from "../../../shared/domain/errors";

describe("createSupabaseAuthAdapter", () => {
  const config: SupabaseConfig = {
    url: "https://example.supabase.co",
    anonKey: "anon-key",
    audience: "authenticated",
    jwtSecret: undefined,
    jwtAlgs: [],
  };

  let mockHttpClient: HttpClient;

  beforeEach(() => {
    mockHttpClient = {
      post: vi.fn(),
      get: vi.fn(),
      patch: vi.fn(),
    };
  });

  describe("login", () => {
    it("should login successfully", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            access_token: "access-token",
            refresh_token: "refresh-token",
          }),
        ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.login("test@example.com", "password123");

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "https://example.supabase.co/auth/v1/token?grant_type=password",
        { email: "test@example.com", password: "password123" },
        expect.objectContaining({
          apikey: "anon-key",
          Authorization: "Bearer anon-key",
          "Content-Type": "application/json",
          "X-Supabase-Api-Version": "2024-01-01",
        }),
      );
    });

    it("should throw AuthenticationError when missing access token", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            refresh_token: "refresh-token",
          }),
        ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.login("test@example.com", "password123"),
      ).rejects.toThrow(AuthenticationError);
    });

    it("should handle http errors", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('{"error": "Invalid credentials"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.login("test@example.com", "password123"),
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe("signup", () => {
    it("should signup successfully", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            access_token: "access-token",
            refresh_token: "refresh-token",
          }),
        ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.signup(
        "test@example.com",
        "password123",
        "Test",
        "challenge",
        "https://example.com/callback",
      );

      expect(result.needsEmailConfirmation).toBe(false);
    });

    it("should indicate email confirmation needed when no access token", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            user: { identities: [{ provider: "email", id: "test-id" }] },
          }),
        ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.signup(
        "test@example.com",
        "password123",
        "Test",
        "challenge",
        "https://example.com/callback",
      );

      expect(result.needsEmailConfirmation).toBe(true);
    });

    it("should throw ConflictError when signup returns user.identities=[]", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi
          .fn()
          .mockResolvedValue(JSON.stringify({ user: { identities: [] } })),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.signup(
          "test@example.com",
          "password123",
          "Test",
          "challenge",
          "https://example.com/callback",
        ),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("should throw ConflictError when signup returns identities=[] at root", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(JSON.stringify({ identities: [] })),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.signup(
          "test@example.com",
          "password123",
          "Test",
          "challenge",
          "https://example.com/callback",
        ),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("should throw ConflictError for 400 with 'already registered' message", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        text: vi
          .fn()
          .mockResolvedValue(
            '{"error_description": "user already registered"}',
          ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.signup(
          "test@example.com",
          "password123",
          "Test",
          "challenge",
          "https://example.com/callback",
        ),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("should throw ConflictError for 400 with 'already been' message", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        text: vi
          .fn()
          .mockResolvedValue('{"msg": "user already been registered"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.signup(
          "test@example.com",
          "password123",
          "Test",
          "challenge",
          "https://example.com/callback",
        ),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("should throw ConflictError for 400 with 'exists' message", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('{"error": "email exists"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.signup(
          "test@example.com",
          "password123",
          "Test",
          "challenge",
          "https://example.com/callback",
        ),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("should throw ValidationError for 400 with generic message", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('{"error": "Invalid password"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.signup(
          "test@example.com",
          "password123",
          "Test",
          "challenge",
          "https://example.com/callback",
        ),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it("should make correct http request", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi
          .fn()
          .mockResolvedValue(JSON.stringify({ access_token: "token" })),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await adapter.signup(
        "test@example.com",
        "password123",
        "Test User",
        "challenge",
        "https://example.com/callback",
      );

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "https://example.supabase.co/auth/v1/signup",
        {
          email: "test@example.com",
          password: "password123",
          data: { display_name: "Test User" },
          code_challenge: "challenge",
          code_challenge_method: "s256",
          redirect_to: "https://example.com/callback",
        },
        expect.objectContaining({
          "X-Supabase-Api-Version": "2024-01-01",
        }),
      );
    });
  });

  describe("refreshSession", () => {
    it("should refresh session successfully", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
          }),
        ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.refreshSession("refresh-token");

      expect(result.accessToken).toBe("new-access-token");
      expect(result.refreshToken).toBe("new-refresh-token");
    });

    it("should reuse old refresh token when new one not provided", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            access_token: "new-access-token",
          }),
        ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.refreshSession("old-refresh-token");

      expect(result.accessToken).toBe("new-access-token");
      expect(result.refreshToken).toBe("old-refresh-token");
    });

    it("should throw AuthenticationError when missing access token", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            refresh_token: "new-refresh-token",
          }),
        ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(adapter.refreshSession("refresh-token")).rejects.toThrow(
        AuthenticationError,
      );
    });
  });

  describe("exchangeAuthCodeForTokens", () => {
    it("should exchange auth code for tokens", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            access_token: "access-token",
            refresh_token: "refresh-token",
          }),
        ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.exchangeAuthCodeForTokens(
        "auth-code",
        "code-verifier",
      );

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
    });

    it("should throw AuthenticationError when missing access token", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            refresh_token: "refresh-token",
          }),
        ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.exchangeAuthCodeForTokens("auth-code", "code-verifier"),
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe("getUser", () => {
    it("should get user successfully", async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            email: "test@example.com",
          }),
        ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const user = await adapter.getUser("access-token");

      expect(user.email).toBe("test@example.com");
    });

    it("should throw AuthenticationError when missing email", async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            id: "user-123",
          }),
        ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(adapter.getUser("access-token")).rejects.toThrow(
        AuthenticationError,
      );
    });

    it("should handle http errors", async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('{"error": "Invalid token"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(adapter.getUser("access-token")).rejects.toThrow(
        AuthenticationError,
      );
    });
  });

  describe("error handling", () => {
    it("should throw ForbiddenError on 403", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 403,
        text: vi.fn().mockResolvedValue('{"error": "Forbidden"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.login("test@example.com", "password123"),
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw ConflictError on 409", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 409,
        text: vi.fn().mockResolvedValue('{"error": "Conflict"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.signup(
          "test@example.com",
          "password123",
          "Test",
          "challenge",
          "https://example.com/callback",
        ),
      ).rejects.toThrow(ConflictError);
    });

    it("should throw generic Error on 500", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('{"error": "Server error"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.login("test@example.com", "password123"),
      ).rejects.toThrow("Server error");
    });

    it("should extract error message from msg field", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('{"msg": "Custom error message"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.login("test@example.com", "password123"),
      ).rejects.toThrow("Custom error message");
    });

    it("should extract error message from error_description field", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        text: vi
          .fn()
          .mockResolvedValue('{"error_description": "Detailed error"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.login("test@example.com", "password123"),
      ).rejects.toThrow("Detailed error");
    });

    it("should handle invalid json response", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue("invalid json"),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.login("test@example.com", "password123"),
      ).rejects.toThrow("Request failed");
    });
  });
});
