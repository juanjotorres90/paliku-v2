import { Hono, type MiddlewareHandler } from "hono";
import type { RouteContext, RouteEnv } from "../context";
import { parseJsonBody } from "../utils/parse-json";

export function createProfileRoutes(
  ctx: RouteContext,
  jwtAuth: MiddlewareHandler<RouteEnv>,
) {
  const { config, useCases, supabaseAuth, httpClient, storageClient } = ctx;
  const router = new Hono<RouteEnv>();

  router.use("/me", jwtAuth);

  router.get("/me", async (c) => {
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

  router.post("/me", async (c) => {
    const payload = c.get("jwtPayload");
    const accessToken = c.get("accessToken");

    if (!payload?.sub || !accessToken) {
      return c.json({ error: "Invalid token" }, 401);
    }

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

  router.use("/avatar", jwtAuth);

  router.post("/avatar", async (c) => {
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

  return router;
}
