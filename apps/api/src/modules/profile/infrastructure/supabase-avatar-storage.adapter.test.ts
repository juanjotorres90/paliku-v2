import { describe, it, expect, vi } from "vitest";
import { createSupabaseAvatarStorage } from "./supabase-avatar-storage.adapter";
import type { SupabaseConfig } from "../../../server/config";
import type { AvatarFile } from "../application/ports";

describe("createSupabaseAvatarStorage", () => {
  const supabase: SupabaseConfig = {
    url: "https://example.supabase.co",
    anonKey: "anon-key",
    audience: "authenticated",
    jwtSecret: undefined,
    jwtAlgs: [],
  };

  it("should upload avatar successfully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(""),
      }),
    );

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
    vi.unstubAllGlobals();
  });
});
