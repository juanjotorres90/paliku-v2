import { describe, it, expect, vi } from "vitest";
import { callback } from "./callback";
import type { SupabaseAuthPort } from "../ports";

describe("callback", () => {
  it("should exchange auth code for tokens", async () => {
    const mockTokens = {
      accessToken: "access-token-123",
      refreshToken: "refresh-token-456",
    };

    const mockSupabaseAuth: SupabaseAuthPort = {
      exchangeAuthCodeForTokens: vi.fn().mockResolvedValue(mockTokens),
      signup: vi.fn(),
      login: vi.fn(),
      refreshSession: vi.fn(),
      getUser: vi.fn(),
    };

    const result = await callback(
      {
        code: "auth-code-123",
        codeVerifier: "code-verifier-456",
      },
      { supabaseAuth: mockSupabaseAuth },
    );

    expect(result).toEqual({
      tokens: mockTokens,
      next: "/",
    });
    expect(mockSupabaseAuth.exchangeAuthCodeForTokens).toHaveBeenCalledWith(
      "auth-code-123",
      "code-verifier-456",
    );
  });

  it("should handle custom next parameter", async () => {
    const mockTokens = {
      accessToken: "access-token-123",
      refreshToken: "refresh-token-456",
    };

    const mockSupabaseAuth: SupabaseAuthPort = {
      exchangeAuthCodeForTokens: vi.fn().mockResolvedValue(mockTokens),
      signup: vi.fn(),
      login: vi.fn(),
      refreshSession: vi.fn(),
      getUser: vi.fn(),
    };

    const result = await callback(
      {
        code: "auth-code-123",
        codeVerifier: "code-verifier-456",
        next: "/dashboard",
      },
      { supabaseAuth: mockSupabaseAuth },
    );

    expect(result.next).toBe("/dashboard");
  });

  it("should propagate errors from supabase auth", async () => {
    const mockSupabaseAuth: SupabaseAuthPort = {
      exchangeAuthCodeForTokens: vi
        .fn()
        .mockRejectedValue(new Error("Invalid auth code")),
      signup: vi.fn(),
      login: vi.fn(),
      refreshSession: vi.fn(),
      getUser: vi.fn(),
    };

    await expect(
      callback(
        {
          code: "invalid-code",
          codeVerifier: "code-verifier-456",
        },
        { supabaseAuth: mockSupabaseAuth },
      ),
    ).rejects.toThrow("Invalid auth code");
  });
});
