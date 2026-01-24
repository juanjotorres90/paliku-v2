import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Home", () => {
  it("renders the welcome section", async () => {
    const { default: Home } = await import("./page");

    const ui = await Home();
    render(ui);

    expect(
      screen.getByRole("heading", { name: "Welcome back!" }),
    ).toBeInTheDocument();
  });

  it("renders quick action buttons", async () => {
    const { default: Home } = await import("./page");

    const ui = await Home();
    render(ui);

    expect(screen.getAllByText("Find a Partner").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Practice Now").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Schedule Session").length).toBeGreaterThan(0);
  });

  it("renders activity feed section", async () => {
    const { default: Home } = await import("./page");

    const ui = await Home();
    render(ui);

    expect(
      screen.getAllByRole("heading", { name: "Activity Feed" }).length,
    ).toBeGreaterThan(0);
  });

  it("renders multiple feed items", async () => {
    const { default: Home } = await import("./page");

    const ui = await Home();
    render(ui);

    const feedItems = screen.getAllByText(/Post content goes here/);
    expect(feedItems.length).toBeGreaterThan(0);
  });

  it("renders feed interaction buttons", async () => {
    const { default: Home } = await import("./page");

    const ui = await Home();
    render(ui);

    expect(
      screen.getAllByRole("button", { name: "Like" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Comment" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Share" }).length,
    ).toBeGreaterThan(0);
  });

  it("renders progress stats section", async () => {
    const { default: Home } = await import("./page");

    const ui = await Home();
    render(ui);

    expect(
      screen.getAllByRole("heading", { name: "Your Progress" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Languages Learning").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Connections").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Practice Hours").length).toBeGreaterThan(0);
  });

  it("renders suggested partners section", async () => {
    const { default: Home } = await import("./page");

    const ui = await Home();
    render(ui);

    expect(
      screen.getAllByRole("heading", { name: "Suggested Partners" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("View all suggestions →").length,
    ).toBeGreaterThan(0);
  });

  it("renders upcoming sessions section", async () => {
    const { default: Home } = await import("./page");

    const ui = await Home();
    render(ui);

    expect(
      screen.getAllByRole("heading", { name: "Upcoming Sessions" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Spanish Practice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Japanese Conversation").length).toBeGreaterThan(
      0,
    );
  });

  it("displays language tags on feed items", async () => {
    const { default: Home } = await import("./page");

    const ui = await Home();
    render(ui);

    expect(screen.getAllByText("English").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Spanish").length).toBeGreaterThan(0);
  });
});
