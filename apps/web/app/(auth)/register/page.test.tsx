import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock next/navigation with stable references
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
let mockSearchParams = new URLSearchParams();
const mockRouter = {
  replace: mockReplace,
  refresh: mockRefresh,
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

// Mock global fetch
const mockFetch = vi.fn();

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockSearchParams = new URLSearchParams();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the registration form", async () => {
    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", { name: "Create account" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeInTheDocument();
  });

  it("shows link to login page", async () => {
    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    const loginLink = screen.getByRole("link", { name: "Sign In" });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("shows link to login page with redirect param", async () => {
    mockSearchParams = new URLSearchParams("redirect=/dashboard");

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    const loginLink = screen.getByRole("link", { name: "Sign In" });
    expect(loginLink).toHaveAttribute("href", "/login?redirect=%2Fdashboard");
  });

  it("shows error when passwords do not match", async () => {
    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "different123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid email", async () => {
    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText("Email");
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });

    // Submit the form directly
    const form = emailInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
    });
  });

  it("handles successful registration with email confirmation", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({ needsEmailConfirmation: true })),
    });

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Check your email to confirm your account/),
      ).toBeInTheDocument();
    });
  });

  it("handles successful registration with auto-login", async () => {
    mockFetch
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({ needsEmailConfirmation: false })),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
      });

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("handles successful registration when auto-login fails", async () => {
    mockFetch
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () =>
          Promise.resolve(JSON.stringify({ needsEmailConfirmation: false })),
      })
      .mockResolvedValueOnce({
        status: 401,
        ok: false,
      });

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Account created successfully/),
      ).toBeInTheDocument();
    });
  });

  it("handles registration error with JSON error message", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 400,
      ok: false,
      text: () =>
        Promise.resolve(JSON.stringify({ error: "Email already exists" })),
    });

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });
  });

  it("handles registration error with invalid JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 400,
      ok: false,
      text: () => Promise.resolve("not valid json"),
    });

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to create account")).toBeInTheDocument();
    });
  });

  it("handles registration error with empty response", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 400,
      ok: false,
      text: () => Promise.resolve(""),
    });

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to create account")).toBeInTheDocument();
    });
  });

  it("handles network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(
        screen.getByText("An unexpected error occurred"),
      ).toBeInTheDocument();
    });
  });

  it("disables inputs while loading", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Display name")).toBeDisabled();
      expect(screen.getByLabelText("Email")).toBeDisabled();
      expect(screen.getByLabelText("Password")).toBeDisabled();
      expect(screen.getByLabelText("Confirm Password")).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Creating account..." }),
      ).toBeDisabled();
    });
  });

  it("sanitizes unsafe redirect URLs", async () => {
    mockSearchParams = new URLSearchParams("redirect=//evil.com");

    mockFetch
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({})),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
      });

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("sanitizes unsafe redirect URLs starting with /\\", async () => {
    mockSearchParams = new URLSearchParams("redirect=/\\evil.com");

    mockFetch
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({})),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
      });

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("handles JSON response with non-object value for error", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 400,
      ok: false,
      text: () => Promise.resolve(JSON.stringify("string error")),
    });

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to create account")).toBeInTheDocument();
    });
  });

  it("handles error response with non-string error property", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 400,
      ok: false,
      text: () => Promise.resolve(JSON.stringify({ error: 123 })),
    });

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to create account")).toBeInTheDocument();
    });
  });

  it("calls same-origin /api endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: () =>
        Promise.resolve(JSON.stringify({ needsEmailConfirmation: true })),
    });

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.any(Object),
      );
    });
  });

  it("handles safe redirect with valid path", async () => {
    mockSearchParams = new URLSearchParams("redirect=/dashboard");

    mockFetch
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({})),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
      });

    const { default: RegisterPage } = await import("./page");
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });
});
