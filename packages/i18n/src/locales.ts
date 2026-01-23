/**
 * Supported locales for the application.
 * en is the default locale and has no URL prefix.
 */
export const DEFAULT_LOCALE = "en" as const;

export const LOCALES = [
  "en",
  "es",
  "ca",
  "ru",
  "de",
  "fr",
  "it",
  "pt",
] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * Autonym language names - native names for each locale.
 * Used in UI language switchers.
 */
export const AUTONYMS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ca: "Català",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  pt: "Português",
};

/**
 * Check if a string is a valid locale.
 */
export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

/**
 * Check if a locale is the default (has no URL prefix).
 */
export function isDefaultLocale(locale: Locale): boolean {
  return locale === DEFAULT_LOCALE;
}
