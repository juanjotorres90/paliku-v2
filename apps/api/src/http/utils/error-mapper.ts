import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  PayloadTooLargeError,
  ConflictError,
} from "../../shared/domain/errors";

export function mapErrorToStatus(error: unknown): number {
  if (error instanceof ValidationError) return 400;
  if (error instanceof AuthenticationError) return 401;
  if (error instanceof ForbiddenError) return 403;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  if (error instanceof PayloadTooLargeError) return 413;
  return 500;
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
