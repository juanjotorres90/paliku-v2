import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALES,
  AUTONYMS,
  isLocale,
  isDefaultLocale,
  type Locale,
} from "./locales";

describe("locales", () => {
  describe("constants", () => {
    it("has correct default locale", () => {
      expect(DEFAULT_LOCALE).toBe("en");
    });

    it("includes all expected locales", () => {
      expect(LOCALES).toContain("en");
      expect(LOCALES).toContain("es");
      expect(LOCALES).toContain("ca");
      expect(LOCALES).toContain("ru");
      expect(LOCALES).toContain("de");
      expect(LOCALES).toContain("fr");
      expect(LOCALES).toContain("it");
      expect(LOCALES).toContain("pt");
    });

    it("has autonyms for all locales", () => {
      LOCALES.forEach((locale) => {
        expect(AUTONYMS[locale]).toBeDefined();
        expect(typeof AUTONYMS[locale]).toBe("string");
        expect(AUTONYMS[locale].length).toBeGreaterThan(0);
      });
    });

    it("has correct autonym values", () => {
      expect(AUTONYMS.en).toBe("English");
      expect(AUTONYMS.es).toBe("Español");
      expect(AUTONYMS.ca).toBe("Català");
      expect(AUTONYMS.ru).toBe("Русский");
      expect(AUTONYMS.de).toBe("Deutsch");
      expect(AUTONYMS.fr).toBe("Français");
      expect(AUTONYMS.it).toBe("Italiano");
      expect(AUTONYMS.pt).toBe("Português");
    });
  });

  describe("isLocale", () => {
    it("returns true for valid locales", () => {
      LOCALES.forEach((locale) => {
        expect(isLocale(locale)).toBe(true);
      });
    });

    it("returns false for invalid locales", () => {
      expect(isLocale("invalid")).toBe(false);
      expect(isLocale("en-US")).toBe(false);
      expect(isLocale("")).toBe(false);
      expect(isLocale("zh")).toBe(false);
    });

    it("is case sensitive", () => {
      expect(isLocale("EN")).toBe(false);
      expect(isLocale("Es")).toBe(false);
    });
  });

  describe("isDefaultLocale", () => {
    it("returns true for default locale", () => {
      expect(isDefaultLocale("en" as Locale)).toBe(true);
    });

    it("returns false for non-default locales", () => {
      expect(isDefaultLocale("es" as Locale)).toBe(false);
      expect(isDefaultLocale("ca" as Locale)).toBe(false);
      expect(isDefaultLocale("ru" as Locale)).toBe(false);
      expect(isDefaultLocale("de" as Locale)).toBe(false);
      expect(isDefaultLocale("fr" as Locale)).toBe(false);
      expect(isDefaultLocale("it" as Locale)).toBe(false);
      expect(isDefaultLocale("pt" as Locale)).toBe(false);
    });
  });
});
