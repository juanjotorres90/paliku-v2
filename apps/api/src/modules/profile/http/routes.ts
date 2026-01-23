import { Hono, type MiddlewareHandler } from "hono";
import type { RouteEnv } from "../../../http/context";
import { parseJsonBody } from "../../../http/utils/parse-json";
import {
  mapErrorToStatus,
  formatError,
} from "../../../http/utils/error-mapper";
import type { AppConfig } from "../../../server/config";
import type {
  AvatarFile,
  AvatarStoragePort,
  ProfileRepositoryPort,
  UserEmailPort,
} from "../application/ports";
import { getProfileMe } from "../application/use-cases/get-profile-me";
import { updateProfileMe } from "../application/use-cases/update-profile-me";
import { uploadAvatar } from "../application/use-cases/upload-avatar";

interface ProfileRoutesContext {
  config: AppConfig;
  profileRepo: ProfileRepositoryPort;
  storage: AvatarStoragePort;
  userEmail: UserEmailPort;
}

export function createProfileRoutes(
  ctx: ProfileRoutesContext,
  jwtAuth: MiddlewareHandler<RouteEnv>,
) {
  const { profileRepo, storage, userEmail } = ctx;
  const router = new Hono<RouteEnv>();

  router.use("/me", jwtAuth);

  router.get("/me", async (c) => {
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;

    try {
      const result = await getProfileMe(
        { accessToken, userId },
        { profileRepo, userEmail },
      );

      return c.json(result);
    } catch (err) {
      const status = mapErrorToStatus(err);
      const body = formatError(err);
      return c.json(body, status as 400 | 401 | 403 | 404 | 409 | 413 | 500);
    }
  });

  router.post("/me", async (c) => {
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
      const profileResult = await updateProfileMe(
        {
          accessToken,
          userId,
          data: {
            displayName: parsed.data.displayName,
            bio: parsed.data.bio,
            location: parsed.data.location,
            intents: parsed.data.intents,
            isPublic: parsed.data.isPublic,
            ...(parsed.data.avatarUrl !== undefined
              ? { avatarUrl: parsed.data.avatarUrl }
              : {}),
          },
        },
        { profileRepo, userEmail },
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

    const bytes = Buffer.from(await file.arrayBuffer());

    const avatarFile: AvatarFile = {
      bytes,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      originalName: file.name,
    };

    try {
      const profileResult = await uploadAvatar(
        { accessToken, userId, file: avatarFile },
        { profileRepo, storage, userEmail },
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
