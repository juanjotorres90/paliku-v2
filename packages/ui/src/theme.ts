// Theme constants and utilities
export const STORAGE_KEY = "theme";
export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/**
 * Get the system's preferred color scheme
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Get the stored theme from localStorage
 */
export function getStoredTheme(storageKey = STORAGE_KEY): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") return stored;
  return null;
}

/**
 * Get the resolved theme (what should actually be displayed)
 */
export function getResolvedTheme(storageKey = STORAGE_KEY): ResolvedTheme {
  const stored = getStoredTheme(storageKey);
  if (stored === "light" || stored === "dark") return stored;
  return getSystemTheme();
}

/**
 * Apply theme to the document
 */
export function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const isDark = resolved === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = resolved;
}

/**
 * Save theme to localStorage and dispatch storage event for cross-tab sync
 */
export function setTheme(theme: Theme, storageKey = STORAGE_KEY): void {
  if (typeof window === "undefined") return;

  if (theme === "system") {
    localStorage.removeItem(storageKey);
  } else {
    localStorage.setItem(storageKey, theme);
  }

  // Dispatch storage event for cross-tab sync (storage events don't fire on the same tab)
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: storageKey,
      newValue: theme === "system" ? null : theme,
    })
  );
}
