import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { createI18nRoutes } from "./routes";
import type { RouteEnv } from "../../../http/context";
import type { AppConfig } from "../../../server/config";

describe("createI18nRoutes", () => {
  let mockConfig: AppConfig;
  let app: Hono<RouteEnv>;

  beforeEach(() => {
    mockConfig = {
      supabase: {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        audience: "authenticated",
        jwtSecret: "secret",
        jwtAlgs: [],
      },
      cors: {
        allowedOrigins: ["http://localhost:3000"],
      },
      cookie: {
        domain: "localhost",
        projectRef: "test-project",
      },
    };

    app = new Hono<RouteEnv>();
    app.route("/i18n", createI18nRoutes({ config: mockConfig }));
  });

  describe("POST /i18n/locale", () => {
    it("should set valid locale cookie and return success", async () => {
      const res = await app.request("/i18n/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "en" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ ok: true, locale: "en" });
      expect(res.headers.get("Set-Cookie")).toContain("locale=en");
    });

    it("should return error for invalid JSON", async () => {
      const res = await app.request("/i18n/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty(
        "errorKey",
        "api.errors.request.invalid_json",
      );
    });

    it("should return error for empty body", async () => {
      const res = await app.request("/i18n/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty(
        "errorKey",
        "api.errors.request.invalid_request",
      );
    });

    it("should return error for missing locale field", async () => {
      const res = await app.request("/i18n/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherField: "value" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty(
        "errorKey",
        "api.errors.request.invalid_request",
      );
    });

    it("should return error for non-string locale", async () => {
      const res = await app.request("/i18n/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: 123 }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty(
        "errorKey",
        "api.errors.request.invalid_request",
      );
    });

    it("should return error for invalid locale", async () => {
      const res = await app.request("/i18n/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "xx" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid locale");
      expect(data.error).toContain("en, es, ca, ru, de, fr, it, pt");
    });

    it("should set all valid locales", async () => {
      const locales = ["en", "es", "ca", "ru", "de", "fr", "it", "pt"];

      for (const locale of locales) {
        const res = await app.request("/i18n/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale }),
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ ok: true, locale });
        expect(res.headers.get("Set-Cookie")).toContain(`locale=${locale}`);
      }
    });

    it("should handle additional fields in request body", async () => {
      const res = await app.request("/i18n/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "en", extra: "ignored" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ ok: true, locale: "en" });
    });

    it("should return error for null body", async () => {
      const res = await app.request("/i18n/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(null),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty(
        "errorKey",
        "api.errors.request.invalid_request",
      );
    });

    it("should handle malformed JSON", async () => {
      const res = await app.request("/i18n/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{malformed json",
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty(
        "errorKey",
        "api.errors.request.invalid_json",
      );
    });
  });

  describe("GET /i18n/locales", () => {
    it("should return list of supported locales with autonyms", async () => {
      const res = await app.request("/i18n/locales");

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("locales");
      expect(Array.isArray(data.locales)).toBe(true);
      expect(data.locales).toHaveLength(8);
      expect(data.locales[0]).toHaveProperty("code");
      expect(data.locales[0]).toHaveProperty("name");
    });

    it("should include all expected locales", async () => {
      const res = await app.request("/i18n/locales");

      expect(res.status).toBe(200);
      const data = await res.json();
      const codes = data.locales.map((l: { code: string }) => l.code);
      expect(codes).toEqual(
        expect.arrayContaining([
          "en",
          "es",
          "ca",
          "ru",
          "de",
          "fr",
          "it",
          "pt",
        ]),
      );
    });

    it("should have correct autonyms for each locale", async () => {
      const res = await app.request("/i18n/locales");

      expect(res.status).toBe(200);
      const data = await res.json();
      const localesMap = Object.fromEntries(
        data.locales.map((l: { code: string; name: string }) => [
          l.code,
          l.name,
        ]),
      );

      expect(localesMap.en).toBe("English");
      expect(localesMap.es).toBe("Español");
      expect(localesMap.ca).toBe("Català");
      expect(localesMap.ru).toBe("Русский");
      expect(localesMap.de).toBe("Deutsch");
      expect(localesMap.fr).toBe("Français");
      expect(localesMap.it).toBe("Italiano");
      expect(localesMap.pt).toBe("Português");
    });

    it("should return consistent order of locales", async () => {
      const res = await app.request("/i18n/locales");

      expect(res.status).toBe(200);
      const data = await res.json();
      const codes = data.locales.map((l: { code: string }) => l.code);

      const res2 = await app.request("/i18n/locales");
      const data2 = await res2.json();
      const codes2 = data2.locales.map((l: { code: string }) => l.code);

      expect(codes).toEqual(codes2);
    });
  });

  describe("route not found", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await app.request("/i18n/unknown");

      expect(res.status).toBe(404);
    });
  });
});
