"use client";

import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.PropsWithChildren<ThemeProviderProps>): React.ReactElement {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
