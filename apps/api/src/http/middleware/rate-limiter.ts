import { createMiddleware } from "hono/factory";
import { RateLimitError } from "../../shared/domain/errors";
import type { RouteEnv } from "../context";
import { getT } from "../utils/i18n";
import {
  ErrorCode,
  ErrorCodeToKey,
  ErrorCodeFallbacks,
} from "@repo/validators/error-codes";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const stores = new Map<string, RateLimitStore>();

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of stores.entries()) {
    if (value.resetTime < now) {
      stores.delete(key);
    }
  }
}

export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
}) {
  return createMiddleware<RouteEnv>(async (c, next) => {
    const ip =
      c.req.header("CF-Connecting-IP") ||
      c.req.header("X-Forwarded-For")?.split(",")[0] ||
      c.req.header("X-Real-IP") ||
      "unknown";

    const key = `${ip}:${c.req.path}`;
    const now = Date.now();

    const store = stores.get(key);
    if (!store || store.resetTime < now) {
      stores.set(key, { count: 1, resetTime: now + options.windowMs });
      await next();
      return;
    }

    if (store.count >= options.limit) {
      const error = new RateLimitError(
        "Too many requests. Please try again later.",
        Math.ceil((store.resetTime - now) / 1000),
      );
      const t = getT(c);
      const code = ErrorCode.REQUEST_RATE_LIMITED;
      const errorKey = ErrorCodeToKey[code];
      const translated = t(errorKey);
      return c.json(
        {
          error:
            translated === errorKey ? ErrorCodeFallbacks[code] : translated,
          code,
          retryAfter: error.retryAfter,
        },
        429,
      );
    }

    store.count++;
    await next();

    if (Math.random() < 0.01) {
      cleanupExpiredEntries();
    }
  });
}
