import { Hono, type MiddlewareHandler } from "hono";
import type { RouteEnv } from "../context";

export function createMeRoutes(jwtAuth: MiddlewareHandler<RouteEnv>) {
  const router = new Hono<RouteEnv>();

  router.use("*", jwtAuth);

  router.get("/", (c) => {
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

  return router;
}
