import type { PeopleDiscoverResponse } from "@repo/validators/people";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock apiFetchWithRefresh
vi.mock("../../lib/api", () => ({
  apiFetchWithRefresh: vi.fn(),
  apiFetcher: vi.fn(),
  ErrorCode: {},
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/people",
}));

// Mock next/image
vi.mock("next/image", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: ({ fill, priority, ...rest }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...rest} />
  ),
}));

const mockDiscoverResponse: PeopleDiscoverResponse = {
  items: [
    {
      id: "user-1",
      displayName: "Test User 1",
      location: "Tokyo, Japan",
      bio: "Hello world",
      avatarUrl: null,
      updatedAt: "2024-01-01T00:00:00Z",
      intents: ["practice"],
      speaks: [{ languageCode: "japanese", level: "native" }],
      learning: [{ languageCode: "english", level: "beginner" }],
      relationshipStatus: null,
      relationshipId: null,
      isRequester: null,
    },
  ],
  nextCursor: null,
};

// Mock SWR
vi.mock("swr", () => ({
  default: (key: string | null) => {
    if (key?.startsWith("/people?")) {
      return {
        data: mockDiscoverResponse,
        isLoading: false,
        mutate: vi.fn(),
      };
    }
    return { data: undefined, isLoading: false, mutate: vi.fn() };
  },
}));

describe("PeoplePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    const inputs = screen.getAllByPlaceholderText(
      "Search by name, language, or location...",
    );
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("renders tab navigation", async () => {
    const { default: PeoplePage } = await import("./page");
    render(<PeoplePage />);

    expect(screen.getAllByText("Discover").length).toBeGreaterThan(0);
    expect(screen.getAllByText("My Partners").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Requests").length).toBeGreaterThan(0);
  });

  it("shows person card with name and languages", async () => {
    const { default: PeoplePage } = await import("./page");
    render(<PeoplePage />);

    expect(screen.getAllByText("Test User 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tokyo, Japan").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Japanese/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/English/).length).toBeGreaterThan(0);
  });

  it("shows connect button for users without relationship", async () => {
    const { default: PeoplePage } = await import("./page");
    render(<PeoplePage />);

    const connectButtons = screen.getAllByRole("button", { name: "Connect" });
    expect(connectButtons.length).toBeGreaterThan(0);
  });

  it("shows filter dropdowns", async () => {
    const { default: PeoplePage } = await import("./page");
    render(<PeoplePage />);

    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(3);
  });
});
