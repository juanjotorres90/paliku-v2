import { z } from "zod";
import { IntentSchema } from "./profile";

export const LanguageCodeSchema = z.enum([
  "english",
  "spanish",
  "french",
  "german",
  "italian",
  "portuguese",
  "russian",
  "catalan",
  "japanese",
  "mandarin",
]);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

export const ProficiencySchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "native",
]);
export type Proficiency = z.infer<typeof ProficiencySchema>;

export const LanguageKindSchema = z.enum(["speaks", "learning"]);
export type LanguageKind = z.infer<typeof LanguageKindSchema>;

export const UserLanguageSchema = z
  .object({
    kind: LanguageKindSchema,
    languageCode: LanguageCodeSchema,
    level: ProficiencySchema,
  })
  .strict();
export type UserLanguage = z.infer<typeof UserLanguageSchema>;

export const RelationshipStatusSchema = z.enum([
  "pending",
  "accepted",
  "blocked",
  "declined",
]);
export type RelationshipStatus = z.infer<typeof RelationshipStatusSchema>;

export const PersonCardSchema = z
  .object({
    id: z.string().uuid(),
    displayName: z.string(),
    location: z.string(),
    bio: z.string(),
    avatarUrl: z.string().url().nullable().optional(),
    updatedAt: z.string().datetime(),
    intents: z.array(IntentSchema),
    speaks: z.array(
      z
        .object({
          languageCode: LanguageCodeSchema,
          level: ProficiencySchema,
        })
        .strict(),
    ),
    learning: z.array(
      z
        .object({
          languageCode: LanguageCodeSchema,
          level: ProficiencySchema,
        })
        .strict(),
    ),
    relationshipStatus: RelationshipStatusSchema.nullable().optional(),
    relationshipId: z.string().uuid().nullable().optional(),
    isRequester: z.boolean().nullable().optional(),
  })
  .strict();
export type PersonCard = z.infer<typeof PersonCardSchema>;

export const PeopleDiscoverResponseSchema = z
  .object({
    items: z.array(PersonCardSchema),
    nextCursor: z.string().nullable(),
  })
  .strict();
export type PeopleDiscoverResponse = z.infer<
  typeof PeopleDiscoverResponseSchema
>;

export const ConnectionRequestItemSchema = z
  .object({
    id: z.string().uuid(),
    direction: z.enum(["incoming", "outgoing"]),
    createdAt: z.string().datetime(),
    other: PersonCardSchema,
  })
  .strict();
export type ConnectionRequestItem = z.infer<typeof ConnectionRequestItemSchema>;

export const PeopleRequestsResponseSchema = z
  .object({
    items: z.array(ConnectionRequestItemSchema),
    nextCursor: z.string().nullable(),
  })
  .strict();
export type PeopleRequestsResponse = z.infer<
  typeof PeopleRequestsResponseSchema
>;

export const PeopleDiscoverQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    native: LanguageCodeSchema.optional(),
    learning: LanguageCodeSchema.optional(),
    learningLevel: ProficiencySchema.optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional().default(24),
  })
  .strict();
export type PeopleDiscoverQuery = z.infer<typeof PeopleDiscoverQuerySchema>;

export const ConnectParamsSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const RespondBodySchema = z
  .object({
    action: z.enum(["accept", "decline"]),
  })
  .strict();
export type RespondBody = z.infer<typeof RespondBodySchema>;

export const ProfileLanguagesUpsertSchema = z
  .object({
    speaks: z
      .array(
        z
          .object({
            languageCode: LanguageCodeSchema,
            level: ProficiencySchema,
          })
          .strict(),
      )
      .max(3, "Maximum 3 spoken languages"),
    learning: z
      .array(
        z
          .object({
            languageCode: LanguageCodeSchema,
            level: ProficiencySchema,
          })
          .strict(),
      )
      .max(3, "Maximum 3 learning languages"),
  })
  .strict();
export type ProfileLanguagesUpsertInput = z.input<
  typeof ProfileLanguagesUpsertSchema
>;
export type ProfileLanguagesUpsert = z.infer<
  typeof ProfileLanguagesUpsertSchema
>;
