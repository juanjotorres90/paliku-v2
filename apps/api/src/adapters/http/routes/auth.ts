import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import type { RouteContext, RouteEnv } from "../context";
import { parseJsonBody } from "../utils/parse-json";
import { getCookieName, getCookieOptions } from "../utils/cookies";
import { resolveWebOrigin } from "../utils/origin";
import type { LoginInput, RegisterInput } from "../../../application";

export function createAuthRoutes(ctx: RouteContext) {
  const { config, useCases, pkceHelpers, supabaseAuth } = ctx;
  const { cors: corsConfig, cookie: cookieConfig } = config;
  const loginContext = { supabaseAuth };

  const router = new Hono<RouteEnv>();

  router.post("/register", async (c) => {
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

    const webOrigin = resolveWebOrigin([c.req.header("Origin")], corsConfig);

    const cookieOptions = getCookieOptions(
      cookieConfig,
      webOrigin.startsWith("https://"),
    );

    const codeVerifierCookieName = getCookieName(cookieConfig, "code-verifier");
    const apiOrigin = process.env.API_URL ?? new URL(c.req.url).origin;

    try {
      const result = await useCases.register(input, {
        supabaseAuth,
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
      return c.json(
        { error: err instanceof Error ? err.message : "Signup failed" },
        500,
      );
    }
  });

  router.post("/login", async (c) => {
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

    const webOrigin = resolveWebOrigin([c.req.header("Origin")], corsConfig);

    const cookieOptions = getCookieOptions(
      cookieConfig,
      webOrigin.startsWith("https://"),
    );
    const refreshTokenOptions = {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    };

    try {
      const result = await useCases.login(input, loginContext);

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
      }

      return c.json({ ok: true });
    } catch (err) {
      return c.json(
        { error: err instanceof Error ? err.message : "Login failed" },
        500,
      );
    }
  });

  router.post("/refresh", async (c) => {
    const webOrigin = resolveWebOrigin([c.req.header("Origin")], corsConfig);

    const cookieOptions = getCookieOptions(
      cookieConfig,
      webOrigin.startsWith("https://"),
    );
    const refreshTokenOptions = {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    };

    const accessTokenCookieName = getCookieName(cookieConfig, "access-token");
    const refreshTokenCookieName = getCookieName(cookieConfig, "refresh-token");

    const refreshToken = getCookie(c, refreshTokenCookieName);
    if (!refreshToken) {
      return c.json({ error: "Missing refresh token" }, 401);
    }

    try {
      const result = await useCases.refresh({ refreshToken }, { supabaseAuth });

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
      }

      return c.json({ ok: true });
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
    const webOrigin = resolveWebOrigin([c.req.header("Origin")], corsConfig);

    const cookieOptions = getCookieOptions(
      cookieConfig,
      webOrigin.startsWith("https://"),
    );
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

    const cookieOptions = getCookieOptions(
      cookieConfig,
      webOrigin.startsWith("https://"),
    );
    const codeVerifierCookieName = getCookieName(cookieConfig, "code-verifier");

    const codeVerifier = getCookie(c, codeVerifierCookieName);
    if (!codeVerifier) {
      return c.redirect(`${webOrigin}?error=invalid_state`);
    }

    deleteCookie(c, codeVerifierCookieName, cookieOptions);

    try {
      const result = await useCases.callback(
        { code, codeVerifier, next: nextParam ?? undefined },
        { supabaseAuth },
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
