import { Hono } from "hono";
import { cors } from "hono/cors";
import type { RouteContext, RouteEnv } from "./context";
import { createAuthRoutes } from "./routes/auth";
import { createMeRoutes } from "./routes/me";
import { createProfileRoutes } from "./routes/profile";
import { createJwtAuth } from "./middleware/jwt-auth";

export function createHttpApp(ctx: RouteContext) {
  const { cors: corsConfig } = ctx.config;

  const app = new Hono<RouteEnv>();

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

  app.get("/", (c) => c.text("ok"));

  const jwtAuth = createJwtAuth(ctx.jwtVerifier, ctx.config.cookie);

  app.route("/auth", createAuthRoutes(ctx));
  app.route("/me", createMeRoutes(jwtAuth));
  app.route("/profile", createProfileRoutes(ctx, jwtAuth));

  return app;
}
