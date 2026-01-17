import type { JSX } from "react";
import { STORAGE_KEY } from "./theme";

interface ThemeScriptProps {
  storageKey?: string;
  defaultTheme?: "system" | "light" | "dark";
  nonce?: string;
}

/**
 * Blocking script that sets the theme before first paint.
 * Must be rendered in <head> to avoid flash of wrong theme.
 */
export function ThemeScript({
  storageKey = STORAGE_KEY,
  defaultTheme = "system",
  nonce,
}: ThemeScriptProps = {}): JSX.Element {
  const script = `
(function() {
  var storageKey = ${JSON.stringify(storageKey)};
  var defaultTheme = ${JSON.stringify(defaultTheme)};

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(resolved) {
    var isDark = resolved === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = resolved;
  }

  function getResolvedTheme() {
    var stored = null;
    try {
      stored = localStorage.getItem(storageKey);
    } catch (e) {}

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    if (defaultTheme === 'light' || defaultTheme === 'dark') {
      return defaultTheme;
    }

    return getSystemTheme();
  }

  // Apply theme immediately
  applyTheme(getResolvedTheme());

  // Listen for system theme changes (only affects users in "system" mode)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
    var stored = null;
    try {
      stored = localStorage.getItem(storageKey);
    } catch (e) {}

    // Only update if user is in "system" mode:
    // - no explicit theme stored, and
    // - defaultTheme is "system" (fixed defaults should not track OS changes)
    if (
      defaultTheme === 'system' &&
      (!stored || (stored !== 'light' && stored !== 'dark'))
    ) {
      applyTheme(getSystemTheme());
    }
  });
})();
`.trim();

  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: script }} />;
}
