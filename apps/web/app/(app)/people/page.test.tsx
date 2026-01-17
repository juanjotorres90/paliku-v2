import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("PeoplePage", () => {
  it("renders the main heading", async () => {
    const { default: PeoplePage } = await import("./page");

    render(<PeoplePage />);

    expect(
      screen.getByRole("heading", { name: "Find Language Partners" }),
    ).toBeInTheDocument();
  });

  it("renders search input", async () => {
    const { default: PeoplePage } = await import("./page");

    render(<PeoplePage />);

    const searchInputs = screen.getAllByPlaceholderText(
      "Search by name, language, or location...",
    );
    expect(searchInputs.length).toBeGreaterThan(0);
  });

  it("renders all filter dropdowns", async () => {
    const { default: PeoplePage } = await import("./page");

    render(<PeoplePage />);

    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(4); // Native Language, Learning Language, Proficiency Level, Availability
  });

  it("renders tab navigation", async () => {
    const { default: PeoplePage } = await import("./page");

    render(<PeoplePage />);

    const discoverButtons = screen.getAllByRole("button", { name: "Discover" });
    const myPartnersButtons = screen.getAllByRole("button", {
      name: /My Partners/,
    });
    expect(discoverButtons.length).toBeGreaterThan(0);
    expect(myPartnersButtons.length).toBeGreaterThan(0);
  });

  it("shows notification badge on Requests tab", async () => {
    const { default: PeoplePage } = await import("./page");

    render(<PeoplePage />);

    const requestsTabs = screen.getAllByRole("button", { name: /Requests/ });
    expect(requestsTabs.length).toBeGreaterThan(0);
    // Badge shows count of 3
    expect(requestsTabs[0]?.textContent).toContain("3");
  });

  it("renders multiple people cards", async () => {
    const { default: PeoplePage } = await import("./page");

    render(<PeoplePage />);

    const connectButtons = screen.getAllByRole("button", { name: "Connect" });
    expect(connectButtons.length).toBeGreaterThanOrEqual(6); // 6 people cards
  });

  it("shows online status indicators", async () => {
    const { default: PeoplePage } = await import("./page");

    render(<PeoplePage />);

    const onlineStatuses = screen.getAllByText("Online now");
    expect(onlineStatuses.length).toBeGreaterThan(0);
  });

  it("displays language information on cards", async () => {
    const { default: PeoplePage } = await import("./page");

    render(<PeoplePage />);

    expect(screen.getAllByText("Speaks").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Learning").length).toBeGreaterThan(0);
  });

  it("renders Connect and View Profile buttons for each card", async () => {
    const { default: PeoplePage } = await import("./page");

    render(<PeoplePage />);

    const connectButtons = screen.getAllByRole("button", { name: "Connect" });
    const viewProfileButtons = screen.getAllByRole("button", {
      name: "View Profile",
    });

    expect(connectButtons.length).toBeGreaterThanOrEqual(6);
    expect(viewProfileButtons.length).toBeGreaterThanOrEqual(6);
  });

  it("renders pagination controls", async () => {
    const { default: PeoplePage } = await import("./page");

    render(<PeoplePage />);

    const previousButtons = screen.getAllByRole("button", { name: "Previous" });
    const nextButtons = screen.getAllByRole("button", { name: "Next" });
    expect(previousButtons.length).toBeGreaterThan(0);
    expect(nextButtons.length).toBeGreaterThan(0);
    expect(screen.getAllByText("Page 1 of 10").length).toBeGreaterThan(0);
  });

  it("displays bio preview on cards", async () => {
    const { default: PeoplePage } = await import("./page");

    render(<PeoplePage />);

    expect(
      screen.getAllByText(/Hi! I'm looking for language exchange partners/)
        .length,
    ).toBeGreaterThan(0);
  });
});
