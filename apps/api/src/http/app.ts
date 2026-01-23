import { Hono } from "hono";
import { cors } from "hono/cors";
import type { RouteEnv } from "./context";
import type { AppConfig } from "../server/config";
import { createAuthRoutes } from "../modules/auth/http/routes";
import { createMeRoutes } from "../modules/auth/http/me.routes";
import { createProfileRoutes } from "../modules/profile/http/routes";
import { createJwtAuth } from "../modules/auth/http/middleware/jwt-auth";
import { createSettingsRoutes } from "../modules/settings/http/routes";
import type {
  AuthProviderPort,
  JWTVerifierPort,
} from "../modules/auth/application/ports";
import type { PKCEHelpers } from "../modules/auth/domain/pkce";
import type {
  AvatarStoragePort,
  ProfileRepositoryPort,
  UserEmailPort,
} from "../modules/profile/application/ports";
import type { SettingsRepositoryPort } from "../modules/settings/application/ports";

interface HttpAppContext {
  config: AppConfig;
  authProvider: AuthProviderPort;
  jwtVerifier: JWTVerifierPort;
  pkceHelpers: PKCEHelpers;
  profileRepo: ProfileRepositoryPort;
  avatarStorage: AvatarStoragePort;
  userEmail: UserEmailPort;
  settingsRepo: SettingsRepositoryPort;
}

export function createHttpApp(ctx: HttpAppContext) {
  const { cors: corsConfig } = ctx.config;

  const app = new Hono<RouteEnv>();

  app.use("*", async (c, next) => {
    const start = Date.now();
    const requestId =
      c.req.header("x-request-id") ??
      `req_${start.toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    let error: unknown;

    try {
      await next();
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const durationMs = Date.now() - start;
      const status = c.res?.status ?? (error ? 500 : 200);
      const userId = c.get("jwtPayload")?.sub;
      const base = {
        message: error ? "request.failed" : "request.completed",
        requestId,
        method: c.req.method,
        path: c.req.path,
        status,
        durationMs,
        userId,
      };

      if (error instanceof Error) {
        console.error({ ...base, error: error.message });
      } else if (error) {
        console.error({ ...base, error: "unknown_error" });
      } else {
        console.info(base);
      }
    }
  });

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) {
          return undefined;
        }
        if (corsConfig.allowedOrigins.includes(origin)) {
          return origin;
        }
        if (
          process.env.NODE_ENV !== "production" &&
          (origin.startsWith("http://localhost:") ||
            origin.startsWith("http://127.0.0.1:") ||
            origin.startsWith("https://localhost:") ||
            origin.startsWith("https://127.0.0.1:"))
        ) {
          return origin;
        }
        return undefined;
      },
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
      credentials: true,
    }),
  );

  app.get("/", (c) => c.text("ok"));

  const jwtAuth = createJwtAuth(ctx.jwtVerifier, ctx.config.cookie);

  app.route(
    "/auth",
    createAuthRoutes({
      config: ctx.config,
      authProvider: ctx.authProvider,
      pkceHelpers: ctx.pkceHelpers,
    }),
  );

  app.route("/me", createMeRoutes(jwtAuth));

  app.route(
    "/profile",
    createProfileRoutes(
      {
        config: ctx.config,
        profileRepo: ctx.profileRepo,
        storage: ctx.avatarStorage,
        userEmail: ctx.userEmail,
      },
      jwtAuth,
    ),
  );

  app.route(
    "/settings",
    createSettingsRoutes(
      {
        config: ctx.config,
        settingsRepo: ctx.settingsRepo,
      },
      jwtAuth,
    ),
  );

  return app;
}
