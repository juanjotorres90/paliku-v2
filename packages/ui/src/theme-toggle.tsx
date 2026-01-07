"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  STORAGE_KEY,
  type Theme,
  getStoredTheme,
  getSystemTheme,
  applyTheme,
  setTheme,
} from "./theme";

interface ThemeToggleProps {
  storageKey?: string;
  className?: string;
}

function getThemeLabel(theme: Theme): string {
  switch (theme) {
    case "system":
      return "System theme (click for light)";
    case "light":
      return "Light theme (click for dark)";
    case "dark":
      return "Dark theme (click for system)";
  }
}

// SVG icons as components for sun, moon, and system
function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx={12} cy={12} r={5} />
      <line x1={12} y1={1} x2={12} y2={3} />
      <line x1={12} y1={21} x2={12} y2={23} />
      <line x1={4.22} y1={4.22} x2={5.64} y2={5.64} />
      <line x1={18.36} y1={18.36} x2={19.78} y2={19.78} />
      <line x1={1} y1={12} x2={3} y2={12} />
      <line x1={21} y1={12} x2={23} y2={12} />
      <line x1={4.22} y1={19.78} x2={5.64} y2={18.36} />
      <line x1={18.36} y1={5.64} x2={19.78} y2={4.22} />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x={2} y={3} width={20} height={14} rx={2} ry={2} />
      <line x1={8} y1={21} x2={16} y2={21} />
      <line x1={12} y1={17} x2={12} y2={21} />
    </svg>
  );
}

/**
 * Theme toggle button that cycles through system → light → dark.
 * Position via className prop (e.g., "ui:fixed ui:top-4 ui:right-4").
 */
export function ThemeToggle({
  storageKey = STORAGE_KEY,
  className,
}: ThemeToggleProps): JSX.Element {
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  // Initialize state from localStorage/system on mount
  useEffect(() => {
    const stored = getStoredTheme(storageKey);
    const currentTheme: Theme = stored ?? "system";
    setThemeState(currentTheme);
    setMounted(true);
  }, [storageKey]);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        const newTheme: Theme =
          e.newValue === "light" || e.newValue === "dark"
            ? e.newValue
            : "system";
        setThemeState(newTheme);
        const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
        applyTheme(resolved);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      // Only update if in system mode
      if (!getStoredTheme(storageKey)) {
        applyTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [storageKey]);

  const cycleTheme = useCallback(() => {
    const nextTheme: Theme =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";

    setThemeState(nextTheme);
    const resolved = nextTheme === "system" ? getSystemTheme() : nextTheme;
    applyTheme(resolved);
    setTheme(nextTheme, storageKey);
  }, [theme, storageKey]);

  // Prevent hydration mismatch by rendering a placeholder until mounted
  if (!mounted) {
    return (
      <button
        className={`inline-flex items-center justify-center size-10 rounded-full transition-all duration-300 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 shadow-lg backdrop-blur-sm ${className ?? ""}`}
        aria-label="Toggle theme"
        disabled
      >
        <span className="size-5" />
      </button>
    );
  }

  const label = getThemeLabel(theme);

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`group inline-flex items-center justify-center size-10 rounded-full transition-all duration-300 ease-out bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-gray-700 dark:text-gray-200 shadow-lg shadow-gray-200/50 dark:shadow-black/30 ring-1 ring-gray-200/50 dark:ring-gray-700/50 hover:scale-110 hover:shadow-xl hover:ring-2 hover:ring-purple-500/50 dark:hover:ring-purple-400/50 active:scale-95 cursor-pointer ${className ?? ""}`}
      aria-label={label}
      title={label}
    >
      {theme === "system" ? (
        <SystemIcon className="size-5 transition-transform duration-300 group-hover:rotate-12" />
      ) : theme === "light" ? (
        <SunIcon className="size-5 transition-transform duration-300 group-hover:rotate-90" />
      ) : (
        <MoonIcon className="size-5 transition-transform duration-300 group-hover:-rotate-12" />
      )}
    </button>
  );
}
