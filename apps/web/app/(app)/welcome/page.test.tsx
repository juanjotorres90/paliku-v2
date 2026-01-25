import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

type MockUser = {
  email: string;
  profile: {
    id: string;
    displayName: string;
    bio: string;
    location: string;
    intents: string[];
    isPublic: boolean;
    avatarUrl: string | null;
    updatedAt: string;
  };
  settings: { locale: string; theme: "system" };
} | null;

// Mock next/navigation with stable references
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();
const mockRouter = {
  replace: mockReplace,
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

// Mock the user context
let mockUser: MockUser = {
  email: "test@example.com",
  profile: {
    id: "123",
    displayName: "Test User",
    bio: "",
    location: "",
    intents: [],
    isPublic: true,
    avatarUrl: null,
    updatedAt: "",
  },
  settings: { locale: "en", theme: "system" as const },
};
let mockLoading = false;

vi.mock("../../user-context", () => ({
  useUser: () => ({ user: mockUser, loading: mockLoading }),
}));

describe("WelcomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockUser = {
      email: "test@example.com",
      profile: {
        id: "123",
        displayName: "Test User",
        bio: "",
        location: "",
        intents: [],
        isPublic: true,
        avatarUrl: null,
        updatedAt: "",
      },
      settings: { locale: "en", theme: "system" as const },
    };
    mockLoading = false;
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the welcome screen", async () => {
    const { default: WelcomePage } = await import("./page");
    render(<WelcomePage />);

    expect(
      screen.getByRole("heading", { name: "Welcome!" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your account has been created/),
    ).toBeInTheDocument();
  });

  it("displays user display name when loaded", async () => {
    const { default: WelcomePage } = await import("./page");
    render(<WelcomePage />);

    expect(screen.getByText("Hi, Test User!")).toBeInTheDocument();
  });

  it("shows loading skeleton while user data is loading", async () => {
    mockLoading = true;

    const { default: WelcomePage } = await import("./page");
    render(<WelcomePage />);

    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("navigates to next parameter when Continue is clicked", async () => {
    mockSearchParams = new URLSearchParams("next=/people");

    const { default: WelcomePage } = await import("./page");
    render(<WelcomePage />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/people");
    });
  });

  it("navigates to / when next parameter is missing", async () => {
    const { default: WelcomePage } = await import("./page");
    render(<WelcomePage />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("sanitizes unsafe next parameter", async () => {
    mockSearchParams = new URLSearchParams("next=//evil.com");

    const { default: WelcomePage } = await import("./page");
    render(<WelcomePage />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("shows Complete your profile button", async () => {
    const { default: WelcomePage } = await import("./page");
    render(<WelcomePage />);

    const profileLink = screen.getByRole("link", {
      name: "Complete your profile",
    });
    expect(profileLink).toHaveAttribute("href", "/profile/settings");
  });

  it("handles user without display name", async () => {
    mockUser = {
      email: "test@example.com",
      profile: {
        id: "123",
        displayName: "",
        bio: "",
        location: "",
        intents: [],
        isPublic: true,
        avatarUrl: null,
        updatedAt: "",
      },
      settings: { locale: "en", theme: "system" as const },
    };

    const { default: WelcomePage } = await import("./page");
    render(<WelcomePage />);

    expect(screen.queryByText(/Hi,/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Welcome!" }),
    ).toBeInTheDocument();
  });

  it("handles null user", async () => {
    mockUser = null;

    const { default: WelcomePage } = await import("./page");
    render(<WelcomePage />);

    expect(screen.queryByText(/Hi,/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Welcome!" }),
    ).toBeInTheDocument();
  });
});
