import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSupabaseAvatarStorage } from "./supabase-avatar-storage.adapter";
import type { SupabaseConfig } from "../../../server/config";
import type { AvatarFile } from "../application/ports";
import {
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  PayloadTooLargeError,
} from "../../../shared/domain/errors";

describe("createSupabaseAvatarStorage", () => {
  const supabase: SupabaseConfig = {
    url: "https://example.supabase.co",
    anonKey: "anon-key",
    audience: "authenticated",
    jwtSecret: undefined,
    jwtAlgs: [],
  };

  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should upload avatar successfully", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(""),
    });

    const storage = createSupabaseAvatarStorage(supabase);
    const file: AvatarFile = {
      bytes: Buffer.from("image"),
      contentType: "image/jpeg",
      size: 5,
      originalName: "avatar.jpg",
    };

    const result = await storage.uploadAvatar({
      userId: "user-123",
      accessToken: "access-token",
      file,
    });

    expect(result.avatarUrl).toContain("/storage/v1/object/public/avatars/");
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/storage/v1/object/avatars/"),
      expect.objectContaining({
        method: "POST",
        headers: {
          apikey: "anon-key",
          Authorization: "Bearer access-token",
          "Content-Type": "image/jpeg",
        },
      }),
    );
  });

  it("should upload avatar with content type", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(""),
    });

    const storage = createSupabaseAvatarStorage(supabase);
    const file: AvatarFile = {
      bytes: Buffer.from("image"),
      contentType: "application/octet-stream",
      size: 5,
      originalName: "avatar.jpg",
    };

    const result = await storage.uploadAvatar({
      userId: "user-123",
      accessToken: "access-token",
      file,
    });

    expect(result.avatarUrl).toContain("/storage/v1/object/public/avatars/");
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/octet-stream",
        }),
      }),
    );
  });

  it("should handle different file types", async () => {
    const extensions = ["jpg", "png", "webp", "gif", "jpeg"];

    for (const ext of extensions) {
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(""),
      });

      const storage = createSupabaseAvatarStorage(supabase);
      const file: AvatarFile = {
        bytes: Buffer.from("image"),
        contentType: `image/${ext}`,
        size: 5,
        originalName: `avatar.${ext}`,
      };

      const result = await storage.uploadAvatar({
        userId: "user-123",
        accessToken: "access-token",
        file,
      });

      expect(result.avatarUrl).toContain(`/avatars/user-123/`);
      expect(result.avatarUrl).toContain(`.${ext}`);
    }
  });

  it("should generate unique filename for each upload", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(""),
    });

    const storage = createSupabaseAvatarStorage(supabase);
    const file: AvatarFile = {
      bytes: Buffer.from("image"),
      contentType: "image/jpeg",
      size: 5,
      originalName: "avatar.jpg",
    };

    const result1 = await storage.uploadAvatar({
      userId: "user-123",
      accessToken: "access-token",
      file,
    });

    const result2 = await storage.uploadAvatar({
      userId: "user-123",
      accessToken: "access-token",
      file,
    });

    expect(result1.avatarUrl).not.toBe(result2.avatarUrl);
  });

  it("should handle files without extension", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(""),
    });

    const storage = createSupabaseAvatarStorage(supabase);
    const file: AvatarFile = {
      bytes: Buffer.from("image"),
      contentType: "image/jpeg",
      size: 5,
      originalName: "avatar",
    };

    const result = await storage.uploadAvatar({
      userId: "user-123",
      accessToken: "access-token",
      file,
    });

    expect(result.avatarUrl).toContain("/avatars/user-123/");
  });

  it("should handle multiple dots in filename", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(""),
    });

    const storage = createSupabaseAvatarStorage(supabase);
    const file: AvatarFile = {
      bytes: Buffer.from("image"),
      contentType: "image/jpeg",
      size: 5,
      originalName: "my.avatar.jpg",
    };

    const result = await storage.uploadAvatar({
      userId: "user-123",
      accessToken: "access-token",
      file,
    });

    expect(result.avatarUrl).toContain(".jpg");
  });

  it("should throw ValidationError on 400", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue("Bad request"),
    });

    const storage = createSupabaseAvatarStorage(supabase);
    const file: AvatarFile = {
      bytes: Buffer.from("image"),
      contentType: "image/jpeg",
      size: 5,
      originalName: "avatar.jpg",
    };

    await expect(
      storage.uploadAvatar({
        userId: "user-123",
        accessToken: "access-token",
        file,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should throw AuthenticationError on 401", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue("Unauthorized"),
    });

    const storage = createSupabaseAvatarStorage(supabase);
    const file: AvatarFile = {
      bytes: Buffer.from("image"),
      contentType: "image/jpeg",
      size: 5,
      originalName: "avatar.jpg",
    };

    await expect(
      storage.uploadAvatar({
        userId: "user-123",
        accessToken: "access-token",
        file,
      }),
    ).rejects.toThrow(AuthenticationError);
  });

  it("should throw ForbiddenError on 403", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue("Forbidden"),
    });

    const storage = createSupabaseAvatarStorage(supabase);
    const file: AvatarFile = {
      bytes: Buffer.from("image"),
      contentType: "image/jpeg",
      size: 5,
      originalName: "avatar.jpg",
    };

    await expect(
      storage.uploadAvatar({
        userId: "user-123",
        accessToken: "access-token",
        file,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("should throw PayloadTooLargeError on 413", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 413,
      text: vi.fn().mockResolvedValue("Payload too large"),
    });

    const storage = createSupabaseAvatarStorage(supabase);
    const file: AvatarFile = {
      bytes: Buffer.from("image"),
      contentType: "image/jpeg",
      size: 5,
      originalName: "avatar.jpg",
    };

    await expect(
      storage.uploadAvatar({
        userId: "user-123",
        accessToken: "access-token",
        file,
      }),
    ).rejects.toThrow(PayloadTooLargeError);
  });

  it("should throw generic Error on other status codes", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("Internal server error"),
    });

    const storage = createSupabaseAvatarStorage(supabase);
    const file: AvatarFile = {
      bytes: Buffer.from("image"),
      contentType: "image/jpeg",
      size: 5,
      originalName: "avatar.jpg",
    };

    await expect(
      storage.uploadAvatar({
        userId: "user-123",
        accessToken: "access-token",
        file,
      }),
    ).rejects.toThrow("Upload failed: 500 - Internal server error");
  });

  it("should construct correct upload URL", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(""),
    });

    const storage = createSupabaseAvatarStorage(supabase);
    const file: AvatarFile = {
      bytes: Buffer.from("image"),
      contentType: "image/jpeg",
      size: 5,
      originalName: "avatar.jpg",
    };

    await storage.uploadAvatar({
      userId: "user-123",
      accessToken: "access-token",
      file,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /https:\/\/example\.supabase\.co\/storage\/v1\/object\/avatars\/user-123\/.+/,
      ),
      expect.any(Object),
    );
  });

  it("should construct correct public URL", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(""),
    });

    const storage = createSupabaseAvatarStorage(supabase);
    const file: AvatarFile = {
      bytes: Buffer.from("image"),
      contentType: "image/jpeg",
      size: 5,
      originalName: "avatar.jpg",
    };

    const result = await storage.uploadAvatar({
      userId: "user-123",
      accessToken: "access-token",
      file,
    });

    expect(result.avatarUrl).toMatch(
      /https:\/\/example\.supabase\.co\/storage\/v1\/object\/public\/avatars\/user-123\/.+/,
    );
  });
});
