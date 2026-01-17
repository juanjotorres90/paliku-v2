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
    // No image should be rendered for empty src
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders fallback when src is whitespace only", () => {
    render(<Avatar src="   " fallback={<span>WS</span>} />);
    expect(screen.getByText("WS")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
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
    const avatar = screen.getByText("SM").closest("div");
    expect(avatar).toHaveClass("h-8", "w-8");
  });

  it("applies medium size class (default)", () => {
    render(<Avatar fallback={<span>MD</span>} />);
    const avatar = screen.getByText("MD").closest("div");
    expect(avatar).toHaveClass("h-12", "w-12");
  });

  it("applies large size class", () => {
    render(<Avatar size="lg" fallback={<span>LG</span>} />);
    const avatar = screen.getByText("LG").closest("div");
    expect(avatar).toHaveClass("h-16", "w-16");
  });

  it("applies extra large size class", () => {
    render(<Avatar size="xl" fallback={<span>XL</span>} />);
    const avatar = screen.getByText("XL").closest("div");
    expect(avatar).toHaveClass("h-24", "w-24");
  });

  it("applies custom className to container", () => {
    render(<Avatar className="custom-class" fallback={<span>Test</span>} />);
    const avatar = screen.getByText("Test").closest("div");
    expect(avatar).toHaveClass("custom-class");
  });

  it("applies custom className when image is present", () => {
    render(
      <Avatar
        src="https://example.com/avatar.jpg"
        className="custom-img-class"
      />,
    );
    const container = screen.getByRole("img").closest("div");
    expect(container).toHaveClass("custom-img-class");
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
      // Image should be removed after error
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });

  it("shows fallback while image is loading", () => {
    render(
      <Avatar
        src="https://example.com/avatar.jpg"
        fallback={<span>Loading</span>}
      />,
    );
    // Fallback should be visible while image loads
    expect(screen.getByText("Loading")).toBeInTheDocument();
    // Image should also be present but with opacity-0
    const img = screen.getByRole("img");
    expect(img).toHaveClass("opacity-0");
  });

  it("hides fallback after image loads", async () => {
    render(
      <Avatar
        src="https://example.com/avatar.jpg"
        fallback={<span>Loading</span>}
      />,
    );

    const img = screen.getByRole("img");
    fireEvent.load(img);

    await waitFor(() => {
      expect(img).toHaveClass("opacity-100");
      // Fallback should be hidden when image is loaded
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
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
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
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

  it("renders container with proper styling", () => {
    render(<Avatar fallback={<span>A</span>} />);
    const container = screen.getByText("A").closest("div");
    expect(container).toHaveClass(
      "relative",
      "inline-flex",
      "items-center",
      "justify-center",
      "rounded-full",
      "bg-muted",
    );
  });
});
