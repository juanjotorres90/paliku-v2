import { describe, it, expect, vi } from "vitest";
import { parseJsonBody } from "./parse-json";
import type { Context } from "hono";

describe("parseJsonBody", () => {
  it("should parse valid JSON body", async () => {
    const mockContext = {
      req: {
        json: vi.fn().mockResolvedValue({ key: "value" }),
      },
    } as unknown as Context;

    const result = await parseJsonBody(mockContext);

    expect(result).toEqual({ ok: true, value: { key: "value" } });
    expect(mockContext.req.json).toHaveBeenCalledTimes(1);
  });

  it("should return ok: false when JSON parsing fails", async () => {
    const mockContext = {
      req: {
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      },
    } as unknown as Context;

    const result = await parseJsonBody(mockContext);

    expect(result).toEqual({ ok: false });
    expect(mockContext.req.json).toHaveBeenCalledTimes(1);
  });

  it("should handle empty body", async () => {
    const mockContext = {
      req: {
        json: vi.fn().mockResolvedValue({}),
      },
    } as unknown as Context;

    const result = await parseJsonBody(mockContext);

    expect(result).toEqual({ ok: true, value: {} });
  });
});
