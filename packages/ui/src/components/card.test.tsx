import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import { Card } from "./card";

describe("Card", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with title and children", () => {
    render(
      <Card title="Test Card" href="https://example.com">
        Card content
      </Card>,
    );
    expect(
      screen.getByRole("heading", { name: /Test Card/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders as a link with proper href", () => {
    render(
      <Card title="Link Card" href="https://example.com">
        Content
      </Card>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://example.com?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo",
    );
  });

  it("opens link in new tab", () => {
    render(
      <Card title="External Card" href="https://example.com">
        Content
      </Card>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("applies custom className", () => {
    render(
      <Card
        title="Custom Card"
        href="https://example.com"
        className="custom-class"
      >
        Content
      </Card>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveClass("custom-class");
  });

  it("applies default styling classes", () => {
    render(
      <Card title="Styled Card" href="https://example.com">
        Content
      </Card>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveClass("group", "block", "p-6", "rounded-xl", "border");
  });

  it("renders arrow indicator in title", () => {
    render(
      <Card title="Arrow Card" href="https://example.com">
        Content
      </Card>,
    );
    expect(screen.getByText("->")).toBeInTheDocument();
  });

  it("renders children in paragraph", () => {
    render(
      <Card title="Paragraph Card" href="https://example.com">
        <strong>Bold text</strong>
      </Card>,
    );
    expect(screen.getByText("Bold text")).toBeInTheDocument();
  });
});
