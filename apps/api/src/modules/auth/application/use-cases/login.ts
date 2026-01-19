import type { AuthProviderPort } from "../ports";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginContext {
  authProvider: AuthProviderPort;
}

export interface LoginResult {
  ok: true;
  tokens: {
    accessToken: string;
    refreshToken?: string;
  };
}

export async function login(
  input: LoginInput,
  ctx: LoginContext,
): Promise<LoginResult> {
  const { email, password } = input;
  const { authProvider } = ctx;

  const tokens = await authProvider.login(email, password);

  return { ok: true, tokens };
}
