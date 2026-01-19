import { describe, it, expect } from "vitest";
import { mapErrorToStatus, formatError } from "./error-mapper";
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  PayloadTooLargeError,
  ConflictError,
  RateLimitError,
} from "../../shared/domain/errors";

describe("mapErrorToStatus", () => {
  it("maps ValidationError to 400", () => {
    const error = new ValidationError("Invalid input");
    expect(mapErrorToStatus(error)).toBe(400);
  });

  it("maps AuthenticationError to 401", () => {
    const error = new AuthenticationError("Not authenticated");
    expect(mapErrorToStatus(error)).toBe(401);
  });

  it("maps ForbiddenError to 403", () => {
    const error = new ForbiddenError("Forbidden");
    expect(mapErrorToStatus(error)).toBe(403);
  });

  it("maps NotFoundError to 404", () => {
    const error = new NotFoundError("Not found");
    expect(mapErrorToStatus(error)).toBe(404);
  });

  it("maps ConflictError to 409", () => {
    const error = new ConflictError("Conflict");
    expect(mapErrorToStatus(error)).toBe(409);
  });

  it("maps PayloadTooLargeError to 413", () => {
    const error = new PayloadTooLargeError("Too large");
    expect(mapErrorToStatus(error)).toBe(413);
  });

  it("returns 500 for unknown errors", () => {
    expect(mapErrorToStatus(new RateLimitError("Too many"))).toBe(500);
  });
});

describe("formatError", () => {
  it("formats ValidationError with details", () => {
    const error = new ValidationError("Invalid input", { field: "name" });
    expect(formatError(error)).toEqual({
      error: "Invalid input",
      details: { field: "name" },
    });
  });

  it("formats Error with message", () => {
    const error = new Error("Boom");
    expect(formatError(error)).toEqual({ error: "Boom" });
  });

  it("formats unknown error", () => {
    expect(formatError("oops")).toEqual({
      error: "An unexpected error occurred",
    });
  });
});
