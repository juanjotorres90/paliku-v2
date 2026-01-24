import { describe, expect, it, vi } from "vitest";
import { mapErrorToStatus, formatErrorI18n, formatError } from "./error-i18n";
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  PayloadTooLargeError,
  ConflictError,
  RateLimitError,
} from "../../shared/domain/errors";

describe("error-i18n", () => {
  describe("mapErrorToStatus", () => {
    it("maps ValidationError to 400", () => {
      const error = new ValidationError("Invalid");
      expect(mapErrorToStatus(error)).toBe(400);
    });

    it("maps AuthenticationError to 401", () => {
      const error = new AuthenticationError("Unauthorized");
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

    it("maps RateLimitError to 429", () => {
      const error = new RateLimitError("Rate limited");
      expect(mapErrorToStatus(error)).toBe(429);
    });

    it("maps unknown errors to 500", () => {
      expect(mapErrorToStatus(new Error("Unknown"))).toBe(500);
      expect(mapErrorToStatus("string error")).toBe(500);
      expect(mapErrorToStatus(null)).toBe(500);
    });
  });

  describe("formatErrorI18n", () => {
    it("formats ValidationError", () => {
      const error = new ValidationError("Invalid input");
      const t = vi.fn((key: string) => key);
      const result = formatErrorI18n(error, { t });

      expect(result.errorKey).toBe("api.errors.validation.invalid_input");
      expect(t).toHaveBeenCalledWith("api.errors.validation.invalid_input");
    });

    it("includes details for ValidationError", () => {
      const error = new ValidationError("Invalid", { field: "email" });
      const t = vi.fn(() => "Error");
      const result = formatErrorI18n(error, { t });

      expect(result.details).toEqual({ field: "email" });
    });

    it("formats NotFoundError", () => {
      const error = new NotFoundError("Not found");
      const t = vi.fn(() => "Not found");
      const result = formatErrorI18n(error, { t });

      expect(result.errorKey).toBe("api.errors.request.not_found");
    });

    it("formats AuthenticationError with credentials", () => {
      const error = new AuthenticationError("Invalid credentials");
      const t = vi.fn(() => "Invalid email or password");
      const result = formatErrorI18n(error, { t });

      expect(result.errorKey).toBe("api.errors.auth.invalid_credentials");
    });

    it("formats AuthenticationError with confirmation", () => {
      const error = new AuthenticationError("Email not confirmed");
      const t = vi.fn(() => "Email not confirmed");
      const result = formatErrorI18n(error, { t });

      expect(result.errorKey).toBe("api.errors.auth.email_not_confirmed");
    });

    it("formats AuthenticationError with session", () => {
      const error = new AuthenticationError("Your session has expired");
      const t = vi.fn(() => "Session expired");
      const result = formatErrorI18n(error, { t });

      expect(result.errorKey).toBe("api.errors.auth.session_expired");
    });

    it("formats generic AuthenticationError", () => {
      const error = new AuthenticationError("Unauthorized");
      const t = vi.fn(() => "Unauthorized");
      const result = formatErrorI18n(error, { t });

      expect(result.errorKey).toBe("api.errors.auth.unauthorized");
    });

    it("formats ForbiddenError", () => {
      const error = new ForbiddenError("Forbidden");
      const t = vi.fn(() => "Forbidden");
      const result = formatErrorI18n(error, { t });

      expect(result.errorKey).toBe("api.errors.auth.forbidden");
    });

    it("formats PayloadTooLargeError", () => {
      const error = new PayloadTooLargeError("Too large");
      const t = vi.fn(() => "Too large");
      const result = formatErrorI18n(error, { t });

      expect(result.errorKey).toBe("api.errors.request.payload_too_large");
    });

    it("formats ConflictError with exists", () => {
      const error = new ConflictError("User already exists");
      const t = vi.fn(() => "User exists");
      const result = formatErrorI18n(error, { t });

      expect(result.errorKey).toBe("api.errors.auth.user_exists");
    });

    it("formats generic ConflictError", () => {
      const error = new ConflictError("Conflict");
      const t = vi.fn(() => "Error");
      const result = formatErrorI18n(error, { t });

      expect(result.errorKey).toBe("api.errors.upstream.unknown_error");
    });

    it("formats RateLimitError", () => {
      const error = new RateLimitError("Rate limited");
      const t = vi.fn(() => "Rate limited");
      const result = formatErrorI18n(error, { t });

      expect(result.errorKey).toBe("api.errors.request.rate_limited");
    });

    it("includes retryAfter for RateLimitError", () => {
      const error = new RateLimitError("Rate limited", 60);
      const t = vi.fn(() => "Rate limited");
      const result = formatErrorI18n(error, { t });

      expect(result.retryAfter).toBe(60);
    });

    it("formats unknown errors", () => {
      const error = new Error("Unknown");
      const t = vi.fn(() => "Unknown error");
      const result = formatErrorI18n(error, { t });

      expect(result.errorKey).toBe("api.errors.upstream.unknown_error");
    });

    it("uses fallback when translation returns key", () => {
      const error = new ValidationError("Invalid");
      const t = vi.fn((key: string) => key);
      const result = formatErrorI18n(error, { t });

      expect(result.error).toBe("Invalid input data");
    });

    it("uses translation when available", () => {
      const error = new ValidationError("Invalid");
      const t = vi.fn(() => "Entrada inválida");
      const result = formatErrorI18n(error, { t });

      expect(result.error).toBe("Entrada inválida");
    });
  });

  describe("formatError", () => {
    it("formats ValidationError with details", () => {
      const error = new ValidationError("Invalid", { field: "email" });
      const result = formatError(error);

      expect(result).toEqual({
        error: "Invalid",
        details: { field: "email" },
      });
    });

    it("formats ValidationError without details", () => {
      const error = new ValidationError("Invalid");
      const result = formatError(error);

      expect(result).toEqual({ error: "Invalid" });
    });

    it("formats generic Error", () => {
      const error = new Error("Test error");
      const result = formatError(error);

      expect(result).toEqual({ error: "Test error" });
    });

    it("formats unknown errors", () => {
      const result = formatError("string error");

      expect(result).toEqual({ error: "An unexpected error occurred" });
    });
  });
});
