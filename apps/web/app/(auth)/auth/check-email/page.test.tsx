import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock next/navigation with stable references
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

describe("CheckEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the check email screen", async () => {
    const { default: CheckEmailPage } = await import("./page");
    render(<CheckEmailPage />);

    expect(
      screen.getByRole("heading", { name: "Check your email" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We've sent a confirmation link to your email/),
    ).toBeInTheDocument();
  });

  it("shows sign in link with correct redirect flow", async () => {
    const { default: CheckEmailPage } = await import("./page");
    render(<CheckEmailPage />);

    const signInLink = screen.getByRole("link", { name: "Sign In" });
    expect(signInLink).toHaveAttribute(
      "href",
      "/login?redirect=%2Fwelcome%3Fnext%3D%252F",
    );
  });

  it("shows sign in link with custom next parameter", async () => {
    mockSearchParams = new URLSearchParams("next=/people");

    const { default: CheckEmailPage } = await import("./page");
    render(<CheckEmailPage />);

    const signInLink = screen.getByRole("link", { name: "Sign In" });
    expect(signInLink).toHaveAttribute(
      "href",
      "/login?redirect=%2Fwelcome%3Fnext%3D%252Fpeople",
    );
  });

  it("shows wrong email link with next parameter", async () => {
    mockSearchParams = new URLSearchParams("next=/dashboard");

    const { default: CheckEmailPage } = await import("./page");
    render(<CheckEmailPage />);

    const wrongEmailLink = screen.getByRole("link", {
      name: "Wrong email? Register again",
    });
    expect(wrongEmailLink).toHaveAttribute(
      "href",
      "/register?redirect=%2Fdashboard",
    );
  });

  it("sanitizes unsafe next parameter", async () => {
    mockSearchParams = new URLSearchParams("next=//evil.com");

    const { default: CheckEmailPage } = await import("./page");
    render(<CheckEmailPage />);

    const signInLink = screen.getByRole("link", { name: "Sign In" });
    expect(signInLink).toHaveAttribute(
      "href",
      "/login?redirect=%2Fwelcome%3Fnext%3D%252F",
    );
  });

  it("shows tip about checking spam folder", async () => {
    const { default: CheckEmailPage } = await import("./page");
    render(<CheckEmailPage />);

    expect(screen.getByText(/Didn't receive the email/)).toBeInTheDocument();
  });
});
