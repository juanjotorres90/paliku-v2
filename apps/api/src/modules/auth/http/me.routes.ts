import { Hono, type MiddlewareHandler } from "hono";
import type { RouteEnv } from "../../../http/context";
import { getT } from "../../../http/utils/i18n";

export function createMeRoutes(jwtAuth: MiddlewareHandler<RouteEnv>) {
  const router = new Hono<RouteEnv>();

  router.use("*", jwtAuth);

  router.get("/", (c) => {
    const t = getT(c);
    const payload = c.get("jwtPayload");
    if (!payload?.sub) {
      return c.json(
        {
          error: t("api.errors.auth.token_invalid"),
          errorKey: "api.errors.auth.token_invalid",
        },
        401,
      );
    }

    return c.json({
      userId: payload.sub,
      aud: payload.aud,
      role: payload.role,
    });
  });

  return router;
}
