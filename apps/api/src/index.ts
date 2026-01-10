import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import * as jose from "jose";

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

const supabaseOrigin = new URL(supabaseUrl).origin;
const issuer = `${supabaseOrigin}/auth/v1`;
const audience = process.env.SUPABASE_JWT_AUD ?? "authenticated";
const jwtSecret = process.env.SUPABASE_JWT_SECRET;
const jwtAlgs = (process.env.SUPABASE_JWT_ALGS ?? "")
  .split(",")
  .map((alg) => alg.trim())
  .filter(Boolean);
const algorithms =
  jwtAlgs.length > 0 ? jwtAlgs : jwtSecret ? ["HS256"] : ["RS256", "ES256"];

const JWKS = jose.createRemoteJWKSet(
  new URL("/auth/v1/.well-known/jwks.json", supabaseOrigin)
);

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
const allowedOrigins = corsOrigin
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Custom JWT middleware
const jwtAuth = createMiddleware(async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  try {
    const verifyOptions = {
      issuer,
      audience,
      algorithms,
      clockTolerance: "5s",
    };
    const { payload } = jwtSecret
      ? await jose.jwtVerify(token, new TextEncoder().encode(jwtSecret), verifyOptions)
      : await jose.jwtVerify(token, JWKS, verifyOptions);
    if (!payload.sub) {
      return c.json({ error: "Invalid token" }, 401);
    }
    c.set("jwtPayload", payload);
    await next();
  } catch (err) {
    console.error("JWT verification failed");
    return c.json({ error: "Invalid token" }, 401);
  }
});

const app = new Hono<{ Variables: { jwtPayload: jose.JWTPayload } }>();

// CORS middleware
app.use(
  "*",
  cors({
    origin: allowedOrigins,
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
  })
);

// Health check (public)
app.get("/", (c) => {
  return c.text("ok");
});

// Protected /me endpoint
app.use("/me", jwtAuth);

app.get("/me", (c) => {
  const payload = c.get("jwtPayload");
  return c.json({
    userId: payload.sub,
    aud: payload.aud,
    role: payload.role,
  });
});

export default {
  port: 3002,
  fetch: app.fetch,
};
