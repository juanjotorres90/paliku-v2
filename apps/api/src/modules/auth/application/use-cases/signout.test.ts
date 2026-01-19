import { describe, it, expect } from "vitest";
import { signout } from "./signout";

describe("signout", () => {
  it("should return ok", async () => {
    await expect(signout({}, {})).resolves.toEqual({ ok: true });
  });
});
