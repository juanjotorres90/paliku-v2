import { Hono } from "hono";
import type { RouteEnv } from "../../../http/context";
import { parseJsonBody } from "../../../http/utils/parse-json";
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
    const body = await parseJsonBody(c);
    if (!body.ok) {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const value = body.value;
    if (
      typeof value !== "object" ||
      value === null ||
      !("locale" in value) ||
      typeof value.locale !== "string"
    ) {
      return c.json({ error: "locale is required" }, 400);
    }

    const locale = value.locale as string;

    // Validate locale against supported locales
    if (!isLocale(locale)) {
      return c.json(
        {
          error: `Invalid locale. Supported locales: ${LOCALES.join(", ")}`,
        },
        400,
      );
    }

    // Set the locale cookie
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
