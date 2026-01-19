import type { Profile } from "../domain/types";

export interface AvatarFile {
  bytes: Buffer;
  contentType: string;
  size: number;
  originalName: string;
}

export interface UpdateProfileData {
  displayName: string;
  bio: string;
  location: string;
  intents: string[];
  isPublic: boolean;
  /**
   * When omitted (undefined), the avatar URL is not updated.
   * Use null to explicitly clear it.
   */
  avatarUrl?: string | null;
}

export interface UserEmailPort {
  getEmailForAccessToken(accessToken: string): Promise<string>;
}

export interface ProfileRepositoryPort {
  getById(input: { userId: string; accessToken: string }): Promise<Profile>;
  updateById(input: {
    userId: string;
    accessToken: string;
    data: UpdateProfileData;
  }): Promise<Profile>;
  updateAvatarUrl(input: {
    userId: string;
    accessToken: string;
    avatarUrl: string | null;
  }): Promise<Profile>;
}

export interface AvatarStoragePort {
  uploadAvatar(input: {
    userId: string;
    accessToken: string;
    file: AvatarFile;
  }): Promise<{ avatarUrl: string }>;
}
