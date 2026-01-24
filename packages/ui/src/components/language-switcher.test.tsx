import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageSwitcher } from "./language-switcher";

const mockOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
];

describe("LanguageSwitcher", () => {
  it("renders with all language options", () => {
    const { container } = render(
      <LanguageSwitcher value="en" onChange={() => {}} options={mockOptions} />,
    );

    const select = container.querySelector("select");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(screen.getByText("Français")).toBeInTheDocument();
  });

  it("shows selected value", () => {
    const { container } = render(
      <LanguageSwitcher value="es" onChange={() => {}} options={mockOptions} />,
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    expect(select?.value).toBe("es");
  });

  it("calls onChange when selection changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <LanguageSwitcher value="en" onChange={onChange} options={mockOptions} />,
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "fr" } });

    expect(onChange).toHaveBeenCalledWith("fr");
  });

  it("applies custom className", () => {
    const { container } = render(
      <LanguageSwitcher
        value="en"
        onChange={() => {}}
        options={mockOptions}
        className="custom-class"
      />,
    );

    const select = container.querySelector("select");
    expect(select).toHaveClass("custom-class");
  });

  it("uses custom id", () => {
    const { container } = render(
      <LanguageSwitcher
        value="en"
        onChange={() => {}}
        options={mockOptions}
        id="custom-id"
      />,
    );

    const select = container.querySelector("select");
    expect(select).toHaveAttribute("id", "custom-id");
  });

  it("uses custom name", () => {
    const { container } = render(
      <LanguageSwitcher
        value="en"
        onChange={() => {}}
        options={mockOptions}
        name="custom-name"
      />,
    );

    const select = container.querySelector("select");
    expect(select).toHaveAttribute("name", "custom-name");
  });

  it("uses default id when not provided", () => {
    const { container } = render(
      <LanguageSwitcher value="en" onChange={() => {}} options={mockOptions} />,
    );

    const select = container.querySelector("select");
    expect(select).toHaveAttribute("id", "language-select");
  });

  it("uses default name when not provided", () => {
    const { container } = render(
      <LanguageSwitcher value="en" onChange={() => {}} options={mockOptions} />,
    );

    const select = container.querySelector("select");
    expect(select).toHaveAttribute("name", "language");
  });
});
