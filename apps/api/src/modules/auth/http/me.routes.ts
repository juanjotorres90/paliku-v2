import { Hono, type MiddlewareHandler } from "hono";
import type { RouteEnv } from "../../../http/context";
import { getT } from "../../../http/utils/i18n";
import {
  ErrorCode,
  ErrorCodeToKey,
  ErrorCodeFallbacks,
} from "@repo/validators/error-codes";

export function createMeRoutes(jwtAuth: MiddlewareHandler<RouteEnv>) {
  const router = new Hono<RouteEnv>();

  router.use("*", jwtAuth);

  router.get("/", (c) => {
    const t = getT(c);
    const payload = c.get("jwtPayload");
    if (!payload?.sub) {
      const code = ErrorCode.AUTH_TOKEN_INVALID;
      const errorKey = ErrorCodeToKey[code];
      const translated = t(errorKey);
      return c.json(
        {
          error:
            translated === errorKey ? ErrorCodeFallbacks[code] : translated,
          code,
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
