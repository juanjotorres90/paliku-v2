import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a div element", () => {
    render(<Skeleton data-testid="test-skeleton" />);
    expect(screen.getByTestId("test-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("test-skeleton").tagName).toBe("DIV");
  });

  it("applies default animation class", () => {
    render(<Skeleton data-testid="test-skeleton" />);
    const skeleton = screen.getByTestId("test-skeleton");
    expect(skeleton).toHaveClass("animate-pulse");
  });

  it("applies default styling classes", () => {
    render(<Skeleton data-testid="test-skeleton" />);
    const skeleton = screen.getByTestId("test-skeleton");
    expect(skeleton).toHaveClass("rounded-md", "bg-muted");
  });

  it("accepts custom className", () => {
    render(<Skeleton data-testid="test-skeleton" className="h-4 w-full" />);
    const skeleton = screen.getByTestId("test-skeleton");
    expect(skeleton).toHaveClass("h-4", "w-full");
  });

  it("passes through additional props", () => {
    render(
      <Skeleton data-testid="test-skeleton" aria-label="Loading content" />,
    );
    const skeleton = screen.getByTestId("test-skeleton");
    expect(skeleton).toHaveAttribute("aria-label", "Loading content");
  });

  it("can be used with custom dimensions", () => {
    render(<Skeleton data-testid="test-skeleton" className="h-12 w-12" />);
    const skeleton = screen.getByTestId("test-skeleton");
    expect(skeleton).toHaveClass("h-12", "w-12");
  });

  it("maintains base classes when custom className is provided", () => {
    render(<Skeleton data-testid="test-skeleton" className="custom-class" />);
    const skeleton = screen.getByTestId("test-skeleton");
    expect(skeleton).toHaveClass(
      "animate-pulse",
      "rounded-md",
      "bg-muted",
      "custom-class",
    );
  });
});
