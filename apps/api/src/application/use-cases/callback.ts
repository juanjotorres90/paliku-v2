import type { SupabaseAuthPort } from "../ports";
import type { AuthTokens } from "../../domain/types";
import { getSafeNext } from "../../domain/redirect";

export interface CallbackInput {
  code: string;
  codeVerifier: string;
  next?: string;
}

export interface CallbackContext {
  supabaseAuth: SupabaseAuthPort;
}

export interface CallbackResult {
  tokens: AuthTokens;
  next: string;
}

export async function callback(
  input: CallbackInput,
  ctx: CallbackContext,
): Promise<CallbackResult> {
  const { code, codeVerifier, next } = input;
  const { supabaseAuth } = ctx;

  const tokens = await supabaseAuth.exchangeAuthCodeForTokens(
    code,
    codeVerifier,
  );
  const safeNext = getSafeNext(next);

  return { tokens, next: safeNext };
}
