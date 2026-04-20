import { describe, expect, it, vi } from "vitest";
import type {
  AuthProviderPort,
  JWTVerifierPort,
} from "../modules/auth/application/ports";
import type { PKCEHelpers } from "../modules/auth/domain/pkce";
import type {
  PeopleRepositoryPort,
  UserLanguagesRepositoryPort,
} from "../modules/people/application/ports";
import type {
  AvatarStoragePort,
  ProfileRepositoryPort,
  UserEmailPort,
} from "../modules/profile/application/ports";
import type { SettingsRepositoryPort } from "../modules/settings/application/ports";
import type { AppConfig } from "../server/config";
import { createHttpApp } from "./app";

describe("createHttpApp", () => {
  const mockContext: {
    config: AppConfig;
    authProvider: AuthProviderPort;
    jwtVerifier: JWTVerifierPort;
    pkceHelpers: PKCEHelpers;
    profileRepo: ProfileRepositoryPort;
    avatarStorage: AvatarStoragePort;
    userEmail: UserEmailPort;
    settingsRepo: SettingsRepositoryPort;
    peopleRepo: PeopleRepositoryPort;
    languagesRepo: UserLanguagesRepositoryPort;
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
    settingsRepo: {
      getById: vi.fn(),
      updateById: vi.fn(),
    } as unknown as SettingsRepositoryPort,
    peopleRepo: {
      discover: vi.fn(),
      getRequests: vi.fn(),
      getPartners: vi.fn(),
      getPersonById: vi.fn(),
      createRequest: vi.fn(),
      respondToRequest: vi.fn(),
      cancelRequest: vi.fn(),
    } as unknown as PeopleRepositoryPort,
    languagesRepo: {
      getForUser: vi.fn(),
      getForUsers: vi.fn(),
      replaceForUser: vi.fn(),
    } as unknown as UserLanguagesRepositoryPort,
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
