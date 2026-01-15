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
  describe("ValidationError", () => {
    it("creates error with message", () => {
      const error = new ValidationError("Invalid input");
      expect(error.message).toBe("Invalid input");
      expect(error.name).toBe("ValidationError");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
    });

    it("creates error with message and details", () => {
      const details = { field: "email", issue: "required" };
      const error = new ValidationError("Invalid input", details);
      expect(error.message).toBe("Invalid input");
      expect(error.details).toEqual(details);
      expect(error.name).toBe("ValidationError");
    });

    it("creates error without details", () => {
      const error = new ValidationError("Invalid input");
      expect(error.details).toBeUndefined();
    });
  });

  describe("NotFoundError", () => {
    it("creates error with message", () => {
      const error = new NotFoundError("Resource not found");
      expect(error.message).toBe("Resource not found");
      expect(error.name).toBe("NotFoundError");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotFoundError);
    });
  });

  describe("AuthenticationError", () => {
    it("creates error with message", () => {
      const error = new AuthenticationError("Invalid credentials");
      expect(error.message).toBe("Invalid credentials");
      expect(error.name).toBe("AuthenticationError");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthenticationError);
    });
  });

  describe("ForbiddenError", () => {
    it("creates error with message", () => {
      const error = new ForbiddenError("Access denied");
      expect(error.message).toBe("Access denied");
      expect(error.name).toBe("ForbiddenError");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ForbiddenError);
    });
  });

  describe("PayloadTooLargeError", () => {
    it("creates error with message", () => {
      const error = new PayloadTooLargeError("File too large");
      expect(error.message).toBe("File too large");
      expect(error.name).toBe("PayloadTooLargeError");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PayloadTooLargeError);
    });
  });

  describe("ConflictError", () => {
    it("creates error with message", () => {
      const error = new ConflictError("Resource already exists");
      expect(error.message).toBe("Resource already exists");
      expect(error.name).toBe("ConflictError");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ConflictError);
    });
  });

  describe("RateLimitError", () => {
    it("creates error with message", () => {
      const error = new RateLimitError("Too many requests");
      expect(error.message).toBe("Too many requests");
      expect(error.name).toBe("RateLimitError");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.retryAfter).toBeUndefined();
    });

    it("creates error with message and retryAfter", () => {
      const error = new RateLimitError("Too many requests", 60);
      expect(error.message).toBe("Too many requests");
      expect(error.retryAfter).toBe(60);
      expect(error.name).toBe("RateLimitError");
    });
  });
});
