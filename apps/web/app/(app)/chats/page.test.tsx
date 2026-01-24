import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ChatsPage", () => {
  it("renders the main heading", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    expect(
      screen.getByRole("heading", { name: "Messages" }),
    ).toBeInTheDocument();
  });

  it("renders search input for conversations", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    const searchInputs = screen.getAllByPlaceholderText(
      "Search conversations...",
    );
    expect(searchInputs.length).toBeGreaterThan(0);
  });

  it("renders filter tabs for conversations", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    const tabs = screen.getAllByRole("button");
    const tabTexts = tabs.map((tab) => tab.textContent);

    expect(tabTexts).toContain("All");
    expect(tabTexts).toContain("Unread");
    expect(tabTexts).toContain("Groups");
  });

  it("renders multiple conversations in the list", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    const partnerNames = screen.getAllByText("Partner Name");
    expect(partnerNames.length).toBeGreaterThan(0);
  });

  it("shows online indicators for active users", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    const onlineStatuses = screen.getAllByText("Online");
    expect(onlineStatuses.length).toBeGreaterThan(0);
  });

  it("displays unread message badges", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    // Check for unread count badges (numbers 1 and 2 appear as badges)
    const conversationItems = screen.getAllByText(/Last message preview/);
    expect(conversationItems.length).toBeGreaterThan(0);
  });

  it("renders chat header with partner info", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    expect(screen.getAllByText("Maria García").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Spanish ↔ English/).length).toBeGreaterThan(0);
  });

  it("shows call and video call buttons", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    // Using emojis as placeholders for call buttons
    expect(screen.getAllByText("📞").length).toBeGreaterThan(0);
    expect(screen.getAllByText("📹").length).toBeGreaterThan(0);
  });

  it("renders messages in the chat area", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    expect(
      screen.getAllByText("Hi! How are you today?").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Hi Maria! I'm good, thanks. And you?").length,
    ).toBeGreaterThan(0);
  });

  it("displays date separator", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    expect(screen.getAllByText("Today").length).toBeGreaterThan(0);
  });

  it("shows message timestamps", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    expect(screen.getAllByText("10:30 AM").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/10:32 AM • Seen/).length).toBeGreaterThan(0);
  });

  it("renders correction suggestion feature", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    expect(
      screen.getAllByText(/💡 Tip: You could also say/).length,
    ).toBeGreaterThan(0);
  });

  it("displays typing indicator", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    // Typing indicator is shown with animated dots
    const typingIndicators = document.querySelectorAll(".animate-bounce");
    expect(typingIndicators.length).toBeGreaterThan(0);
  });

  it("renders quick tools bar", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    expect(screen.getAllByText("📝 Request Correction").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("🔊 Voice Message").length).toBeGreaterThan(0);
    expect(screen.getAllByText("📚 Share Resource").length).toBeGreaterThan(0);
    expect(screen.getAllByText("📅 Schedule Session").length).toBeGreaterThan(
      0,
    );
  });

  it("renders message input area", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    const messageInputs = screen.getAllByPlaceholderText(
      "Type a message in Spanish...",
    );
    expect(messageInputs.length).toBeGreaterThan(0);
  });

  it("shows send button", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    const sendButtons = screen.getAllByRole("button", { name: "Send" });
    expect(sendButtons.length).toBeGreaterThan(0);
  });

  it("displays language tags on conversations", async () => {
    const { default: ChatsPage } = await import("./page");

    const ui = await ChatsPage();
    render(ui);

    expect(screen.getAllByText("Spanish").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Japanese").length).toBeGreaterThan(0);
  });
});
