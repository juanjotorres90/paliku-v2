import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders an input element", () => {
    render(<Input data-testid="test-input" />);
    expect(screen.getByTestId("test-input")).toBeInTheDocument();
    expect(screen.getByTestId("test-input").tagName).toBe("INPUT");
  });

  it("applies default styles", () => {
    render(<Input data-testid="test-input" />);
    const input = screen.getByTestId("test-input");
    expect(input).toHaveClass("flex", "h-10", "w-full", "rounded-md");
  });

  it("accepts custom className", () => {
    render(<Input data-testid="test-input" className="custom-class" />);
    const input = screen.getByTestId("test-input");
    expect(input).toHaveClass("custom-class");
  });

  it("supports different input types", () => {
    render(<Input data-testid="test-input" type="email" />);
    const input = screen.getByTestId("test-input");
    expect(input).toHaveAttribute("type", "email");
  });

  it("supports password type", () => {
    render(<Input data-testid="test-input" type="password" />);
    const input = screen.getByTestId("test-input");
    expect(input).toHaveAttribute("type", "password");
  });

  it("supports placeholder", () => {
    render(<Input placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
  });

  it("supports disabled state", () => {
    render(<Input data-testid="test-input" disabled />);
    const input = screen.getByTestId("test-input");
    expect(input).toBeDisabled();
  });

  it("supports required attribute", () => {
    render(<Input data-testid="test-input" required />);
    const input = screen.getByTestId("test-input");
    expect(input).toBeRequired();
  });

  it("forwards ref", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} data-testid="test-input" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("supports value and onChange", () => {
    const handleChange = () => {};
    render(
      <Input
        data-testid="test-input"
        value="test value"
        onChange={handleChange}
      />,
    );
    const input = screen.getByTestId("test-input");
    expect(input).toHaveValue("test value");
  });
});
