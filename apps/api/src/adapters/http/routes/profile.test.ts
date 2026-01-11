import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { createProfileRoutes } from "./profile";
import type { RouteContext, RouteEnv } from "../context";
import type {
  JWTVerifierPort,
  SupabaseAuthPort,
} from "../../../application/ports";
import type { HttpClient } from "../../../adapters/http-client";
import type { PKCEHelpers } from "../../../domain/pkce";
import type { StorageClient } from "../../../adapters/storage-client";
import * as useCases from "../../../application/index";
import { createJwtAuth } from "../middleware/jwt-auth";

describe("createProfileRoutes", () => {
  let mockContext: RouteContext;
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
      jwtVerifier: mockJwtVerifier,
      useCases,
      pkceHelpers: {
        randomBytes: vi.fn(),
        createHash: vi.fn(),
      } as unknown as PKCEHelpers,
      supabaseAuth: {
        signup: vi.fn(),
        login: vi.fn(),
        refreshSession: vi.fn(),
        exchangeAuthCodeForTokens: vi.fn(),
        getUser: vi.fn().mockResolvedValue({ email: "test@example.com" }),
      } as unknown as SupabaseAuthPort,
      httpClient: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
      } as unknown as HttpClient,
      storageClient: {
        upload: vi.fn(),
      } as unknown as StorageClient,
    };
  });

  describe("GET /me", () => {
    it("should return 401 when not authenticated", async () => {
      (mockJwtVerifier.verify as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Invalid token"),
      );

      const app = new Hono<RouteEnv>();
      const jwtAuth = createJwtAuth(mockJwtVerifier, mockContext.config.cookie);
      app.route("/profile", createProfileRoutes(mockContext, jwtAuth));

      const res = await app.request("/profile/me", {
        headers: { Authorization: "Bearer invalid-token" },
      });

      expect(res.status).toBe(401);
    });

    it("should return profile when authenticated", async () => {
      (
        mockContext.httpClient.get as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              id: "user-123",
              display_name: "Test User",
              bio: "Test bio",
              location: "Test location",
              intents: [],
              is_public: true,
              avatar_url: null,
              updated_at: "2024-01-01T00:00:00Z",
            },
          ]),
        ),
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

    it("should return 500 when profile fetch fails", async () => {
      (
        mockContext.httpClient.get as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        ok: false,
        text: vi.fn().mockResolvedValue(""),
      });

      const app = new Hono<RouteEnv>();
      const jwtAuth = createJwtAuth(mockJwtVerifier, mockContext.config.cookie);
      app.route("/profile", createProfileRoutes(mockContext, jwtAuth));

      const res = await app.request("/profile/me", {
        headers: { Authorization: "Bearer valid-token" },
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });
  });

  describe("POST /me", () => {
    it("should return 401 when not authenticated", async () => {
      (mockJwtVerifier.verify as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Invalid token"),
      );

      const app = new Hono<RouteEnv>();
      const jwtAuth = createJwtAuth(mockJwtVerifier, mockContext.config.cookie);
      app.route("/profile", createProfileRoutes(mockContext, jwtAuth));

      const res = await app.request("/profile/me", {
        method: "POST",
        headers: {
          Authorization: "Bearer invalid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName: "New Name" }),
      });

      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid JSON", async () => {
      const app = new Hono<RouteEnv>();
      const jwtAuth = createJwtAuth(mockJwtVerifier, mockContext.config.cookie);
      app.route("/profile", createProfileRoutes(mockContext, jwtAuth));

      const res = await app.request("/profile/me", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid JSON body");
    });

    it("should return 400 for invalid request schema", async () => {
      const app = new Hono<RouteEnv>();
      const jwtAuth = createJwtAuth(mockJwtVerifier, mockContext.config.cookie);
      app.route("/profile", createProfileRoutes(mockContext, jwtAuth));

      const res = await app.request("/profile/me", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invalid: "data" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });

    it("should update profile when authenticated", async () => {
      (
        mockContext.httpClient.patch as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              id: "user-123",
              display_name: "New Name",
              bio: "Updated bio",
              location: "Updated location",
              intents: [],
              is_public: true,
              avatar_url: null,
              updated_at: "2024-01-02T00:00:00Z",
            },
          ]),
        ),
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
          avatarUrl: null,
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("profile");
    });

    it("should return 500 when profile update fails", async () => {
      (
        mockContext.httpClient.patch as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        ok: false,
        text: vi.fn().mockResolvedValue(""),
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
          bio: "",
          location: "",
          intents: ["friends"],
          isPublic: true,
          avatarUrl: null,
        }),
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });
  });

  describe("POST /avatar", () => {
    it("should return 401 when not authenticated", async () => {
      (mockJwtVerifier.verify as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Invalid token"),
      );

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
        headers: { Authorization: "Bearer invalid-token" },
        body: formData,
      });

      expect(res.status).toBe(401);
    });

    it("should return 400 when no file provided", async () => {
      const app = new Hono<RouteEnv>();
      const jwtAuth = createJwtAuth(mockJwtVerifier, mockContext.config.cookie);
      app.route("/profile", createProfileRoutes(mockContext, jwtAuth));

      const formData = new FormData();

      const res = await app.request("/profile/avatar", {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
        body: formData,
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("No file provided");
    });

    it("should return 400 when file is not a File instance", async () => {
      const app = new Hono<RouteEnv>();
      const jwtAuth = createJwtAuth(mockJwtVerifier, mockContext.config.cookie);
      app.route("/profile", createProfileRoutes(mockContext, jwtAuth));

      const formData = new FormData();
      formData.append("file", "not-a-file");

      const res = await app.request("/profile/avatar", {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
        body: formData,
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid file");
    });

    it("should upload avatar when authenticated", async () => {
      (
        mockContext.storageClient.upload as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        url: "https://example.com/avatar.jpg",
      });
      (
        mockContext.httpClient.patch as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(
          JSON.stringify([
            {
              id: "user-123",
              display_name: "Test User",
              bio: "",
              location: "",
              intents: [],
              is_public: true,
              avatar_url: "https://example.com/avatar.jpg",
              updated_at: "2024-01-02T00:00:00Z",
            },
          ]),
        ),
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
      const data = await res.json();
      expect(data).toHaveProperty("profile");
    });

    it("should return 500 when avatar upload fails", async () => {
      (
        mockContext.storageClient.upload as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error("Upload failed"));

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

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });
  });
});
