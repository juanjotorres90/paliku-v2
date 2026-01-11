import { describe, it, expect, vi } from "vitest";
import { refresh } from "./refresh";
import type { SupabaseAuthPort } from "../ports";

describe("refresh", () => {
  it("should refresh session successfully", async () => {
    const mockTokens = {
      accessToken: "access-token-123",
      refreshToken: "refresh-token-456",
    };

    const mockSupabaseAuth: SupabaseAuthPort = {
      signup: vi.fn(),
      login: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(mockTokens),
      exchangeAuthCodeForTokens: vi.fn(),
      getUser: vi.fn(),
    };

    const result = await refresh(
      { refreshToken: "refresh-token-000" },
      { supabaseAuth: mockSupabaseAuth },
    );

    expect(result).toEqual({ ok: true, tokens: mockTokens });
    expect(mockSupabaseAuth.refreshSession).toHaveBeenCalledWith(
      "refresh-token-000",
    );
  });

  it("should propagate errors from supabase auth", async () => {
    const mockSupabaseAuth: SupabaseAuthPort = {
      signup: vi.fn(),
      login: vi.fn(),
      refreshSession: vi.fn().mockRejectedValue(new Error("Refresh failed")),
      exchangeAuthCodeForTokens: vi.fn(),
      getUser: vi.fn(),
    };

    await expect(
      refresh(
        { refreshToken: "refresh-token-000" },
        { supabaseAuth: mockSupabaseAuth },
      ),
    ).rejects.toThrow("Refresh failed");
  });
});
