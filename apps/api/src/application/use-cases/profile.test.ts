import { describe, it, expect, vi } from "vitest";
import { getProfileMe, updateProfileMe, uploadAvatar } from "./profile";
import type { SupabaseAuthPort } from "../ports";
import type { HttpClient } from "../../adapters/http-client";
import type { StorageClient } from "../../adapters/storage-client";

describe("getProfileMe", () => {
  const mockSupabaseAuth: SupabaseAuthPort = {
    getUser: vi.fn().mockResolvedValue({ email: "test@example.com" }),
    signup: vi.fn(),
    login: vi.fn(),
    exchangeAuthCodeForTokens: vi.fn(),
  };

  it("should fetch user profile successfully", async () => {
    const mockHttpClient: HttpClient = {
      get: vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              id: "user-123",
              display_name: "Test User",
              bio: "Test bio",
              location: "Test location",
              intents: ["intent1", "intent2"],
              is_public: true,
              avatar_url: "https://example.com/avatar.jpg",
              updated_at: "2024-01-01T00:00:00Z",
            },
          ]),
        ),
      }),
      post: vi.fn(),
      patch: vi.fn(),
    };

    const result = await getProfileMe(
      {
        accessToken: "access-token",
        userId: "user-123",
      },
      {
        supabaseAuth: mockSupabaseAuth,
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon-key",
        httpClient: mockHttpClient,
      },
    );

    expect(result.email).toBe("test@example.com");
    expect(result.profile.id).toBe("user-123");
    expect(result.profile.displayName).toBe("Test User");
    expect(result.profile.bio).toBe("Test bio");
    expect(result.profile.intents).toEqual(["intent1", "intent2"]);
  });

  it("should handle null avatar_url", async () => {
    const mockHttpClient: HttpClient = {
      get: vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              id: "user-123",
              display_name: "Test User",
              bio: "",
              location: "",
              intents: [],
              is_public: false,
              avatar_url: null,
              updated_at: "2024-01-01T00:00:00Z",
            },
          ]),
        ),
      }),
      post: vi.fn(),
      patch: vi.fn(),
    };

    const result = await getProfileMe(
      {
        accessToken: "access-token",
        userId: "user-123",
      },
      {
        supabaseAuth: mockSupabaseAuth,
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon-key",
        httpClient: mockHttpClient,
      },
    );

    expect(result.profile.avatarUrl).toBeNull();
  });

  it("should throw error when profile fetch fails", async () => {
    const mockHttpClient: HttpClient = {
      get: vi.fn().mockResolvedValue({
        ok: false,
        text: vi.fn().mockResolvedValue(""),
      }),
      post: vi.fn(),
      patch: vi.fn(),
    };

    await expect(
      getProfileMe(
        {
          accessToken: "access-token",
          userId: "user-123",
        },
        {
          supabaseAuth: mockSupabaseAuth,
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          httpClient: mockHttpClient,
        },
      ),
    ).rejects.toThrow("Failed to fetch profile");
  });

  it("should throw error when profile not found", async () => {
    const mockHttpClient: HttpClient = {
      get: vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue("[]"),
      }),
      post: vi.fn(),
      patch: vi.fn(),
    };

    await expect(
      getProfileMe(
        {
          accessToken: "access-token",
          userId: "user-123",
        },
        {
          supabaseAuth: mockSupabaseAuth,
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          httpClient: mockHttpClient,
        },
      ),
    ).rejects.toThrow("Profile not found");
  });

  it("should handle empty response text", async () => {
    const mockHttpClient: HttpClient = {
      get: vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(""),
      }),
      post: vi.fn(),
      patch: vi.fn(),
    };

    await expect(
      getProfileMe(
        {
          accessToken: "access-token",
          userId: "user-123",
        },
        {
          supabaseAuth: mockSupabaseAuth,
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          httpClient: mockHttpClient,
        },
      ),
    ).rejects.toThrow("Profile not found");
  });

  it("should handle malformed JSON response", async () => {
    const mockHttpClient: HttpClient = {
      get: vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue("invalid json"),
      }),
      post: vi.fn(),
      patch: vi.fn(),
    };

    await expect(
      getProfileMe(
        {
          accessToken: "access-token",
          userId: "user-123",
        },
        {
          supabaseAuth: mockSupabaseAuth,
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          httpClient: mockHttpClient,
        },
      ),
    ).rejects.toThrow("Profile not found");
  });
});

