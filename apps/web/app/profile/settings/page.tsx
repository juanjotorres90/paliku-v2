"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Avatar } from "@repo/ui/components/avatar";
import { ProfileUpsertSchema } from "@repo/validators/profile";
import { apiFetchWithRefresh } from "../../lib/api";

type IntentValue = "practice" | "friends" | "date";

interface ProfileMeResponse {
  email: string;
  profile: {
    id: string;
    displayName: string;
    bio: string;
    location: string;
    intents: string[];
    isPublic: boolean;
    avatarUrl: string | null;
    updatedAt: string;
  };
}

const INTENT_OPTIONS = [
  { value: "practice" as IntentValue, label: "Practice" },
  { value: "friends" as IntentValue, label: "Friends" },
  { value: "date" as IntentValue, label: "Date" },
];

function ProfileSettingsPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileMeResponse | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    location: "",
    intents: ["practice"] as IntentValue[],
    isPublic: true,
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await apiFetchWithRefresh("/profile/me");

        if (response.status === 401) {
          router.replace(
            `/login?redirect=${encodeURIComponent("/profile/settings")}`,
          );
          router.refresh();
          return;
        }

        if (!response.ok) {
          const text = await response.text();
          setError(`API error: ${response.status} - ${text}`);
          setLoading(false);
          return;
        }

        const json = await response.json();
        setProfile(json);
        setFormData({
          displayName: json.profile.displayName,
          bio: json.profile.bio,
          location: json.profile.location,
          intents: json.profile.intents,
          isPublic: json.profile.isPublic,
        });
        setAvatarPreview(json.profile.avatarUrl);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch profile",
        );
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const parsed = ProfileUpsertSchema.safeParse(formData);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid profile");
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

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to save profile: ${response.status} - ${text}`);
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setAvatarPreview(updatedProfile.profile.avatarUrl);
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError(null);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiFetchWithRefresh("/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Failed to upload avatar: ${response.status} - ${text}`,
        );
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setAvatarPreview(updatedProfile.profile.avatarUrl);
      setUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
      setUploading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Update your public profile information.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="avatar" className="text-sm font-medium">
              Avatar
            </label>
            <div className="flex items-center gap-4">
              <Avatar
                src={avatarPreview ?? undefined}
                size="xl"
                fallback={
                  <span className="font-semibold">
                    {formData.displayName?.[0]?.toUpperCase() ?? "?"}
                  </span>
                }
              />
              <div className="space-y-2">
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="text-sm"
                />
                {uploading && (
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={profile?.email ?? ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email is read-only. Contact support to change your email.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              Display name
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
              Bio
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
              placeholder="Tell others about yourself..."
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              Location
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
              placeholder="e.g., San Francisco, CA"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Intents</label>
            <p className="text-xs text-muted-foreground mb-2">
              Select up to 3 intents
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
              Public profile
            </label>
            <p className="text-xs text-muted-foreground">
              When disabled, only you can view your profile.
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving || uploading}>
              {saving ? "Saving..." : "Save changes"}
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
