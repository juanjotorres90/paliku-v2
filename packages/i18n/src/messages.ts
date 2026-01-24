import { IntlMessageFormat } from "intl-messageformat";
import type { Locale } from "./locales.js";

export type MessageValue = string | Messages | MessageValue[];

export interface Messages extends Record<string, MessageValue> {}

const messagesCache = new Map<Locale, Messages>();

const loaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import("./messages/en.json"),
  es: () => import("./messages/es.json"),
  ca: () => import("./messages/ca.json"),
  ru: () => import("./messages/ru.json"),
  de: () => import("./messages/de.json"),
  fr: () => import("./messages/fr.json"),
  it: () => import("./messages/it.json"),
  pt: () => import("./messages/pt.json"),
};

export async function loadMessages(locale: Locale): Promise<Messages> {
  if (messagesCache.has(locale)) {
    return messagesCache.get(locale)!;
  }

  const loader = loaders[locale];
  if (!loader) {
    throw new Error(`No loader found for locale: ${locale}`);
  }

  const messages = (await loader()).default;
  messagesCache.set(locale, messages);
  return messages;
}

export function getMessagesSync(locale: Locale): Messages | null {
  return messagesCache.get(locale) ?? null;
}

export function formatMessage(
  messages: Messages,
  key: string,
  values?: Record<string, unknown>,
): string {
  const message = getNestedValue(messages, key);

  if (typeof message !== "string") {
    return key;
  }

  if (!values || Object.keys(values).length === 0) {
    return message;
  }

  try {
    const mf = new IntlMessageFormat(message);
    return mf.format(values) as string;
  } catch {
    return message;
  }
}

function getNestedValue(obj: unknown, key: string): unknown {
  const parts = key.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

export function hasMessage(messages: Messages, key: string): boolean {
  return getNestedValue(messages, key) !== undefined;
}

export async function preloadMessages(locales: Locale[]): Promise<void> {
  await Promise.all(locales.map((locale) => loadMessages(locale)));
}
