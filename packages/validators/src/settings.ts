import { z } from "zod";

export const LocaleSchema = z.enum(
  ["en", "es", "ca", "ru", "de", "fr", "it", "pt"],
  {
    errorMap: () => ({ message: "Invalid language preference" }),
  },
);

export const ThemeSchema = z.enum(["system", "light", "dark"]);

export const SettingsUpdateSchema = z
  .object({
    locale: LocaleSchema.optional(),
    theme: ThemeSchema.optional(),
  })
  .strict()
  .refine((data) => data.locale !== undefined || data.theme !== undefined, {
    message: "At least one setting must be provided",
  });

export type SettingsUpdateInput = z.input<typeof SettingsUpdateSchema>;
export type SettingsUpdate = z.infer<typeof SettingsUpdateSchema>;

export const SettingsMeResponseSchema = z
  .object({
    locale: LocaleSchema,
    theme: ThemeSchema,
  })
  .strict();

export type SettingsMeResponse = z.infer<typeof SettingsMeResponseSchema>;
