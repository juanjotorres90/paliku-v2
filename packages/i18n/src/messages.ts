import { IntlMessageFormat } from "intl-messageformat";
import type { Locale } from "./locales.js";

/**
 * Message value type - can be a string, a nested messages object, or an array (for rare cases).
 */
export type MessageValue = string | Messages | MessageValue[];

/**
 * Messages structure - nested object with string values at the leaves.
 * Example: { ui: { common: { loading: "Loading..." } } }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Messages extends Record<string, MessageValue> {}

/**
 * Cache for loaded messages.
 */
const messagesCache = new Map<Locale, Messages>();

/**
 * Load messages for a given locale.
 * Uses dynamic import for code-splitting.
 */
export async function loadMessages(locale: Locale): Promise<Messages> {
  if (messagesCache.has(locale)) {
    return messagesCache.get(locale)!;
  }

  // Import the messages file for the locale
  const messages = (await import(`./messages/${locale}.json`)) as {
    default: Messages;
  };

  messagesCache.set(locale, messages.default);
  return messages.default;
}

/**
 * Load messages synchronously.
 * This requires that messages have been loaded before.
 * Returns null if messages are not cached.
 */
export function getMessagesSync(locale: Locale): Messages | null {
  return messagesCache.get(locale) ?? null;
}

/**
 * Format a message with ICU syntax.
 * Handles pluralization, number formatting, etc.
 */
export function formatMessage(
  messages: Messages,
  key: string,
  values?: Record<string, unknown>,
): string {
  // Navigate the message structure by key (e.g., "ui.common.loading")
  const message = getNestedValue(messages, key);

  if (typeof message !== "string") {
    // Fallback: return the key if message is not a string
    return key;
  }

  if (!values || Object.keys(values).length === 0) {
    return message;
  }

  try {
    const mf = new IntlMessageFormat(message);
    return mf.format(values) as string;
  } catch {
    // Fallback to message if formatting fails
    return message;
  }
}

/**
 * Get a nested value from an object using dot notation.
 */
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

/**
 * Check if a message key exists in the messages.
 */
export function hasMessage(messages: Messages, key: string): boolean {
  return getNestedValue(messages, key) !== undefined;
}

/**
 * Preload messages for multiple locales.
 * Useful for warming up the cache.
 */
export async function preloadMessages(locales: Locale[]): Promise<void> {
  await Promise.all(locales.map((locale) => loadMessages(locale)));
}
