import type { AuthProviderPort } from "../ports";

export interface RefreshInput {
  refreshToken: string;
}

export interface RefreshContext {
  authProvider: AuthProviderPort;
}

export interface RefreshResult {
  ok: true;
  tokens: {
    accessToken: string;
    refreshToken?: string;
  };
}

export async function refresh(
  input: RefreshInput,
  ctx: RefreshContext,
): Promise<RefreshResult> {
  const { refreshToken } = input;
  const { authProvider } = ctx;

  const tokens = await authProvider.refreshSession(refreshToken);

  return { ok: true, tokens };
}
