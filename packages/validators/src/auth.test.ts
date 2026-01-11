import { describe, expect, it } from "vitest";
import { LoginRequestSchema, RegisterRequestSchema } from "./auth";

describe("RegisterRequestSchema", () => {
  it("accepts valid input and normalizes email", () => {
    const result = RegisterRequestSchema.safeParse({
      email: "Test@Example.com",
      password: "password123",
      displayName: "Test User",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("rejects short passwords", () => {
    const result = RegisterRequestSchema.safeParse({
      email: "valid@example.com",
      password: "short",
      displayName: "Test User",
    });

    expect(result.success).toBe(false);
  });
});

describe("LoginRequestSchema", () => {
  it("requires an email and password", () => {
    const result = LoginRequestSchema.safeParse({
      email: "valid@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });
});
