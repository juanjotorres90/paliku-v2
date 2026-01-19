import type { AppConfig } from "./config";
import { buildConfig } from "./config";
import { createHttpApp } from "../http/app";
import { createFetchHttpClient } from "../shared/infrastructure/http-client";
import { createSupabaseAuthAdapter } from "../modules/auth/infrastructure/supabase-auth.adapter";
import { createJWTVerifier } from "../modules/auth/infrastructure/jwt-verifier.adapter";
import { createPKCEHelpers } from "../modules/auth/infrastructure/pkce-crypto.adapter";
import { createSupabaseProfileRepo } from "../modules/profile/infrastructure/supabase-profile.repo";
import { createSupabaseAvatarStorage } from "../modules/profile/infrastructure/supabase-avatar-storage.adapter";
import { createAuthUserEmailPort } from "../modules/profile/infrastructure/user-email.adapter";

export interface CreateAppOptions {
  config?: AppConfig;
}

export function createApp(options: CreateAppOptions = {}) {
  const config = options.config ?? buildConfig();

  const httpClient = createFetchHttpClient();
  const authProvider = createSupabaseAuthAdapter(config.supabase, httpClient);
  const jwtVerifier = createJWTVerifier(config.supabase);
  const pkceHelpers = createPKCEHelpers();
  const profileRepo = createSupabaseProfileRepo(config.supabase, httpClient);
  const avatarStorage = createSupabaseAvatarStorage(config.supabase);
  const userEmail = createAuthUserEmailPort(authProvider);

  return createHttpApp({
    config,
    authProvider,
    jwtVerifier,
    pkceHelpers,
    profileRepo,
    avatarStorage,
    userEmail,
  });
}
