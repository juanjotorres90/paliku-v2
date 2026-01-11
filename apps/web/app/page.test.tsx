import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./me-widget", () => ({
  MeWidget: () => <div data-testid="me-widget" />,
}));

describe("Home", () => {
  it("renders the main heading and widget placeholder", async () => {
    const { default: Home } = await import("./page");

    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Web App" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("me-widget")).toBeInTheDocument();
  });
});
