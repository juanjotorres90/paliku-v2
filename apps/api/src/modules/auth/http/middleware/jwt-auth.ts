import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { CookieConfig } from "../../../../server/config";
import type { JWTVerifierPort } from "../../application/ports";
import type { RouteEnv } from "../../../../http/context";
import { getCookieName } from "../cookies";

export function createJwtAuth(
  jwtVerifier: JWTVerifierPort,
  cookieConfig: CookieConfig,
) {
  return createMiddleware<RouteEnv>(async (c, next) => {
    if (c.req.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    const authHeader = c.req.header("Authorization");
    const headerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : "";
    const cookieToken =
      getCookie(c, getCookieName(cookieConfig, "access-token")) ?? "";
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
}
