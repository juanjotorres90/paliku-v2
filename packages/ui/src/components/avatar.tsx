import * as React from "react";
import { cn } from "@repo/ui/lib/utils";

export interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 min-h-8 min-w-8 text-xs",
  md: "h-12 w-12 min-h-12 min-w-12 text-sm",
  lg: "h-16 w-16 min-h-16 min-w-16 text-base",
  xl: "h-24 w-24 min-h-24 min-w-24 text-lg",
};

export function Avatar({
  className,
  fallback,
  size = "md",
  src,
  alt,
  ...props
}: AvatarProps) {
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [imgError, setImgError] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  // Treat empty strings as no src
  const validSrc =
    src && typeof src === "string" && src.trim() !== "" ? src : undefined;

  React.useEffect(() => {
    setImgError(false);
    setLoaded(false);
  }, [validSrc]);

  // Handle images that load from browser cache (onLoad may not fire)
  React.useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [validSrc]);

  const showFallback = imgError || !validSrc;

  // Always render the fallback container, show/hide based on image state
  // This prevents layout shift and ensures something is always visible
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground overflow-hidden",
        sizeClasses[size],
        className,
      )}
    >
      {/* Fallback - visible when no image or image failed/loading */}
      {(showFallback || !loaded) && fallback}

      {/* Image - only render if we have a valid src */}
      {validSrc && !imgError && (
        <img
          ref={imgRef}
          src={validSrc}
          alt={alt ?? "Avatar"}
          className={cn(
            "absolute inset-0 h-full w-full rounded-full object-cover",
            "transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0",
          )}
          onError={() => setImgError(true)}
          onLoad={() => setLoaded(true)}
          {...props}
        />
      )}
    </div>
  );
}
