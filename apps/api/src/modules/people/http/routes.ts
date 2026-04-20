import {
  ErrorCodeFallbacks,
  ErrorCodeToKey,
  type ErrorCodeValue,
} from "@repo/validators/error-codes";
import { Hono, type MiddlewareHandler } from "hono";
import type { RouteEnv } from "../../../http/context";
import { ErrorCode } from "../../../http/utils/error-i18n";
import { getT } from "../../../http/utils/i18n";
import { parseJsonBody } from "../../../http/utils/parse-json";
import { ConflictError, ValidationError } from "../../../shared/domain/errors";
import type {
  PeopleRepositoryPort,
  UserLanguagesRepositoryPort,
} from "../application/ports";
import { cancelRequest } from "../application/use-cases/cancel-request";
import { connect } from "../application/use-cases/connect";
import { discoverPeople } from "../application/use-cases/discover-people";
import { getPartners } from "../application/use-cases/get-partners";
import { getPerson } from "../application/use-cases/get-person";
import { getRequests } from "../application/use-cases/get-requests";
import { respondToRequest } from "../application/use-cases/respond-to-request";
import { updateLanguages } from "../application/use-cases/update-languages";
import type { LanguageEntry, UserLanguage } from "../domain/types";

function makeErrorResponse(
  t: (key: string) => string,
  code: ErrorCodeValue,
): { error: string; code: ErrorCodeValue } {
  const errorKey = ErrorCodeToKey[code];
  const translated = t(errorKey);
  return {
    error: translated === errorKey ? ErrorCodeFallbacks[code] : translated,
    code,
  };
}

function splitLanguages(langs: UserLanguage[]): {
  speaks: LanguageEntry[];
  learning: LanguageEntry[];
} {
  const speaks: LanguageEntry[] = [];
  const learning: LanguageEntry[] = [];
  for (const l of langs) {
    const entry = { languageCode: l.languageCode, level: l.level };
    if (l.kind === "speaks") speaks.push(entry);
    else if (l.kind === "learning") learning.push(entry);
  }
  return { speaks, learning };
}

interface PeopleRoutesContext {
  peopleRepo: PeopleRepositoryPort;
  languagesRepo: UserLanguagesRepositoryPort;
}

export function createPeopleRoutes(
  ctx: PeopleRoutesContext,
  jwtAuth: MiddlewareHandler<RouteEnv>,
) {
  const { peopleRepo, languagesRepo } = ctx;
  const router = new Hono<RouteEnv>();

  router.use("*", jwtAuth);

  // GET /people — Discover
  router.get("/", async (c) => {
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;

    const { PeopleDiscoverQuerySchema } =
      await import("@repo/validators/people");
    const query = PeopleDiscoverQuerySchema.safeParse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    );
    if (!query.success) {
      const t = getT(c);
      return c.json(
        {
          ...makeErrorResponse(t, ErrorCode.REQUEST_INVALID_REQUEST),
          issues: query.error.flatten(),
        },
        400,
      );
    }

    const result = await discoverPeople(
      { accessToken, userId, ...query.data },
      { peopleRepo },
    );

    return c.json(result);
  });

  // GET /people/requests
  router.get("/requests", async (c) => {
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;

    const dir = c.req.query("dir");
    if (dir !== "incoming" && dir !== "outgoing") {
      const t = getT(c);
      return c.json(
        makeErrorResponse(t, ErrorCode.REQUEST_INVALID_REQUEST),
        400,
      );
    }

    const cursor = c.req.query("cursor");
    const limitStr = c.req.query("limit");
    const limit = limitStr
      ? Math.min(Math.max(parseInt(limitStr, 10) || 24, 1), 50)
      : 24;

    const result = await getRequests(
      { accessToken, userId, direction: dir, cursor, limit },
      { peopleRepo },
    );

    return c.json(result);
  });

  // GET /people/partners
  router.get("/partners", async (c) => {
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;

    const items = await getPartners({ accessToken, userId }, { peopleRepo });
    return c.json({ items });
  });

  // GET /people/languages — current user's languages
  router.get("/languages", async (c) => {
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;

    const languages = await languagesRepo.getForUser({ accessToken, userId });
    return c.json(splitLanguages(languages));
  });

  // PUT /people/languages — replace current user's languages
  router.put("/languages", async (c) => {
    const t = getT(c);
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;

    const body = await parseJsonBody(c);
    if (!body.ok) {
      return c.json(makeErrorResponse(t, ErrorCode.REQUEST_INVALID_JSON), 400);
    }

    const { ProfileLanguagesUpsertSchema } =
      await import("@repo/validators/people");
    const parsed = ProfileLanguagesUpsertSchema.safeParse(body.value);
    if (!parsed.success) {
      return c.json(
        {
          ...makeErrorResponse(t, ErrorCode.REQUEST_INVALID_REQUEST),
          issues: parsed.error.flatten(),
        },
        400,
      );
    }

    const languages = await updateLanguages(
      {
        accessToken,
        userId,
        speaks: parsed.data.speaks,
        learning: parsed.data.learning,
      },
      { languagesRepo },
    );

    return c.json(splitLanguages(languages));
  });

  // POST /people/requests/:requestId/respond
  router.post("/requests/:requestId/respond", async (c) => {
    const t = getT(c);
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;
    const requestId = c.req.param("requestId");

    const reqBody = await parseJsonBody(c);
    if (!reqBody.ok) {
      return c.json(makeErrorResponse(t, ErrorCode.REQUEST_INVALID_JSON), 400);
    }

    const { RespondBodySchema } = await import("@repo/validators/people");
    const parsed = RespondBodySchema.safeParse(reqBody.value);
    if (!parsed.success) {
      return c.json(
        {
          ...makeErrorResponse(t, ErrorCode.REQUEST_INVALID_REQUEST),
          issues: parsed.error.flatten(),
        },
        400,
      );
    }

    await respondToRequest(
      { accessToken, requestId, userId, action: parsed.data.action },
      { peopleRepo },
    );

    return c.json({ ok: true });
  });

  // DELETE /people/requests/:requestId — cancel outgoing request
  router.delete("/requests/:requestId", async (c) => {
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;
    const requestId = c.req.param("requestId");

    await cancelRequest({ accessToken, requestId, userId }, { peopleRepo });
    return c.json({ ok: true });
  });

  // POST /people/:id/connect — send connection request
  router.post("/:id/connect", async (c) => {
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;
    const targetId = c.req.param("id");

    try {
      const result = await connect(
        { accessToken, requesterId: userId, targetId },
        { peopleRepo },
      );
      return c.json(result, 201);
    } catch (err) {
      if (err instanceof ValidationError) {
        const t = getT(c);
        return c.json(makeErrorResponse(t, ErrorCode.PEOPLE_SELF_CONNECT), 400);
      }
      if (err instanceof ConflictError) {
        const t = getT(c);
        return c.json(
          makeErrorResponse(t, ErrorCode.PEOPLE_ALREADY_EXISTS),
          409,
        );
      }
      throw err;
    }
  });

  // GET /people/:id — single person detail
  router.get("/:id", async (c) => {
    const payload = c.get("jwtPayload")!;
    const accessToken = c.get("accessToken")!;
    const userId = payload.sub as string;
    const targetId = c.req.param("id");

    const person = await getPerson(
      { accessToken, userId, targetId },
      { peopleRepo },
    );
    return c.json(person);
  });

  return router;
}
