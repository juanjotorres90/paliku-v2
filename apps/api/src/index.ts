import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";

const jwtSecret = process.env.SUPABASE_JWT_SECRET;
if (!jwtSecret) {
  throw new Error("Missing SUPABASE_JWT_SECRET environment variable");
}

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
const allowedOrigins = corsOrigin.split(",").map((o) => o.trim());

const app = new Hono();

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
app.use("/me", jwt({ secret: jwtSecret }));

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
