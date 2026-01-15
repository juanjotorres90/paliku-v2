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
} from "../../../domain/errors";

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
    const error = new ForbiddenError("Access denied");
    expect(mapErrorToStatus(error)).toBe(403);
  });

  it("maps NotFoundError to 404", () => {
    const error = new NotFoundError("Resource not found");
    expect(mapErrorToStatus(error)).toBe(404);
  });

  it("maps ConflictError to 409", () => {
    const error = new ConflictError("Resource already exists");
    expect(mapErrorToStatus(error)).toBe(409);
  });

  it("maps PayloadTooLargeError to 413", () => {
    const error = new PayloadTooLargeError("File too large");
    expect(mapErrorToStatus(error)).toBe(413);
  });

  it("maps unknown errors to 500", () => {
    const error = new Error("Unknown error");
    expect(mapErrorToStatus(error)).toBe(500);
  });

  it("maps non-Error objects to 500", () => {
    expect(mapErrorToStatus("string error")).toBe(500);
    expect(mapErrorToStatus(null)).toBe(500);
    expect(mapErrorToStatus(undefined)).toBe(500);
    expect(mapErrorToStatus({ custom: "error" })).toBe(500);
  });

  it("maps RateLimitError to 500 (not explicitly handled)", () => {
    const error = new RateLimitError("Too many requests", 60);
    expect(mapErrorToStatus(error)).toBe(500);
  });
});

describe("formatError", () => {
  it("formats ValidationError with message", () => {
    const error = new ValidationError("Invalid input");
    expect(formatError(error)).toEqual({ error: "Invalid input" });
  });

  it("formats ValidationError with details", () => {
    const details = { field: "email", issue: "required" };
    const error = new ValidationError("Invalid input", details);
    expect(formatError(error)).toEqual({
      error: "Invalid input",
      details,
    });
  });

  it("formats standard Error objects", () => {
    const error = new Error("Something went wrong");
    expect(formatError(error)).toEqual({ error: "Something went wrong" });
  });

  it("formats AuthenticationError", () => {
    const error = new AuthenticationError("Invalid credentials");
    expect(formatError(error)).toEqual({ error: "Invalid credentials" });
  });

  it("formats unknown error types", () => {
    expect(formatError("string error")).toEqual({
      error: "An unexpected error occurred",
    });
  });

  it("formats null errors", () => {
    expect(formatError(null)).toEqual({
      error: "An unexpected error occurred",
    });
  });

  it("formats undefined errors", () => {
    expect(formatError(undefined)).toEqual({
      error: "An unexpected error occurred",
    });
  });

  it("formats object errors that are not Error instances", () => {
    expect(formatError({ custom: "error" })).toEqual({
      error: "An unexpected error occurred",
    });
  });
});
