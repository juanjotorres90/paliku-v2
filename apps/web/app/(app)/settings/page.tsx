"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, AUTONYMS, type Locale } from "@repo/i18n/locales";
import { Button } from "@repo/ui/components/button";
import { LanguageSwitcher } from "@repo/ui/components/language-switcher";
import { ThemeRadioGroup } from "@repo/ui/components/theme-radio-group";
import {
  applyTheme,
  getSystemTheme,
  setTheme,
  type Theme,
} from "@repo/ui/theme";
import { apiFetchWithRefresh } from "../../lib/api";
import { useUser } from "../../user-context";

const LOCALE_OPTIONS = LOCALES.map((locale) => ({
  value: locale,
  label: AUTONYMS[locale],
}));

interface SettingsFormData {
  locale: Locale;
  theme: Theme;
}

function SettingsPageContent() {
  const router = useRouter();
  const {
    user,
    loading: userLoading,
    error: userError,
    refreshSettings,
  } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savedThemeRef = useRef<Theme | null>(null);

  // Sync formData with user.settings - this prevents flicker on navigation
  const formData: SettingsFormData = user
    ? {
        locale: user.settings.locale as Locale,
        theme: user.settings.theme,
      }
    : {
        locale: "en",
        theme: "system",
      };

  // Track saved theme for cleanup on unmount
  useEffect(() => {
    if (userLoading) return;

    if (userError || !user) {
      router.replace(`/login?redirect=${encodeURIComponent("/settings")}`);
      router.refresh();
      return;
    }

    savedThemeRef.current = user.settings.theme;
  }, [user, userLoading, userError, router]);

  // Local state for unsaved changes
  const [localChanges, setLocalChanges] = useState<Partial<SettingsFormData>>(
    {},
  );

  // Clear local changes when user settings update from server
  // Only trigger on actual value changes, not on every user object render
  useEffect(() => {
    if (user) {
      setLocalChanges({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.settings.locale, user?.settings.theme]);

  const effectiveFormData = { ...formData, ...localChanges };

  const handleThemeChange = useCallback((theme: Theme) => {
    setLocalChanges((prev) => ({ ...prev, theme }));

    // Apply theme immediately for better UX
    const resolved = theme === "system" ? getSystemTheme() : theme;
    applyTheme(resolved);
    setTheme(theme);
  }, []);

  const handleLocaleChange = useCallback((locale: string) => {
    setLocalChanges((prev) => ({ ...prev, locale: locale as Locale }));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await apiFetchWithRefresh("/settings/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(effectiveFormData),
      });

      if (response.status === 401) {
        router.replace(`/login?redirect=${encodeURIComponent("/settings")}`);
        router.refresh();
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Failed to save settings: ${response.status} - ${text}`,
        );
      }

      await refreshSettings();
      savedThemeRef.current = effectiveFormData.theme;
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
      setSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (!savedThemeRef.current) return;
      const restored = savedThemeRef.current;
      const resolved = restored === "system" ? getSystemTheme() : restored;
      applyTheme(resolved);
      setTheme(restored);
    };
  }, []);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your app preferences.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Language Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Language</h2>
              <p className="text-sm text-muted-foreground">
                Select your preferred language for the app interface.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="language" className="text-sm font-medium">
                Language
              </label>
              <LanguageSwitcher
                id="language"
                name="language"
                value={effectiveFormData.locale}
                onChange={handleLocaleChange}
                options={LOCALE_OPTIONS}
                className="w-full md:w-64"
              />
              <p className="text-xs text-muted-foreground">
                Current: {AUTONYMS[effectiveFormData.locale]}
              </p>
            </div>
          </section>

          {/* Theme Section */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Theme</h2>
              <p className="text-sm text-muted-foreground">
                Choose how the app looks. Your selection will be saved
                automatically.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Appearance</label>
              <ThemeRadioGroup
                name="theme"
                value={effectiveFormData.theme}
                onChange={handleThemeChange}
                className="w-full md:w-96"
              />
              <p className="text-xs text-muted-foreground">
                {effectiveFormData.theme === "system" && (
                  <>Theme matches your system settings (light/dark)</>
                )}
                {effectiveFormData.theme === "light" && (
                  <>Always use light theme</>
                )}
                {effectiveFormData.theme === "dark" && (
                  <>Always use dark theme</>
                )}
              </p>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <SettingsPageContent />
    </div>
  );
}
