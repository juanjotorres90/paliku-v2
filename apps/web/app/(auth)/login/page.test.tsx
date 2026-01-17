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

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockSearchParams = new URLSearchParams();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the login form", async () => {
    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: "Sign In" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("shows link to register page", async () => {
    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const registerLink = screen.getByRole("link", {
      name: "Create an account",
    });
    expect(registerLink).toHaveAttribute("href", "/register");
  });

  it("shows link to register page with redirect param", async () => {
    mockSearchParams = new URLSearchParams("redirect=/dashboard");

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const registerLink = screen.getByRole("link", {
      name: "Create an account",
    });
    expect(registerLink).toHaveAttribute(
      "href",
      "/register?redirect=%2Fdashboard",
    );
  });

  it("shows validation error for invalid email", async () => {
    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Submit the form directly
    const form = emailInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
    });
  });

  it("handles successful login", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: () => Promise.resolve("{}"),
    });

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("handles login with safe redirect", async () => {
    mockSearchParams = new URLSearchParams("redirect=/dashboard");

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: () => Promise.resolve("{}"),
    });

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("sanitizes unsafe redirect URLs starting with //", async () => {
    mockSearchParams = new URLSearchParams("redirect=//evil.com");

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: () => Promise.resolve("{}"),
    });

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("sanitizes unsafe redirect URLs starting with /\\", async () => {
    mockSearchParams = new URLSearchParams("redirect=/\\evil.com");

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: () => Promise.resolve("{}"),
    });

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("sanitizes external URL redirect", async () => {
    mockSearchParams = new URLSearchParams("redirect=https://evil.com");

    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: () => Promise.resolve("{}"),
    });

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("handles login error with JSON error message", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 401,
      ok: false,
      text: () =>
        Promise.resolve(JSON.stringify({ error: "Invalid credentials" })),
    });

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("handles login error with invalid JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 401,
      ok: false,
      text: () => Promise.resolve("not valid json"),
    });

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to sign in")).toBeInTheDocument();
    });
  });

  it("handles login error with non-string error in JSON", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 401,
      ok: false,
      text: () => Promise.resolve(JSON.stringify({ error: 123 })),
    });

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to sign in")).toBeInTheDocument();
    });
  });

  it("handles login error with empty response", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 401,
      ok: false,
      text: () => Promise.resolve(""),
    });

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to sign in")).toBeInTheDocument();
    });
  });

  it("handles network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("An unexpected error occurred"),
      ).toBeInTheDocument();
    });
  });

  it("disables inputs while loading", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Email")).toBeDisabled();
      expect(screen.getByLabelText("Password")).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Signing in..." }),
      ).toBeDisabled();
    });
  });

  it("calls same-origin /api endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: () => Promise.resolve("{}"),
    });

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.any(Object),
      );
    });
  });

  it("handles JSON response with non-object value", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 401,
      ok: false,
      text: () => Promise.resolve(JSON.stringify("string error")),
    });

    const { default: LoginPage } = await import("./page");
    render(<LoginPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to sign in")).toBeInTheDocument();
    });
  });
});
