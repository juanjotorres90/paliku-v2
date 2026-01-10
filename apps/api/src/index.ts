import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import * as jose from "jose";

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

const jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
const allowedOrigins = corsOrigin.split(",").map((o) => o.trim());

// Custom JWT middleware using jose for ES256 verification
const jwtAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: "authenticated",
    });
    c.set("jwtPayload", payload);
    await next();
  } catch (err) {
    console.error("JWT verification failed:", err);
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
