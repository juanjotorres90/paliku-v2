"use client";

import { AvatarUpload } from "@repo/ui/components/avatar-upload";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  LanguageCodeSchema,
  ProficiencySchema,
  ProfileLanguagesUpsertSchema,
  type LanguageCode,
  type Proficiency,
} from "@repo/validators/people";
import { ProfileUpsertSchema } from "@repo/validators/profile";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { apiFetcher, apiFetchWithRefresh } from "../../../lib/api";
import { useUser } from "../../../user-context";

interface LanguagesResponse {
  speaks: LanguageEntry[];
  learning: LanguageEntry[];
}

type IntentValue = "practice" | "friends" | "date";

interface LanguageEntry {
  languageCode: LanguageCode;
  level: Proficiency;
}

const LANGUAGE_CODES = LanguageCodeSchema.options;
const PROFICIENCY_LEVELS = ProficiencySchema.options;

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
  const tLang = useTranslations("profile.languages");
  const tLanguages = useTranslations("languages");
  const tPeople = useTranslations("pages.people");
  const { data: languagesData, mutate: mutateLanguages } =
    useSWR<LanguagesResponse>(user ? "/people/languages" : null, apiFetcher, {
      revalidateOnFocus: false,
    });
  const speaks = languagesData?.speaks ?? [];
  const learning = languagesData?.learning ?? [];
  const [savingLanguages, setSavingLanguages] = useState(false);

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

  const saveLanguages = useCallback(
    async (nextSpeaks: LanguageEntry[], nextLearning: LanguageEntry[]) => {
      const parsed = ProfileLanguagesUpsertSchema.safeParse({
        speaks: nextSpeaks,
        learning: nextLearning,
      });
      if (!parsed.success) return;

      const optimistic = { speaks: nextSpeaks, learning: nextLearning };
      setSavingLanguages(true);
      try {
        await mutateLanguages(
          async () => {
            const res = await apiFetchWithRefresh("/people/languages", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(parsed.data),
            });
            if (!res.ok) throw new Error();
            return (await res.json()) as LanguagesResponse;
          },
          {
            optimisticData: optimistic,
            rollbackOnError: true,
            revalidate: false,
          },
        );
      } catch {
        setError(tLang("failedToSaveLanguages"));
      } finally {
        setSavingLanguages(false);
      }
    },
    [mutateLanguages, tLang],
  );

  const addLanguage = (kind: "speaks" | "learning") => {
    const current = kind === "speaks" ? speaks : learning;
    if (current.length >= 3) return;
    const entry: LanguageEntry = {
      languageCode: LANGUAGE_CODES[0]!,
      level: "beginner",
    };
    const next = [...current, entry];
    void saveLanguages(
      kind === "speaks" ? next : speaks,
      kind === "learning" ? next : learning,
    );
  };

  const removeLanguage = (kind: "speaks" | "learning", index: number) => {
    const current = kind === "speaks" ? speaks : learning;
    const next = current.filter((_, i) => i !== index);
    void saveLanguages(
      kind === "speaks" ? next : speaks,
      kind === "learning" ? next : learning,
    );
  };

  const updateLanguage = (
    kind: "speaks" | "learning",
    index: number,
    field: "languageCode" | "level",
    value: string,
  ) => {
    const current = kind === "speaks" ? speaks : learning;
    const next = current.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry,
    );
    void saveLanguages(
      kind === "speaks" ? next : speaks,
      kind === "learning" ? next : learning,
    );
  };

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
              labels={{
                upload: t("avatarUpload.upload"),
                uploading: t("avatarUpload.uploading"),
                choosePhoto: t("avatarUpload.choosePhoto"),
                delete: tCommon("delete"),
                dropHint: t("avatarUpload.dropHint"),
                fileTypeHint: t("avatarUpload.fileTypeHint", { maxSizeMB: 5 }),
                fileSizeError: t("avatarUpload.fileSizeError", {
                  maxSizeMB: 5,
                }),
                fileTypeError: t("avatarUpload.fileTypeError"),
              }}
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

        {/* Languages Section */}
        <div className="space-y-6 border-t border-border pt-8">
          <h2 className="text-xl font-semibold">{tLang("title")}</h2>

          {(["speaks", "learning"] as const).map((kind) => {
            const entries = kind === "speaks" ? speaks : learning;
            return (
              <div key={kind} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{tLang(kind)}</label>
                  {entries.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={savingLanguages}
                      onClick={() => addLanguage(kind)}
                    >
                      {tLang("addLanguage")}
                    </Button>
                  )}
                  {entries.length >= 3 && (
                    <span className="text-xs text-muted-foreground">
                      {tLang("maxReached", { max: 3 })}
                    </span>
                  )}
                </div>

                {entries.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
                      value={entry.languageCode}
                      disabled={savingLanguages}
                      onChange={(e) =>
                        updateLanguage(
                          kind,
                          idx,
                          "languageCode",
                          e.target.value,
                        )
                      }
                    >
                      {LANGUAGE_CODES.map((code) => (
                        <option key={code} value={code}>
                          {tLanguages(code)}
                        </option>
                      ))}
                    </select>
                    <select
                      className="w-36 px-3 py-2 rounded-md border border-input bg-background text-sm"
                      value={entry.level}
                      disabled={savingLanguages}
                      onChange={(e) =>
                        updateLanguage(kind, idx, "level", e.target.value)
                      }
                    >
                      {PROFICIENCY_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {tPeople(level)}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={savingLanguages}
                      onClick={() => removeLanguage(kind, idx)}
                    >
                      {tLang("removeLanguage")}
                    </Button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
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
