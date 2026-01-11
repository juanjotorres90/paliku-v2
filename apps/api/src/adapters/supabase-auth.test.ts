import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseAuthAdapter } from "./supabase-auth";
import type { SupabaseConfig } from "../domain/config";
import type { HttpClient } from "./http-client";

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

  describe("signup", () => {
    it("should signup successfully with email confirmation needed", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('{"user":{"id":"123"}}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.signup(
        "test@example.com",
        "password123",
        "Test User",
        "code-challenge",
        "http://localhost:3000/callback",
      );

      expect(result.needsEmailConfirmation).toBe(true);
      expect(mockHttpClient.post).toHaveBeenCalled();
    });

    it("should signup successfully without email confirmation", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi
          .fn()
          .mockResolvedValue('{"access_token":"token","user":{"id":"123"}}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.signup(
        "test@example.com",
        "password123",
        "Test User",
        "code-challenge",
        "http://localhost:3000/callback",
      );

      expect(result.needsEmailConfirmation).toBe(false);
    });

    it("should throw error on signup failure with msg", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('{"msg":"Email already registered"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.signup(
          "test@example.com",
          "password123",
          "Test User",
          "code-challenge",
          "http://localhost:3000/callback",
        ),
      ).rejects.toThrow("Email already registered");
    });

    it("should throw error on signup failure with error_description", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        text: vi
          .fn()
          .mockResolvedValue('{"error_description":"Invalid email"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.signup(
          "invalid",
          "password123",
          "Test User",
          "code-challenge",
          "http://localhost:3000/callback",
        ),
      ).rejects.toThrow("Invalid email");
    });

    it("should throw error on signup failure with error field", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('{"error":"Bad request"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.signup(
          "test@example.com",
          "password123",
          "Test User",
          "code-challenge",
          "http://localhost:3000/callback",
        ),
      ).rejects.toThrow("Bad request");
    });

    it("should throw generic error when no error message in response", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("{}"),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.signup(
          "test@example.com",
          "password123",
          "Test User",
          "code-challenge",
          "http://localhost:3000/callback",
        ),
      ).rejects.toThrow("Request failed");
    });
  });

  describe("login", () => {
    it("should login successfully", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi
          .fn()
          .mockResolvedValue(
            '{"access_token":"access-123","refresh_token":"refresh-456"}',
          ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.login("test@example.com", "password123");

      expect(result.accessToken).toBe("access-123");
      expect(result.refreshToken).toBe("refresh-456");
    });

    it("should throw error when access token is missing", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('{"refresh_token":"refresh-456"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.login("test@example.com", "password123"),
      ).rejects.toThrow("Login failed: missing access token");
    });

    it("should throw error on login failure", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('{"error":"Invalid credentials"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.login("test@example.com", "wrong-password"),
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("refreshSession", () => {
    it("should refresh session successfully", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi
          .fn()
          .mockResolvedValue(
            '{"access_token":"access-123","refresh_token":"refresh-456"}',
          ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.refreshSession("refresh-000");

      expect(result.accessToken).toBe("access-123");
      expect(result.refreshToken).toBe("refresh-456");
    });

    it("should keep existing refresh token when response does not include one", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('{"access_token":"access-123"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.refreshSession("refresh-000");

      expect(result.accessToken).toBe("access-123");
      expect(result.refreshToken).toBe("refresh-000");
    });

    it("should throw error when access token is missing", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('{"refresh_token":"refresh-456"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(adapter.refreshSession("refresh-000")).rejects.toThrow(
        "Refresh failed: missing access token",
      );
    });

    it("should throw error on refresh failure", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('{"error":"Invalid refresh token"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(adapter.refreshSession("refresh-000")).rejects.toThrow(
        "Invalid refresh token",
      );
    });
  });

  describe("exchangeAuthCodeForTokens", () => {
    it("should exchange code for tokens successfully", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi
          .fn()
          .mockResolvedValue(
            '{"access_token":"access-789","refresh_token":"refresh-012"}',
          ),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.exchangeAuthCodeForTokens(
        "auth-code",
        "code-verifier",
      );

      expect(result.accessToken).toBe("access-789");
      expect(result.refreshToken).toBe("refresh-012");
    });

    it("should throw error when access token is missing", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("{}"),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.exchangeAuthCodeForTokens("auth-code", "code-verifier"),
      ).rejects.toThrow("Token exchange failed: missing access token");
    });

    it("should throw error on token exchange failure", async () => {
      (mockHttpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('{"error":"Invalid code"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(
        adapter.exchangeAuthCodeForTokens("invalid-code", "code-verifier"),
      ).rejects.toThrow("Invalid code");
    });
  });

  describe("getUser", () => {
    it("should get user successfully", async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi
          .fn()
          .mockResolvedValue('{"email":"test@example.com","id":"user-123"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);
      const result = await adapter.getUser("access-token");

      expect(result.email).toBe("test@example.com");
    });

    it("should throw error when email is missing", async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('{"id":"user-123"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(adapter.getUser("access-token")).rejects.toThrow(
        "Failed to get user: missing email",
      );
    });

    it("should throw error on get user failure", async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('{"error":"Invalid token"}'),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(adapter.getUser("invalid-token")).rejects.toThrow(
        "Invalid token",
      );
    });

    it("should handle empty response", async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(""),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(adapter.getUser("access-token")).rejects.toThrow(
        "Failed to get user: missing email",
      );
    });

    it("should handle malformed JSON response", async () => {
      (mockHttpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("invalid json"),
      });

      const adapter = createSupabaseAuthAdapter(config, mockHttpClient);

      await expect(adapter.getUser("access-token")).rejects.toThrow(
        "Failed to get user: missing email",
      );
    });
  });
});
