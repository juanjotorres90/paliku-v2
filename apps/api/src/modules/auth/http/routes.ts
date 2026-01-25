import { Hono, type Context } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import type { RouteEnv } from "../../../http/context";
import { parseJsonBody } from "../../../http/utils/parse-json";
import { getCookieName, getCookieOptions } from "./cookies";
import { resolveWebOrigin } from "../../../http/utils/origin";
import {
  mapErrorToStatus,
  formatErrorI18n,
} from "../../../http/utils/error-mapper";
import { getLocale, getT } from "../../../http/utils/i18n";
import { createRateLimiter } from "../../../http/middleware/rate-limiter";
import type { LoginInput } from "../application/use-cases/login";
import type { RegisterInput } from "../application/use-cases/register";
import { login } from "../application/use-cases/login";
import { register } from "../application/use-cases/register";
import { refresh } from "../application/use-cases/refresh";
import { callback } from "../application/use-cases/callback";
import type { AuthProviderPort } from "../application/ports";
import type { PKCEHelpers } from "../domain/pkce";
import type { AppConfig } from "../../../server/config";
import type { SettingsRepositoryPort } from "../../settings/application/ports";
import { DEFAULT_LOCALE } from "@repo/i18n";
import type { UpdateSettingsData } from "../../settings/domain/types";

interface AuthRoutesContext {
  config: AppConfig;
  authProvider: AuthProviderPort;
  pkceHelpers: PKCEHelpers;
  settingsRepo: SettingsRepositoryPort;
}

