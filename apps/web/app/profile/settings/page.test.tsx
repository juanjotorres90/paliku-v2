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

// Helper to create fetch mock with sequential responses
function createFetchMock(
  responses: Array<
    | { type: "resolve"; value: Partial<Response> }
    | { type: "reject"; error: unknown }
  >,
) {
  let callIndex = 0;
  return vi.fn().mockImplementation(() => {
    const response = responses[callIndex];
    callIndex++;
    if (!response) {
      return Promise.reject(new Error("No more mock responses configured"));
    }
    if (response.type === "reject") {
      return Promise.reject(response.error);
    }
    return Promise.resolve(response.value as Response);
  });
}

// Create a success profile load response
const profileLoadResponse = () => ({
  type: "resolve" as const,
  value: {
    status: 200,
    ok: true,
    json: () => Promise.resolve(mockProfileData),
  },
});

describe("ProfileSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    cleanup();
    vi.restoreAllMocks();
    await new Promise((r) => setTimeout(r, 0));
  });

  // Initial Load Tests
  it("shows loading state initially", () => {
    globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));
    render(<ProfileSettingsPage />);
    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });

  it("redirects to login when user is not authenticated (401)", async () => {
    globalThis.fetch = createFetchMock([
      { type: "resolve", value: { status: 401, ok: false } },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/login?redirect=%2Fprofile%2Fsettings",
      );
    });
  });

  it("shows error when API returns non-ok response", async () => {
    globalThis.fetch = createFetchMock([
      {
        type: "resolve",
        value: {
          status: 500,
          ok: false,
          text: () => Promise.resolve("Server error"),
        },
      },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByText("API error: 500 - Server error"),
      ).toBeInTheDocument();
    });
  });

  it("shows error when fetch throws an Error", async () => {
    globalThis.fetch = createFetchMock([
      { type: "reject", error: new Error("Network failure") },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Network failure")).toBeInTheDocument();
    });
  });

  it("shows error when fetch throws a non-Error", async () => {
    globalThis.fetch = createFetchMock([
      { type: "reject", error: "unknown error" },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch profile")).toBeInTheDocument();
    });
  });

  // Form Rendering Tests
  it("renders profile form when authenticated", async () => {
    globalThis.fetch = createFetchMock([profileLoadResponse()]);
    render(<ProfileSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Profile Settings" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Email")).toHaveValue("test@example.com");
    expect(screen.getByLabelText("Display name")).toHaveValue("Test User");
  });

  it("shows avatar fallback when no avatar URL", async () => {
    globalThis.fetch = createFetchMock([profileLoadResponse()]);
    render(<ProfileSettingsPage />);
    await waitFor(() => expect(screen.getByText("T")).toBeInTheDocument());
  });

  it("shows question mark fallback when displayName is empty", async () => {
    const profileWithEmptyName = {
      ...mockProfileData,
      profile: { ...mockProfileData.profile, displayName: "" },
    };
    globalThis.fetch = createFetchMock([
      {
        type: "resolve",
        value: {
          status: 200,
          ok: true,
          json: () => Promise.resolve(profileWithEmptyName),
        },
      },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() => expect(screen.getByText("?")).toBeInTheDocument());
  });

  it("shows character count for bio", async () => {
    const profileWithBio = {
      ...mockProfileData,
      profile: { ...mockProfileData.profile, bio: "Hello" },
    };
    globalThis.fetch = createFetchMock([
      {
        type: "resolve",
        value: {
          status: 200,
          ok: true,
          json: () => Promise.resolve(profileWithBio),
        },
      },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByText("5/500 characters")).toBeInTheDocument(),
    );
  });

  it("shows profile with avatar URL", async () => {
    const profileWithAvatar = {
      ...mockProfileData,
      profile: {
        ...mockProfileData.profile,
        avatarUrl: "https://example.com/avatar.jpg",
      },
    };
    globalThis.fetch = createFetchMock([
      {
        type: "resolve",
        value: {
          status: 200,
          ok: true,
          json: () => Promise.resolve(profileWithAvatar),
        },
      },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() => {
      expect(screen.getByRole("img")).toHaveAttribute(
        "src",
        "https://example.com/avatar.jpg",
      );
    });
  });

  // Form Interaction Tests
  it("updates bio field", async () => {
    globalThis.fetch = createFetchMock([profileLoadResponse()]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Bio")).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByLabelText("Bio"), {
      target: { value: "New bio text" },
    });
    expect(screen.getByLabelText("Bio")).toHaveValue("New bio text");
  });

  it("updates location field", async () => {
    globalThis.fetch = createFetchMock([profileLoadResponse()]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Location")).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "San Francisco" },
    });
    expect(screen.getByLabelText("Location")).toHaveValue("San Francisco");
  });

  it("toggles public profile checkbox", async () => {
    globalThis.fetch = createFetchMock([profileLoadResponse()]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Public profile")).toBeInTheDocument(),
    );
    const checkbox = screen.getByLabelText("Public profile");
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("toggles intent selection - add intent", async () => {
    globalThis.fetch = createFetchMock([profileLoadResponse()]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Friends" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Friends" }));
    expect(screen.getByRole("button", { name: "Friends" })).toBeInTheDocument();
  });

  it("toggles intent selection - remove intent", async () => {
    const profileWithMultipleIntents = {
      ...mockProfileData,
      profile: { ...mockProfileData.profile, intents: ["practice", "friends"] },
    };
    globalThis.fetch = createFetchMock([
      {
        type: "resolve",
        value: {
          status: 200,
          ok: true,
          json: () => Promise.resolve(profileWithMultipleIntents),
        },
      },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Practice" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Practice" }));
    expect(
      screen.getByRole("button", { name: "Practice" }),
    ).toBeInTheDocument();
  });

  it("limits intent selection to maximum 3", async () => {
    const profileWithAllIntents = {
      ...mockProfileData,
      profile: {
        ...mockProfileData.profile,
        intents: ["practice", "friends", "date"],
      },
    };
    globalThis.fetch = createFetchMock([
      {
        type: "resolve",
        value: {
          status: 200,
          ok: true,
          json: () => Promise.resolve(profileWithAllIntents),
        },
      },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Practice" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Friends" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Date" })).toBeInTheDocument();
    });
  });

  // Save Operation Tests
  it("handles profile save successfully", async () => {
    globalThis.fetch = createFetchMock([
      profileLoadResponse(),
      {
        type: "resolve",
        value: {
          status: 200,
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockProfileData,
              profile: { ...mockProfileData.profile, displayName: "Updated" },
            }),
        },
      },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Display name")).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(screen.getByText("Saving...")).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Save changes" }),
      ).toBeInTheDocument(),
    );
  });

  it("shows validation error when profile schema is invalid", async () => {
    globalThis.fetch = createFetchMock([profileLoadResponse()]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Display name")).toBeInTheDocument(),
    );

    // Set display name to just 1 char - too short for min(2)
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "a" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(screen.getByText(/Display name too short/i)).toBeInTheDocument(),
    );
  });

  it("handles profile save error", async () => {
    globalThis.fetch = createFetchMock([
      profileLoadResponse(),
      {
        type: "resolve",
        value: {
          status: 500,
          ok: false,
          text: () => Promise.resolve("Save failed"),
        },
      },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Display name")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(screen.getByText(/Failed to save profile/)).toBeInTheDocument(),
    );
  });

  it("handles profile save network error", async () => {
    globalThis.fetch = createFetchMock([
      profileLoadResponse(),
      { type: "reject", error: new Error("Network error") },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Display name")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(screen.getByText("Network error")).toBeInTheDocument(),
    );
  });

  it("handles profile save with non-Error throw", async () => {
    globalThis.fetch = createFetchMock([
      profileLoadResponse(),
      { type: "reject", error: "unknown error" },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Display name")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(screen.getByText("Failed to save profile")).toBeInTheDocument(),
    );
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
    globalThis.fetch = createFetchMock([
      profileLoadResponse(),
      {
        type: "resolve",
        value: {
          status: 200,
          ok: true,
          json: () => Promise.resolve(updatedProfile),
        },
      },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Avatar")).toBeInTheDocument(),
    );
    const file = new File(["test"], "avatar.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Avatar"), {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByText("Uploading...")).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.queryByText("Uploading...")).not.toBeInTheDocument(),
    );
  });

  it("handles avatar upload with no file selected", async () => {
    globalThis.fetch = createFetchMock([profileLoadResponse()]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Avatar")).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByLabelText("Avatar"), {
      target: { files: [] },
    });
    expect(screen.queryByText("Uploading...")).not.toBeInTheDocument();
  });

  it("handles avatar upload error", async () => {
    globalThis.fetch = createFetchMock([
      profileLoadResponse(),
      {
        type: "resolve",
        value: {
          status: 500,
          ok: false,
          text: () => Promise.resolve("Upload failed"),
        },
      },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Avatar")).toBeInTheDocument(),
    );
    const file = new File(["test"], "avatar.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Avatar"), {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByText(/Failed to upload avatar/)).toBeInTheDocument(),
    );
  });

  it("handles avatar upload network error", async () => {
    globalThis.fetch = createFetchMock([
      profileLoadResponse(),
      { type: "reject", error: new Error("Network error") },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Avatar")).toBeInTheDocument(),
    );
    const file = new File(["test"], "avatar.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Avatar"), {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByText("Network error")).toBeInTheDocument(),
    );
  });

  it("handles avatar upload with non-Error throw", async () => {
    globalThis.fetch = createFetchMock([
      profileLoadResponse(),
      { type: "reject", error: "unknown error" },
    ]);
    render(<ProfileSettingsPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Avatar")).toBeInTheDocument(),
    );
    const file = new File(["test"], "avatar.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Avatar"), {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByText("Failed to upload avatar")).toBeInTheDocument(),
    );
  });

  // Environment Config Tests
  it("uses environment variable for API URL", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "http://test-api:4000";
    const mockFetch = createFetchMock([profileLoadResponse()]);
    globalThis.fetch = mockFetch;
    render(<ProfileSettingsPage />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api:4000/profile/me",
        expect.any(Object),
      );
    });
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });
});
