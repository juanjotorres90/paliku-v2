import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { createProfileRoutes } from "./routes";
import type { RouteEnv } from "../../../http/context";
import { createJwtAuth } from "../../auth/http/middleware/jwt-auth";
import type { JWTVerifierPort } from "../../auth/application/ports";
import type { AppConfig } from "../../../server/config";
import type {
  AvatarStoragePort,
  ProfileRepositoryPort,
  UserEmailPort,
} from "../application/ports";

describe("createProfileRoutes", () => {
  let mockContext: {
    config: AppConfig;
    profileRepo: ProfileRepositoryPort;
    storage: AvatarStoragePort;
    userEmail: UserEmailPort;
  };
  let mockJwtVerifier: JWTVerifierPort;

  beforeEach(() => {
    mockJwtVerifier = {
      verify: vi.fn().mockResolvedValue({
        sub: "user-123",
        aud: "authenticated",
        role: "authenticated",
      }),
    };

    mockContext = {
      config: {
        supabase: {
          url: "https://example.supabase.co",
          anonKey: "anon-key",
          audience: "authenticated",
          jwtSecret: "secret",
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
      profileRepo: {
        getById: vi.fn(),
        updateById: vi.fn(),
        updateAvatarUrl: vi.fn(),
      } as unknown as ProfileRepositoryPort,
      storage: {
        uploadAvatar: vi.fn(),
      } as unknown as AvatarStoragePort,
      userEmail: {
        getEmailForAccessToken: vi.fn().mockResolvedValue("test@example.com"),
      } as unknown as UserEmailPort,
    };
  });

  it("should return profile when authenticated", async () => {
    (
      mockContext.profileRepo.getById as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "user-123",
      displayName: "Test User",
      bio: "Test bio",
      location: "Test location",
      intents: [],
      isPublic: true,
      avatarUrl: null,
      updatedAt: "2024-01-01T00:00:00Z",
    });

    const app = new Hono<RouteEnv>();
    const jwtAuth = createJwtAuth(mockJwtVerifier, mockContext.config.cookie);
    app.route("/profile", createProfileRoutes(mockContext, jwtAuth));

    const res = await app.request("/profile/me", {
      headers: { Authorization: "Bearer valid-token" },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("email", "test@example.com");
    expect(data).toHaveProperty("profile");
  });

  it("should update profile", async () => {
    (
      mockContext.profileRepo.updateById as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "user-123",
      displayName: "New Name",
      bio: "Updated bio",
      location: "Updated location",
      intents: [],
      isPublic: true,
      avatarUrl: "https://example.com/avatar.jpg",
      updatedAt: "2024-01-02T00:00:00Z",
    });

    const app = new Hono<RouteEnv>();
    const jwtAuth = createJwtAuth(mockJwtVerifier, mockContext.config.cookie);
    app.route("/profile", createProfileRoutes(mockContext, jwtAuth));

    const res = await app.request("/profile/me", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName: "New Name",
        bio: "Updated bio",
        location: "Updated location",
        intents: ["practice"],
        isPublic: true,
      }),
    });

    expect(res.status).toBe(200);
    expect(mockContext.profileRepo.updateById).toHaveBeenCalled();
    const call = (
      mockContext.profileRepo.updateById as ReturnType<typeof vi.fn>
    ).mock.calls[0]![0];
    expect(call.data).not.toHaveProperty("avatarUrl");
  });

  it("should upload avatar", async () => {
    (
      mockContext.storage.uploadAvatar as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      avatarUrl: "https://example.com/avatar.jpg",
    });
    (
      mockContext.profileRepo.updateAvatarUrl as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      id: "user-123",
      displayName: "Test User",
      bio: "",
      location: "",
      intents: [],
      isPublic: true,
      avatarUrl: "https://example.com/avatar.jpg",
      updatedAt: "2024-01-02T00:00:00Z",
    });

    const app = new Hono<RouteEnv>();
    const jwtAuth = createJwtAuth(mockJwtVerifier, mockContext.config.cookie);
    app.route("/profile", createProfileRoutes(mockContext, jwtAuth));

    const formData = new FormData();
    formData.append(
      "file",
      new File(["content"], "avatar.jpg", { type: "image/jpeg" }),
    );

    const res = await app.request("/profile/avatar", {
      method: "POST",
      headers: { Authorization: "Bearer valid-token" },
      body: formData,
    });

    expect(res.status).toBe(200);
  });
});
