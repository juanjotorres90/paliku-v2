import { describe, it, expect, vi } from "vitest";
import { getProfileMe } from "./get-profile-me";
import { updateProfileMe } from "./update-profile-me";
import { uploadAvatar } from "./upload-avatar";
import type {
  AvatarFile,
  AvatarStoragePort,
  ProfileRepositoryPort,
  UpdateProfileData,
  UserEmailPort,
} from "../ports";

const baseProfile = {
  id: "user-123",
  displayName: "Test User",
  bio: "Test bio",
  location: "Test location",
  intents: ["intent1", "intent2"],
  isPublic: true,
  avatarUrl: "https://example.com/avatar.jpg",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("getProfileMe", () => {
  const mockUserEmail: UserEmailPort = {
    getEmailForAccessToken: vi.fn().mockResolvedValue("test@example.com"),
  };

  it("should fetch user profile successfully", async () => {
    const mockProfileRepo: ProfileRepositoryPort = {
      getById: vi.fn().mockResolvedValue(baseProfile),
      updateById: vi.fn(),
      updateAvatarUrl: vi.fn(),
    };

    const result = await getProfileMe(
      {
        accessToken: "access-token",
        userId: "user-123",
      },
      {
        profileRepo: mockProfileRepo,
        userEmail: mockUserEmail,
      },
    );

    expect(result.email).toBe("test@example.com");
    expect(result.profile.id).toBe("user-123");
    expect(result.profile.displayName).toBe("Test User");
    expect(result.profile.bio).toBe("Test bio");
    expect(result.profile.intents).toEqual(["intent1", "intent2"]);
  });

  it("should propagate profile repo errors", async () => {
    const mockProfileRepo: ProfileRepositoryPort = {
      getById: vi.fn().mockRejectedValue(new Error("Profile not found")),
      updateById: vi.fn(),
      updateAvatarUrl: vi.fn(),
    };

    await expect(
      getProfileMe(
        { accessToken: "access-token", userId: "user-123" },
        { profileRepo: mockProfileRepo, userEmail: mockUserEmail },
      ),
    ).rejects.toThrow("Profile not found");
  });
});

describe("updateProfileMe", () => {
  const mockUserEmail: UserEmailPort = {
    getEmailForAccessToken: vi.fn().mockResolvedValue("test@example.com"),
  };

  it("should update user profile successfully", async () => {
    const mockProfileRepo: ProfileRepositoryPort = {
      getById: vi.fn(),
      updateById: vi.fn().mockResolvedValue({
        ...baseProfile,
        displayName: "Updated User",
        bio: "Updated bio",
        isPublic: false,
      }),
      updateAvatarUrl: vi.fn(),
    };

    const data: UpdateProfileData = {
      displayName: "Updated User",
      bio: "Updated bio",
      location: "Updated location",
      intents: ["practice"],
      isPublic: false,
      avatarUrl: "https://example.com/new-avatar.jpg",
    };

    const result = await updateProfileMe(
      { accessToken: "access-token", userId: "user-123", data },
      { profileRepo: mockProfileRepo, userEmail: mockUserEmail },
    );

    expect(result.profile.displayName).toBe("Updated User");
    expect(result.profile.bio).toBe("Updated bio");
    expect(result.profile.isPublic).toBe(false);
  });

  it("should throw error when update fails", async () => {
    const mockProfileRepo: ProfileRepositoryPort = {
      getById: vi.fn(),
      updateById: vi.fn().mockRejectedValue(new Error("Failed to update")),
      updateAvatarUrl: vi.fn(),
    };

    const data: UpdateProfileData = {
      displayName: "Updated User",
      bio: "Updated bio",
      location: "Updated location",
      intents: [],
      isPublic: true,
    };

    await expect(
      updateProfileMe(
        { accessToken: "access-token", userId: "user-123", data },
        { profileRepo: mockProfileRepo, userEmail: mockUserEmail },
      ),
    ).rejects.toThrow("Failed to update");
  });
});

describe("uploadAvatar", () => {
  const mockUserEmail: UserEmailPort = {
    getEmailForAccessToken: vi.fn().mockResolvedValue("test@example.com"),
  };

  const avatarFile: AvatarFile = {
    bytes: Buffer.from("image content"),
    contentType: "image/jpeg",
    size: 1024,
    originalName: "avatar.jpg",
  };

  it("should upload avatar successfully", async () => {
    const mockProfileRepo: ProfileRepositoryPort = {
      getById: vi.fn(),
      updateById: vi.fn(),
      updateAvatarUrl: vi.fn().mockResolvedValue({
        ...baseProfile,
        avatarUrl: "https://example.com/avatar.jpg",
      }),
    };

    const mockStorage: AvatarStoragePort = {
      uploadAvatar: vi.fn().mockResolvedValue({
        avatarUrl: "https://example.com/avatar.jpg",
      }),
    };

    const result = await uploadAvatar(
      {
        accessToken: "access-token",
        userId: "user-123",
        file: avatarFile,
      },
      {
        profileRepo: mockProfileRepo,
        storage: mockStorage,
        userEmail: mockUserEmail,
      },
    );

    expect(result.profile.avatarUrl).toBe("https://example.com/avatar.jpg");
    expect(mockStorage.uploadAvatar).toHaveBeenCalled();
  });

  it("should reject non-image files", async () => {
    const mockProfileRepo: ProfileRepositoryPort = {
      getById: vi.fn(),
      updateById: vi.fn(),
      updateAvatarUrl: vi.fn(),
    };

    const mockStorage: AvatarStoragePort = {
      uploadAvatar: vi.fn(),
    };

    const badFile: AvatarFile = {
      bytes: Buffer.from("text content"),
      contentType: "text/plain",
      size: 100,
      originalName: "document.txt",
    };

    await expect(
      uploadAvatar(
        { accessToken: "access-token", userId: "user-123", file: badFile },
        {
          profileRepo: mockProfileRepo,
          storage: mockStorage,
          userEmail: mockUserEmail,
        },
      ),
    ).rejects.toThrow("File must be an image");
  });

  it("should reject files larger than 5MB", async () => {
    const mockProfileRepo: ProfileRepositoryPort = {
      getById: vi.fn(),
      updateById: vi.fn(),
      updateAvatarUrl: vi.fn(),
    };

    const mockStorage: AvatarStoragePort = {
      uploadAvatar: vi.fn(),
    };

    const largeContent = new Array(6 * 1024 * 1024).fill("x").join("");
    const bigFile: AvatarFile = {
      bytes: Buffer.from(largeContent),
      contentType: "image/jpeg",
      size: 6 * 1024 * 1024,
      originalName: "large.jpg",
    };

    await expect(
      uploadAvatar(
        { accessToken: "access-token", userId: "user-123", file: bigFile },
        {
          profileRepo: mockProfileRepo,
          storage: mockStorage,
          userEmail: mockUserEmail,
        },
      ),
    ).rejects.toThrow("File too large (max 5MB)");
  });

  it("should throw error when profile update fails", async () => {
    const mockProfileRepo: ProfileRepositoryPort = {
      getById: vi.fn(),
      updateById: vi.fn(),
      updateAvatarUrl: vi
        .fn()
        .mockRejectedValue(new Error("Failed to update profile with avatar")),
    };

    const mockStorage: AvatarStoragePort = {
      uploadAvatar: vi.fn().mockResolvedValue({
        avatarUrl: "https://example.com/avatar.jpg",
      }),
    };

    await expect(
      uploadAvatar(
        { accessToken: "access-token", userId: "user-123", file: avatarFile },
        {
          profileRepo: mockProfileRepo,
          storage: mockStorage,
          userEmail: mockUserEmail,
        },
      ),
    ).rejects.toThrow("Failed to update profile with avatar");
  });
});
