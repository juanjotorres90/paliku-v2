import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { ThemeProvider } from "./providers";

describe("ThemeProvider", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders children", () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("passes additional props to NextThemesProvider", () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div data-testid="themed-child">Themed Child</div>
      </ThemeProvider>,
    );

    expect(screen.getByTestId("themed-child")).toBeInTheDocument();
  });
});
