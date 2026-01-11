import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { Code } from "./code";

describe("Code", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders code element with children", () => {
    render(<Code>const x = 1;</Code>);
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("renders as a code element", () => {
    render(<Code>test</Code>);
    const codeElement = screen.getByText("test");
    expect(codeElement.tagName).toBe("CODE");
  });

  it("applies default font-mono class", () => {
    render(<Code>code</Code>);
    const codeElement = screen.getByText("code");
    expect(codeElement).toHaveClass("font-mono");
  });

  it("applies default styling classes", () => {
    render(<Code>styled</Code>);
    const codeElement = screen.getByText("styled");
    expect(codeElement).toHaveClass(
      "px-1.5",
      "py-0.5",
      "rounded",
      "font-semibold",
    );
  });

  it("accepts custom className", () => {
    render(<Code className="custom-code">custom</Code>);
    const codeElement = screen.getByText("custom");
    expect(codeElement).toHaveClass("custom-code");
  });

  it("renders complex children", () => {
    render(
      <Code>
        <span>nested</span> content
      </Code>,
    );
    expect(screen.getByText("nested")).toBeInTheDocument();
    expect(screen.getByText(/content/)).toBeInTheDocument();
  });
});
