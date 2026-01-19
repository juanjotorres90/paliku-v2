import { getCookieDomainForSharing } from "./cookie";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  audience: string;
  jwtSecret?: string;
  jwtAlgs: string[];
}

export interface CorsConfig {
  allowedOrigins: string[];
}

export interface CookieConfig {
  domain?: string;
  projectRef: string;
}

export interface AppConfig {
  supabase: SupabaseConfig;
  cors: CorsConfig;
  cookie: CookieConfig;
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
