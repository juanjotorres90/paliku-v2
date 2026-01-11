import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders with the provided label", () => {
    render(<Button>Save changes</Button>);

    expect(
      screen.getByRole("button", { name: "Save changes" })
    ).toBeInTheDocument();
  });

  it("applies the default variant styles", () => {
    render(<Button>Default</Button>);

    expect(screen.getByRole("button", { name: "Default" })).toHaveClass(
      "bg-primary"
    );
  });
});
