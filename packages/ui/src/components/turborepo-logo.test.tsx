import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { TurborepoLogo } from "./turborepo-logo";

describe("TurborepoLogo", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the Turbo logomark SVG", () => {
    render(<TurborepoLogo />);

    const logo = screen.getByRole("img", { name: /turbo logomark/i });
    expect(logo).toBeInTheDocument();
    expect(logo.tagName.toLowerCase()).toBe("svg");
  });

  it("has correct dimensions", () => {
    render(<TurborepoLogo />);

    const logo = screen.getByRole("img", { name: /turbo logomark/i });
    expect(logo).toHaveAttribute("width", "80");
    expect(logo).toHaveAttribute("height", "80");
  });

  it("has correct viewBox", () => {
    render(<TurborepoLogo />);

    const logo = screen.getByRole("img", { name: /turbo logomark/i });
    expect(logo).toHaveAttribute("viewBox", "0 0 40 40");
  });
});