function isSecureRequest(c: Context) {
  const forwardedProto = c.req.header("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }
  return new URL(c.req.url).protocol === "https:";
}

export function createAuthRoutes(ctx: AuthRoutesContext) {
  const { config, authProvider, pkceHelpers, settingsRepo } = ctx;
  const { cors: corsConfig, cookie: cookieConfig } = config;

  const router = new Hono<RouteEnv>();

  const registerRateLimiter = createRateLimiter({
    limit: 3,
    windowMs: 60 * 1000,
  });

  const loginRateLimiter = createRateLimiter({
    limit: 5,
    windowMs: 60 * 1000,
  });

  const refreshRateLimiter = createRateLimiter({
    limit: 10,
    windowMs: 60 * 1000,
  });

  router.post("/register", registerRateLimiter, async (c) => {
    const t = getT(c);

    const body = await parseJsonBody(c);
    if (!body.ok) {
      return c.json(
        {
          error: t("api.errors.request.invalid_json"),
          errorKey: "api.errors.request.invalid_json",
        },
        400,
      );
    }

    const { RegisterRequestSchema } = await import("@repo/validators/auth");
    const parsed = RegisterRequestSchema.safeParse(body.value);
    if (!parsed.success) {
      return c.json(
        {
          error: t("api.errors.request.invalid_request"),
          errorKey: "api.errors.request.invalid_request",
          issues: parsed.error.flatten(),
        },
        400,
      );
    }

    const input: RegisterInput = {
      email: parsed.data.email,
      password: parsed.data.password,
      displayName: parsed.data.displayName,
      redirectTo: parsed.data.redirectTo,
    };

    const cookieOptions = getCookieOptions(cookieConfig, isSecureRequest(c));

    const codeVerifierCookieName = getCookieName(cookieConfig, "code-verifier");
    const requestUrl = new URL(c.req.url);
    const derivedApiOrigin = `${requestUrl.origin}${requestUrl.pathname.replace(
      /\/auth\/.*$/,
      "",
    )}`.replace(/\/+$/, "");
    const apiOrigin = (process.env.API_URL ?? derivedApiOrigin).replace(
      /\/+$/,
      "",
    );

    try {
      const result = await register(input, {
        authProvider,
        pkceHelpers,
        apiOrigin,
      });

      setCookie(c, codeVerifierCookieName, result.codeVerifier, cookieOptions);

      return c.json({
        ok: true,
        needsEmailConfirmation: result.needsEmailConfirmation,
      });
    } catch (err) {
      deleteCookie(c, codeVerifierCookieName, cookieOptions);
      const status = mapErrorToStatus(err);
      const body = formatErrorI18n(err, { t });
      return c.json(body, status as 400 | 401 | 403 | 404 | 409 | 413 | 500);
    }
  });

  router.post("/login", loginRateLimiter, async (c) => {
    const t = getT(c);

    const body = await parseJsonBody(c);
    if (!body.ok) {
      return c.json(
        {
          error: t("api.errors.request.invalid_json"),
          errorKey: "api.errors.request.invalid_json",
        },
        400,
      );
    }

    const { LoginRequestSchema } = await import("@repo/validators/auth");
    const parsed = LoginRequestSchema.safeParse(body.value);
    if (!parsed.success) {
      return c.json(
        {
          error: t("api.errors.request.invalid_request"),
          errorKey: "api.errors.request.invalid_request",
        },
        400,
      );
    }

    const input: LoginInput = {
      email: parsed.data.email,
      password: parsed.data.password,
    };

    const cookieOptions = getCookieOptions(cookieConfig, isSecureRequest(c));
    const refreshTokenOptions = {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    };

    try {
      const result = await login(input, { authProvider });

      const accessTokenCookieName = getCookieName(cookieConfig, "access-token");
      const refreshTokenCookieName = getCookieName(
        cookieConfig,
        "refresh-token",
      );

      setCookie(
        c,
        accessTokenCookieName,
        result.tokens.accessToken,
        cookieOptions,
      );
      if (result.tokens.refreshToken) {
        setCookie(
          c,
          refreshTokenCookieName,
          result.tokens.refreshToken,
          refreshTokenOptions,
        );
      } else {
        deleteCookie(c, refreshTokenCookieName, cookieOptions);
      }

      const { firstLogin } = await bootstrapFirstLogin({
        accessToken: result.tokens.accessToken,
        requestLocale: getLocale(c),
        settingsRepo,
      });

      return c.json({
        ok: true,
        firstLogin,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken ?? null,
        },
      });
    } catch (err) {
      const status = mapErrorToStatus(err);
      const body = formatErrorI18n(err, { t });
      return c.json(body, status as 400 | 401 | 403 | 404 | 409 | 413 | 500);
    }
  });

  router.post("/refresh", refreshRateLimiter, async (c) => {
    const t = getT(c);
    const cookieOptions = getCookieOptions(cookieConfig, isSecureRequest(c));
    const refreshTokenOptions = {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    };

    const accessTokenCookieName = getCookieName(cookieConfig, "access-token");
    const refreshTokenCookieName = getCookieName(cookieConfig, "refresh-token");

    let refreshToken = getCookie(c, refreshTokenCookieName);

    if (!refreshToken) {
      const body = await parseJsonBody(c);
      if (
        body.ok &&
        typeof body.value === "object" &&
        body.value !== null &&
        "refreshToken" in body.value &&
        typeof body.value.refreshToken === "string"
      ) {
        refreshToken = body.value.refreshToken;
      }
    }

    if (!refreshToken) {
      return c.json(
        {
          error: t("api.errors.auth.missing_refresh_token"),
          errorKey: "api.errors.auth.missing_refresh_token",
        },
        401,
      );
    }

    try {
      const result = await refresh({ refreshToken }, { authProvider });

      setCookie(
        c,
        accessTokenCookieName,
        result.tokens.accessToken,
        cookieOptions,
      );
      if (result.tokens.refreshToken) {
        setCookie(
          c,
          refreshTokenCookieName,
          result.tokens.refreshToken,
          refreshTokenOptions,
        );
      } else {
        deleteCookie(c, refreshTokenCookieName, cookieOptions);
      }

      return c.json({
        ok: true,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken ?? null,
        },
      });
    } catch (err) {
      deleteCookie(c, accessTokenCookieName, cookieOptions);
      deleteCookie(c, refreshTokenCookieName, cookieOptions);

      const status = mapErrorToStatus(err);
      const body = formatErrorI18n(err, { t });
      return c.json(body, status as 400 | 401 | 403 | 404 | 409 | 413 | 500);
    }
  });

  router.post("/signout", async (c) => {
    const cookieOptions = getCookieOptions(cookieConfig, isSecureRequest(c));
    const accessTokenCookieName = getCookieName(cookieConfig, "access-token");
    const refreshTokenCookieName = getCookieName(cookieConfig, "refresh-token");

    deleteCookie(c, accessTokenCookieName, cookieOptions);
    deleteCookie(c, refreshTokenCookieName, cookieOptions);

    return c.json({ ok: true });
  });

  router.get("/callback", async (c) => {
    const t = getT(c);
    const { searchParams } = new URL(c.req.url);
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next");

    if (!code) {
      return c.json(
        {
          error: t("api.errors.auth.missing_code"),
          errorKey: "api.errors.auth.missing_code",
        },
        400,
      );
    }

    const forwardedProto = c.req.header("x-forwarded-proto");
    const forwardedHost = c.req.header("x-forwarded-host");
    const host = forwardedHost?.split(",")[0]?.trim() ?? c.req.header("host");
    const protocol = (forwardedProto ?? new URL(c.req.url).protocol).replace(
      /:$/,
      "",
    );
    const requestOrigin = host ? `${protocol}://${host}` : undefined;

    const referer = c.req.header("Referer");
    let refererOrigin: string | undefined;
    if (referer) {
      try {
        refererOrigin = new URL(referer).origin;
      } catch {
        refererOrigin = undefined;
      }
    }

    const webOrigin = resolveWebOrigin(
      [c.req.header("Origin"), refererOrigin, requestOrigin],
      corsConfig,
    );
    const cookieOptions = getCookieOptions(cookieConfig, isSecureRequest(c));
    const codeVerifierCookieName = getCookieName(cookieConfig, "code-verifier");

    const codeVerifier = getCookie(c, codeVerifierCookieName);
    if (!codeVerifier) {
      return c.redirect(`${webOrigin}?error=invalid_state`);
    }

    deleteCookie(c, codeVerifierCookieName, cookieOptions);

    try {
      const result = await callback(
        { code, codeVerifier, next: nextParam ?? undefined },
        { authProvider },
      );

      const { tokens, next } = result;
      const accessTokenCookieName = getCookieName(cookieConfig, "access-token");
      const refreshTokenCookieName = getCookieName(
        cookieConfig,
        "refresh-token",
      );

      const refreshTokenOptions = {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30,
      };

      setCookie(c, accessTokenCookieName, tokens.accessToken, cookieOptions);
      if (tokens.refreshToken) {
        setCookie(
          c,
          refreshTokenCookieName,
          tokens.refreshToken,
          refreshTokenOptions,
        );
      } else {
        deleteCookie(c, refreshTokenCookieName, cookieOptions);
      }

      const { firstLogin } = await bootstrapFirstLogin({
        accessToken: tokens.accessToken,
        requestLocale: getLocale(c),
        settingsRepo,
      });

      if (firstLogin) {
        const welcomeUrl = new URL(`${webOrigin}/welcome`);
        welcomeUrl.searchParams.set("verified", "true");
        welcomeUrl.searchParams.set("next", next);
        return c.redirect(welcomeUrl.toString());
      }

      return c.redirect(`${webOrigin}${next}`);
    } catch (err) {
      return c.redirect(
        `${webOrigin}?error=${
          err instanceof Error ? encodeURIComponent(err.message) : "token_error"
        }`,
      );
    }
  });

  return router;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function base64UrlToUtf8(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  return Buffer.from(padded, "base64").toString("utf8");
}

