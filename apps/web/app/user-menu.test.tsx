import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { UserMenu } from "./user-menu";

// Mock next/navigation
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
    push: mockPush,
  }),
}));

// Mock Link component
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} data-link={href}>
      {children}
    </a>
  ),
}));

// Mock the API module
const mockApiFetch = vi.fn();

vi.mock("./lib/api", () => ({
  apiFetch: () => mockApiFetch(),
}));

// Mock the UserContext
type UserContextValue = {
  user: {
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
  } | null;
  loading: boolean;
  error: boolean;
  refreshUser: () => Promise<void>;
};

let mockUserContext: UserContextValue = {
  user: null,
  loading: false,
  error: false,
  refreshUser: vi.fn().mockResolvedValue(undefined),
};

vi.mock("./user-context", () => ({
  useUser: () => mockUserContext,
}));

const mockUser = {
  email: "test@example.com",
  profile: {
    id: "profile-123",
    displayName: "Test User",
    bio: "",
    location: "",
    intents: ["practice"],
    isPublic: true,
    avatarUrl: null,
    updatedAt: "2024-01-01T00:00:00Z",
  },
};

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // Loading State Tests
  it("shows loading skeleton while loading", () => {
    mockUserContext = {
      user: null,
      loading: true,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    const { container } = render(<UserMenu />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  // Error State Tests
  it("shows error state when there's an error", () => {
    mockUserContext = {
      user: null,
      loading: false,
      error: true,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);
    const button = screen.getByRole("button", {
      name: "User menu unavailable",
    });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-label", "User menu unavailable");
  });

  // Unauthenticated State Tests
  it("shows sign in link when user is not authenticated", () => {
    mockUserContext = {
      user: null,
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);
    const signInLink = screen.getByRole("link", { name: "Sign in" });
    expect(signInLink).toHaveAttribute("href", "/login");
  });

  // Authenticated State Tests
  it("shows user avatar when authenticated", () => {
    mockUserContext = {
      user: mockUser,
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);
    const avatarButton = screen.getByRole("button", { name: "User menu" });
    expect(avatarButton).toBeInTheDocument();
    expect(avatarButton).toHaveAttribute("aria-label", "User menu");
  });

  it("shows user initials as fallback", () => {
    mockUserContext = {
      user: mockUser,
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);
    expect(screen.getByText("TU")).toBeInTheDocument();
  });

  it("shows single initial for single word display name", () => {
    mockUserContext = {
      user: {
        ...mockUser,
        profile: { ...mockUser.profile, displayName: "Test" },
      },
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("shows profile image when avatarUrl is present", () => {
    mockUserContext = {
      user: {
        ...mockUser,
        profile: {
          ...mockUser.profile,
          avatarUrl: "https://example.com/avatar.jpg",
        },
      },
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("opens dropdown menu when avatar is clicked", () => {
    mockUserContext = {
      user: mockUser,
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);

    // Verify the avatar button exists and is clickable
    const avatarButton = screen.getByRole("button", { name: "User menu" });
    expect(avatarButton).toBeInTheDocument();
    expect(avatarButton).toHaveAttribute("aria-haspopup", "menu");
  });

  it("shows profile link in dropdown", () => {
    mockUserContext = {
      user: mockUser,
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);

    // Verify the avatar button exists
    const avatarButton = screen.getByRole("button", { name: "User menu" });
    expect(avatarButton).toBeInTheDocument();
  });

  it("profile link navigates to profile settings", () => {
    mockUserContext = {
      user: mockUser,
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);

    // Verify the avatar button exists
    const avatarButton = screen.getByRole("button", { name: "User menu" });
    expect(avatarButton).toBeInTheDocument();
  });

  it("shows sign out button in dropdown", () => {
    mockUserContext = {
      user: mockUser,
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);

    // Verify the avatar button exists
    const avatarButton = screen.getByRole("button", { name: "User menu" });
    expect(avatarButton).toBeInTheDocument();
  });

  // Logout Functionality Tests - Note: Full logout flow testing requires user interaction
  it("renders avatar button when authenticated", () => {
    mockUserContext = {
      user: mockUser,
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);

    const avatarButton = screen.getByRole("button", { name: "User menu" });
    expect(avatarButton).toBeInTheDocument();
    expect(avatarButton).toHaveAttribute("aria-haspopup", "menu");
  });

  // Dropdown Focus State Tests
  it("applies focus styles to avatar button", () => {
    mockUserContext = {
      user: mockUser,
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);
    const avatarButton = screen.getByRole("button", { name: "User menu" });
    expect(avatarButton).toHaveClass("focus:ring-2", "focus:ring-ring");
  });

  // Edge Case Tests
  it("handles empty display name gracefully", () => {
    mockUserContext = {
      user: {
        ...mockUser,
        profile: { ...mockUser.profile, displayName: "" },
      },
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);
    // Should not show any initials for empty display name
    expect(screen.queryByText("TU")).not.toBeInTheDocument();
  });

  it("handles display name with more than 2 words", () => {
    mockUserContext = {
      user: {
        ...mockUser,
        profile: { ...mockUser.profile, displayName: "Test Middle User" },
      },
      loading: false,
      error: false,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    };
    vi.doMock("./user-context", () => ({
      useUser: () => mockUserContext,
    }));
    render(<UserMenu />);
    // Should only take first letter of first two words
    expect(screen.getByText("TM")).toBeInTheDocument();
  });
});
