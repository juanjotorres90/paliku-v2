import { describe, expect, it } from "vitest";
import {
  LocaleSchema,
  ThemeSchema,
  SettingsUpdateSchema,
  SettingsMeResponseSchema,
} from "./settings";

describe("LocaleSchema", () => {
  it("accepts valid locale codes", () => {
    const validLocales = ["en", "es", "ca", "ru", "de", "fr", "it", "pt"];
    validLocales.forEach((locale) => {
      const result = LocaleSchema.safeParse(locale);
      expect(result.success).toBe(true);
    });
  });

  it("rejects invalid locale codes", () => {
    const result = LocaleSchema.safeParse("invalid");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe(
        "Invalid language preference",
      );
    }
  });
});

describe("ThemeSchema", () => {
  it("accepts valid theme values", () => {
    const validThemes = ["system", "light", "dark"];
    validThemes.forEach((theme) => {
      const result = ThemeSchema.safeParse(theme);
      expect(result.success).toBe(true);
    });
  });

  it("rejects invalid theme values", () => {
    const result = ThemeSchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });
});

describe("SettingsUpdateSchema", () => {
  it("accepts update with only locale", () => {
    const result = SettingsUpdateSchema.safeParse({ locale: "en" });
    expect(result.success).toBe(true);
  });

  it("accepts update with only theme", () => {
    const result = SettingsUpdateSchema.safeParse({ theme: "dark" });
    expect(result.success).toBe(true);
  });

  it("accepts update with both locale and theme", () => {
    const result = SettingsUpdateSchema.safeParse({
      locale: "es",
      theme: "light",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty update", () => {
    const result = SettingsUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe(
        "At least one setting must be provided",
      );
    }
  });

  it("rejects extra fields due to strict mode", () => {
    const result = SettingsUpdateSchema.safeParse({
      locale: "en",
      extraField: "value",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid locale in update", () => {
    const result = SettingsUpdateSchema.safeParse({ locale: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid theme in update", () => {
    const result = SettingsUpdateSchema.safeParse({ theme: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("SettingsMeResponseSchema", () => {
  it("accepts valid settings response", () => {
    const result = SettingsMeResponseSchema.safeParse({
      locale: "en",
      theme: "dark",
    });
    expect(result.success).toBe(true);
  });

  it("rejects response missing locale", () => {
    const result = SettingsMeResponseSchema.safeParse({ theme: "dark" });
    expect(result.success).toBe(false);
  });

  it("rejects response missing theme", () => {
    const result = SettingsMeResponseSchema.safeParse({ locale: "en" });
    expect(result.success).toBe(false);
  });

  it("rejects response with extra fields due to strict mode", () => {
    const result = SettingsMeResponseSchema.safeParse({
      locale: "en",
      theme: "dark",
      extraField: "value",
    });
    expect(result.success).toBe(false);
  });
});
