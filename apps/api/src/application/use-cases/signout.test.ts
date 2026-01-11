import { describe, it, expect } from "vitest";
import { signout } from "./signout";

describe("signout", () => {
  it("should return ok: true", async () => {
    const result = await signout({}, {});
    expect(result).toEqual({ ok: true });
  });
});
