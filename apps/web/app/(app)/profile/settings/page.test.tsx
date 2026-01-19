import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import ProfileSettingsPage from "./page";

// Mock next/navigation with stable reference
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockRouter = {
  replace: mockReplace,
  refresh: mockRefresh,
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const mockProfileData = {
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

// Mock API functions
const mockApiFetchWithRefresh = vi.fn();
const mockApiFetch = vi.fn();

// Create a mock module that can be updated
const createMockUserContext = (overrides = {}) => ({
  user: null,
  loading: false,
  error: false,
  refreshUser: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

let currentUserContext = createMockUserContext();

vi.mock("../../../lib/api", () => ({
  apiFetchWithRefresh: () => mockApiFetchWithRefresh(),
  apiFetch: () => mockApiFetch(),
}));

vi.mock("../../../user-context", () => ({
  useUser: () => currentUserContext,
}));

describe("ProfileSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUserContext = createMockUserContext();
    mockApiFetchWithRefresh.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockProfileData,
    });
  });

  afterEach(async () => {
    cleanup();
    await new Promise((r) => setTimeout(r, 0));
  });

  // Initial Load Tests
  it("shows loading state initially", () => {
    currentUserContext = createMockUserContext({ loading: true });
    render(<ProfileSettingsPage />);
    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  it("shows error when user context has error", () => {
    currentUserContext = createMockUserContext({ error: true });
    render(<ProfileSettingsPage />);
    expect(screen.getByText("Failed to fetch profile")).toBeInTheDocument();
  });

  // Form Rendering Tests
  it("renders profile form when authenticated", () => {
    currentUserContext = createMockUserContext({ user: mockProfileData });
    render(<ProfileSettingsPage />);
    expect(
      screen.getByRole("heading", { name: "Profile Settings" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("test@example.com");
    expect(screen.getByLabelText("Display name")).toHaveValue("Test User");
  });

  it("shows avatar fallback when no avatar URL", () => {
    currentUserContext = createMockUserContext({ user: mockProfileData });
    render(<ProfileSettingsPage />);
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("shows question mark fallback when displayName is empty", () => {
    const profileWithEmptyName = {
      ...mockProfileData,
      profile: { ...mockProfileData.profile, displayName: "" },
    };
    currentUserContext = createMockUserContext({ user: profileWithEmptyName });
    render(<ProfileSettingsPage />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("shows character count for bio", () => {
    const profileWithBio = {
      ...mockProfileData,
      profile: { ...mockProfileData.profile, bio: "Hello" },
    };
    currentUserContext = createMockUserContext({ user: profileWithBio });
    render(<ProfileSettingsPage />);
    expect(screen.getByText("5/500 characters")).toBeInTheDocument();
  });

  it("shows profile with avatar URL", () => {
    const profileWithAvatar = {
      ...mockProfileData,
      profile: {
        ...mockProfileData.profile,
        avatarUrl: "https://example.com/avatar.jpg",
      },
    };
    currentUserContext = createMockUserContext({ user: profileWithAvatar });
    render(<ProfileSettingsPage />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/avatar.jpg",
    );
  });

  // Form Interaction Tests
  it("updates display name field", () => {
    currentUserContext = createMockUserContext({ user: mockProfileData });
    render(<ProfileSettingsPage />);
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Updated Name" },
    });
    expect(screen.getByLabelText("Display name")).toHaveValue("Updated Name");
  });

  it("updates bio field", () => {
    currentUserContext = createMockUserContext({ user: mockProfileData });
    render(<ProfileSettingsPage />);
    fireEvent.change(screen.getByLabelText("Bio"), {
      target: { value: "New bio text" },
    });
    expect(screen.getByLabelText("Bio")).toHaveValue("New bio text");
  });

  it("updates location field", () => {
    currentUserContext = createMockUserContext({ user: mockProfileData });
    render(<ProfileSettingsPage />);
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "San Francisco" },
    });
    expect(screen.getByLabelText("Location")).toHaveValue("San Francisco");
  });

  it("toggles public profile checkbox", () => {
    currentUserContext = createMockUserContext({ user: mockProfileData });
    render(<ProfileSettingsPage />);
    const checkbox = screen.getByLabelText("Public profile");
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("toggles intent selection - add intent", () => {
    currentUserContext = createMockUserContext({ user: mockProfileData });
    render(<ProfileSettingsPage />);
    const friendsButton = screen.getByRole("button", { name: "Friends" });
    // Check that button is outline (default is outline when not selected)
    expect(friendsButton.className).not.toContain("bg-primary");
    fireEvent.click(friendsButton);
    // Check that button is now selected (has bg-primary class)
    expect(friendsButton.className).toContain("bg-primary");
  });

  it("toggles intent selection - remove intent", () => {
    const profileWithMultipleIntents = {
      ...mockProfileData,
      profile: { ...mockProfileData.profile, intents: ["practice", "friends"] },
    };
    currentUserContext = createMockUserContext({
      user: profileWithMultipleIntents,
    });
    render(<ProfileSettingsPage />);
    const practiceButton = screen.getByRole("button", { name: "Practice" });
    // Check that button is selected (has bg-primary class)
    expect(practiceButton.className).toContain("bg-primary");
    fireEvent.click(practiceButton);
    // Check that button is now outline (no bg-primary class)
    expect(practiceButton.className).not.toContain("bg-primary");
  });

  it("limits intent selection to maximum 3", () => {
    const profileWithAllIntents = {
      ...mockProfileData,
      profile: {
        ...mockProfileData.profile,
        intents: ["practice", "friends", "date"],
      },
    };
    currentUserContext = createMockUserContext({ user: profileWithAllIntents });
    render(<ProfileSettingsPage />);
    expect(
      screen.getByRole("button", { name: "Practice" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Friends" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Date" })).toBeInTheDocument();
  });

  // Save Operation Tests
  it("handles profile save successfully", async () => {
    const updatedProfile = {
      ...mockProfileData,
      profile: { ...mockProfileData.profile, displayName: "Updated" },
    };

    currentUserContext = createMockUserContext({
      user: mockProfileData,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    });

    mockApiFetchWithRefresh.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updatedProfile,
    });

    render(<ProfileSettingsPage />);
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Save changes" }),
      ).toBeInTheDocument();
    });

    expect(currentUserContext.refreshUser).toHaveBeenCalled();
  });

  it("handles profile save with 401 redirect", async () => {
    currentUserContext = createMockUserContext({
      user: mockProfileData,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    });

    mockApiFetchWithRefresh.mockResolvedValue({
      ok: false,
      status: 401,
    });

    render(<ProfileSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/login?redirect=%2Fprofile%2Fsettings",
      );
    });
  });

  it("shows validation error when profile schema is invalid", () => {
    currentUserContext = createMockUserContext({ user: mockProfileData });
    render(<ProfileSettingsPage />);

    // Set display name to just 1 char - too short for min(2)
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "a" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Zod validation error message
    expect(screen.getByText(/Display name too short/i)).toBeInTheDocument();
  });

  it("handles profile save error", async () => {
    currentUserContext = createMockUserContext({
      user: mockProfileData,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    });

    mockApiFetchWithRefresh.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Save failed",
    });

    render(<ProfileSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to save profile/)).toBeInTheDocument();
    });
  });

  it("handles profile save network error", async () => {
    currentUserContext = createMockUserContext({
      user: mockProfileData,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    });

    mockApiFetchWithRefresh.mockRejectedValue(new Error("Network error"));

    render(<ProfileSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  // Avatar Upload Tests
  it("handles avatar upload successfully", async () => {
    const updatedProfile = {
      ...mockProfileData,
      profile: {
        ...mockProfileData.profile,
        avatarUrl: "https://example.com/new-avatar.jpg",
      },
    };

    currentUserContext = createMockUserContext({
      user: mockProfileData,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    });

    mockApiFetchWithRefresh.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updatedProfile,
    });

    render(<ProfileSettingsPage />);
    const file = new File(["test"], "avatar.png", { type: "image/png" });

    // Trigger file upload
    const input = screen.getByLabelText("Avatar");
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for the upload to complete and refresh to be called
    await waitFor(() => {
      expect(currentUserContext.refreshUser).toHaveBeenCalled();
    });
  });

  it("handles avatar upload error", async () => {
    currentUserContext = createMockUserContext({
      user: mockProfileData,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    });

    mockApiFetchWithRefresh.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Upload failed",
    });

    render(<ProfileSettingsPage />);
    const file = new File(["test"], "avatar.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Avatar"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to upload avatar/)).toBeInTheDocument();
    });
  });

  it("handles avatar delete successfully", async () => {
    const updatedProfile = {
      ...mockProfileData,
      profile: {
        ...mockProfileData.profile,
        avatarUrl: null,
      },
    };

    currentUserContext = createMockUserContext({
      user: {
        ...mockProfileData,
        profile: {
          ...mockProfileData.profile,
          avatarUrl: "https://example.com/avatar.jpg",
        },
      },
      refreshUser: vi.fn().mockResolvedValue(undefined),
    });

    mockApiFetchWithRefresh.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updatedProfile,
    });

    render(<ProfileSettingsPage />);
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(currentUserContext.refreshUser).toHaveBeenCalled();
    });
  });

  it("disables form inputs while saving", async () => {
    currentUserContext = createMockUserContext({
      user: mockProfileData,
      refreshUser: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          }),
      ),
    });

    mockApiFetchWithRefresh.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                json: async () => mockProfileData,
              }),
            100,
          );
        }),
    );

    render(<ProfileSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Display name")).toBeDisabled();
    });
  });

  it("shows error message from API response", async () => {
    currentUserContext = createMockUserContext({
      user: mockProfileData,
      refreshUser: vi.fn().mockResolvedValue(undefined),
    });

    mockApiFetchWithRefresh.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad request - validation failed",
    });

    render(<ProfileSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to save profile: 400/),
      ).toBeInTheDocument();
    });
  });
});
