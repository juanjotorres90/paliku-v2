import type { AuthProviderPort } from "../ports";
import type { PKCEHelpers } from "../../domain/pkce";
import { generateCodeChallenge } from "../../domain/pkce";
import { getSafeNext } from "../../domain/redirect";

export interface RegisterResult {
  ok: true;
  needsEmailConfirmation: boolean;
}

export interface RegisterResultWithVerifier extends RegisterResult {
  codeVerifier: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  redirectTo?: string;
}

export interface RegisterContext {
  authProvider: AuthProviderPort;
  pkceHelpers: PKCEHelpers;
  apiOrigin: string;
}

export async function register(
  input: RegisterInput,
  ctx: RegisterContext,
): Promise<RegisterResultWithVerifier> {
  const { email, password, displayName, redirectTo } = input;
  const { authProvider, pkceHelpers, apiOrigin } = ctx;

  const next = getSafeNext(redirectTo);
  const emailRedirectTo = `${apiOrigin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { codeVerifier, codeChallenge } = generateCodeChallenge(pkceHelpers);

  const result = await authProvider.signup(
    email,
    password,
    displayName,
    codeChallenge,
    emailRedirectTo,
  );

  return {
    ok: true,
    needsEmailConfirmation: result.needsEmailConfirmation,
    codeVerifier,
  };
}
