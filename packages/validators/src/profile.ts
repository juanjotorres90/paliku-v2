import { z } from "zod";

export const IntentSchema = z.enum(["practice", "friends", "date"]);

export const ProfileUpsertSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Display name too short")
      .max(50, "Display name too long"),
    bio: z.string().trim().max(500, "Bio too long").optional().default(""),
    location: z
      .string()
      .trim()
      .max(120, "Location too long")
      .optional()
      .default(""),
    intents: z.array(IntentSchema).min(1).max(3),
    isPublic: z.boolean().optional().default(true),
    avatarUrl: z
      .string()
      .trim()
      .url("Invalid avatar URL")
      .max(2048, "Avatar URL too long")
      .optional()
      .nullable(),
  })
  .strict();

export type ProfileUpsertInput = z.input<typeof ProfileUpsertSchema>;
export type ProfileUpsert = z.infer<typeof ProfileUpsertSchema>;

export const ProfilePublicSchema = z
  .object({
    id: z.string().uuid(),
    displayName: z.string(),
    bio: z.string(),
    location: z.string(),
    intents: z.array(IntentSchema),
    isPublic: z.boolean(),
    avatarUrl: z.string().url().nullable().optional(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type ProfilePublic = z.infer<typeof ProfilePublicSchema>;

export const ProfileMeResponseSchema = z
  .object({
    email: z.string().email(),
    profile: ProfilePublicSchema,
  })
  .strict();

export type ProfileMeResponse = z.infer<typeof ProfileMeResponseSchema>;
