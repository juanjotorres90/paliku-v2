import type { Context } from "hono";

export async function parseJsonBody<T = unknown>(
  c: Context,
): Promise<{ ok: true; value: T } | { ok: false }> {
  try {
    const value = (await c.req.json()) as T;
    return { ok: true, value };
  } catch {
    return { ok: false };
  }
}