describe("updateProfileMe", () => {
  const mockSupabaseAuth: SupabaseAuthPort = {
    getUser: vi.fn().mockResolvedValue({ email: "test@example.com" }),
    signup: vi.fn(),
    login: vi.fn(),
    exchangeAuthCodeForTokens: vi.fn(),
  };

  it("should update user profile successfully", async () => {
    const mockHttpClient: HttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              id: "user-123",
              display_name: "Updated User",
              bio: "Updated bio",
              location: "Updated location",
              intents: ["new-intent"],
              is_public: false,
              avatar_url: "https://example.com/new-avatar.jpg",
              updated_at: "2024-01-02T00:00:00Z",
            },
          ]),
        ),
      }),
    };

    const result = await updateProfileMe(
      {
        accessToken: "access-token",
        userId: "user-123",
        data: {
          displayName: "Updated User",
          bio: "Updated bio",
          location: "Updated location",
          intents: ["practice"],
          isPublic: false,
          avatarUrl: "https://example.com/new-avatar.jpg",
        },
      },
      {
        supabaseAuth: mockSupabaseAuth,
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon-key",
        httpClient: mockHttpClient,
      },
    );

    expect(result.profile.displayName).toBe("Updated User");
    expect(result.profile.bio).toBe("Updated bio");
    expect(result.profile.isPublic).toBe(false);
  });

  it("should throw error when update fails", async () => {
    const mockHttpClient: HttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn().mockResolvedValue({
        ok: false,
        text: vi.fn().mockResolvedValue(""),
      }),
    };

    await expect(
      updateProfileMe(
        {
          accessToken: "access-token",
          userId: "user-123",
          data: {
            displayName: "Updated User",
            bio: "Updated bio",
            location: "Updated location",
            intents: [],
            isPublic: true,
            avatarUrl: null,
          },
        },
        {
          supabaseAuth: mockSupabaseAuth,
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          httpClient: mockHttpClient,
        },
      ),
    ).rejects.toThrow("Failed to update profile");
  });

  it("should throw error when response cannot be parsed", async () => {
    const mockHttpClient: HttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue("invalid json"),
      }),
    };

    await expect(
      updateProfileMe(
        {
          accessToken: "access-token",
          userId: "user-123",
          data: {
            displayName: "Updated User",
            bio: "",
            location: "",
            intents: [],
            isPublic: true,
            avatarUrl: null,
          },
        },
        {
          supabaseAuth: mockSupabaseAuth,
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          httpClient: mockHttpClient,
        },
      ),
    ).rejects.toThrow("Failed to parse updated profile");
  });

  it("should handle empty response", async () => {
    const mockHttpClient: HttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(""),
      }),
    };

    await expect(
      updateProfileMe(
        {
          accessToken: "access-token",
          userId: "user-123",
          data: {
            displayName: "Updated User",
            bio: "",
            location: "",
            intents: [],
            isPublic: true,
            avatarUrl: null,
          },
        },
        {
          supabaseAuth: mockSupabaseAuth,
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          httpClient: mockHttpClient,
        },
      ),
    ).rejects.toThrow("Failed to parse updated profile");
  });
});

