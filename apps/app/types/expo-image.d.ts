import type { ImageProps } from "expo-image";

// expo-image's Image is a class component whose constructor signature
// is incompatible with React 19's stricter JSX element types.
// Re-declare it as a function component for JSX compatibility.
declare module "expo-image" {
  export const Image: React.FC<ImageProps>;
}
