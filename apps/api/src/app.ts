import type {
  AppConfig,
  SupabaseConfig,
  CorsConfig,
  CookieConfig,
} from "./domain/config";
import { getCookieDomainForSharing } from "./domain/cookie";
import { createPKCEHelpers } from "./adapters/crypto";
import { createFetchHttpClient } from "./adapters/http-client";
import { createSupabaseAuthAdapter } from "./adapters/supabase-auth";
import { createJWTVerifier } from "./adapters/jwt-verifier";
import { createHttpApp } from "./adapters/http/app";
import { createStorageClient } from "./adapters/storage-client";
import * as useCases from "./application/index";
import type { RouteContext } from "./adapters/http/context";

export interface CreateAppOptions {
  /**
   * Override the default config builder.
   * Useful for testing or custom deployment environments.
   */
  config?: AppConfig;
}

export function buildConfig(): AppConfig {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL environment variable");
  }

  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    throw new Error("Missing SUPABASE_ANON_KEY environment variable");
  }

  const supabaseOrigin = new URL(supabaseUrl);
  const projectRef = supabaseOrigin.hostname.split(".")[0] || "default";

  const supabaseConfig: SupabaseConfig = {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    audience: process.env.SUPABASE_JWT_AUD ?? "authenticated",
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
    jwtAlgs: (process.env.SUPABASE_JWT_ALGS ?? "")
      .split(",")
      .map((alg) => alg.trim())
      .filter(Boolean),
  };

  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  const allowedOrigins = corsOrigin
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const corsConfig: CorsConfig = {
    allowedOrigins,
  };

  const cookieDomain =
    process.env.COOKIE_DOMAIN ??
    getCookieDomainForSharing(
      allowedOrigins[0] ? new URL(allowedOrigins[0]).hostname : "localhost",
    );

  const cookieConfig: CookieConfig = {
    domain: cookieDomain,
    projectRef,
  };

  return {
    supabase: supabaseConfig,
    cors: corsConfig,
    cookie: cookieConfig,
  };
}

export function createRouteContext(config: AppConfig): RouteContext {
  const pkceHelpers = createPKCEHelpers();
  const httpClient = createFetchHttpClient();
  const supabaseAuth = createSupabaseAuthAdapter(config.supabase, httpClient);
  const jwtVerifier = createJWTVerifier(config.supabase);
  const storageClient = createStorageClient(
    config.supabase.url,
    config.supabase.anonKey,
  );

  return {
    config,
    jwtVerifier,
    useCases,
    pkceHelpers,
    supabaseAuth,
    httpClient,
    storageClient,
  };
}

/**
 * Creates and returns the Hono app instance.
 * This factory can be used by both:
 * - Bun standalone server (apps/api)
 * - Next.js API route handler via hono/vercel adapter (apps/web)
 */
export function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? buildConfig();
  const routeCtx = createRouteContext(config);
  return createHttpApp(routeCtx);
}

export type { AppConfig, RouteContext };
