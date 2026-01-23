import { Hono } from "hono";
import { handle } from "hono/vercel";

// Use Node.js runtime since we need node:crypto for PKCE helpers
export const runtime = "nodejs";

// Dynamic route to disable static generation
export const dynamic = "force-dynamic";

// Lazy singleton - only created when first request arrives
let app: Hono | null = null;
let appPromise: Promise<Hono> | null = null;

async function getApp(): Promise<Hono> {
  if (app) return app;

  if (!appPromise) {
    appPromise = (async () => {
      // Dynamic import using relative path from apps/web to apps/api
      // This avoids path alias resolution issues at runtime
      const { createApp } = await import("../../../../api/src/app");
      const apiApp = createApp();

      // Create a wrapper app with /api basePath
      const wrapper = new Hono().basePath("/api");
      wrapper.route("/", apiApp);

      app = wrapper;
      return wrapper;
    })();
  }

  return appPromise;
}

// Create handlers that lazily initialize the app
export const GET = async (req: Request) => {
  const resolvedApp = await getApp();
  return handle(resolvedApp)(req);
};

export const POST = async (req: Request) => {
  const resolvedApp = await getApp();
  return handle(resolvedApp)(req);
};

export const PATCH = async (req: Request) => {
  const resolvedApp = await getApp();
  return handle(resolvedApp)(req);
};

export const PUT = async (req: Request) => {
  const resolvedApp = await getApp();
  return handle(resolvedApp)(req);
};

export const DELETE = async (req: Request) => {
  const resolvedApp = await getApp();
  return handle(resolvedApp)(req);
};

export const OPTIONS = async (req: Request) => {
  const resolvedApp = await getApp();
  return handle(resolvedApp)(req);
};
