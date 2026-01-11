import type { AuthTokens } from "../domain/types";

export interface SupabaseAuthPort {
  signup(
    email: string,
    password: string,
    displayName: string,
    codeChallenge: string,
    emailRedirectTo: string,
  ): Promise<{ needsEmailConfirmation: boolean }>;

  login(email: string, password: string): Promise<AuthTokens>;

  exchangeAuthCodeForTokens(
    authCode: string,
    codeVerifier: string,
  ): Promise<AuthTokens>;
}

export interface JWTVerifierPort {
  verify(token: string): Promise<{ sub?: string; aud?: string; role?: string }>;
}
