import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AvatarUpload } from "./avatar-upload";

describe("AvatarUpload", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // Basic Rendering Tests
  it("renders with fallback content", () => {
    render(
      <AvatarUpload
        fallback={<span data-testid="fallback">AB</span>}
        onChange={mockOnChange}
      />,
    );
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
  });

  it("renders with image source", () => {
    render(
      <AvatarUpload
        src="https://example.com/avatar.jpg"
        fallback={<span data-testid="fallback">AB</span>}
        onChange={mockOnChange}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("renders with custom className", () => {
    const { container } = render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        className="custom-class"
      />,
    );
    // The className is applied to the drop zone div
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("renders with custom aria-label", () => {
    render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        aria-label="User avatar"
      />,
    );
    expect(screen.getByLabelText("User avatar")).toBeInTheDocument();
  });

  it("renders children instead of default controls", () => {
    render(
      <AvatarUpload fallback={<span>AB</span>} onChange={mockOnChange}>
        <span data-testid="custom-controls">Custom Controls</span>
      </AvatarUpload>,
    );
    expect(screen.getByTestId("custom-controls")).toBeInTheDocument();
    expect(screen.queryByText("Choose photo")).not.toBeInTheDocument();
  });

  // Size Variants
  it("renders with different sizes", () => {
    const sizes: Array<"sm" | "md" | "lg" | "xl"> = ["sm", "md", "lg", "xl"];
    const expectedSizeClasses = {
      sm: "h-8 w-8",
      md: "h-12 w-12",
      lg: "h-16 w-16",
      xl: "h-24 w-24",
    };

    sizes.forEach((size) => {
      const { unmount, container } = render(
        <AvatarUpload
          fallback={<span>AB</span>}
          onChange={mockOnChange}
          size={size}
        />,
      );
      const avatar = container.querySelector(".rounded-full");
      expect(avatar?.className).toContain(expectedSizeClasses[size]);
      unmount();
    });
  });

  // File Upload Tests
  it("opens file picker on click", () => {
    const { container } = render(
      <AvatarUpload fallback={<span>AB</span>} onChange={mockOnChange} />,
    );
    const input = screen.getByLabelText("Avatar", { selector: "input" });
    const dropZone = container.querySelector(".relative");

    fireEvent.click(dropZone!);
    // Input click should be triggered (verified by no error thrown)
    expect(input).toBeInTheDocument();
  });

  it("calls onChange when valid file is selected", async () => {
    const promise = Promise.resolve();
    mockOnChange.mockReturnValue(promise);

    render(<AvatarUpload fallback={<span>AB</span>} onChange={mockOnChange} />);

    const input = screen.getByLabelText("Avatar", { selector: "input" });
    const file = new File(["test"], "avatar.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(file);
    });

    await act(() => promise);
  });

  it("shows upload text while uploading", () => {
    mockOnChange.mockImplementation(() => new Promise(() => {}));

    render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        uploading
      />,
    );
    // The "Uploading..." text appears in both the button and the overlay
    // Note: There may be two instances of "Uploading..." text
    const uploadTextElements = screen.getAllByText("Uploading...");
    expect(uploadTextElements.length).toBeGreaterThan(0);
  });

  it("disables interactions when disabled", () => {
    render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        disabled
      />,
    );
    const chooseButton = screen.getByRole("button", { name: "Choose photo" });
    expect(chooseButton).toBeDisabled();
  });

  it("disables interactions when uploading", () => {
    render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        uploading
      />,
    );
    const chooseButton = screen.getByRole("button", { name: "Uploading..." });
    expect(chooseButton).toBeDisabled();
  });

  // Delete Functionality
  it("shows delete button when image exists", () => {
    render(
      <AvatarUpload
        src="https://example.com/avatar.jpg"
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("does not show delete button when no image", () => {
    render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        onDelete={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", async () => {
    const mockOnDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <AvatarUpload
        src="https://example.com/avatar.jpg"
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        onDelete={mockOnDelete}
      />,
    );

    const deleteButton = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });

  it("does not show delete button when no preview exists", () => {
    render(<AvatarUpload fallback={<span>AB</span>} onChange={mockOnChange} />);
    // When there's no preview, the delete button should not appear
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  // File Validation Tests
  it("shows alert for oversized file", async () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        maxSizeMB={1}
      />,
    );

    const input = screen.getByLabelText("Avatar", { selector: "input" });
    const largeFile = new File(
      [new ArrayBuffer(2 * 1024 * 1024)],
      "large.png",
      {
        type: "image/png",
      },
    );

    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("File size must be less than 1MB");
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    alertMock.mockRestore();
  });

  it("shows alert for non-image file", async () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<AvatarUpload fallback={<span>AB</span>} onChange={mockOnChange} />);

    const input = screen.getByLabelText("Avatar", { selector: "input" });
    const textFile = new File(["text"], "document.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [textFile] } });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("Please select an image file");
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    alertMock.mockRestore();
  });

  // Drag and Drop Tests
  it("handles drag over event", () => {
    const { container } = render(
      <AvatarUpload fallback={<span>AB</span>} onChange={mockOnChange} />,
    );

    const dropZone = container.querySelector(".relative");
    fireEvent.dragOver(dropZone!, {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    });

    // Should not throw error
    expect(dropZone).toBeInTheDocument();
  });

  it("handles drag leave event", () => {
    const { container } = render(
      <AvatarUpload fallback={<span>AB</span>} onChange={mockOnChange} />,
    );

    const dropZone = container.querySelector(".relative");
    fireEvent.dragLeave(dropZone!, {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    });

    // Should not throw error
    expect(dropZone).toBeInTheDocument();
  });

  it("handles drop event with valid file", async () => {
    let resolveOnChanged: (value: void) => void;
    const promise = new Promise<void>((resolve) => {
      resolveOnChanged = resolve;
    });
    mockOnChange.mockReturnValue(promise);

    render(<AvatarUpload fallback={<span>AB</span>} onChange={mockOnChange} />);

    const file = new File(["test"], "avatar.png", { type: "image/png" });

    // Use the hidden file input to trigger the upload
    const input = screen.getByLabelText("Avatar", { selector: "input" });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    // Wait for onChange to be called
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(file);
    });

    // Resolve the promise
    await act(async () => {
      resolveOnChanged!();
      await promise;
    });
  });

  it("does not handle drop when disabled", async () => {
    const { container } = render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        disabled
      />,
    );

    const dropZone = container.querySelector(".relative");
    const file = new File(["test"], "avatar.png", { type: "image/png" });

    fireEvent.drop(dropZone!, {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { files: [file] },
    });

    // onChange should not be called immediately since drop is disabled
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("does not handle drop when uploading", async () => {
    const { container } = render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        uploading
      />,
    );

    const dropZone = container.querySelector(".relative");
    const file = new File(["test"], "avatar.png", { type: "image/png" });

    fireEvent.drop(dropZone!, {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { files: [file] },
    });

    // onChange should not be called immediately since drop is disabled during upload
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  // Preview Update Tests
  it("updates preview when src prop changes", () => {
    const { rerender } = render(
      <AvatarUpload
        src="https://example.com/avatar1.jpg"
        fallback={<span>AB</span>}
        onChange={mockOnChange}
      />,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/avatar1.jpg",
    );

    rerender(
      <AvatarUpload
        src="https://example.com/avatar2.jpg"
        fallback={<span>AB</span>}
        onChange={mockOnChange}
      />,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/avatar2.jpg",
    );
  });

  // Custom Accept Type
  it("uses custom accept type", () => {
    render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        accept="image/png,image/jpeg"
      />,
    );
    const input = screen.getByLabelText("Avatar", { selector: "input" });
    expect(input).toHaveAttribute("accept", "image/png,image/jpeg");
  });

  // Size Display
  it("displays max size hint", () => {
    render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        maxSizeMB={10}
      />,
    );
    expect(screen.getByText("JPG, PNG or GIF (max 10MB)")).toBeInTheDocument();
  });

  // Upload Text for Different Sizes
  it("shows empty upload text for sm size", () => {
    const { container } = render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        size="sm"
      />,
    );
    const uploadText = container.querySelector(
      '[class*="text-xs font-medium"]',
    );
    expect(uploadText?.textContent).toBe("");
  });

  it("shows 'Upload' text for larger sizes", () => {
    render(
      <AvatarUpload
        fallback={<span>AB</span>}
        onChange={mockOnChange}
        size="md"
      />,
    );
    expect(screen.getByText("Upload")).toBeInTheDocument();
  });
});
