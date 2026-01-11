import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { Avatar } from "./avatar";

describe("Avatar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders fallback when no src is provided", () => {
    render(<Avatar fallback={<span>JD</span>} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders fallback when src is empty", () => {
    render(<Avatar src="" fallback={<span>FB</span>} />);
    expect(screen.getByText("FB")).toBeInTheDocument();
  });

  it("renders image when src is provided", () => {
    render(<Avatar src="https://example.com/avatar.jpg" alt="User avatar" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
    expect(img).toHaveAttribute("alt", "User avatar");
  });

  it("uses default alt text when not provided", () => {
    render(<Avatar src="https://example.com/avatar.jpg" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Avatar");
  });

  it("applies small size class", () => {
    render(<Avatar size="sm" fallback={<span>SM</span>} />);
    const avatar = screen.getByText("SM").parentElement;
    expect(avatar).toHaveClass("h-8", "w-8");
  });

  it("applies medium size class (default)", () => {
    render(<Avatar fallback={<span>MD</span>} />);
    const avatar = screen.getByText("MD").parentElement;
    expect(avatar).toHaveClass("h-12", "w-12");
  });

  it("applies large size class", () => {
    render(<Avatar size="lg" fallback={<span>LG</span>} />);
    const avatar = screen.getByText("LG").parentElement;
    expect(avatar).toHaveClass("h-16", "w-16");
  });

  it("applies extra large size class", () => {
    render(<Avatar size="xl" fallback={<span>XL</span>} />);
    const avatar = screen.getByText("XL").parentElement;
    expect(avatar).toHaveClass("h-24", "w-24");
  });

  it("applies custom className to fallback", () => {
    render(<Avatar className="custom-class" fallback={<span>Test</span>} />);
    const avatar = screen.getByText("Test").parentElement;
    expect(avatar).toHaveClass("custom-class");
  });

  it("applies custom className to image", () => {
    render(
      <Avatar
        src="https://example.com/avatar.jpg"
        className="custom-img-class"
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveClass("custom-img-class");
  });

  it("shows fallback on image error", async () => {
    render(
      <Avatar
        src="https://example.com/broken.jpg"
        fallback={<span>Error</span>}
      />,
    );

    const img = screen.getByRole("img");
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });

  it("applies opacity transition on load", () => {
    render(<Avatar src="https://example.com/avatar.jpg" />);
    const img = screen.getByRole("img");
    expect(img).toHaveClass("transition-opacity");
    expect(img).toHaveClass("opacity-0");

    fireEvent.load(img);
    expect(img).toHaveClass("opacity-100");
  });

  it("resets error state when src changes", async () => {
    const { rerender } = render(
      <Avatar
        src="https://example.com/broken.jpg"
        fallback={<span>Fallback</span>}
      />,
    );

    // Trigger error to show fallback
    const img = screen.getByRole("img");
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.getByText("Fallback")).toBeInTheDocument();
    });

    // Change src - should show new image
    rerender(
      <Avatar
        src="https://example.com/new-avatar.jpg"
        fallback={<span>Fallback</span>}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("img")).toHaveAttribute(
        "src",
        "https://example.com/new-avatar.jpg",
      );
    });
  });

  it("renders fallback div with proper styling", () => {
    render(<Avatar fallback={<span>A</span>} />);
    const fallbackContainer = screen.getByText("A").parentElement;
    expect(fallbackContainer).toHaveClass(
      "inline-flex",
      "items-center",
      "justify-center",
      "rounded-full",
      "bg-muted",
    );
  });
});
