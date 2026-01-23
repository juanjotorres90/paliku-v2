import { Hono, type Context } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import type { RouteEnv } from "../../../http/context";
import { parseJsonBody } from "../../../http/utils/parse-json";
import { getCookieName, getCookieOptions } from "./cookies";
import { resolveWebOrigin } from "../../../http/utils/origin";
import {
  mapErrorToStatus,
  formatError,
} from "../../../http/utils/error-mapper";
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

interface AuthRoutesContext {
  config: AppConfig;
  authProvider: AuthProviderPort;
  pkceHelpers: PKCEHelpers;
}

function isSecureRequest(c: Context) {
  const forwardedProto = c.req.header("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }
  return new URL(c.req.url).protocol === "https:";
}

export function createAuthRoutes(ctx: AuthRoutesContext) {
  const { config, authProvider, pkceHelpers } = ctx;
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
    const body = await parseJsonBody(c);
    if (!body.ok) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { RegisterRequestSchema } = await import("@repo/validators/auth");
    const parsed = RegisterRequestSchema.safeParse(body.value);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid request", issues: parsed.error.flatten() },
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
    const apiOrigin = process.env.API_URL ?? new URL(c.req.url).origin;

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
      const body = formatError(err);
      return c.json(body, status as 400 | 401 | 403 | 404 | 409 | 413 | 500);
    }
  });

  router.post("/login", loginRateLimiter, async (c) => {
    const body = await parseJsonBody(c);
    if (!body.ok) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { LoginRequestSchema } = await import("@repo/validators/auth");
    const parsed = LoginRequestSchema.safeParse(body.value);
    if (!parsed.success) {
      return c.json({ error: "Invalid request" }, 400);
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

      return c.json({
        ok: true,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken ?? null,
        },
      });
    } catch (err) {
      const status = mapErrorToStatus(err);
      const body = formatError(err);
      return c.json(body, status as 400 | 401 | 403 | 404 | 409 | 413 | 500);
    }
  });

  router.post("/refresh", refreshRateLimiter, async (c) => {
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
      return c.json({ error: "Missing refresh token" }, 401);
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

      return c.json(
        { error: err instanceof Error ? err.message : "Refresh failed" },
        401,
      );
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
    const { searchParams } = new URL(c.req.url);
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next");

    if (!code) {
      return c.text("Missing code", 400);
    }

    const webOrigin = resolveWebOrigin(
      [c.req.header("Origin"), c.req.header("Referer")],
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
