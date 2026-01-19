import type { Profile } from "../domain/types";
import type {
  ProfileRepositoryPort,
  UpdateProfileData,
} from "../application/ports";
import type { HttpClient } from "../../../shared/infrastructure/http-client";
import type { SupabaseConfig } from "../../../server/config";
import {
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
} from "../../../shared/domain/errors";

export function createSupabaseProfileRepo(
  supabase: SupabaseConfig,
  httpClient: HttpClient,
): ProfileRepositoryPort {
  async function parseProfiles(response: {
    ok: boolean;
    status: number;
    text: () => Promise<string>;
  }): Promise<Profile> {
    if (!response.ok) {
      const text = await response.text();
      switch (response.status) {
        case 401:
          throw new AuthenticationError(`Failed to fetch profile: ${text}`);
        case 403:
          throw new ForbiddenError(`Failed to fetch profile: ${text}`);
        default:
          throw new Error(`Failed to fetch profile: ${text}`);
      }
    }

    const profileText = await response.text();
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
      throw new NotFoundError("Profile not found");
    }

    return mapProfileRow(profileRow as Record<string, unknown>);
  }

  function mapProfileRow(row: Record<string, unknown>): Profile {
    return {
      id: String(row.id),
      displayName: String(row.display_name ?? ""),
      bio: String(row.bio ?? ""),
      location: String(row.location ?? ""),
      intents: Array.isArray(row.intents) ? (row.intents as string[]) : [],
      isPublic: Boolean(row.is_public ?? true),
      avatarUrl: row.avatar_url === null ? null : String(row.avatar_url ?? ""),
      updatedAt: String(row.updated_at ?? new Date().toISOString()),
    };
  }

  async function getById(input: {
    userId: string;
    accessToken: string;
  }): Promise<Profile> {
    const profilesUrl = new URL(
      `/rest/v1/profiles?id=eq.${input.userId}&select=*`,
      supabase.url,
    );

    const response = await httpClient.get(profilesUrl.toString(), {
      apikey: supabase.anonKey,
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    });

    return parseProfiles(response);
  }

  async function updateById(input: {
    userId: string;
    accessToken: string;
    data: UpdateProfileData;
  }): Promise<Profile> {
    const profilesUrl = new URL(
      `/rest/v1/profiles?id=eq.${input.userId}`,
      supabase.url,
    );

    const payload: Record<string, unknown> = {
      display_name: input.data.displayName,
      bio: input.data.bio,
      location: input.data.location,
      intents: input.data.intents,
      is_public: input.data.isPublic,
    };

    if ("avatarUrl" in input.data) {
      payload.avatar_url = input.data.avatarUrl;
    }

    const response = await httpClient.patch(profilesUrl.toString(), payload, {
      apikey: supabase.anonKey,
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    });

    return parseUpdatedProfile(response);
  }

  async function updateAvatarUrl(input: {
    userId: string;
    accessToken: string;
    avatarUrl: string | null;
  }): Promise<Profile> {
    const profilesUrl = new URL(
      `/rest/v1/profiles?id=eq.${input.userId}`,
      supabase.url,
    );

    const response = await httpClient.patch(
      profilesUrl.toString(),
      { avatar_url: input.avatarUrl },
      {
        apikey: supabase.anonKey,
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    );

    return parseUpdatedProfile(response);
  }

  async function parseUpdatedProfile(response: {
    ok: boolean;
    status: number;
    text: () => Promise<string>;
  }): Promise<Profile> {
    if (!response.ok) {
      const text = await response.text();
      switch (response.status) {
        case 401:
          throw new AuthenticationError(`Failed to update profile: ${text}`);
        case 403:
          throw new ForbiddenError(`Failed to update profile: ${text}`);
        default:
          throw new Error(`Failed to update profile: ${text}`);
      }
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

    return mapProfileRow(profileRow as Record<string, unknown>);
  }

  return {
    getById,
    updateById,
    updateAvatarUrl,
  };
}
