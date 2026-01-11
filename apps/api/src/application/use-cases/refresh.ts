import type { SupabaseAuthPort } from "../ports";
import type { AuthTokens } from "../../domain/types";

export interface RefreshInput {
  refreshToken: string;
}

export interface RefreshContext {
  supabaseAuth: SupabaseAuthPort;
}

export interface RefreshResult {
  ok: true;
  tokens: AuthTokens;
}

export async function refresh(
  input: RefreshInput,
  ctx: RefreshContext,
): Promise<RefreshResult> {
  const { refreshToken } = input;
  const { supabaseAuth } = ctx;

  const tokens = await supabaseAuth.refreshSession(refreshToken);

  return { ok: true, tokens };
}
