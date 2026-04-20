"use client";

import { Button } from "@repo/ui/components/button";
import {
  LanguageCodeSchema,
  ProficiencySchema,
  type ConnectionRequestItem,
  type LanguageCode,
  type PeopleDiscoverResponse,
  type PeopleRequestsResponse,
  type PersonCard,
  type Proficiency,
} from "@repo/validators/people";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { apiFetcher, apiFetchWithRefresh } from "../../lib/api";

type Tab = "discover" | "partners" | "requests";

// ─── Person card ────────────────────────────────────────────────

function PersonCardView({
  card,
  tPeople,
  tLanguages,
  onConnect,
  onCancel,
  onAccept,
  onDecline,
}: {
  card: PersonCard;
  tPeople: ReturnType<typeof useTranslations<"pages.people">>;
  tLanguages: ReturnType<typeof useTranslations<"languages">>;
  onConnect: (id: string) => void;
  onCancel: (reqId: string) => void;
  onAccept: (reqId: string) => void;
  onDecline: (reqId: string) => void;
}) {
  const status = card.relationshipStatus;
  return (
    <article className="rounded-xl border border-border p-6 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-4 mb-4">
        {card.avatarUrl ? (
          <Image
            src={card.avatarUrl}
            alt={card.displayName}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted shrink-0 flex items-center justify-center text-lg font-semibold">
            {card.displayName[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{card.displayName}</h3>
          {card.location && (
            <p className="text-sm text-muted-foreground">{card.location}</p>
          )}
          {status && (
            <span className="text-xs text-muted-foreground">
              {tPeople(status)}
            </span>
          )}
        </div>
      </div>

      {/* Languages */}
      <div className="mb-4 space-y-2">
        {card.speaks.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {tPeople("speaks")}
            </span>
            {card.speaks.map((l) => (
              <span
                key={l.languageCode}
                className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs"
              >
                {tLanguages(l.languageCode)} ({tPeople(l.level)})
              </span>
            ))}
          </div>
        )}
        {card.learning.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {tPeople("learning")}
            </span>
            {card.learning.map((l) => (
              <span
                key={l.languageCode}
                className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs"
              >
                {tLanguages(l.languageCode)} ({tPeople(l.level)})
              </span>
            ))}
          </div>
        )}
      </div>

      {card.bio && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {card.bio}
        </p>
      )}

      <div className="flex gap-2">
        {!status && (
          <Button size="sm" onClick={() => onConnect(card.id)}>
            {tPeople("connect")}
          </Button>
        )}
        {status === "pending" && card.isRequester && card.relationshipId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel(card.relationshipId!)}
          >
            {tPeople("cancel")}
          </Button>
        )}
        {status === "pending" && !card.isRequester && card.relationshipId && (
          <>
            <Button size="sm" onClick={() => onAccept(card.relationshipId!)}>
              {tPeople("accept")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDecline(card.relationshipId!)}
            >
              {tPeople("decline")}
            </Button>
          </>
        )}
        <Link href={`/people/${card.id}`}>
          <Button size="sm" variant="outline">
            {tPeople("viewProfile")}
          </Button>
        </Link>
      </div>
    </article>
  );
}

// ─── Request card ───────────────────────────────────────────────

