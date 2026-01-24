"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { AvatarUpload } from "@repo/ui/components/avatar-upload";
import { ProfileUpsertSchema } from "@repo/validators/profile";
import { apiFetchWithRefresh } from "../../../lib/api";
import { useUser } from "../../../user-context";

type IntentValue = "practice" | "friends" | "date";

function ProfileSettingsPageContent() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const {
    user,
    loading: userLoading,
    error: userError,
    refreshUser,
  } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    location: "",
    intents: ["practice"] as IntentValue[],
    isPublic: true,
  });

  const INTENT_OPTIONS: { value: IntentValue; label: string }[] = [
    { value: "practice", label: t("intentPractice") },
    { value: "friends", label: t("intentFriends") },
    { value: "date", label: t("intentDate") },
  ];

  useEffect(() => {
    if (userLoading) return;

    if (userError) {
      setError(t("failedToFetchProfile"));
      return;
    }

    if (user) {
      setFormData({
        displayName: user.profile.displayName,
        bio: user.profile.bio,
        location: user.profile.location,
        intents: user.profile.intents as IntentValue[],
        isPublic: user.profile.isPublic,
      });
      setAvatarPreview(user.profile.avatarUrl || null);
    }
  }, [t, user, userLoading, userError]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const parsed = ProfileUpsertSchema.safeParse(formData);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t("invalidProfile"));
        setSaving(false);
        return;
      }

      const response = await apiFetchWithRefresh("/profile/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      if (response.status === 401) {
        router.replace(
          `/login?redirect=${encodeURIComponent("/profile/settings")}`,
        );
        router.refresh();
        return;
      }

      if (!response.ok) {
        throw new Error(t("failedToSaveProfile"));
      }

      const updatedProfile = await response.json();
      await refreshUser();
      setFormData({
        displayName: updatedProfile.profile.displayName,
        bio: updatedProfile.profile.bio,
        location: updatedProfile.profile.location,
        intents: updatedProfile.profile.intents,
        isPublic: updatedProfile.profile.isPublic,
      });
      setAvatarPreview(updatedProfile.profile.avatarUrl);
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToSaveProfile"));
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file) {
      setError(null);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const payload = new FormData();
      payload.append("file", file);

      const response = await apiFetchWithRefresh("/profile/avatar", {
        method: "POST",
        body: payload,
      });

      if (response.status === 401) {
        router.replace(
          `/login?redirect=${encodeURIComponent("/profile/settings")}`,
        );
        router.refresh();
        return;
      }

      if (!response.ok) {
        throw new Error(t("failedToUploadAvatar"));
      }

      const updatedProfile = await response.json();
      await refreshUser();
      setFormData({
        displayName: updatedProfile.profile.displayName,
        bio: updatedProfile.profile.bio,
        location: updatedProfile.profile.location,
        intents: updatedProfile.profile.intents,
        isPublic: updatedProfile.profile.isPublic,
      });
      setAvatarPreview(updatedProfile.profile.avatarUrl);
      setUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToUploadAvatar"));
      setUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    setError(null);

    try {
      const response = await apiFetchWithRefresh("/profile/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          bio: formData.bio,
          location: formData.location,
          intents: formData.intents,
          isPublic: formData.isPublic,
          avatarUrl: null,
        }),
      });

      if (response.status === 401) {
        router.replace(
          `/login?redirect=${encodeURIComponent("/profile/settings")}`,
        );
        router.refresh();
        return;
      }

      if (!response.ok) {
        throw new Error(t("failedToDeleteAvatar"));
      }

      const updatedProfile = await response.json();
      await refreshUser();
      setAvatarPreview(updatedProfile.profile.avatarUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToDeleteAvatar"));
    }
  };

  const toggleIntent = (intent: IntentValue) => {
    setFormData((prev) => {
      const current = prev.intents;
      const exists = current.includes(intent);
      const next = exists
        ? current.filter((i) => i !== intent)
        : current.length >= 3
          ? current
          : [...current, intent];
      return { ...prev, intents: next };
    });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          {t("loadingProfile")}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("description")}</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="avatar" className="text-sm font-medium">
              {t("avatar")}
            </label>
            <AvatarUpload
              src={avatarPreview ?? undefined}
              fallback={
                <span className="font-semibold">
                  {formData.displayName?.[0]?.toUpperCase() ?? "?"}
                </span>
              }
              size="xl"
              onChange={handleAvatarUpload}
              onDelete={handleAvatarDelete}
              uploading={uploading}
              maxSizeMB={5}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              {t("email")}
            </label>
            <Input
              id="email"
              type="email"
              value={user?.email ?? ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              {t("emailReadOnly")}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              {t("displayName")}
            </label>
            <Input
              id="displayName"
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  displayName: e.target.value,
                }))
              }
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              {t("bio")}
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              maxLength={500}
              disabled={saving}
              className="w-full min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={t("bioPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 {tCommon("characters")}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              {t("location")}
            </label>
            <Input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              maxLength={120}
              disabled={saving}
              placeholder={t("locationPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("intents")}</label>
            <p className="text-xs text-muted-foreground mb-2">
              {t("selectUpToIntents")}
            </p>
            <div className="flex flex-wrap gap-2">
              {INTENT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={
                    formData.intents.includes(option.value)
                      ? "default"
                      : "outline"
                  }
                  onClick={() => toggleIntent(option.value)}
                  disabled={saving}
                  size="sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isPublic"
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
              }
              disabled={saving}
              className="h-4 w-4"
            />
            <label htmlFor="isPublic" className="text-sm font-medium">
              {t("publicProfile")}
            </label>
            <p className="text-xs text-muted-foreground">
              {t("publicProfileDescription")}
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving || uploading}>
              {saving ? t("saving") : t("saveChanges")}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function ProfileSettingsPage() {
  return (
    <div className="min-h-screen">
      <ProfileSettingsPageContent />
    </div>
  );
}
