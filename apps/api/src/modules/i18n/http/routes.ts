import { Hono } from "hono";
import type { RouteEnv } from "../../../http/context";
import { parseJsonBody } from "../../../http/utils/parse-json";
import { getT } from "../../../http/utils/i18n";
import { isLocale, LOCALES, AUTONYMS, type Locale } from "@repo/i18n";
import { setLocaleCookie } from "../../settings/http/locale-cookie";
import type { AppConfig } from "../../../server/config";

interface I18nRoutesContext {
  config: AppConfig;
}

export function createI18nRoutes(ctx: I18nRoutesContext) {
  const { config } = ctx;
  const router = new Hono<RouteEnv>();

  /**
   * POST /i18n/locale
   *
   * Set the locale preference for guest users.
   * This endpoint does not require authentication.
   *
   * Request body:
   * - locale: string - One of the supported locales (en, es, ca, ru, de, fr, it, pt)
   *
   * Response:
   * - 200: { ok: true, locale: string }
   * - 400: { error: string }
   */
  router.post("/locale", async (c) => {
    const t = getT(c);
    const body = await parseJsonBody(c);
    if (!body.ok) {
      return c.json(
        {
          error: t("api.errors.request.invalid_json"),
          errorKey: "api.errors.request.invalid_json",
        },
        400,
      );
    }

    const value = body.value;
    if (
      typeof value !== "object" ||
      value === null ||
      !("locale" in value) ||
      typeof value.locale !== "string"
    ) {
      return c.json(
        {
          error: t("api.errors.request.invalid_request"),
          errorKey: "api.errors.request.invalid_request",
        },
        400,
      );
    }

    const locale = value.locale as string;

    if (!isLocale(locale)) {
      return c.json(
        {
          error: `Invalid locale. Supported locales: ${LOCALES.join(", ")}`,
        },
        400,
      );
    }

    setLocaleCookie(c, config.cookie, locale);

    return c.json({ ok: true, locale });
  });

  /**
   * GET /i18n/locales
   *
   * Get the list of supported locales with their autonyms (native names).
   * This endpoint does not require authentication.
   *
   * Response:
   * - 200: { locales: Array<{ code: string, name: string }> }
   */
  router.get("/locales", (c) => {
    const locales = LOCALES.map((code) => ({
      code,
      name: AUTONYMS[code as Locale],
    }));

    return c.json({ locales });
  });

  return router;
}