function RequestCardView({
  item,
  tPeople,
  onAccept,
  onDecline,
  onCancel,
}: {
  item: ConnectionRequestItem;
  tPeople: ReturnType<typeof useTranslations<"pages.people">>;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <article className="rounded-xl border border-border p-6 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-4 mb-4">
        {item.other.avatarUrl ? (
          <Image
            src={item.other.avatarUrl}
            alt={item.other.displayName}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-muted shrink-0 flex items-center justify-center text-lg font-semibold">
            {item.other.displayName[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{item.other.displayName}</h3>
          {item.other.location && (
            <p className="text-sm text-muted-foreground">
              {item.other.location}
            </p>
          )}
          <span className="text-xs text-muted-foreground">
            {tPeople(item.direction)}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {item.direction === "incoming" && (
          <>
            <Button size="sm" onClick={() => onAccept(item.id)}>
              {tPeople("accept")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDecline(item.id)}
            >
              {tPeople("decline")}
            </Button>
          </>
        )}
        {item.direction === "outgoing" && (
          <Button size="sm" variant="outline" onClick={() => onCancel(item.id)}>
            {tPeople("cancel")}
          </Button>
        )}
        <Link href={`/people/${item.other.id}`}>
          <Button size="sm" variant="outline">
            {tPeople("viewProfile")}
          </Button>
        </Link>
      </div>
    </article>
  );
}

// ─── Main page ──────────────────────────────────────────────────

export default function PeoplePage() {
  const t = useTranslations("pages.people");
  const tLanguages = useTranslations("languages");
  const tCommon = useTranslations("common");

  const [tab, setTab] = useState<Tab>("discover");

  // Discover filters
  const [query, setQuery] = useState("");
  const [native, setNative] = useState<LanguageCode | "">("");
  const [learningFilter, setLearningFilter] = useState<LanguageCode | "">("");
  const [learningLevel, setLearningLevel] = useState<Proficiency | "">("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<PersonCard[]>([]);
  const prevCursorRef = useRef<string | null>(null);

  const LANGUAGE_CODES = LanguageCodeSchema.options;
  const PROFICIENCY_LEVELS = ProficiencySchema.options;

  const discoverUrl = useMemo(() => {
    if (tab !== "discover") return null;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (native) params.set("native", native);
    if (learningFilter) params.set("learning", learningFilter);
    if (learningLevel) params.set("learningLevel", learningLevel);
    if (cursor) params.set("cursor", cursor);
    return `/people?${params.toString()}`;
  }, [tab, query, native, learningFilter, learningLevel, cursor]);

  const {
    data: discoverData,
    isLoading: discoverLoading,
    mutate: mutateDiscover,
  } = useSWR<PeopleDiscoverResponse>(discoverUrl, apiFetcher, {
    revalidateOnFocus: false,
  });

  // Sync fetched items into allItems (append on cursor, replace otherwise)
  useEffect(() => {
    if (!discoverData) return;
    if (cursor && cursor === prevCursorRef.current) return;
    prevCursorRef.current = cursor;
    if (cursor) {
      setAllItems((prev) => [...prev, ...discoverData.items]);
    } else {
      setAllItems(discoverData.items);
    }
  }, [discoverData, cursor]);

  // Requests
  const { data: requestsData, mutate: mutateRequests } =
    useSWR<PeopleRequestsResponse>(
      tab === "requests" ? "/people/requests" : null,
      apiFetcher,
      { revalidateOnFocus: false },
    );

  // Partners (reuses discover response shape)
  const { data: partnersData, mutate: mutatePartners } =
    useSWR<PeopleDiscoverResponse>(
      tab === "partners" ? "/people/partners" : null,
      apiFetcher,
      { revalidateOnFocus: false },
    );

  // Reset cursor when filters change
  const resetFilters = useCallback(() => {
    setCursor(null);
    setAllItems([]);
    prevCursorRef.current = null;
  }, []);

  const handleConnect = useCallback(
    async (id: string) => {
      try {
        const res = await apiFetchWithRefresh(`/people/${id}/connect`, {
          method: "POST",
        });
        if (!res.ok) throw new Error();
        void mutateDiscover();
      } catch {
        // error silently — could add toast
      }
    },
    [mutateDiscover],
  );

  const handleCancel = useCallback(
    async (requestId: string) => {
      try {
        const res = await apiFetchWithRefresh(`/people/requests/${requestId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
        void mutateDiscover();
        void mutateRequests();
      } catch {
        // error silently
      }
    },
    [mutateDiscover, mutateRequests],
  );

  const handleAccept = useCallback(
    async (requestId: string) => {
      try {
        const res = await apiFetchWithRefresh(
          `/people/requests/${requestId}/respond`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "accept" }),
          },
        );
        if (!res.ok) throw new Error();
        void mutateRequests();
        void mutatePartners();
        void mutateDiscover();
      } catch {
        // error silently
      }
    },
    [mutateRequests, mutatePartners, mutateDiscover],
  );

  const handleDecline = useCallback(
    async (requestId: string) => {
      try {
        const res = await apiFetchWithRefresh(
          `/people/requests/${requestId}/respond`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "decline" }),
          },
        );
        if (!res.ok) throw new Error();
        void mutateRequests();
        void mutateDiscover();
      } catch {
        // error silently
      }
    },
    [mutateRequests, mutateDiscover],
  );

  const handleLoadMore = () => {
    if (discoverData?.nextCursor) {
      setCursor(discoverData.nextCursor);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {(["discover", "partners", "requests"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tab === tabKey
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tabKey === "discover"
                ? t("discover")
                : tabKey === "partners"
                  ? t("myPartners")
                  : t("requests")}
              {tabKey === "requests" &&
                requestsData &&
                requestsData.items.length > 0 && (
                  <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center text-xs bg-primary text-primary-foreground rounded-full">
                    {requestsData.items.length}
                  </span>
                )}
            </button>
          ))}
        </div>

        {/* Discover Tab */}
        {tab === "discover" && (
          <>
            {/* Search and Filters */}
            <section className="rounded-xl border border-border p-6 mb-8">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      resetFilters();
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <select
                    className="px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={native}
                    onChange={(e) => {
                      setNative(e.target.value as LanguageCode | "");
                      resetFilters();
                    }}
                  >
                    <option value="">{t("nativeLanguage")}</option>
                    {LANGUAGE_CODES.map((code) => (
                      <option key={code} value={code}>
                        {tLanguages(code)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={learningFilter}
                    onChange={(e) => {
                      setLearningFilter(e.target.value as LanguageCode | "");
                      resetFilters();
                    }}
                  >
                    <option value="">{t("learningLanguage")}</option>
                    {LANGUAGE_CODES.map((code) => (
                      <option key={code} value={code}>
                        {tLanguages(code)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={learningLevel}
                    onChange={(e) => {
                      setLearningLevel(e.target.value as Proficiency | "");
                      resetFilters();
                    }}
                  >
                    <option value="">{t("proficiencyLevel")}</option>
                    {PROFICIENCY_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {t(level)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* People Grid */}
            {discoverLoading && allItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {tCommon("loading")}
              </div>
            ) : allItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t("noResults")}
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {allItems.map((card) => (
                    <PersonCardView
                      key={card.id}
                      card={card}
                      tPeople={t}
                      tLanguages={tLanguages}
                      onConnect={handleConnect}
                      onCancel={handleCancel}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                    />
                  ))}
                </div>
                {discoverData?.nextCursor && (
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={discoverLoading}
                    >
                      {t("loadMore")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Partners Tab */}
        {tab === "partners" && (
          <>
            {!partnersData ? (
              <div className="text-center py-12 text-muted-foreground">
                {tCommon("loading")}
              </div>
            ) : partnersData.items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t("noResults")}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {partnersData.items.map((card) => (
                  <PersonCardView
                    key={card.id}
                    card={card}
                    tPeople={t}
                    tLanguages={tLanguages}
                    onConnect={handleConnect}
                    onCancel={handleCancel}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Requests Tab */}
        {tab === "requests" && (
          <>
            {!requestsData ? (
              <div className="text-center py-12 text-muted-foreground">
                {tCommon("loading")}
              </div>
            ) : requestsData.items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t("noResults")}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {requestsData.items.map((item) => (
                  <RequestCardView
                    key={item.id}
                    item={item}
                    tPeople={t}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
