import { Hono } from "hono";
import { cors } from "hono/cors";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { JWTVerifierPort } from "../application/ports";
import type { AppConfig } from "../domain/config";
import * as useCases from "../application/index";
import type { RegisterInput, LoginInput } from "../application/index";

export interface RouteContext {
  config: AppConfig;
  jwtVerifier: JWTVerifierPort;
  useCases: typeof useCases;
  pkceHelpers: ReturnType<(typeof import("./crypto"))["createPKCEHelpers"]>;
  supabaseAuth: ReturnType<
    (typeof import("./supabase-auth"))["createSupabaseAuthAdapter"]
  >;
  httpClient: ReturnType<
    (typeof import("./http-client"))["createFetchHttpClient"]
  >;
  storageClient: ReturnType<
    (typeof import("./storage-client"))["createStorageClient"]
  >;
}

export function createRoutes(ctx: RouteContext) {
  const {
    config,
    jwtVerifier,
    useCases,
    pkceHelpers,
    supabaseAuth,
    httpClient,
    storageClient,
  } = ctx;
  const { cors: corsConfig, cookie: cookieConfig } = config;

  const app = new Hono<{
    Variables: {
      jwtPayload?: { sub?: string; aud?: string; role?: string };
      accessToken?: string;
    };
  }>();

  // CORS must be applied first, before any routes
  app.use(
    "*",
    cors({
      origin: corsConfig.allowedOrigins,
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      credentials: true,
    }),
  );

  const loginContext = {
    supabaseAuth,
  };

  const jwtAuth = createMiddleware(async (c, next) => {
    if (c.req.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    const authHeader = c.req.header("Authorization");
    const headerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : "";
    const cookieToken = getCookie(c, getCookieName("access-token")) ?? "";
    const token = headerToken || cookieToken;

    if (!token) {
      return c.json({ error: "Missing authentication token" }, 401);
    }

    try {
      const payload = await jwtVerifier.verify(token);
      if (!payload.sub) {
        return c.json({ error: "Invalid token" }, 401);
      }
      c.set("jwtPayload", payload);
      c.set("accessToken", token);
      await next();
    } catch {
      return c.json({ error: "Invalid token" }, 401);
    }
  });

  function getCookieName(suffix: string): string {
    return `sb-${cookieConfig.projectRef}-${suffix}`;
  }

  function getCookieOptions(secure: boolean) {
    return {
      domain: cookieConfig.domain,
      maxAge: 60 * 60 * 24 * 7,
      path: "/" as const,
      sameSite: "lax" as const,
      secure,
      httpOnly: true,
    };
  }

  app.get("/", (c) => c.text("ok"));

  app.post("/auth/register", async (c) => {
    let json: unknown;
    try {
      json = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { RegisterRequestSchema } = await import("@repo/validators/auth");
    const parsed = RegisterRequestSchema.safeParse(json);
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

    const requestOrigin = c.req.header("Origin");
    const webOrigin =
      requestOrigin && corsConfig.allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : (corsConfig.allowedOrigins[0] ?? "http://localhost:3000");

    const cookieOptions = getCookieOptions(webOrigin.startsWith("https://"));

    const codeVerifierCookieName = getCookieName("code-verifier");
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

  app.post("/auth/login", async (c) => {
    let json: unknown;
    try {
      json = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { LoginRequestSchema } = await import("@repo/validators/auth");
    const parsed = LoginRequestSchema.safeParse(json);
    if (!parsed.success) {
      return c.json({ error: "Invalid request" }, 400);
    }

    const input: LoginInput = {
      email: parsed.data.email,
      password: parsed.data.password,
    };

    const requestOrigin = c.req.header("Origin");
    const webOrigin =
      requestOrigin && corsConfig.allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : (corsConfig.allowedOrigins[0] ?? "http://localhost:3000");

    const cookieOptions = getCookieOptions(webOrigin.startsWith("https://"));
    const refreshTokenOptions = {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    };

    try {
      const result = await useCases.login(input, loginContext);

      const accessTokenCookieName = getCookieName("access-token");
      const refreshTokenCookieName = getCookieName("refresh-token");

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

  app.post("/auth/signout", async (c) => {
    const requestOrigin = c.req.header("Origin");
    const webOrigin =
      requestOrigin && corsConfig.allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : (corsConfig.allowedOrigins[0] ?? "http://localhost:3000");

    const cookieOptions = getCookieOptions(webOrigin.startsWith("https://"));
    const accessTokenCookieName = getCookieName("access-token");
    const refreshTokenCookieName = getCookieName("refresh-token");

    deleteCookie(c, accessTokenCookieName, cookieOptions);
    deleteCookie(c, refreshTokenCookieName, cookieOptions);

    return c.json({ ok: true });
  });

  app.get("/auth/callback", async (c) => {
    const { searchParams } = new URL(c.req.url);
    const code = searchParams.get("code");
    const nextParam = searchParams.get("next");

    if (!code) {
      return c.text("Missing code", 400);
    }

    const requestOrigin = c.req.header("Origin") ?? c.req.header("Referer");
    const webOrigin =
      requestOrigin && corsConfig.allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : (corsConfig.allowedOrigins[0] ?? "http://localhost:3000");

    const cookieOptions = getCookieOptions(webOrigin.startsWith("https://"));
    const codeVerifierCookieName = getCookieName("code-verifier");

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
      const accessTokenCookieName = getCookieName("access-token");
      const refreshTokenCookieName = getCookieName("refresh-token");

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

  app.use("/me", jwtAuth);

  app.get("/me", (c) => {
    const payload = c.get("jwtPayload");
    if (!payload?.sub) {
      return c.json({ error: "Invalid token" }, 401);
    }

    return c.json({
      userId: payload.sub,
      aud: payload.aud,
      role: payload.role,
    });
  });

  app.use("/profile/me", jwtAuth);

  app.get("/profile/me", async (c) => {
    const payload = c.get("jwtPayload");
    const accessToken = c.get("accessToken");

    if (!payload?.sub || !accessToken) {
      return c.json({ error: "Invalid token" }, 401);
    }

    try {
      const result = await useCases.getProfileMe(
        { accessToken, userId: payload.sub },
        {
          supabaseAuth,
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey,
          httpClient,
        },
      );

      return c.json(result);
    } catch (err) {
      return c.json(
        {
          error: err instanceof Error ? err.message : "Failed to fetch profile",
        },
        500,
      );
    }
  });

  app.post("/profile/me", async (c) => {
    const payload = c.get("jwtPayload");
    const accessToken = c.get("accessToken");

    if (!payload?.sub || !accessToken) {
      return c.json({ error: "Invalid token" }, 401);
    }

    let json: unknown;
    try {
      json = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { ProfileUpsertSchema } = await import("@repo/validators/profile");
    const parsed = ProfileUpsertSchema.safeParse(json);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid request", issues: parsed.error.flatten() },
        400,
      );
    }

    try {
      const profileResult = await useCases.updateProfileMe(
        { accessToken, userId: payload.sub, data: parsed.data },
        {
          supabaseAuth,
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey,
          httpClient,
        },
      );

      return c.json(profileResult);
    } catch (err) {
      return c.json(
        {
          error:
            err instanceof Error ? err.message : "Failed to update profile",
        },
        500,
      );
    }
  });

  app.use("/profile/avatar", jwtAuth);

  app.post("/profile/avatar", async (c) => {
    const payload = c.get("jwtPayload");
    const accessToken = c.get("accessToken");

    if (!payload?.sub || !accessToken) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    if (!(file instanceof File)) {
      return c.json({ error: "Invalid file" }, 400);
    }

    try {
      const profileResult = await useCases.uploadAvatar(
        { accessToken, userId: payload.sub, file },
        {
          supabaseAuth,
          storageClient,
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey,
          httpClient,
        },
      );

      return c.json(profileResult);
    } catch (err) {
      return c.json(
        {
          error: err instanceof Error ? err.message : "Failed to upload avatar",
        },
        500,
      );
    }
  });

  return app;
}
