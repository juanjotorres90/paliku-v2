import { describe, it, expect } from "vitest";
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  PayloadTooLargeError,
  ConflictError,
  RateLimitError,
} from "./errors";

describe("Domain Errors", () => {
  it("creates ValidationError", () => {
    const error = new ValidationError("Invalid input");
    expect(error.name).toBe("ValidationError");
  });

  it("creates NotFoundError", () => {
    const error = new NotFoundError("Not found");
    expect(error.name).toBe("NotFoundError");
  });

  it("creates AuthenticationError", () => {
    const error = new AuthenticationError("No auth");
    expect(error.name).toBe("AuthenticationError");
  });

  it("creates ForbiddenError", () => {
    const error = new ForbiddenError("Forbidden");
    expect(error.name).toBe("ForbiddenError");
  });

  it("creates PayloadTooLargeError", () => {
    const error = new PayloadTooLargeError("Too large");
    expect(error.name).toBe("PayloadTooLargeError");
  });

  it("creates ConflictError", () => {
    const error = new ConflictError("Conflict");
    expect(error.name).toBe("ConflictError");
  });

  it("creates RateLimitError", () => {
    const error = new RateLimitError("Rate limited", 10);
    expect(error.name).toBe("RateLimitError");
    expect(error.retryAfter).toBe(10);
  });
});
