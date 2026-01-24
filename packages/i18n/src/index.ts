// Locale constants and types
export * from "./locales";

// Message loading and formatting
export * from "./messages";

// Re-export commonly used items for convenience
export {
  loadMessages,
  formatMessage,
  getMessagesSync,
  hasMessage,
  preloadMessages,
} from "./messages";
export {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  isDefaultLocale,
  type Locale,
  AUTONYMS,
} from "./locales";

// Message types
export type { Messages, MessageValue } from "./messages";
