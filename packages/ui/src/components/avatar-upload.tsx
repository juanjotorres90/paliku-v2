import * as React from "react";
import { cn } from "@repo/ui/lib/utils";
import { Avatar } from "./avatar";
import { Button } from "./button";

export interface AvatarUploadProps {
  src?: string;
  fallback?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  onChange: (file: File) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  disabled?: boolean;
  uploading?: boolean;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
}

export function AvatarUpload({
  src,
  fallback,
  size = "xl",
  onChange,
  onDelete,
  disabled = false,
  uploading = false,
  accept = "image/*",
  maxSizeMB = 5,
  className,
  children,
  "aria-label": ariaLabel = "Avatar",
}: AvatarUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<string | undefined>(src);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setPreview(src);
  }, [src]);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      await onChange(file);
    } catch (error) {
      setPreview(src);
      throw error;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <div
          ref={dropZoneRef}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative cursor-pointer transition-all duration-200",
            disabled || uploading ? "cursor-not-allowed" : "cursor-pointer",
            className,
          )}
        >
          <Avatar
            src={preview}
            fallback={fallback}
            size={size}
            className={cn(
              "transition-all duration-200",
              isDragging && "scale-105 ring-2 ring-ring ring-offset-2",
              !disabled &&
                !uploading &&
                "group-hover:ring-2 group-hover:ring-ring group-hover:ring-offset-2",
              uploading && "opacity-50",
            )}
          />

          {!disabled && !uploading && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity duration-200",
                isDragging && "opacity-100",
                "group-hover:opacity-100",
              )}
            >
              <div className="flex flex-col items-center gap-1 text-white">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-xs font-medium">
                  {isDragging ? "Drop" : size === "sm" ? "" : "Upload"}
                </span>
              </div>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <div className="flex flex-col items-center gap-1 text-white">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {children || (
          <>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClick}
                disabled={disabled || uploading}
              >
                {uploading ? "Uploading..." : "Choose photo"}
              </Button>
              {preview && !uploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (onDelete) {
                      await onDelete();
                    }
                  }}
                  disabled={disabled || uploading}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Delete
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF (max {maxSizeMB}MB)
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled || uploading}
        className="hidden"
        aria-label={ariaLabel}
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
      />
    </div>
  );
}
