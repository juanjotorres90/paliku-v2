import { describe, it, expect, vi } from "vitest";
import { login } from "./login";
import type { AuthProviderPort } from "../ports";

describe("login", () => {
  it("should successfully login with valid credentials", async () => {
    const mockTokens = {
      accessToken: "access-token-123",
      refreshToken: "refresh-token-456",
    };

    const mockAuthProvider: AuthProviderPort = {
      login: vi.fn().mockResolvedValue(mockTokens),
      signup: vi.fn(),
      refreshSession: vi.fn(),
      exchangeAuthCodeForTokens: vi.fn(),
      getUser: vi.fn(),
    };

    const result = await login(
      { email: "test@example.com", password: "password123" },
      { authProvider: mockAuthProvider },
    );

    expect(result).toEqual({ ok: true, tokens: mockTokens });
    expect(mockAuthProvider.login).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
    );
  });

  it("should propagate errors from supabase auth", async () => {
    const mockAuthProvider: AuthProviderPort = {
      login: vi.fn().mockRejectedValue(new Error("Invalid credentials")),
      signup: vi.fn(),
      refreshSession: vi.fn(),
      exchangeAuthCodeForTokens: vi.fn(),
      getUser: vi.fn(),
    };

    await expect(
      login(
        { email: "test@example.com", password: "wrong" },
        { authProvider: mockAuthProvider },
      ),
    ).rejects.toThrow("Invalid credentials");
  });
});
