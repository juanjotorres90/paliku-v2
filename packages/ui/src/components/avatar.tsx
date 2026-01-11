import * as React from "react";
import { cn } from "@repo/ui/lib/utils";

export interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-24 w-24 text-lg",
};

export function Avatar({
  className,
  fallback,
  size = "md",
  src,
  alt,
  ...props
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
    setLoaded(false);
  }, [src]);

  if (imgError || !src) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground overflow-hidden",
          sizeClasses[size],
          className,
        )}
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? "Avatar"}
      className={cn(
        "inline-flex items-center justify-center rounded-full object-cover",
        sizeClasses[size],
        "transition-opacity",
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
      onError={() => setImgError(true)}
      onLoad={() => setLoaded(true)}
      {...props}
    />
  );
}
