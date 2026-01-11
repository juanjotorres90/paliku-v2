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
