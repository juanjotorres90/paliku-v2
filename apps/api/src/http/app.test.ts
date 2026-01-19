import { describe, it, expect, vi } from "vitest";
import { createHttpApp } from "./app";
import type {
  JWTVerifierPort,
  AuthProviderPort,
} from "../modules/auth/application/ports";
import type { PKCEHelpers } from "../modules/auth/domain/pkce";
import type { AppConfig } from "../server/config";
import type {
  AvatarStoragePort,
  ProfileRepositoryPort,
  UserEmailPort,
} from "../modules/profile/application/ports";

describe("createHttpApp", () => {
  const mockContext: {
    config: AppConfig;
    authProvider: AuthProviderPort;
    jwtVerifier: JWTVerifierPort;
    pkceHelpers: PKCEHelpers;
    profileRepo: ProfileRepositoryPort;
    avatarStorage: AvatarStoragePort;
    userEmail: UserEmailPort;
  } = {
    config: {
      supabase: {
        url: "https://example.supabase.co",
        anonKey: "anon-key",
        audience: "authenticated",
        jwtSecret: undefined,
        jwtAlgs: [],
      },
      cors: {
        allowedOrigins: ["http://localhost:3000"],
      },
      cookie: {
        domain: "localhost",
        projectRef: "test-project",
      },
    },
    jwtVerifier: {
      verify: vi.fn(),
    } as unknown as JWTVerifierPort,
    pkceHelpers: {
      randomBytes: vi.fn(),
      createHash: vi.fn(),
    } as unknown as PKCEHelpers,
    authProvider: {
      signup: vi.fn(),
      login: vi.fn(),
      refreshSession: vi.fn(),
      exchangeAuthCodeForTokens: vi.fn(),
      getUser: vi.fn(),
    } as unknown as AuthProviderPort,
    profileRepo: {
      getById: vi.fn(),
      updateById: vi.fn(),
      updateAvatarUrl: vi.fn(),
    } as unknown as ProfileRepositoryPort,
    avatarStorage: {
      uploadAvatar: vi.fn(),
    } as unknown as AvatarStoragePort,
    userEmail: {
      getEmailForAccessToken: vi.fn(),
    } as unknown as UserEmailPort,
  };

  it("should create app with root endpoint", async () => {
    const app = createHttpApp(mockContext);
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });

  it("should mount /auth routes", async () => {
    const app = createHttpApp(mockContext);
    const res = await app.request("/auth/signout", {
      method: "POST",
      headers: { Origin: "http://localhost:3000" },
    });
    expect(res.status).toBe(200);
  });
});
