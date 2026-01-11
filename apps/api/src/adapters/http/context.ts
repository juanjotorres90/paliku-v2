import type { AppConfig } from "../../domain/config";
import type { PKCEHelpers } from "../../domain/pkce";
import type {
  JWTVerifierPort,
  SupabaseAuthPort,
} from "../../application/ports";
import type { HttpClient } from "../http-client";
import type { StorageClient } from "../storage-client";
import * as useCases from "../../application/index";

export interface RouteContext {
  config: AppConfig;
  jwtVerifier: JWTVerifierPort;
  useCases: typeof useCases;
  pkceHelpers: PKCEHelpers;
  supabaseAuth: SupabaseAuthPort;
  httpClient: HttpClient;
  storageClient: StorageClient;
}

export interface RouteVariables {
  jwtPayload?: { sub?: string; aud?: string; role?: string };
  accessToken?: string;
}

export type RouteEnv = {
  Variables: RouteVariables;
};
