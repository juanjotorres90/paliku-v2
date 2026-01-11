import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has accessible label", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label");
  });

  it("applies custom className", () => {
    render(<ThemeToggle className="custom-toggle" />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-toggle");
  });

  it("renders placeholder while not mounted", () => {
    // The component renders a disabled placeholder before mounting
    render(<ThemeToggle />);
    // After first render, useEffect runs and mounts
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("cycles through themes on click", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    // Initially system - click to go to light
    fireEvent.click(button);
    expect(button).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Light"),
    );

    // Click to go to dark
    fireEvent.click(button);
    expect(button).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Dark"),
    );

    // Click to go back to system
    fireEvent.click(button);
    expect(button).toHaveAttribute(
      "aria-label",
      expect.stringContaining("System"),
    );
  });

  it("uses custom storage key", () => {
    render(<ThemeToggle storageKey="custom-theme" />);
    const button = screen.getByRole("button");

    // Click to change theme
    fireEvent.click(button);

    // Should use custom key
    expect(localStorage.getItem("custom-theme")).toBe("light");
  });

  it("initializes from localStorage", () => {
    localStorage.setItem("theme", "dark");
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Dark"),
    );
  });

  it("shows system icon for system theme", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    // System icon has a rect element (monitor shape)
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector("rect")).toBeInTheDocument();
  });

  it("shows sun icon for light theme", () => {
    localStorage.setItem("theme", "light");
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
    // Sun icon has a circle element
    expect(svg?.querySelector("circle")).toBeInTheDocument();
  });

  it("shows moon icon for dark theme", () => {
    localStorage.setItem("theme", "dark");
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
    // Moon icon has a path element
    expect(svg?.querySelector("path")).toBeInTheDocument();
  });

  it("applies theme to document on toggle", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    // Go to light
    fireEvent.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // Go to dark
    fireEvent.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
