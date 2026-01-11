import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  STORAGE_KEY,
  getSystemTheme,
  getStoredTheme,
  getResolvedTheme,
  applyTheme,
  setTheme,
} from "./theme";

describe("theme utilities", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset document classes
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
  });

  describe("STORAGE_KEY", () => {
    it("has the correct default value", () => {
      expect(STORAGE_KEY).toBe("theme");
    });
  });

  describe("getSystemTheme", () => {
    it("returns dark when prefers-color-scheme is dark", () => {
      // Our mock returns matches: true for dark
      const result = getSystemTheme();
      expect(result).toBe("dark");
    });
  });

  describe("getStoredTheme", () => {
    it("returns null when nothing is stored", () => {
      expect(getStoredTheme()).toBeNull();
    });

    it("returns light when light is stored", () => {
      localStorage.setItem(STORAGE_KEY, "light");
      expect(getStoredTheme()).toBe("light");
    });

    it("returns dark when dark is stored", () => {
      localStorage.setItem(STORAGE_KEY, "dark");
      expect(getStoredTheme()).toBe("dark");
    });

    it("returns null for invalid stored value", () => {
      localStorage.setItem(STORAGE_KEY, "invalid");
      expect(getStoredTheme()).toBeNull();
    });

    it("uses custom storage key", () => {
      localStorage.setItem("custom-key", "light");
      expect(getStoredTheme("custom-key")).toBe("light");
    });
  });

  describe("getResolvedTheme", () => {
    it("returns stored theme when available", () => {
      localStorage.setItem(STORAGE_KEY, "light");
      expect(getResolvedTheme()).toBe("light");
    });

    it("returns system theme when nothing stored", () => {
      // Our mock returns dark for system
      expect(getResolvedTheme()).toBe("dark");
    });

    it("uses custom storage key", () => {
      localStorage.setItem("custom-key", "light");
      expect(getResolvedTheme("custom-key")).toBe("light");
    });
  });

  describe("applyTheme", () => {
    it("adds dark class for dark theme", () => {
      applyTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe("dark");
    });

    it("removes dark class for light theme", () => {
      document.documentElement.classList.add("dark");
      applyTheme("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe("light");
    });
  });

  describe("setTheme", () => {
    it("stores light theme", () => {
      setTheme("light");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    });

    it("stores dark theme", () => {
      setTheme("dark");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    });

    it("removes storage for system theme", () => {
      localStorage.setItem(STORAGE_KEY, "dark");
      setTheme("system");
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("uses custom storage key", () => {
      setTheme("light", "custom-key");
      expect(localStorage.getItem("custom-key")).toBe("light");
    });

    it("dispatches storage event", () => {
      const listener = vi.fn();
      window.addEventListener("storage", listener);

      setTheme("dark");

      expect(listener).toHaveBeenCalled();
      const event = listener.mock.calls[0][0] as StorageEvent;
      expect(event.key).toBe(STORAGE_KEY);
      expect(event.newValue).toBe("dark");

      window.removeEventListener("storage", listener);
    });

    it("dispatches storage event with null for system theme", () => {
      const listener = vi.fn();
      window.addEventListener("storage", listener);

      setTheme("system");

      expect(listener).toHaveBeenCalled();
      const event = listener.mock.calls[0][0] as StorageEvent;
      expect(event.newValue).toBeNull();

      window.removeEventListener("storage", listener);
    });
  });
});
