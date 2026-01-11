import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MeWidget } from "./me-widget";

// Mock next/navigation
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

// Mock global fetch
const mockFetch = vi.fn();

describe("MeWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    cleanup();
  });

  it("shows loading state initially", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<MeWidget />);
    expect(screen.getByText("Loading /me...")).toBeInTheDocument();
  });

  it("shows error state when user is not authenticated (401)", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 401,
      ok: false,
    });

    render(<MeWidget />);

    await waitFor(() => {
      expect(screen.getByText("Not authenticated")).toBeInTheDocument();
    });

    // Should show logout button in error state
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("shows error state when API returns non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 500,
      ok: false,
      text: () => Promise.resolve("Server error"),
    });

    render(<MeWidget />);

    await waitFor(() => {
      expect(
        screen.getByText("API error: 500 - Server error"),
      ).toBeInTheDocument();
    });
  });

  it("shows error state when fetch throws an Error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    render(<MeWidget />);

    await waitFor(() => {
      expect(screen.getByText("Network failure")).toBeInTheDocument();
    });
  });

  it("shows error state when fetch throws a non-Error", async () => {
    mockFetch.mockRejectedValueOnce("unknown error");

    render(<MeWidget />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch /me")).toBeInTheDocument();
    });
  });

  it("shows authenticated user data", async () => {
    const userData = {
      userId: "user-123",
      aud: "authenticated",
      role: "user",
    };

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: () => Promise.resolve(userData),
    });

    render(<MeWidget />);

    await waitFor(() => {
      expect(screen.getByText("GET /me response:")).toBeInTheDocument();
    });

    expect(screen.getByText(/"userId": "user-123"/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Profile Settings" }),
    ).toBeInTheDocument();
  });

  it("handles logout when authenticated", async () => {
    const userData = { userId: "user-123" };

    mockFetch
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve(userData),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
      });

    render(<MeWidget />);

    await waitFor(() => {
      expect(screen.getByText("GET /me response:")).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole("button", { name: "Logout" });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByText("Logging out...")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("handles logout from error state", async () => {
    mockFetch
      .mockResolvedValueOnce({
        status: 401,
        ok: false,
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
      });

    render(<MeWidget />);

    await waitFor(() => {
      expect(screen.getByText("Not authenticated")).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole("button", { name: "Logout" });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("handles logout error gracefully", async () => {
    const userData = { userId: "user-123" };

    mockFetch
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve(userData),
      })
      .mockRejectedValueOnce(new Error("Logout failed"));

    render(<MeWidget />);

    await waitFor(() => {
      expect(screen.getByText("GET /me response:")).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole("button", { name: "Logout" });
    fireEvent.click(logoutButton);

    // Should show logging out and then reset to normal logout button
    await waitFor(() => {
      expect(screen.getByText("Logging out...")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Logout" }),
      ).toBeInTheDocument();
    });
  });

  it("uses custom API URL from environment variable", async () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "http://test-api:4000";

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ userId: "test" }),
    });

    render(<MeWidget />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("http://test-api:4000/me", {
        credentials: "include",
      });
    });

    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });
});
