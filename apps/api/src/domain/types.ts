export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface RegisterResult {
  ok: true;
  needsEmailConfirmation: boolean;
}

export interface LoginResult {
  ok: true;
  tokens: AuthTokens;
}

export interface SignoutResult {
  ok: true;
}

export interface MeResult {
  userId: string;
  aud?: string;
  role?: string;
}
