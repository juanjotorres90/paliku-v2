/**
 * Numeric error codes for API responses.
 *
 * Code ranges:
 * - 1xxx: Authentication errors
 * - 2xxx: Validation errors
 * - 3xxx: Profile errors
 * - 4xxx: Request errors
 * - 5xxx: Upstream/system errors
 */
export const ErrorCode = {
  // Auth errors (1xxx)
  AUTH_TOKEN_INVALID: 1001,
  AUTH_MISSING_TOKEN: 1002,
  AUTH_SESSION_EXPIRED: 1003,
  AUTH_UNAUTHORIZED: 1004,
  AUTH_MISSING_REFRESH_TOKEN: 1005,
  AUTH_INVALID_CREDENTIALS: 1006,
  AUTH_EMAIL_NOT_CONFIRMED: 1007,
  AUTH_USER_EXISTS: 1008,
  AUTH_FORBIDDEN: 1009,
  AUTH_MISSING_CODE: 1010,

  // Validation errors (2xxx)
  VALIDATION_INVALID_INPUT: 2001,

  // Profile errors (3xxx)
  PROFILE_NOT_FOUND: 3001,
  PROFILE_UPDATE_FAILED: 3002,
  PROFILE_AVATAR_UPLOAD_FAILED: 3003,
  PROFILE_INVALID_LOCALE: 3004,
  PROFILE_MISSING_FILE: 3005,
  PROFILE_INVALID_FILE: 3006,

  // Request errors (4xxx)
  REQUEST_INVALID_JSON: 4001,
  REQUEST_INVALID_REQUEST: 4002,
  REQUEST_NOT_FOUND: 4003,
  REQUEST_RATE_LIMITED: 4004,
  REQUEST_PAYLOAD_TOO_LARGE: 4005,

  // Upstream/system errors (5xxx)
  UPSTREAM_AUTH_FAILED: 5001,
  UPSTREAM_DATABASE_ERROR: 5002,
  UPSTREAM_STORAGE_ERROR: 5003,
  UPSTREAM_UNKNOWN_ERROR: 5004,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Maps numeric error codes to i18n keys for translation lookup.
 */
export const ErrorCodeToKey: Record<ErrorCodeValue, string> = {
  [ErrorCode.AUTH_TOKEN_INVALID]: "api.errors.auth.token_invalid",
  [ErrorCode.AUTH_MISSING_TOKEN]: "api.errors.auth.missing_token",
  [ErrorCode.AUTH_SESSION_EXPIRED]: "api.errors.auth.session_expired",
  [ErrorCode.AUTH_UNAUTHORIZED]: "api.errors.auth.unauthorized",
  [ErrorCode.AUTH_MISSING_REFRESH_TOKEN]:
    "api.errors.auth.missing_refresh_token",
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: "api.errors.auth.invalid_credentials",
  [ErrorCode.AUTH_EMAIL_NOT_CONFIRMED]: "api.errors.auth.email_not_confirmed",
  [ErrorCode.AUTH_USER_EXISTS]: "api.errors.auth.user_exists",
  [ErrorCode.AUTH_FORBIDDEN]: "api.errors.auth.forbidden",
  [ErrorCode.AUTH_MISSING_CODE]: "api.errors.auth.missing_code",

  [ErrorCode.VALIDATION_INVALID_INPUT]: "api.errors.validation.invalid_input",

  [ErrorCode.PROFILE_NOT_FOUND]: "api.errors.profile.not_found",
  [ErrorCode.PROFILE_UPDATE_FAILED]: "api.errors.profile.update_failed",
  [ErrorCode.PROFILE_AVATAR_UPLOAD_FAILED]:
    "api.errors.profile.avatar_upload_failed",
  [ErrorCode.PROFILE_INVALID_LOCALE]: "api.errors.profile.invalid_locale",
  [ErrorCode.PROFILE_MISSING_FILE]: "api.errors.profile.missing_file",
  [ErrorCode.PROFILE_INVALID_FILE]: "api.errors.profile.invalid_file",

  [ErrorCode.REQUEST_INVALID_JSON]: "api.errors.request.invalid_json",
  [ErrorCode.REQUEST_INVALID_REQUEST]: "api.errors.request.invalid_request",
  [ErrorCode.REQUEST_NOT_FOUND]: "api.errors.request.not_found",
  [ErrorCode.REQUEST_RATE_LIMITED]: "api.errors.request.rate_limited",
  [ErrorCode.REQUEST_PAYLOAD_TOO_LARGE]: "api.errors.request.payload_too_large",

  [ErrorCode.UPSTREAM_AUTH_FAILED]: "api.errors.upstream.auth_failed",
  [ErrorCode.UPSTREAM_DATABASE_ERROR]: "api.errors.upstream.database_error",
  [ErrorCode.UPSTREAM_STORAGE_ERROR]: "api.errors.upstream.storage_error",
  [ErrorCode.UPSTREAM_UNKNOWN_ERROR]: "api.errors.upstream.unknown_error",
};

/**
 * Fallback messages when translations fail to load.
 */
export const ErrorCodeFallbacks: Record<ErrorCodeValue, string> = {
  [ErrorCode.AUTH_TOKEN_INVALID]: "Invalid or expired token",
  [ErrorCode.AUTH_MISSING_TOKEN]: "Missing authentication token",
  [ErrorCode.AUTH_SESSION_EXPIRED]: "Your session has expired",
  [ErrorCode.AUTH_UNAUTHORIZED]: "Unauthorized",
  [ErrorCode.AUTH_MISSING_REFRESH_TOKEN]: "Missing refresh token",
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: "Invalid email or password",
  [ErrorCode.AUTH_EMAIL_NOT_CONFIRMED]: "Email not confirmed",
  [ErrorCode.AUTH_USER_EXISTS]: "An account with this email already exists",
  [ErrorCode.AUTH_FORBIDDEN]: "Forbidden",
  [ErrorCode.AUTH_MISSING_CODE]: "Missing authorization code",

  [ErrorCode.VALIDATION_INVALID_INPUT]: "Invalid input data",

  [ErrorCode.PROFILE_NOT_FOUND]: "Profile not found",
  [ErrorCode.PROFILE_UPDATE_FAILED]: "Failed to update profile",
  [ErrorCode.PROFILE_AVATAR_UPLOAD_FAILED]: "Failed to upload avatar",
  [ErrorCode.PROFILE_INVALID_LOCALE]: "Invalid language preference",
  [ErrorCode.PROFILE_MISSING_FILE]: "No file provided",
  [ErrorCode.PROFILE_INVALID_FILE]: "Invalid file",

  [ErrorCode.REQUEST_INVALID_JSON]: "Invalid JSON in request body",
  [ErrorCode.REQUEST_INVALID_REQUEST]: "Invalid request",
  [ErrorCode.REQUEST_NOT_FOUND]: "Resource not found",
  [ErrorCode.REQUEST_RATE_LIMITED]: "Too many requests. Please try again later",
  [ErrorCode.REQUEST_PAYLOAD_TOO_LARGE]: "Request payload too large",

  [ErrorCode.UPSTREAM_AUTH_FAILED]: "Authentication failed",
  [ErrorCode.UPSTREAM_DATABASE_ERROR]: "Database error",
  [ErrorCode.UPSTREAM_STORAGE_ERROR]: "Storage error",
  [ErrorCode.UPSTREAM_UNKNOWN_ERROR]: "An unexpected error occurred",
};

/**
 * Check if an error code indicates the token is invalid and requires re-authentication.
 */
export function isTokenInvalidCode(code: number | null | undefined): boolean {
  return code === ErrorCode.AUTH_TOKEN_INVALID;
}

/**
 * Check if an error code is an authentication error.
 */
export function isAuthErrorCode(code: number | null | undefined): boolean {
  if (code === null || code === undefined) return false;
  return code >= 1001 && code <= 1099;
}
