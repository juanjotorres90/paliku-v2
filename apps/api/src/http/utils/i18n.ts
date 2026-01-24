import type { Context } from "hono";
import { DEFAULT_LOCALE, type Locale } from "@repo/i18n";

type Translator = (key: string, values?: Record<string, unknown>) => string;

export function getLocale(c: Context): Locale {
  return (c.get("locale") as Locale | undefined) ?? DEFAULT_LOCALE;
}

export function getT(c: Context): Translator {
  return (c.get("t") as Translator | undefined) ?? ((key) => key);
}
