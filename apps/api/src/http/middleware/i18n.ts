import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { CookieConfig } from "../../server/config";
import {
  DEFAULT_LOCALE,
  isLocale,
  loadMessages,
  formatMessage,
  type Locale,
} from "@repo/i18n";
import type { RouteEnv } from "../context";
import { getCookieName } from "../../modules/auth/http/cookies";

function parseAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  for (const part of header.split(",")) {
    const [tag] = part.trim().split(";");
    if (!tag) continue;

    const baseTag = tag.split("-")[0];
    if (baseTag && isLocale(baseTag)) return baseTag;
    if (isLocale(tag)) return tag;
  }

  return DEFAULT_LOCALE;
}

export function createI18nMiddleware(cookieConfig: CookieConfig) {
  return createMiddleware<RouteEnv>(async (c, next) => {
    let locale: Locale = DEFAULT_LOCALE;
    let t: (key: string, values?: Record<string, unknown>) => string = (key) =>
      key;

    const queryLocale = c.req.query("locale");
    if (queryLocale && isLocale(queryLocale)) {
      locale = queryLocale;
    } else {
      const localeCookie = getCookie(c, getCookieName(cookieConfig, "locale"));
      if (localeCookie && isLocale(localeCookie)) {
        locale = localeCookie;
      } else {
        locale = parseAcceptLanguage(c.req.header("Accept-Language"));
      }
    }

    // Set a safe default before any async work, then override if messages load.
    c.set("locale", locale);
    c.set("t", t);

    try {
      const messages = await loadMessages(locale);
      t = (key: string, values?: Record<string, unknown>): string =>
        formatMessage(messages, key, values);
      c.set("t", t);
    } catch {
      // Keep fallback translator if messages fail to load.
    }

    await next();

    c.header("Content-Language", locale);
    const vary = new Set<string>();
    const existingVary = c.res.headers.get("Vary");
    if (existingVary) {
      existingVary.split(",").forEach((v) => vary.add(v.trim()));
    }
    vary.add("Accept-Language");
    c.header("Vary", Array.from(vary).join(", "));
  });
}
