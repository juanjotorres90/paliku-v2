import { Hono, type MiddlewareHandler } from "hono";
import type { RouteEnv } from "../../../http/context";
import { parseJsonBody } from "../../../http/utils/parse-json";
import {
  mapErrorToStatus,
  formatError,
} from "../../../http/utils/error-mapper";
import type { AppConfig } from "../../../server/config";
import type { SettingsRepositoryPort } from "../application/ports";
import { getSettingsMe } from "../application/use-cases/get-settings-me";
import { updateSettingsMe } from "../application/use-cases/update-settings-me";

interface SettingsRoutesContext {
  config: AppConfig;
  settingsRepo: SettingsRepositoryPort;
}

export function createSettingsRoutes(
  ctx: SettingsRoutesContext,
  jwtAuth: MiddlewareHandler<RouteEnv>,
) {
  const { settingsRepo } = ctx;
  const router = new Hono<RouteEnv>();

  router.use("/me", jwtAuth);

  router.get("/me", async (c) => {
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;

    try {
      const result = await getSettingsMe(
        { accessToken, userId },
        { settingsRepo },
      );

      return c.json(result);
    } catch (err) {
      const status = mapErrorToStatus(err);
      const body = formatError(err);
      return c.json(body, status as 400 | 401 | 403 | 404 | 500);
    }
  });

  router.patch("/me", async (c) => {
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;

    const body = await parseJsonBody(c);
    if (!body.ok) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { SettingsUpdateSchema } = await import("@repo/validators/settings");
    const parsed = SettingsUpdateSchema.safeParse(body.value);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid request", issues: parsed.error.flatten() },
        400,
      );
    }

    try {
      const result = await updateSettingsMe(
        {
          accessToken,
          userId,
          data: {
            locale: parsed.data.locale,
            theme: parsed.data.theme,
          },
        },
        { settingsRepo },
      );

      return c.json(result);
    } catch (err) {
      const status = mapErrorToStatus(err);
      const body = formatError(err);
      return c.json(body, status as 400 | 401 | 403 | 404 | 500);
    }
  });

  return router;
}
