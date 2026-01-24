import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import enMessages from "../../packages/i18n/src/messages/en.json";

type Messages = Record<string, unknown>;

function getNestedValue(obj: Messages, key: string): unknown {
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

function formatMessage(
  value: unknown,
  values?: Record<string, unknown>,
): string {
  if (typeof value !== "string") return String(value ?? "");
  if (!values || Object.keys(values).length === 0) return value;
  return value.replace(/\{(\w+)\}/g, (_, key) => {
    const replacement = values[key];
    return replacement == null ? `{${key}}` : String(replacement);
  });
}

const translatorCache = new Map<string, ReturnType<typeof createTranslator>>();

function createTranslator(namespace?: string) {
  return (key: string, values?: Record<string, unknown>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const value = getNestedValue(enMessages as Messages, fullKey);
    if (value === undefined) return key;
    return formatMessage(value, values);
  };
}

function getTranslator(namespace?: string) {
  const cacheKey = namespace ?? "__root__";
  const cached = translatorCache.get(cacheKey);
  if (cached) return cached;
  const translator = createTranslator(namespace);
  translatorCache.set(cacheKey, translator);
  return translator;
}

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => getTranslator(namespace),
  useLocale: () => "en",
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace?: string) => getTranslator(namespace),
  getLocale: async () => "en",
  getMessages: async () => enMessages,
}));

const defaultRouter = {
  replace: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
};
const defaultSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => defaultRouter,
  useSearchParams: () => defaultSearchParams,
  usePathname: () => "/",
  useParams: () => ({}),
}));

// Mock matchMedia for next-themes and other components that use it
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
