import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  PayloadTooLargeError,
  ConflictError,
  RateLimitError,
} from "../../shared/domain/errors";

export function mapErrorToStatus(error: unknown): number {
  if (error instanceof ValidationError) return 400;
  if (error instanceof AuthenticationError) return 401;
  if (error instanceof ForbiddenError) return 403;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  if (error instanceof PayloadTooLargeError) return 413;
  if (error instanceof RateLimitError) return 429;
  return 500;
}

type ErrorKey =
  | "api.errors.request.invalid_json"
  | "api.errors.request.invalid_request"
  | "api.errors.request.not_found"
  | "api.errors.request.rate_limited"
  | "api.errors.request.payload_too_large"
  | "api.errors.auth.invalid_credentials"
  | "api.errors.auth.email_not_confirmed"
  | "api.errors.auth.user_exists"
  | "api.errors.auth.session_expired"
  | "api.errors.auth.token_invalid"
  | "api.errors.auth.unauthorized"
  | "api.errors.auth.forbidden"
  | "api.errors.auth.missing_token"
  | "api.errors.auth.missing_refresh_token"
  | "api.errors.upstream.auth_failed"
  | "api.errors.upstream.database_error"
  | "api.errors.upstream.storage_error"
  | "api.errors.upstream.unknown_error"
  | "api.errors.validation.invalid_input"
  | "api.errors.profile.not_found"
  | "api.errors.profile.update_failed"
  | "api.errors.profile.avatar_upload_failed"
  | "api.errors.profile.invalid_locale"
  | "api.errors.profile.missing_file"
  | "api.errors.profile.invalid_file";

interface FormatErrorI18nOptions {
  t: (key: string, values?: Record<string, unknown>) => string;
}

// Fallback messages when translations fail to load
const ERROR_FALLBACKS: Record<ErrorKey, string> = {
  "api.errors.request.invalid_json": "Invalid JSON in request body",
  "api.errors.request.invalid_request": "Invalid request",
  "api.errors.request.not_found": "Resource not found",
  "api.errors.request.rate_limited":
    "Too many requests. Please try again later",
  "api.errors.request.payload_too_large": "Request payload too large",
  "api.errors.auth.invalid_credentials": "Invalid email or password",
  "api.errors.auth.email_not_confirmed": "Email not confirmed",
  "api.errors.auth.user_exists": "An account with this email already exists",
  "api.errors.auth.session_expired": "Your session has expired",
  "api.errors.auth.token_invalid": "Invalid or expired token",
  "api.errors.auth.unauthorized": "Unauthorized",
  "api.errors.auth.forbidden": "Forbidden",
  "api.errors.auth.missing_token": "Missing authentication token",
  "api.errors.auth.missing_refresh_token": "Missing refresh token",
  "api.errors.upstream.auth_failed": "Authentication failed",
  "api.errors.upstream.database_error": "Database error",
  "api.errors.upstream.storage_error": "Storage error",
  "api.errors.upstream.unknown_error": "An unexpected error occurred",
  "api.errors.validation.invalid_input": "Invalid input data",
  "api.errors.profile.not_found": "Profile not found",
  "api.errors.profile.update_failed": "Failed to update profile",
  "api.errors.profile.avatar_upload_failed": "Failed to upload avatar",
  "api.errors.profile.invalid_locale": "Invalid language preference",
  "api.errors.profile.missing_file": "No file provided",
  "api.errors.profile.invalid_file": "Invalid file",
};

export function formatErrorI18n(
  error: unknown,
  options: FormatErrorI18nOptions,
): { error: string; errorKey: ErrorKey; [key: string]: unknown } {
  const { t } = options;
  let errorKey: ErrorKey = "api.errors.upstream.unknown_error";

  // NOTE: Error detection via string matching is fragile and may break if
  // upstream services change their error messages or localize them.
  // Consider using error codes if available.
  if (error instanceof ValidationError) {
    errorKey = "api.errors.validation.invalid_input";
  } else if (error instanceof NotFoundError) {
    errorKey = "api.errors.request.not_found";
  } else if (error instanceof AuthenticationError) {
    if (error.message.includes("credentials")) {
      errorKey = "api.errors.auth.invalid_credentials";
    } else if (error.message.includes("confirmed")) {
      errorKey = "api.errors.auth.email_not_confirmed";
    } else if (error.message.includes("session")) {
      errorKey = "api.errors.auth.session_expired";
    } else {
      errorKey = "api.errors.auth.unauthorized";
    }
  } else if (error instanceof ForbiddenError) {
    errorKey = "api.errors.auth.forbidden";
  } else if (error instanceof PayloadTooLargeError) {
    errorKey = "api.errors.request.payload_too_large";
  } else if (error instanceof ConflictError) {
    if (error.message.includes("exists")) {
      errorKey = "api.errors.auth.user_exists";
    } else {
      errorKey = "api.errors.upstream.unknown_error";
    }
  } else if (error instanceof RateLimitError) {
    errorKey = "api.errors.request.rate_limited";
  }

  const translated = t(errorKey);
  const result: {
    error: string;
    errorKey: ErrorKey;
    [key: string]: unknown;
  } = {
    // Use fallback if translation failed (returns the key itself)
    error: translated === errorKey ? ERROR_FALLBACKS[errorKey] : translated,
    errorKey,
  };

  if (error instanceof ValidationError && error.details) {
    result.details = error.details;
  }

  if (error instanceof RateLimitError && error.retryAfter !== undefined) {
    result.retryAfter = error.retryAfter;
  }

  return result;
}

export function formatError(error: unknown) {
  if (error instanceof ValidationError) {
    const result: { error: string; details?: unknown } = {
      error: error.message,
    };
    if (error.details) {
      result.details = error.details;
    }
    return result;
  }
  if (error instanceof Error) {
    return { error: error.message };
  }
  return { error: "An unexpected error occurred" };
}
