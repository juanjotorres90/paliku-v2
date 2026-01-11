import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a textarea element", () => {
    render(<Textarea data-testid="test-textarea" />);
    expect(screen.getByTestId("test-textarea")).toBeInTheDocument();
    expect(screen.getByTestId("test-textarea").tagName).toBe("TEXTAREA");
  });

  it("applies default styles", () => {
    render(<Textarea data-testid="test-textarea" />);
    const textarea = screen.getByTestId("test-textarea");
    expect(textarea).toHaveClass(
      "flex",
      "min-h-[80px]",
      "w-full",
      "rounded-md",
    );
  });

  it("accepts custom className", () => {
    render(<Textarea data-testid="test-textarea" className="custom-class" />);
    const textarea = screen.getByTestId("test-textarea");
    expect(textarea).toHaveClass("custom-class");
  });

  it("supports placeholder", () => {
    render(<Textarea placeholder="Enter description..." />);
    expect(
      screen.getByPlaceholderText("Enter description..."),
    ).toBeInTheDocument();
  });

  it("supports disabled state", () => {
    render(<Textarea data-testid="test-textarea" disabled />);
    const textarea = screen.getByTestId("test-textarea");
    expect(textarea).toBeDisabled();
  });

  it("supports required attribute", () => {
    render(<Textarea data-testid="test-textarea" required />);
    const textarea = screen.getByTestId("test-textarea");
    expect(textarea).toBeRequired();
  });

  it("forwards ref", () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<Textarea ref={ref} data-testid="test-textarea" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("supports value and onChange", () => {
    const handleChange = () => {};
    render(
      <Textarea
        data-testid="test-textarea"
        value="test value"
        onChange={handleChange}
      />,
    );
    const textarea = screen.getByTestId("test-textarea");
    expect(textarea).toHaveValue("test value");
  });

  it("supports rows attribute", () => {
    render(<Textarea data-testid="test-textarea" rows={5} />);
    const textarea = screen.getByTestId("test-textarea");
    expect(textarea).toHaveAttribute("rows", "5");
  });

  it("supports maxLength attribute", () => {
    render(<Textarea data-testid="test-textarea" maxLength={500} />);
    const textarea = screen.getByTestId("test-textarea");
    expect(textarea).toHaveAttribute("maxLength", "500");
  });
});
