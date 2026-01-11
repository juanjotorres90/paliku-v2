import type { SupabaseAuthPort } from "../ports";
import type { HttpClient } from "../../adapters/http-client";
import type { ProfileMeResult, Profile } from "../../domain/types";
import type { ProfileUpsert } from "@repo/validators";
import type { StorageClient } from "../../adapters/storage-client";

export interface GetProfileMeInput {
  accessToken: string;
  userId: string;
}

export interface GetProfileMeContext {
  supabaseAuth: SupabaseAuthPort;
  supabaseUrl: string;
  supabaseAnonKey: string;
  httpClient: HttpClient;
}

export async function getProfileMe(
  input: GetProfileMeInput,
  ctx: GetProfileMeContext,
): Promise<ProfileMeResult> {
  const { accessToken, userId } = input;
  const { supabaseAuth, supabaseUrl, supabaseAnonKey, httpClient } = ctx;

  const { email } = await supabaseAuth.getUser(accessToken);

  const profilesUrl = new URL(
    `/rest/v1/profiles?id=eq.${userId}&select=*`,
    supabaseUrl,
  );

  const profileResponse = await httpClient.get(profilesUrl.toString(), {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  });

  if (!profileResponse.ok) {
    throw new Error("Failed to fetch profile");
  }

  const profileText = await profileResponse.text();
  let profilesJson: unknown = null;
  if (profileText) {
    try {
      profilesJson = JSON.parse(profileText) as unknown;
    } catch {
      profilesJson = null;
    }
  }

  const profiles = Array.isArray(profilesJson) ? profilesJson : [];
  const profileRow = profiles[0] as unknown;

  if (!profileRow || typeof profileRow !== "object") {
    throw new Error("Profile not found");
  }

  const profile: Profile = {
    id: String((profileRow as Record<string, unknown>).id),
    displayName: String(
      (profileRow as Record<string, unknown>).display_name ?? "",
    ),
    bio: String((profileRow as Record<string, unknown>).bio ?? ""),
    location: String((profileRow as Record<string, unknown>).location ?? ""),
    intents: Array.isArray((profileRow as Record<string, unknown>).intents)
      ? ((profileRow as Record<string, unknown>).intents as string[])
      : [],
    isPublic: Boolean(
      (profileRow as Record<string, unknown>).is_public ?? true,
    ),
    avatarUrl:
      (profileRow as Record<string, unknown>).avatar_url === null
        ? null
        : String((profileRow as Record<string, unknown>).avatar_url ?? ""),
    updatedAt: String(
      (profileRow as Record<string, unknown>).updated_at ??
        new Date().toISOString(),
    ),
  };

  return { email, profile };
}

export interface UpdateProfileMeInput {
  accessToken: string;
  userId: string;
  data: ProfileUpsert;
}

export interface UpdateProfileMeContext {
  supabaseAuth: SupabaseAuthPort;
  supabaseUrl: string;
  supabaseAnonKey: string;
  httpClient: HttpClient;
}

export async function updateProfileMe(
  input: UpdateProfileMeInput,
  ctx: UpdateProfileMeContext,
): Promise<ProfileMeResult> {
  const { accessToken, userId, data } = input;
  const { supabaseAuth, supabaseUrl, supabaseAnonKey, httpClient } = ctx;

  const { email } = await supabaseAuth.getUser(accessToken);

  const profilesUrl = new URL(`/rest/v1/profiles?id=eq.${userId}`, supabaseUrl);

  const payload = {
    display_name: data.displayName,
    bio: data.bio,
    location: data.location,
    intents: data.intents,
    is_public: data.isPublic,
    avatar_url: data.avatarUrl,
  };

  const response = await httpClient.patch(profilesUrl.toString(), payload, {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  });

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }

  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = null;
    }
  }

  const profiles = Array.isArray(json) ? json : [];
  const profileRow = profiles[0] as unknown;

  if (!profileRow || typeof profileRow !== "object") {
    throw new Error("Failed to parse updated profile");
  }

  const profile: Profile = {
    id: String((profileRow as Record<string, unknown>).id),
    displayName: String(
      (profileRow as Record<string, unknown>).display_name ?? "",
    ),
    bio: String((profileRow as Record<string, unknown>).bio ?? ""),
    location: String((profileRow as Record<string, unknown>).location ?? ""),
    intents: Array.isArray((profileRow as Record<string, unknown>).intents)
      ? ((profileRow as Record<string, unknown>).intents as string[])
      : [],
    isPublic: Boolean(
      (profileRow as Record<string, unknown>).is_public ?? true,
    ),
    avatarUrl:
      (profileRow as Record<string, unknown>).avatar_url === null
        ? null
        : String((profileRow as Record<string, unknown>).avatar_url ?? ""),
    updatedAt: String(
      (profileRow as Record<string, unknown>).updated_at ??
        new Date().toISOString(),
    ),
  };

  return { email, profile };
}

export interface UploadAvatarInput {
  accessToken: string;
  userId: string;
  file: File;
}

export interface UploadAvatarContext {
  supabaseAuth: SupabaseAuthPort;
  storageClient: StorageClient;
  supabaseUrl: string;
  supabaseAnonKey: string;
  httpClient: HttpClient;
}

export async function uploadAvatar(
  input: UploadAvatarInput,
  ctx: UploadAvatarContext,
): Promise<ProfileMeResult> {
  const { accessToken, userId, file } = input;
  const {
    supabaseAuth,
    storageClient,
    supabaseUrl,
    supabaseAnonKey,
    httpClient,
  } = ctx;

  const { email } = await supabaseAuth.getUser(accessToken);

  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File too large (max 5MB)");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `${userId}/${filename}`;

  const { url: avatarUrl } = await storageClient.upload(
    "avatars",
    path,
    file,
    accessToken,
  );

  const profilesUrl = new URL(`/rest/v1/profiles?id=eq.${userId}`, supabaseUrl);

  const payload = {
    avatar_url: avatarUrl,
  };

  const response = await httpClient.patch(profilesUrl.toString(), payload, {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  });

  if (!response.ok) {
    throw new Error("Failed to update profile with avatar");
  }

  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = null;
    }
  }

  const profiles = Array.isArray(json) ? json : [];
  const profileRow = profiles[0] as unknown;

  if (!profileRow || typeof profileRow !== "object") {
    throw new Error("Failed to parse updated profile");
  }

  const profile: Profile = {
    id: String((profileRow as Record<string, unknown>).id),
    displayName: String(
      (profileRow as Record<string, unknown>).display_name ?? "",
    ),
    bio: String((profileRow as Record<string, unknown>).bio ?? ""),
    location: String((profileRow as Record<string, unknown>).location ?? ""),
    intents: Array.isArray((profileRow as Record<string, unknown>).intents)
      ? ((profileRow as Record<string, unknown>).intents as string[])
      : [],
    isPublic: Boolean(
      (profileRow as Record<string, unknown>).is_public ?? true,
    ),
    avatarUrl:
      (profileRow as Record<string, unknown>).avatar_url === null
        ? null
        : String((profileRow as Record<string, unknown>).avatar_url ?? ""),
    updatedAt: String(
      (profileRow as Record<string, unknown>).updated_at ??
        new Date().toISOString(),
    ),
  };

  return { email, profile };
}
