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
  // Use a function to dynamically determine the origin
  // This allows both web (with specific origins) and mobile (without Origin header)
  app.use(
    "*",
    cors({
      origin: (origin) => {
        // Mobile apps typically don't send an Origin header.
        // For non-browser clients, CORS headers are irrelevant; return undefined
        // so the middleware doesn't emit an ACAO header.
        if (!origin) {
          return undefined;
        }
        // Check if the origin is in the allowed list
        if (corsConfig.allowedOrigins.includes(origin)) {
          return origin;
        }
        // In development, allow any localhost origin
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
