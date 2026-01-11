import type { SupabaseAuthPort } from "../application/ports";
import type { SupabaseConfig } from "../domain/config";
import type { AuthTokens } from "../domain/types";

export interface HttpClient {
  post(
    url: string,
    body: unknown,
    headers: Record<string, string>,
  ): Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
  }>;
  get(
    url: string,
    headers: Record<string, string>,
  ): Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
  }>;
}

export function createSupabaseAuthAdapter(
  config: SupabaseConfig,
  httpClient: HttpClient,
): SupabaseAuthPort {
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
      throw new Error(message);
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

    async login(email: string, password: string): Promise<AuthTokens> {
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
        throw new Error("Login failed: missing access token");
      }

      return { accessToken, refreshToken };
    },

    async refreshSession(refreshToken: string): Promise<AuthTokens> {
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
        throw new Error("Refresh failed: missing access token");
      }

      return { accessToken, refreshToken: nextRefreshToken ?? refreshToken };
    },

    async exchangeAuthCodeForTokens(
      authCode: string,
      codeVerifier: string,
    ): Promise<AuthTokens> {
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
        throw new Error("Token exchange failed: missing access token");
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

      const result = await parseResponse<{
        email?: string;
      }>(response);
      const email = result?.email;

      if (!email) {
        throw new Error("Failed to get user: missing email");
      }

      return { email };
    },
  };
}
