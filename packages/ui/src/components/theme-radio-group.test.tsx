import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeRadioGroup } from "./theme-radio-group";

describe("ThemeRadioGroup", () => {
  it("renders all theme options", () => {
    render(<ThemeRadioGroup value="system" onChange={() => {}} />);

    expect(screen.getByText(/System/)).toBeInTheDocument();
    expect(screen.getByText(/Light/)).toBeInTheDocument();
    expect(screen.getByText(/Dark/)).toBeInTheDocument();
  });

  it("shows correct selected theme", () => {
    const { container } = render(
      <ThemeRadioGroup value="light" onChange={() => {}} />,
    );

    const lightRadio = container.querySelector(
      'input[value="light"]',
    ) as HTMLInputElement;
    const systemRadio = container.querySelector(
      'input[value="system"]',
    ) as HTMLInputElement;
    const darkRadio = container.querySelector(
      'input[value="dark"]',
    ) as HTMLInputElement;

    expect(lightRadio?.checked).toBe(true);
    expect(systemRadio?.checked).toBe(false);
    expect(darkRadio?.checked).toBe(false);
  });

  it("calls onChange when theme is selected", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ThemeRadioGroup value="system" onChange={onChange} />,
    );

    const darkRadio = container.querySelector(
      'input[value="dark"]',
    ) as HTMLInputElement;
    fireEvent.click(darkRadio);

    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("calls onChange with light theme", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ThemeRadioGroup value="dark" onChange={onChange} />,
    );

    const lightRadio = container.querySelector(
      'input[value="light"]',
    ) as HTMLInputElement;
    fireEvent.click(lightRadio);

    expect(onChange).toHaveBeenCalledWith("light");
  });

  it("calls onChange with system theme", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ThemeRadioGroup value="dark" onChange={onChange} />,
    );

    const systemRadio = container.querySelector(
      'input[value="system"]',
    ) as HTMLInputElement;
    fireEvent.click(systemRadio);

    expect(onChange).toHaveBeenCalledWith("system");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ThemeRadioGroup
        value="system"
        onChange={() => {}}
        className="custom-class"
      />,
    );

    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("uses custom name prop", () => {
    const { container } = render(
      <ThemeRadioGroup value="system" onChange={() => {}} name="custom-name" />,
    );

    const radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute("name", "custom-name");
    });
  });

  it("uses default name when not provided", () => {
    const { container } = render(
      <ThemeRadioGroup value="system" onChange={() => {}} />,
    );

    const radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute("name", "theme");
    });
  });

  it("applies selected styles to active theme", () => {
    const { container } = render(
      <ThemeRadioGroup value="dark" onChange={() => {}} />,
    );

    const darkRadio = container.querySelector('input[value="dark"]');
    const darkLabel = darkRadio?.closest("label");
    expect(darkLabel).toHaveClass("border-primary");
  });

  it("renders theme icons", () => {
    const { container } = render(
      <ThemeRadioGroup value="system" onChange={() => {}} />,
    );

    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(3);
  });
});
