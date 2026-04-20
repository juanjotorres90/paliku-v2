"use client";

import { Button } from "@repo/ui/components/button";
import type { PersonCard } from "@repo/validators/people";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import useSWR from "swr";
import { apiFetcher, apiFetchWithRefresh } from "../../../lib/api";

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("pages.people");
  const tLanguages = useTranslations("languages");
  const tCommon = useTranslations("common");

  const { data: person, mutate } = useSWR<PersonCard>(
    id ? `/people/${id}` : null,
    apiFetcher,
    { revalidateOnFocus: false },
  );

  const handleConnect = useCallback(async () => {
    if (!id) return;
    const res = await apiFetchWithRefresh(`/people/${id}/connect`, {
      method: "POST",
    });
    if (res.ok) void mutate();
  }, [id, mutate]);

  const handleCancel = useCallback(async () => {
    if (!person?.relationshipId) return;
    const res = await apiFetchWithRefresh(
      `/people/requests/${person.relationshipId}`,
      { method: "DELETE" },
    );
    if (res.ok) void mutate();
  }, [person?.relationshipId, mutate]);

  const handleRespond = useCallback(
    async (action: "accept" | "decline") => {
      if (!person?.relationshipId) return;
      const res = await apiFetchWithRefresh(
        `/people/requests/${person.relationshipId}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (res.ok) void mutate();
    },
    [person?.relationshipId, mutate],
  );

  if (!person) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        {tCommon("loading")}
      </div>
    );
  }

  const status = person.relationshipStatus;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
        >
          &larr; {t("backToResults")}
        </button>

        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          {person.avatarUrl ? (
            <Image
              src={person.avatarUrl}
              alt={person.displayName}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-muted shrink-0 flex items-center justify-center text-2xl font-semibold">
              {person.displayName[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">
              {person.displayName}
            </h1>
            {person.location && (
              <p className="text-muted-foreground">{person.location}</p>
            )}
            {status && (
              <span className="text-sm text-muted-foreground">{t(status)}</span>
            )}
          </div>
        </div>

        {/* Languages */}
        <div className="rounded-xl border border-border p-6 mb-6 space-y-4">
          {person.speaks.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {t("speaks")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {person.speaks.map((l) => (
                  <span
                    key={l.languageCode}
                    className="px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm"
                  >
                    {tLanguages(l.languageCode)} ({t(l.level)})
                  </span>
                ))}
              </div>
            </div>
          )}
          {person.learning.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {t("learning")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {person.learning.map((l) => (
                  <span
                    key={l.languageCode}
                    className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-sm"
                  >
                    {tLanguages(l.languageCode)} ({t(l.level)})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        {person.bio && (
          <div className="rounded-xl border border-border p-6 mb-6">
            <p className="text-sm whitespace-pre-wrap">{person.bio}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!status && <Button onClick={handleConnect}>{t("connect")}</Button>}
          {status === "pending" && person.isRequester && (
            <Button variant="outline" onClick={handleCancel}>
              {t("cancel")}
            </Button>
          )}
          {status === "pending" && !person.isRequester && (
            <>
              <Button onClick={() => handleRespond("accept")}>
                {t("accept")}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRespond("decline")}
              >
                {t("decline")}
              </Button>
            </>
          )}
          {status === "accepted" && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              {t("accepted")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
