import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Home", () => {
  it("renders the main heading", async () => {
    const { default: Home } = await import("./page");

    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Web App" }),
    ).toBeInTheDocument();
  });
});
