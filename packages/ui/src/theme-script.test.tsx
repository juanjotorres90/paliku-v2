import { render, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { ThemeScript } from "./theme-script";

describe("ThemeScript", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a script element", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script).toBeInTheDocument();
  });

  it("contains theme initialization code", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("getSystemTheme");
    expect(script?.innerHTML).toContain("applyTheme");
    expect(script?.innerHTML).toContain("getResolvedTheme");
  });

  it("uses default storage key", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain('"theme"');
  });

  it("accepts custom storage key", () => {
    const { container } = render(<ThemeScript storageKey="custom-theme" />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain('"custom-theme"');
  });

  it("uses default theme of system", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain('"system"');
  });

  it("accepts custom default theme", () => {
    const { container } = render(<ThemeScript defaultTheme="dark" />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain('defaultTheme = "dark"');
  });

  it("accepts light as default theme", () => {
    const { container } = render(<ThemeScript defaultTheme="light" />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain('defaultTheme = "light"');
  });

  it("accepts nonce attribute", () => {
    const { container } = render(<ThemeScript nonce="abc123" />);
    const script = container.querySelector("script");
    expect(script).toHaveAttribute("nonce", "abc123");
  });

  it("contains localStorage access", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("localStorage.getItem");
  });

  it("contains matchMedia for system theme detection", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("matchMedia");
    expect(script?.innerHTML).toContain("prefers-color-scheme: dark");
  });

  it("sets up event listener for system theme changes", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    expect(script?.innerHTML).toContain("addEventListener");
    expect(script?.innerHTML).toContain("change");
  });
});
