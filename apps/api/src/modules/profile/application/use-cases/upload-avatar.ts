import type { ProfileMeResult } from "../../domain/types";
import type {
  AvatarFile,
  AvatarStoragePort,
  ProfileRepositoryPort,
  UserEmailPort,
} from "../ports";
import {
  PayloadTooLargeError,
  ValidationError,
} from "../../../../shared/domain/errors";

export interface UploadAvatarInput {
  accessToken: string;
  userId: string;
  file: AvatarFile;
}

export interface UploadAvatarContext {
  profileRepo: ProfileRepositoryPort;
  storage: AvatarStoragePort;
  userEmail: UserEmailPort;
}

export async function uploadAvatar(
  input: UploadAvatarInput,
  ctx: UploadAvatarContext,
): Promise<ProfileMeResult> {
  const { accessToken, userId, file } = input;
  const { profileRepo, storage, userEmail } = ctx;

  if (!file.contentType.startsWith("image/")) {
    throw new ValidationError("File must be an image");
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new PayloadTooLargeError("File too large (max 5MB)");
  }

  const [uploadResult, email] = await Promise.all([
    storage.uploadAvatar({ accessToken, userId, file }),
    userEmail.getEmailForAccessToken(accessToken),
  ]);

  const profile = await profileRepo.updateAvatarUrl({
    accessToken,
    userId,
    avatarUrl: uploadResult.avatarUrl,
  });

  return { email, profile };
}
