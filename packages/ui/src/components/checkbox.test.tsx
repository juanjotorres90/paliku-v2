import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a checkbox", () => {
    render(<Checkbox aria-label="Test checkbox" />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("is unchecked by default", () => {
    render(<Checkbox aria-label="Test checkbox" />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("can be checked", () => {
    render(<Checkbox aria-label="Test checkbox" defaultChecked />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("toggles on click", () => {
    render(<Checkbox aria-label="Test checkbox" />);
    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("supports disabled state", () => {
    render(<Checkbox aria-label="Test checkbox" disabled />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<Checkbox aria-label="Test checkbox" className="custom-checkbox" />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveClass("custom-checkbox");
  });

  it("applies default styling classes", () => {
    render(<Checkbox aria-label="Test checkbox" />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveClass("peer", "h-4", "w-4", "rounded-sm", "border");
  });

  it("forwards ref", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Checkbox ref={ref} aria-label="Test checkbox" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("calls onCheckedChange when toggled", () => {
    let checked = false;
    const handleChange = (value: boolean) => {
      checked = value;
    };

    render(
      <Checkbox aria-label="Test checkbox" onCheckedChange={handleChange} />,
    );

    fireEvent.click(screen.getByRole("checkbox"));
    expect(checked).toBe(true);
  });
});
