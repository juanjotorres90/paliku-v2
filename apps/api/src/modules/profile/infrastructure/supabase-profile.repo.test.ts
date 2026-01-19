import { describe, it, expect, vi } from "vitest";
import { createSupabaseProfileRepo } from "./supabase-profile.repo";
import type { SupabaseConfig } from "../../../server/config";
import type { HttpClient } from "../../../shared/infrastructure/http-client";

describe("createSupabaseProfileRepo", () => {
  const supabase: SupabaseConfig = {
    url: "https://example.supabase.co",
    anonKey: "anon-key",
    audience: "authenticated",
    jwtSecret: undefined,
    jwtAlgs: [],
  };

  it("should map profile response", async () => {
    const httpClient: HttpClient = {
      get: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              id: "user-123",
              display_name: "Test User",
              bio: "Test bio",
              location: "Test location",
              intents: [],
              is_public: true,
              avatar_url: null,
              updated_at: "2024-01-01T00:00:00Z",
            },
          ]),
        ),
      }),
      post: vi.fn(),
      patch: vi.fn(),
    };

    const repo = createSupabaseProfileRepo(supabase, httpClient);
    const profile = await repo.getById({
      userId: "user-123",
      accessToken: "access-token",
    });

    expect(profile.displayName).toBe("Test User");
  });
});
