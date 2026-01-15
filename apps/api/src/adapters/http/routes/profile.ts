import { Hono, type MiddlewareHandler } from "hono";
import type { RouteContext, RouteEnv } from "../context";
import { parseJsonBody } from "../utils/parse-json";
import { mapErrorToStatus, formatError } from "../utils/error-mapper";

export function createProfileRoutes(
  ctx: RouteContext,
  jwtAuth: MiddlewareHandler<RouteEnv>,
) {
  const { config, useCases, supabaseAuth, httpClient, storageClient } = ctx;
  const router = new Hono<RouteEnv>();

  router.use("/me", jwtAuth);

  router.get("/me", async (c) => {
    // jwtAuth middleware guarantees these are set and payload.sub exists
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;

    try {
      const result = await useCases.getProfileMe(
        { accessToken, userId },
        {
          supabaseAuth,
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey,
          httpClient,
        },
      );

      return c.json(result);
    } catch (err) {
      const status = mapErrorToStatus(err);
      const body = formatError(err);
      return c.json(body, status as 400 | 401 | 403 | 404 | 409 | 413 | 500);
    }
  });

  router.post("/me", async (c) => {
    // jwtAuth middleware guarantees these are set and payload.sub exists
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;

    const body = await parseJsonBody(c);
    if (!body.ok) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const { ProfileUpsertSchema } = await import("@repo/validators/profile");
    const parsed = ProfileUpsertSchema.safeParse(body.value);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid request", issues: parsed.error.flatten() },
        400,
      );
    }

    try {
      const profileResult = await useCases.updateProfileMe(
        { accessToken, userId, data: parsed.data },
        {
          supabaseAuth,
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey,
          httpClient,
        },
      );

      return c.json(profileResult);
    } catch (err) {
      const status = mapErrorToStatus(err);
      const body = formatError(err);
      return c.json(body, status as 400 | 401 | 403 | 404 | 409 | 413 | 500);
    }
  });

  router.use("/avatar", jwtAuth);

  router.post("/avatar", async (c) => {
    // jwtAuth middleware guarantees these are set and payload.sub exists
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;

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
        { accessToken, userId, file },
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
      const status = mapErrorToStatus(err);
      const body = formatError(err);
      return c.json(body, status as 400 | 401 | 403 | 404 | 409 | 413 | 500);
    }
  });

  return router;
}
