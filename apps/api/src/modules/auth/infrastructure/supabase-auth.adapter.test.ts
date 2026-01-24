import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSupabaseAuthAdapter } from "./supabase-auth.adapter";
import type { SupabaseConfig } from "../../../server/config";
import type { HttpClient } from "../../../shared/infrastructure/http-client";
import { ConflictError } from "../../../shared/domain/errors";

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
});