describe("uploadAvatar", () => {
  const mockSupabaseAuth: SupabaseAuthPort = {
    getUser: vi.fn().mockResolvedValue({ email: "test@example.com" }),
    signup: vi.fn(),
    login: vi.fn(),
    exchangeAuthCodeForTokens: vi.fn(),
  };

  it("should upload avatar successfully", async () => {
    const mockStorageClient: StorageClient = {
      upload: vi
        .fn()
        .mockResolvedValue({ url: "https://example.com/avatar.jpg" }),
    };

    const mockHttpClient: HttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              id: "user-123",
              display_name: "Test User",
              bio: "",
              location: "",
              intents: [],
              is_public: true,
              avatar_url: "https://example.com/avatar.jpg",
              updated_at: "2024-01-02T00:00:00Z",
            },
          ]),
        ),
      }),
    };

    const mockFile = new File(["image content"], "avatar.jpg", {
      type: "image/jpeg",
    });

    const result = await uploadAvatar(
      {
        accessToken: "access-token",
        userId: "user-123",
        file: mockFile,
      },
      {
        supabaseAuth: mockSupabaseAuth,
        storageClient: mockStorageClient,
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon-key",
        httpClient: mockHttpClient,
      },
    );

    expect(result.profile.avatarUrl).toBe("https://example.com/avatar.jpg");
    expect(mockStorageClient.upload).toHaveBeenCalled();
  });

  it("should reject non-image files", async () => {
    const mockStorageClient: StorageClient = {
      upload: vi.fn(),
    };

    const mockHttpClient: HttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    };

    const mockFile = new File(["text content"], "document.txt", {
      type: "text/plain",
    });

    await expect(
      uploadAvatar(
        {
          accessToken: "access-token",
          userId: "user-123",
          file: mockFile,
        },
        {
          supabaseAuth: mockSupabaseAuth,
          storageClient: mockStorageClient,
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          httpClient: mockHttpClient,
        },
      ),
    ).rejects.toThrow("File must be an image");
  });

  it("should reject files larger than 5MB", async () => {
    const mockStorageClient: StorageClient = {
      upload: vi.fn(),
    };

    const mockHttpClient: HttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    };

    // Create a mock file with size > 5MB
    const largeContent = new Array(6 * 1024 * 1024).fill("x").join("");
    const mockFile = new File([largeContent], "large.jpg", {
      type: "image/jpeg",
    });

    await expect(
      uploadAvatar(
        {
          accessToken: "access-token",
          userId: "user-123",
          file: mockFile,
        },
        {
          supabaseAuth: mockSupabaseAuth,
          storageClient: mockStorageClient,
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          httpClient: mockHttpClient,
        },
      ),
    ).rejects.toThrow("File too large (max 5MB)");
  });

  it("should throw error when profile update fails", async () => {
    const mockStorageClient: StorageClient = {
      upload: vi
        .fn()
        .mockResolvedValue({ url: "https://example.com/avatar.jpg" }),
    };

    const mockHttpClient: HttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn().mockResolvedValue({
        ok: false,
        text: vi.fn().mockResolvedValue(""),
      }),
    };

    const mockFile = new File(["image content"], "avatar.jpg", {
      type: "image/jpeg",
    });

    await expect(
      uploadAvatar(
        {
          accessToken: "access-token",
          userId: "user-123",
          file: mockFile,
        },
        {
          supabaseAuth: mockSupabaseAuth,
          storageClient: mockStorageClient,
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          httpClient: mockHttpClient,
        },
      ),
    ).rejects.toThrow("Failed to update profile with avatar");
  });

  it("should throw error when profile response cannot be parsed", async () => {
    const mockStorageClient: StorageClient = {
      upload: vi
        .fn()
        .mockResolvedValue({ url: "https://example.com/avatar.jpg" }),
    };

    const mockHttpClient: HttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue("invalid json"),
      }),
    };

    const mockFile = new File(["image content"], "avatar.jpg", {
      type: "image/jpeg",
    });

    await expect(
      uploadAvatar(
        {
          accessToken: "access-token",
          userId: "user-123",
          file: mockFile,
        },
        {
          supabaseAuth: mockSupabaseAuth,
          storageClient: mockStorageClient,
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          httpClient: mockHttpClient,
        },
      ),
    ).rejects.toThrow("Failed to parse updated profile");
  });

  it("should handle empty response after upload", async () => {
    const mockStorageClient: StorageClient = {
      upload: vi
        .fn()
        .mockResolvedValue({ url: "https://example.com/avatar.jpg" }),
    };

    const mockHttpClient: HttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(""),
      }),
    };

    const mockFile = new File(["image content"], "avatar.jpg", {
      type: "image/jpeg",
    });

    await expect(
      uploadAvatar(
        {
          accessToken: "access-token",
          userId: "user-123",
          file: mockFile,
        },
        {
          supabaseAuth: mockSupabaseAuth,
          storageClient: mockStorageClient,
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          httpClient: mockHttpClient,
        },
      ),
    ).rejects.toThrow("Failed to parse updated profile");
  });
});
