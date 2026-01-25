import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  PayloadTooLargeError,
  ConflictError,
  RateLimitError,
} from "../../shared/domain/errors";
import {
  ErrorCode,
  ErrorCodeToKey,
  ErrorCodeFallbacks,
  type ErrorCodeValue,
} from "@repo/validators/error-codes";

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

// Re-export ErrorCode for convenience
export { ErrorCode };

interface FormatErrorI18nOptions {
  t: (key: string, values?: Record<string, unknown>) => string;
}

export function formatErrorI18n(
  error: unknown,
  options: FormatErrorI18nOptions,
): { error: string; code: ErrorCodeValue; [key: string]: unknown } {
  const { t } = options;
  let code: ErrorCodeValue = ErrorCode.UPSTREAM_UNKNOWN_ERROR;

  if (error instanceof ValidationError) {
    code = ErrorCode.VALIDATION_INVALID_INPUT;
  } else if (error instanceof NotFoundError) {
    code = ErrorCode.REQUEST_NOT_FOUND;
  } else if (error instanceof AuthenticationError) {
    if (error.message.includes("credentials")) {
      code = ErrorCode.AUTH_INVALID_CREDENTIALS;
    } else if (error.message.includes("confirmed")) {
      code = ErrorCode.AUTH_EMAIL_NOT_CONFIRMED;
    } else if (error.message.includes("session")) {
      code = ErrorCode.AUTH_SESSION_EXPIRED;
    } else {
      code = ErrorCode.AUTH_UNAUTHORIZED;
    }
  } else if (error instanceof ForbiddenError) {
    code = ErrorCode.AUTH_FORBIDDEN;
  } else if (error instanceof PayloadTooLargeError) {
    code = ErrorCode.REQUEST_PAYLOAD_TOO_LARGE;
  } else if (error instanceof ConflictError) {
    if (error.message.includes("exists")) {
      code = ErrorCode.AUTH_USER_EXISTS;
    } else {
      code = ErrorCode.UPSTREAM_UNKNOWN_ERROR;
    }
  } else if (error instanceof RateLimitError) {
    code = ErrorCode.REQUEST_RATE_LIMITED;
  }

  const errorKey = ErrorCodeToKey[code];
  const translated = t(errorKey);
  const result: {
    error: string;
    code: ErrorCodeValue;
    [key: string]: unknown;
  } = {
    error: translated === errorKey ? ErrorCodeFallbacks[code] : translated,
    code,
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
