import type { AvatarStoragePort, AvatarFile } from "../application/ports";
import type { SupabaseConfig } from "../../../server/config";
import {
  AuthenticationError,
  ForbiddenError,
  PayloadTooLargeError,
  ValidationError,
} from "../../../shared/domain/errors";

function toUploadBuffer(file: AvatarFile): Buffer {
  return Buffer.from(file.bytes);
}

export function createSupabaseAvatarStorage(
  supabase: SupabaseConfig,
): AvatarStoragePort {
  const supabaseOrigin = new URL(supabase.url).origin;

  return {
    async uploadAvatar(input: {
      userId: string;
      accessToken: string;
      file: AvatarFile;
    }): Promise<{ avatarUrl: string }> {
      const ext = input.file.originalName.split(".").pop() || "jpg";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `${input.userId}/${filename}`;

      const uploadUrl = new URL(
        `/storage/v1/object/avatars/${path}`,
        supabaseOrigin,
      );

      const response = await fetch(uploadUrl.toString(), {
        method: "POST",
        headers: {
          apikey: supabase.anonKey,
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": input.file.contentType || "application/octet-stream",
        },
        body: toUploadBuffer(input.file) as unknown as BodyInit,
      });

      if (!response.ok) {
        const text = await response.text();
        const message = `Upload failed: ${response.status} - ${text}`;

        switch (response.status) {
          case 400:
            throw new ValidationError(message);
          case 401:
            throw new AuthenticationError(message);
          case 403:
            throw new ForbiddenError(message);
          case 413:
            throw new PayloadTooLargeError(message);
          default:
            throw new Error(message);
        }
      }

      const publicUrl = new URL(
        `/storage/v1/object/public/avatars/${path}`,
        supabaseOrigin,
      ).toString();

      return { avatarUrl: publicUrl };
    },
  };
}
