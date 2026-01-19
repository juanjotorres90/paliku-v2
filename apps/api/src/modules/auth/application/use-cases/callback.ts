import type { AuthProviderPort } from "../ports";
import { getSafeNext } from "../../domain/redirect";

export interface CallbackInput {
  code: string;
  codeVerifier: string;
  next?: string;
}

export interface CallbackContext {
  authProvider: AuthProviderPort;
}

export interface CallbackResult {
  tokens: {
    accessToken: string;
    refreshToken?: string;
  };
  next: string;
}

export async function callback(
  input: CallbackInput,
  ctx: CallbackContext,
): Promise<CallbackResult> {
  const { code, codeVerifier, next } = input;
  const { authProvider } = ctx;

  const tokens = await authProvider.exchangeAuthCodeForTokens(
    code,
    codeVerifier,
  );
  const safeNext = getSafeNext(next);

  return { tokens, next: safeNext };
}
