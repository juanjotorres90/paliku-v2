import { describe, it, expect } from "vitest";
import { getCookieDomainForSharing } from "./cookie";

describe("getCookieDomainForSharing", () => {
  it("should return undefined for localhost", () => {
    expect(getCookieDomainForSharing("localhost")).toBeUndefined();
  });

  it("should return undefined for localhost subdomains", () => {
    expect(getCookieDomainForSharing("app.localhost")).toBeUndefined();
  });

  it("should return hostname for simple domains", () => {
    expect(getCookieDomainForSharing("example.com")).toBe("example.com");
  });

  it("should return parent domain for subdomains", () => {
    expect(getCookieDomainForSharing("sub.example.com")).toBe("example.com");
  });

  it("should return parent domain for 3-part domains", () => {
    expect(getCookieDomainForSharing("api.sub.example.com")).toBe(
      "sub.example.com",
    );
  });
});
