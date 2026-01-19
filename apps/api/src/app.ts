import type { AppConfig } from "./server/config";
import { createApp as createServerApp } from "./server/createApp";

export interface CreateAppOptions {
  /**
   * Override the default config builder.
   * Useful for testing or custom deployment environments.
   */
  config?: AppConfig;
}

/**
 * Creates and returns the Hono app instance.
 * This factory can be used by both:
 * - Bun standalone server (apps/api)
 * - Next.js API route handler via hono/vercel adapter (apps/web)
 */
export function createApp(options: CreateAppOptions = {}) {
  return createServerApp(options);
}

export type { AppConfig };
