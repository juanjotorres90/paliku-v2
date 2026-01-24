import { describe, it, expect, vi } from "vitest";
import { setLocaleCookie, getLocaleCookieName } from "./locale-cookie";
import type { CookieConfig } from "../../../server/config";
import { DEFAULT_LOCALE } from "@repo/i18n";

describe("locale-cookie", () => {
  const mockConfig: CookieConfig = {
    domain: "localhost",
    projectRef: "test-project",
  };

  describe("setLocaleCookie", () => {
    it("should set valid locale cookie on secure request", () => {
      const context = {
        req: {
          url: "https://localhost:3000",
          header: vi.fn((name: string) => {
            if (name === "x-forwarded-proto") return undefined;
            return undefined;
          }),
        },
        header: vi.fn((name: string, value: string) => {
          if (name === "Set-Cookie") {
            expect(value).toContain("locale=en");
          }
          return context;
        }),
        set: vi.fn(),
      } as any;

      setLocaleCookie(context, mockConfig, "en");

      expect(getLocaleCookieName(mockConfig)).toBe("sb-test-project-locale");
    });

    it("should set valid locale cookie on non-secure request", () => {
      const context = {
        req: {
          url: "http://localhost:3000",
          header: vi.fn(() => undefined),
        },
        header: vi.fn((name: string, value: string) => {
          if (name === "Set-Cookie") {
            expect(value).toContain("locale=en");
          }
          return context;
        }),
        set: vi.fn(),
      } as any;

      setLocaleCookie(context, mockConfig, "en");

      expect(getLocaleCookieName(mockConfig)).toBe("sb-test-project-locale");
    });

    it("should set valid locale cookie on secure forwarded request", () => {
      const context = {
        req: {
          url: "http://localhost:3000",
          header: vi.fn((name: string) => {
            if (name === "x-forwarded-proto") return "https";
            return undefined;
          }),
        },
        header: vi.fn((name: string, value: string) => {
          if (name === "Set-Cookie") {
            expect(value).toContain("locale=es");
            expect(value).toContain("Secure");
          }
          return context;
        }),
        set: vi.fn(),
      } as any;

      setLocaleCookie(context, mockConfig, "es");

      expect(getLocaleCookieName(mockConfig)).toBe("sb-test-project-locale");
    });

    it("should set valid locale cookie on non-secure forwarded request", () => {
      const context = {
        req: {
          url: "http://localhost:3000",
          header: vi.fn((name: string) => {
            if (name === "x-forwarded-proto") return "http";
            return undefined;
          }),
        },
        header: vi.fn((name: string, value: string) => {
          if (name === "Set-Cookie") {
            expect(value).toContain("locale=ca");
          }
          return context;
        }),
        set: vi.fn(),
      } as any;

      setLocaleCookie(context, mockConfig, "ca");

      expect(getLocaleCookieName(mockConfig)).toBe("sb-test-project-locale");
    });

    it("should set valid locale cookie with multiple forwarded protocols", () => {
      const context = {
        req: {
          url: "http://localhost:3000",
          header: vi.fn((name: string) => {
            if (name === "x-forwarded-proto") return "https, http";
            return undefined;
          }),
        },
        header: vi.fn((name: string, value: string) => {
          if (name === "Set-Cookie") {
            expect(value).toContain("locale=de");
            expect(value).toContain("Secure");
          }
          return context;
        }),
        set: vi.fn(),
      } as any;

      setLocaleCookie(context, mockConfig, "de");

      expect(getLocaleCookieName(mockConfig)).toBe("sb-test-project-locale");
    });

    it("should fall back to default locale for invalid locale", () => {
      const context = {
        req: {
          url: "http://localhost:3000",
          header: vi.fn(() => undefined),
        },
        header: vi.fn((name: string, value: string) => {
          if (name === "Set-Cookie") {
            expect(value).toContain(`locale=${DEFAULT_LOCALE}`);
          }
          return context;
        }),
        set: vi.fn(),
      } as any;

      setLocaleCookie(context, mockConfig, "invalid-locale");

      expect(getLocaleCookieName(mockConfig)).toBe("sb-test-project-locale");
    });

    it("should fall back to default locale for empty string", () => {
      const context = {
        req: {
          url: "http://localhost:3000",
          header: vi.fn(() => undefined),
        },
        header: vi.fn((name: string, value: string) => {
          if (name === "Set-Cookie") {
            expect(value).toContain(`locale=${DEFAULT_LOCALE}`);
          }
          return context;
        }),
        set: vi.fn(),
      } as any;

      setLocaleCookie(context, mockConfig, "");

      expect(getLocaleCookieName(mockConfig)).toBe("sb-test-project-locale");
    });

    it("should set locale for all supported locales", () => {
      const locales = ["en", "es", "ca", "ru", "de", "fr", "it", "pt"] as const;

      for (const locale of locales) {
        const context = {
          req: {
            url: "http://localhost:3000",
            header: vi.fn(() => undefined),
          },
          header: vi.fn((name: string, value: string) => {
            if (name === "Set-Cookie") {
              expect(value).toContain(`locale=${locale}`);
            }
            return context;
          }),
          set: vi.fn(),
        } as any;

        setLocaleCookie(context, mockConfig, locale);
        expect(getLocaleCookieName(mockConfig)).toBe("sb-test-project-locale");
      }
    });

    it("should fall back to default for invalid locale", () => {
      const context = {
        req: {
          url: "http://localhost:3000",
          header: vi.fn(() => undefined),
        },
        header: vi.fn((name: string, value: string) => {
          if (name === "Set-Cookie") {
            expect(value).toContain(`locale=${DEFAULT_LOCALE}`);
          }
          return context;
        }),
        set: vi.fn(),
      } as any;

      setLocaleCookie(context, mockConfig, DEFAULT_LOCALE);

      expect(getLocaleCookieName(mockConfig)).toBe("sb-test-project-locale");
    });
  });

  describe("getLocaleCookieName", () => {
    it("should return correct cookie name for given config", () => {
      const name = getLocaleCookieName(mockConfig);

      expect(name).toBe("sb-test-project-locale");
    });

    it("should handle different project references", () => {
      const config: CookieConfig = {
        domain: "example.com",
        projectRef: "my-project",
      };

      const name = getLocaleCookieName(config);

      expect(name).toBe("sb-my-project-locale");
    });
  });
});
