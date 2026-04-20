import type { SupabaseConfig } from "../../server/config";
import {
  AuthenticationError,
  ConflictError,
  ForbiddenError,
} from "../domain/errors";

export function buildSupabaseHeaders(
  supabase: SupabaseConfig,
  accessToken: string,
): Record<string, string> {
  return {
    apikey: supabase.anonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

interface SupabaseResponse {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}

export async function parsePostgrestArray(
  response: SupabaseResponse,
): Promise<unknown[]> {
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) {
      throw new AuthenticationError(`Unauthorized: ${text}`);
    }
    if (response.status === 403) {
      throw new ForbiddenError(`Forbidden: ${text}`);
    }
    if (response.status === 409) {
      throw new ConflictError("Conflict");
    }
    throw new Error(`PostgREST error (${response.status}): ${text}`);
  }
  const text = await response.text();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
