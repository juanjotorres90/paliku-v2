import { describe, it, expect } from "vitest";
import { createPKCEHelpers } from "./pkce-crypto.adapter";

describe("createPKCEHelpers", () => {
  it("should create PKCEHelpers with randomBytes and createHash functions", () => {
    const pkceHelpers = createPKCEHelpers();

    expect(pkceHelpers).toHaveProperty("randomBytes");
    expect(pkceHelpers).toHaveProperty("createHash");
    expect(typeof pkceHelpers.randomBytes).toBe("function");
    expect(typeof pkceHelpers.createHash).toBe("function");
  });
});
