import { render, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { Gradient } from "./gradient";

describe("Gradient", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a span element", () => {
    const { container } = render(<Gradient />);
    const span = container.querySelector("span");
    expect(span).toBeInTheDocument();
  });

  it("applies base classes", () => {
    const { container } = render(<Gradient />);
    const span = container.querySelector("span");
    expect(span).toHaveClass(
      "absolute",
      "mix-blend-normal",
      "will-change-[filter]",
      "rounded-[100%]",
    );
  });

  it("applies large blur by default", () => {
    const { container } = render(<Gradient />);
    const span = container.querySelector("span");
    expect(span).toHaveClass("blur-[75px]");
  });

  it("applies small blur when small prop is true", () => {
    const { container } = render(<Gradient small />);
    const span = container.querySelector("span");
    expect(span).toHaveClass("blur-[32px]");
  });

  it("applies non-conic gradient by default", () => {
    const { container } = render(<Gradient />);
    const span = container.querySelector("span");
    expect(span).toHaveClass("bg-gradient-to-br");
  });

  it("applies conic gradient when conic prop is true", () => {
    const { container } = render(<Gradient conic />);
    const span = container.querySelector("span");
    expect(span).toHaveClass("bg-gradient-to-r");
  });

  it("accepts custom className", () => {
    const { container } = render(<Gradient className="custom-gradient" />);
    const span = container.querySelector("span");
    expect(span).toHaveClass("custom-gradient");
  });

  it("combines small and conic props", () => {
    const { container } = render(<Gradient small conic />);
    const span = container.querySelector("span");
    expect(span).toHaveClass("blur-[32px]", "bg-gradient-to-r");
  });
});
