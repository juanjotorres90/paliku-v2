import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSupabaseAuthAdapter } from "./supabase-auth.adapter";
import type { SupabaseConfig } from "../../../server/config";
import type { HttpClient } from "../../../shared/infrastructure/http-client";

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
});
