import { describe, it, expect, vi } from "vitest";
import { createSupabaseProfileRepo } from "./supabase-profile.repo";
import type { SupabaseConfig } from "../../../server/config";
import type { HttpClient } from "../../../shared/infrastructure/http-client";
import {
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
} from "../../../shared/domain/errors";

describe("createSupabaseProfileRepo", () => {
  const supabase: SupabaseConfig = {
    url: "https://example.supabase.co",
    anonKey: "anon-key",
    audience: "authenticated",
    jwtSecret: undefined,
    jwtAlgs: [],
  };

  describe("getById", () => {
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
      expect(profile.bio).toBe("Test bio");
      expect(profile.location).toBe("Test location");
      expect(profile.intents).toEqual([]);
      expect(profile.isPublic).toBe(true);
      expect(profile.avatarUrl).toBe(null);
      expect(profile.updatedAt).toBe("2024-01-01T00:00:00Z");
    });

    it("should handle profile with avatar URL", async () => {
      const httpClient: HttpClient = {
        get: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue(
            JSON.stringify([
              {
                id: "user-123",
                display_name: "Test User",
                bio: "",
                location: "",
                intents: ["practice"],
                is_public: false,
                avatar_url: "https://example.com/avatar.jpg",
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

      expect(profile.avatarUrl).toBe("https://example.com/avatar.jpg");
      expect(profile.intents).toEqual(["practice"]);
      expect(profile.isPublic).toBe(false);
    });

    it("should throw AuthenticationError on 401", async () => {
      const httpClient: HttpClient = {
        get: vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          text: vi.fn().mockResolvedValue("Unauthorized"),
        }),
        post: vi.fn(),
        patch: vi.fn(),
      };

      const repo = createSupabaseProfileRepo(supabase, httpClient);

      await expect(
        repo.getById({
          userId: "user-123",
          accessToken: "access-token",
        }),
      ).rejects.toThrow(AuthenticationError);
    });

    it("should throw ForbiddenError on 403", async () => {
      const httpClient: HttpClient = {
        get: vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          text: vi.fn().mockResolvedValue("Forbidden"),
        }),
        post: vi.fn(),
        patch: vi.fn(),
      };

      const repo = createSupabaseProfileRepo(supabase, httpClient);

      await expect(
        repo.getById({
          userId: "user-123",
          accessToken: "access-token",
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("should throw Error on other status codes", async () => {
      const httpClient: HttpClient = {
        get: vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          text: vi.fn().mockResolvedValue("Server error"),
        }),
        post: vi.fn(),
        patch: vi.fn(),
      };

      const repo = createSupabaseProfileRepo(supabase, httpClient);

      await expect(
        repo.getById({
          userId: "user-123",
          accessToken: "access-token",
        }),
      ).rejects.toThrow("Failed to fetch profile: Server error");
    });

    it("should throw NotFoundError when profile not found", async () => {
      const httpClient: HttpClient = {
        get: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue("[]"),
        }),
        post: vi.fn(),
        patch: vi.fn(),
      };

      const repo = createSupabaseProfileRepo(supabase, httpClient);

      await expect(
        repo.getById({
          userId: "user-123",
          accessToken: "access-token",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("should handle malformed JSON response", async () => {
      const httpClient: HttpClient = {
        get: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue("invalid json"),
        }),
        post: vi.fn(),
        patch: vi.fn(),
      };

      const repo = createSupabaseProfileRepo(supabase, httpClient);

      await expect(
        repo.getById({
          userId: "user-123",
          accessToken: "access-token",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("should make correct HTTP request", async () => {
      const httpClient: HttpClient = {
        get: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue(
            JSON.stringify([
              {
                id: "user-123",
                display_name: "Test User",
                bio: "",
                location: "",
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

      await repo.getById({
        userId: "user-123",
        accessToken: "access-token",
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        "https://example.supabase.co/rest/v1/profiles?id=eq.user-123&select=*",
        {
          apikey: "anon-key",
          Authorization: "Bearer access-token",
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
      );
    });
  });

  describe("updateById", () => {
    it("should update profile", async () => {
      const httpClient: HttpClient = {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue(
            JSON.stringify([
              {
                id: "user-123",
                display_name: "Updated Name",
                bio: "Updated bio",
                location: "Updated location",
                intents: ["practice", "social"],
                is_public: false,
                avatar_url: "https://example.com/avatar.jpg",
                updated_at: "2024-01-02T00:00:00Z",
              },
            ]),
          ),
        }),
      };

      const repo = createSupabaseProfileRepo(supabase, httpClient);

      const profile = await repo.updateById({
        userId: "user-123",
        accessToken: "access-token",
        data: {
          displayName: "Updated Name",
          bio: "Updated bio",
          location: "Updated location",
          intents: ["practice", "social"],
          isPublic: false,
          avatarUrl: "https://example.com/avatar.jpg",
        },
      });

      expect(profile.displayName).toBe("Updated Name");
      expect(profile.intents).toEqual(["practice", "social"]);
    });

    it("should update profile without avatar URL", async () => {
      const httpClient: HttpClient = {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue(
            JSON.stringify([
              {
                id: "user-123",
                display_name: "Updated Name",
                bio: "",
                location: "",
                intents: [],
                is_public: true,
                avatar_url: null,
                updated_at: "2024-01-02T00:00:00Z",
              },
            ]),
          ),
        }),
      };

      const repo = createSupabaseProfileRepo(supabase, httpClient);

      const profile = await repo.updateById({
        userId: "user-123",
        accessToken: "access-token",
        data: {
          displayName: "Updated Name",
          bio: "",
          location: "",
          intents: [],
          isPublic: true,
        },
      });

      expect(profile.avatarUrl).toBe(null);
      expect(httpClient.patch).toHaveBeenCalledWith(
        "https://example.supabase.co/rest/v1/profiles?id=eq.user-123",
        {
          display_name: "Updated Name",
          bio: "",
          location: "",
          intents: [],
          is_public: true,
        },
        expect.any(Object),
      );
    });

    it("should handle update errors", async () => {
      const httpClient: HttpClient = {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          text: vi.fn().mockResolvedValue("Unauthorized"),
        }),
      };

      const repo = createSupabaseProfileRepo(supabase, httpClient);

      await expect(
        repo.updateById({
          userId: "user-123",
          accessToken: "access-token",
          data: {
            displayName: "Updated Name",
            bio: "",
            location: "",
            intents: [],
            isPublic: true,
          },
        }),
      ).rejects.toThrow(AuthenticationError);
    });

    it("should handle empty response", async () => {
      const httpClient: HttpClient = {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue("[]"),
        }),
      };

      const repo = createSupabaseProfileRepo(supabase, httpClient);

      await expect(
        repo.updateById({
          userId: "user-123",
          accessToken: "access-token",
          data: {
            displayName: "Updated Name",
            bio: "",
            location: "",
            intents: [],
            isPublic: true,
          },
        }),
      ).rejects.toThrow("Failed to parse updated profile");
    });
  });

  describe("updateAvatarUrl", () => {
    it("should update avatar URL", async () => {
      const httpClient: HttpClient = {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue(
            JSON.stringify([
              {
                id: "user-123",
                display_name: "Test User",
                bio: "",
                location: "",
                intents: [],
                is_public: true,
                avatar_url: "https://example.com/new-avatar.jpg",
                updated_at: "2024-01-02T00:00:00Z",
              },
            ]),
          ),
        }),
      };

      const repo = createSupabaseProfileRepo(supabase, httpClient);

      const profile = await repo.updateAvatarUrl({
        userId: "user-123",
        accessToken: "access-token",
        avatarUrl: "https://example.com/new-avatar.jpg",
      });

      expect(profile.avatarUrl).toBe("https://example.com/new-avatar.jpg");
      expect(httpClient.patch).toHaveBeenCalledWith(
        "https://example.supabase.co/rest/v1/profiles?id=eq.user-123",
        {
          avatar_url: "https://example.com/new-avatar.jpg",
        },
        expect.any(Object),
      );
    });

    it("should update avatar URL to null", async () => {
      const httpClient: HttpClient = {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: vi.fn().mockResolvedValue(
            JSON.stringify([
              {
                id: "user-123",
                display_name: "Test User",
                bio: "",
                location: "",
                intents: [],
                is_public: true,
                avatar_url: null,
                updated_at: "2024-01-02T00:00:00Z",
              },
            ]),
          ),
        }),
      };

      const repo = createSupabaseProfileRepo(supabase, httpClient);

      const profile = await repo.updateAvatarUrl({
        userId: "user-123",
        accessToken: "access-token",
        avatarUrl: null,
      });

      expect(profile.avatarUrl).toBe(null);
      expect(httpClient.patch).toHaveBeenCalledWith(
        "https://example.supabase.co/rest/v1/profiles?id=eq.user-123",
        {
          avatar_url: null,
        },
        expect.any(Object),
      );
    });

    it("should handle update errors", async () => {
      const httpClient: HttpClient = {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          text: vi.fn().mockResolvedValue("Forbidden"),
        }),
      };

      const repo = createSupabaseProfileRepo(supabase, httpClient);

      await expect(
        repo.updateAvatarUrl({
          userId: "user-123",
          accessToken: "access-token",
          avatarUrl: "https://example.com/avatar.jpg",
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
