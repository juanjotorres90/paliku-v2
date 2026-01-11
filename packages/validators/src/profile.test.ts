import { describe, expect, it } from "vitest";
import {
  IntentSchema,
  ProfileUpsertSchema,
  ProfilePublicSchema,
  ProfileMeResponseSchema,
} from "./profile";

describe("IntentSchema", () => {
  it("accepts valid intent values", () => {
    expect(IntentSchema.safeParse("practice").success).toBe(true);
    expect(IntentSchema.safeParse("friends").success).toBe(true);
    expect(IntentSchema.safeParse("date").success).toBe(true);
  });

  it("rejects invalid intent values", () => {
    expect(IntentSchema.safeParse("invalid").success).toBe(false);
    expect(IntentSchema.safeParse("").success).toBe(false);
    expect(IntentSchema.safeParse(123).success).toBe(false);
  });
});

describe("ProfileUpsertSchema", () => {
  const validProfile = {
    displayName: "Test User",
    bio: "Hello world",
    location: "San Francisco",
    intents: ["practice"] as const,
    isPublic: true,
  };

  it("accepts valid profile data", () => {
    const result = ProfileUpsertSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("trims and validates displayName", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      displayName: "  Test User  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayName).toBe("Test User");
    }
  });

  it("rejects displayName too short", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      displayName: "A",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Display name too short");
    }
  });

  it("rejects displayName too long", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      displayName: "A".repeat(51),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Display name too long");
    }
  });

  it("rejects bio too long", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      bio: "A".repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Bio too long");
    }
  });

  it("rejects location too long", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      location: "A".repeat(121),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Location too long");
    }
  });

  it("requires at least one intent", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      intents: [],
    });
    expect(result.success).toBe(false);
  });

  it("allows maximum 3 intents", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      intents: ["practice", "friends", "date"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 3 intents", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      intents: ["practice", "friends", "date", "practice"],
    });
    expect(result.success).toBe(false);
  });

  it("defaults bio to empty string", () => {
    const result = ProfileUpsertSchema.safeParse({
      displayName: "Test",
      intents: ["practice"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bio).toBe("");
    }
  });

  it("defaults location to empty string", () => {
    const result = ProfileUpsertSchema.safeParse({
      displayName: "Test",
      intents: ["practice"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.location).toBe("");
    }
  });

  it("defaults isPublic to true", () => {
    const result = ProfileUpsertSchema.safeParse({
      displayName: "Test",
      intents: ["practice"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(true);
    }
  });

  it("accepts valid avatar URL", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      avatarUrl: "https://example.com/avatar.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null avatar URL", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      avatarUrl: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid avatar URL", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      avatarUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid avatar URL");
    }
  });

  it("rejects avatar URL too long", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      avatarUrl: `https://example.com/${"a".repeat(2049)}`,
    });
    expect(result.success).toBe(false);
  });

  it("rejects extra fields (strict mode)", () => {
    const result = ProfileUpsertSchema.safeParse({
      ...validProfile,
      extraField: "not allowed",
    });
    expect(result.success).toBe(false);
  });
});

describe("ProfilePublicSchema", () => {
  const validPublicProfile = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    displayName: "Test User",
    bio: "Hello",
    location: "NYC",
    intents: ["practice"],
    isPublic: true,
    avatarUrl: null,
    updatedAt: "2024-01-01T00:00:00Z",
  };

  it("accepts valid public profile", () => {
    const result = ProfilePublicSchema.safeParse(validPublicProfile);
    expect(result.success).toBe(true);
  });

  it("requires valid UUID for id", () => {
    const result = ProfilePublicSchema.safeParse({
      ...validPublicProfile,
      id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("requires valid datetime for updatedAt", () => {
    const result = ProfilePublicSchema.safeParse({
      ...validPublicProfile,
      updatedAt: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("accepts avatar URL", () => {
    const result = ProfilePublicSchema.safeParse({
      ...validPublicProfile,
      avatarUrl: "https://example.com/avatar.jpg",
    });
    expect(result.success).toBe(true);
  });
});

describe("ProfileMeResponseSchema", () => {
  const validResponse = {
    email: "test@example.com",
    profile: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      displayName: "Test User",
      bio: "Hello",
      location: "NYC",
      intents: ["practice"],
      isPublic: true,
      avatarUrl: null,
      updatedAt: "2024-01-01T00:00:00Z",
    },
  };

  it("accepts valid response", () => {
    const result = ProfileMeResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it("requires valid email", () => {
    const result = ProfileMeResponseSchema.safeParse({
      ...validResponse,
      email: "invalid-email",
    });
    expect(result.success).toBe(false);
  });

  it("requires profile object", () => {
    const result = ProfileMeResponseSchema.safeParse({
      email: "test@example.com",
    });
    expect(result.success).toBe(false);
  });
});