function getJwtSub(token: string): string | undefined {
  const parts = token.split(".");
  if (parts.length < 2) return undefined;

  try {
    const json = base64UrlToUtf8(parts[1]!);
    const payload: unknown = JSON.parse(json);

    if (!isRecord(payload)) return undefined;
    return typeof payload.sub === "string" ? payload.sub : undefined;
  } catch {
    // noop
  }

  return undefined;
}

async function bootstrapFirstLogin(input: {
  accessToken: string;
  requestLocale: string;
  settingsRepo: SettingsRepositoryPort;
}): Promise<{ firstLogin: boolean }> {
  const { accessToken, requestLocale, settingsRepo } = input;

  const userId = getJwtSub(accessToken);
  if (!userId) return { firstLogin: false };

  try {
    const settings = await settingsRepo.getById({ userId, accessToken });
    const data: UpdateSettingsData = {};

    // Best-effort: persist initial locale based on the current request locale.
    // Only sets it if the user is still on the default locale.
    if (
      requestLocale !== DEFAULT_LOCALE &&
      settings.locale === DEFAULT_LOCALE
    ) {
      data.locale = requestLocale;
    }

    // One-time welcome on first login.
    const firstLogin = !settings.welcomeSeen;
    if (firstLogin) {
      data.welcomeSeen = true;
    }

    if (Object.keys(data).length > 0) {
      await settingsRepo.updateById({
        userId,
        accessToken,
        data,
      });
    }

    return { firstLogin };
  } catch (err) {
    // Best-effort; auth should succeed even if settings persistence fails.
    console.error("Failed to bootstrap first login state:", err);
    return { firstLogin: false };
  }
}
