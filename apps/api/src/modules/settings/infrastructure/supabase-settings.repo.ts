import type { Settings, Theme, UpdateSettingsData } from "../domain/types";
import type { SettingsRepositoryPort } from "../application/ports";
import type { HttpClient } from "../../../shared/infrastructure/http-client";
import type { SupabaseConfig } from "../../../server/config";
import {
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
} from "../../../shared/domain/errors";

export function createSupabaseSettingsRepo(
  supabase: SupabaseConfig,
  httpClient: HttpClient,
): SettingsRepositoryPort {
  async function parseSettings(response: {
    ok: boolean;
    status: number;
    text: () => Promise<string>;
  }): Promise<Settings> {
    if (!response.ok) {
      const text = await response.text();
      switch (response.status) {
        case 401:
          throw new AuthenticationError(`Failed to fetch settings: ${text}`);
        case 403:
          throw new ForbiddenError(`Failed to fetch settings: ${text}`);
        default:
          throw new Error(`Failed to fetch settings: ${text}`);
      }
    }

    const settingsText = await response.text();
    let settingsJson: unknown = null;
    if (settingsText) {
      try {
        settingsJson = JSON.parse(settingsText) as unknown;
      } catch {
        settingsJson = null;
      }
    }

    const settings = Array.isArray(settingsJson)
      ? settingsJson
      : settingsJson && typeof settingsJson === "object"
        ? [settingsJson]
        : [];
    const settingsRow = settings[0] as unknown;

    if (!settingsRow || typeof settingsRow !== "object") {
      throw new NotFoundError("Settings not found");
    }

    return mapSettingsRow(settingsRow as Record<string, unknown>);
  }

  function mapSettingsRow(row: Record<string, unknown>): Settings {
    return {
      userId: String(row.user_id),
      theme: String(row.theme ?? "system") as Theme,
      locale: String(row.locale ?? "en"),
      createdAt: String(row.created_at ?? new Date().toISOString()),
      updatedAt: String(row.updated_at ?? new Date().toISOString()),
    };
  }

  async function createDefaultSettings(input: {
    userId: string;
    accessToken: string;
    data?: UpdateSettingsData;
  }): Promise<Settings> {
    const settingsUrl = new URL(`/rest/v1/user_settings`, supabase.url);
    const payload: Record<string, unknown> = {
      user_id: input.userId,
      theme: input.data?.theme ?? "system",
      locale: input.data?.locale ?? "en",
    };

    const response = await httpClient.post(settingsUrl.toString(), payload, {
      apikey: supabase.anonKey,
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    });

    return parseSettings(response);
  }

  async function getById(input: {
    userId: string;
    accessToken: string;
  }): Promise<Settings> {
    const settingsUrl = new URL(
      `/rest/v1/user_settings?user_id=eq.${input.userId}&select=*`,
      supabase.url,
    );

    const response = await httpClient.get(settingsUrl.toString(), {
      apikey: supabase.anonKey,
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    });

    try {
      return parseSettings(response);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return createDefaultSettings(input);
      }
      throw err;
    }
  }

  async function updateById(input: {
    userId: string;
    accessToken: string;
    data: UpdateSettingsData;
  }): Promise<Settings> {
    const settingsUrl = new URL(
      `/rest/v1/user_settings?user_id=eq.${input.userId}`,
      supabase.url,
    );

    const payload: Record<string, unknown> = {};
    if ("theme" in input.data && input.data.theme !== undefined) {
      payload.theme = input.data.theme;
    }
    if ("locale" in input.data && input.data.locale !== undefined) {
      payload.locale = input.data.locale;
    }

    const response = await httpClient.patch(settingsUrl.toString(), payload, {
      apikey: supabase.anonKey,
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    });

    try {
      return parseSettings(response);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return createDefaultSettings(input);
      }
      throw err;
    }
  }

  return {
    getById,
    updateById,
  };
}
