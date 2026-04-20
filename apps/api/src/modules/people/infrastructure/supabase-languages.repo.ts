import type {
  LanguageCode,
  LanguageKind,
  Proficiency,
} from "@repo/validators/people";
import type { SupabaseConfig } from "../../../server/config";
import type { HttpClient } from "../../../shared/infrastructure/http-client";
import {
  buildSupabaseHeaders,
  parsePostgrestArray,
} from "../../../shared/infrastructure/supabase-http";
import type { UserLanguagesRepositoryPort } from "../application/ports";
import type { LanguageEntry, UserLanguage } from "../domain/types";

interface LanguageRow {
  id: number;
  user_id: string;
  kind: string;
  language_code: string;
  level: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: LanguageRow): UserLanguage {
  return {
    kind: row.kind as LanguageKind,
    languageCode: row.language_code as LanguageCode,
    level: row.level as Proficiency,
  };
}

const LANGUAGE_COLS =
  "id,user_id,kind,language_code,level,created_at,updated_at";

export function createSupabaseLanguagesRepo(
  supabase: SupabaseConfig,
  httpClient: HttpClient,
): UserLanguagesRepositoryPort {
  async function getForUser(input: {
    accessToken: string;
    userId: string;
  }): Promise<UserLanguage[]> {
    const url = new URL(
      `/rest/v1/user_languages?user_id=eq.${input.userId}&select=${LANGUAGE_COLS}&order=kind.asc,language_code.asc`,
      supabase.url,
    );

    const response = await httpClient.get(
      url.toString(),
      buildSupabaseHeaders(supabase, input.accessToken),
    );

    const rows = (await parsePostgrestArray(response)) as LanguageRow[];
    return rows.map(mapRow);
  }

  async function getForUsers(input: {
    accessToken: string;
    userIds: string[];
  }): Promise<Map<string, UserLanguage[]>> {
    const result = new Map<string, UserLanguage[]>();
    if (input.userIds.length === 0) return result;

    const url = new URL(
      `/rest/v1/user_languages?user_id=in.(${input.userIds.join(",")})&select=${LANGUAGE_COLS}&order=kind.asc,language_code.asc`,
      supabase.url,
    );

    const response = await httpClient.get(
      url.toString(),
      buildSupabaseHeaders(supabase, input.accessToken),
    );

    const rows = (await parsePostgrestArray(response)) as LanguageRow[];

    for (const row of rows) {
      const userId = row.user_id;
      const existing = result.get(userId) ?? [];
      existing.push(mapRow(row));
      result.set(userId, existing);
    }

    return result;
  }

  async function replaceForUser(input: {
    accessToken: string;
    userId: string;
    speaks: LanguageEntry[];
    learning: LanguageEntry[];
  }): Promise<UserLanguage[]> {
    const headers = buildSupabaseHeaders(supabase, input.accessToken);

    // Delete existing languages for user
    const deleteUrl = new URL(
      `/rest/v1/user_languages?user_id=eq.${input.userId}`,
      supabase.url,
    );
    const deleteResponse = await httpClient.delete(
      deleteUrl.toString(),
      headers,
    );
    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const text = await deleteResponse.text();
      throw new Error(`Failed to delete languages: ${text}`);
    }

    // Build rows to insert
    const rows = [
      ...input.speaks.map((l) => ({
        user_id: input.userId,
        kind: "speaks",
        language_code: l.languageCode,
        level: l.level,
      })),
      ...input.learning.map((l) => ({
        user_id: input.userId,
        kind: "learning",
        language_code: l.languageCode,
        level: l.level,
      })),
    ];

    if (rows.length === 0) {
      return [];
    }

    // Bulk insert
    const insertUrl = new URL(`/rest/v1/user_languages`, supabase.url);
    const insertResponse = await httpClient.post(
      insertUrl.toString(),
      rows,
      headers,
    );

    const inserted = (await parsePostgrestArray(
      insertResponse,
    )) as LanguageRow[];
    return inserted.map(mapRow);
  }

  return {
    getForUser,
    getForUsers,
    replaceForUser,
  };
}
