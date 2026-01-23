// Locale constants and types
export * from "./locales.js";

// Message loading and formatting
export * from "./messages.js";

// Re-export commonly used items for convenience
export {
  loadMessages,
  formatMessage,
  getMessagesSync,
  hasMessage,
  preloadMessages,
} from "./messages.js";
export {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  isDefaultLocale,
  type Locale,
  AUTONYMS,
} from "./locales.js";

// Message types
export type { Messages, MessageValue } from "./messages.js";
