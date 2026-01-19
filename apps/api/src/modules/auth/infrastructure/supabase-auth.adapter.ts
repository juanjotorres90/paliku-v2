import type { AuthProviderPort } from "../application/ports";
import type { SupabaseConfig } from "../../../server/config";
import type { HttpClient } from "../../../shared/infrastructure/http-client";
import {
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  ConflictError,
} from "../../../shared/domain/errors";

export function createSupabaseAuthAdapter(
  config: SupabaseConfig,
  httpClient: HttpClient,
): AuthProviderPort {
  const { url, anonKey } = config;
  const supabaseOrigin = new URL(url).origin;

  async function parseResponse<T>(response: {
    ok: boolean;
    status: number;
    text: () => Promise<string>;
  }): Promise<T> {
    const text = await response.text();
    let json: unknown = null;
    if (text) {
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        json = null;
      }
    }

    if (!response.ok) {
      const message =
        typeof json === "object" &&
        json !== null &&
        "msg" in json &&
        typeof json.msg === "string"
          ? json.msg
          : typeof json === "object" &&
              json !== null &&
              "error_description" in json &&
              typeof json.error_description === "string"
            ? json.error_description
            : typeof json === "object" &&
                json !== null &&
                "error" in json &&
                typeof json.error === "string"
              ? json.error
              : "Request failed";

      switch (response.status) {
        case 400:
          throw new ValidationError(message);
        case 401:
          throw new AuthenticationError(message);
        case 403:
          throw new ForbiddenError(message);
        case 409:
          throw new ConflictError(message);
        default:
          throw new Error(message);
      }
    }

    return json as T;
  }

  return {
    async signup(
      email: string,
      password: string,
      displayName: string,
      codeChallenge: string,
      emailRedirectTo: string,
    ): Promise<{ needsEmailConfirmation: boolean }> {
      const signupUrl = new URL("/auth/v1/signup", supabaseOrigin);
      const response = await httpClient.post(
        signupUrl.toString(),
        {
          email,
          password,
          data: { display_name: displayName },
          code_challenge: codeChallenge,
          code_challenge_method: "s256",
          redirect_to: emailRedirectTo,
        },
        {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
          "X-Supabase-Api-Version": "2024-01-01",
        },
      );

      const result = await parseResponse<{ access_token?: string }>(response);
      const needsEmailConfirmation = !result?.access_token;
      return { needsEmailConfirmation };
    },

    async login(email: string, password: string) {
      const signinUrl = new URL(
        "/auth/v1/token?grant_type=password",
        supabaseOrigin,
      );
      const response = await httpClient.post(
        signinUrl.toString(),
        { email, password },
        {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
          "X-Supabase-Api-Version": "2024-01-01",
        },
      );

      const result = await parseResponse<{
        access_token?: string;
        refresh_token?: string;
      }>(response);
      const accessToken = result?.access_token;
      const refreshToken = result?.refresh_token;

      if (!accessToken) {
        throw new AuthenticationError("Login failed: missing access token");
      }

      return { accessToken, refreshToken };
    },

    async refreshSession(refreshToken: string) {
      const refreshUrl = new URL(
        "/auth/v1/token?grant_type=refresh_token",
        supabaseOrigin,
      );
      const response = await httpClient.post(
        refreshUrl.toString(),
        { refresh_token: refreshToken },
        {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
          "X-Supabase-Api-Version": "2024-01-01",
        },
      );

      const result = await parseResponse<{
        access_token?: string;
        refresh_token?: string;
      }>(response);
      const accessToken = result?.access_token;
      const nextRefreshToken = result?.refresh_token;

      if (!accessToken) {
        throw new AuthenticationError("Refresh failed: missing access token");
      }

      return { accessToken, refreshToken: nextRefreshToken ?? refreshToken };
    },

    async exchangeAuthCodeForTokens(authCode: string, codeVerifier: string) {
      const tokenUrl = new URL(
        "/auth/v1/token?grant_type=pkce",
        supabaseOrigin,
      );
      const response = await httpClient.post(
        tokenUrl.toString(),
        { auth_code: authCode, code_verifier: codeVerifier },
        {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
        },
      );

      const result = await parseResponse<{
        access_token?: string;
        refresh_token?: string;
      }>(response);
      const accessToken = result?.access_token;
      const refreshToken = result?.refresh_token;

      if (!accessToken) {
        throw new AuthenticationError(
          "Token exchange failed: missing access token",
        );
      }

      return { accessToken, refreshToken };
    },

    async getUser(accessToken: string): Promise<{ email: string }> {
      const userUrl = new URL("/auth/v1/user", supabaseOrigin);
      const response = await httpClient.get(userUrl.toString(), {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Supabase-Api-Version": "2024-01-01",
      });

      const result = await parseResponse<{ email?: string }>(response);
      const email = result?.email;

      if (!email) {
        throw new AuthenticationError("Failed to get user: missing email");
      }

      return { email };
    },
  };
}
