import type { Intent } from "@repo/validators/profile";
import type { RelationshipStatus } from "@repo/validators/people";
import type { SupabaseConfig } from "../../../server/config";
import { ForbiddenError, NotFoundError } from "../../../shared/domain/errors";
import type { HttpClient } from "../../../shared/infrastructure/http-client";
import {
  buildSupabaseHeaders,
  parsePostgrestArray,
} from "../../../shared/infrastructure/supabase-http";
import type {
  PeopleRepositoryPort,
  UserLanguagesRepositoryPort,
} from "../application/ports";
import { encodeCursor } from "../domain/cursor";
import type {
  ConnectionRequestItem,
  CursorPage,
  LanguageEntry,
  PersonCard,
  UserLanguage,
} from "../domain/types";

interface ProfileRow {
  id: string;
  display_name: string;
  bio: string;
  location: string;
  intents: string[];
  is_public: boolean;
  avatar_url: string | null;
  updated_at: string;
}

const PROFILE_COLS =
  "id,display_name,bio,location,intents,is_public,avatar_url,updated_at";
const RELATIONSHIP_COLS =
  "id,user_a,user_b,requested_by,status,created_at,updated_at";
const PARTNERS_MAX = 100;

interface RelationshipRow {
  id: string;
  user_a: string;
  user_b: string;
  requested_by: string;
  status: RelationshipStatus;
  created_at: string;
  updated_at: string;
}

function splitLanguages(langs: UserLanguage[]): {
  speaks: LanguageEntry[];
  learning: LanguageEntry[];
} {
  const speaks: LanguageEntry[] = [];
  const learning: LanguageEntry[] = [];
  for (const l of langs) {
    const entry = { languageCode: l.languageCode, level: l.level };
    if (l.kind === "speaks") speaks.push(entry);
    else if (l.kind === "learning") learning.push(entry);
  }
  return { speaks, learning };
}

function mapProfileToCard(
  row: ProfileRow,
  speaks: LanguageEntry[],
  learning: LanguageEntry[],
  rel: RelationshipRow | null,
  currentUserId: string,
): PersonCard {
  return {
    id: row.id,
    displayName: row.display_name ?? "",
    bio: row.bio ?? "",
    location: row.location ?? "",
    avatarUrl: row.avatar_url,
    updatedAt: row.updated_at ?? new Date().toISOString(),
    intents: Array.isArray(row.intents) ? (row.intents as Intent[]) : [],
    speaks,
    learning,
    relationshipStatus: rel?.status ?? null,
    relationshipId: rel?.id ?? null,
    isRequester: rel ? rel.requested_by === currentUserId : null,
  };
}

/**
 * Compute ordered pair for partner_relationships constraint (user_a < user_b).
 */
function orderedPair(a: string, b: string): { userA: string; userB: string } {
  return a < b ? { userA: a, userB: b } : { userA: b, userB: a };
}

export function createSupabasePeopleRepo(
  supabase: SupabaseConfig,
  httpClient: HttpClient,
  languagesRepo: UserLanguagesRepositoryPort,
): PeopleRepositoryPort {
  async function discover(input: {
    accessToken: string;
    userId: string;
    q?: string;
    native?: string;
    learning?: string;
    learningLevel?: string;
    cursor?: { updatedAt: string; id: string };
    limit: number;
  }): Promise<CursorPage<PersonCard>> {
    const headers = buildSupabaseHeaders(supabase, input.accessToken);

    let select = PROFILE_COLS;
    const filters: string[] = [`is_public=eq.true`, `id=neq.${input.userId}`];

    // If language filters are present, use inner join
    if (input.native || input.learning) {
      select += ",user_languages!inner(id,kind,language_code,level)";

      if (input.native) {
        filters.push(`user_languages.kind=eq.speaks`);
        filters.push(`user_languages.language_code=eq.${input.native}`);
        filters.push(`user_languages.level=eq.native`);
      }

      if (input.learning) {
        filters.push(`user_languages.kind=eq.learning`);
        filters.push(`user_languages.language_code=eq.${input.learning}`);
        if (input.learningLevel) {
          filters.push(`user_languages.level=eq.${input.learningLevel}`);
        }
      }
    }

    // Text search
    if (input.q) {
      const q = input.q.replace(/[%_]/g, "");
      filters.push(
        `or=(display_name.ilike.*${q}*,location.ilike.*${q}*,bio.ilike.*${q}*)`,
      );
    }

    // Cursor pagination
    if (input.cursor) {
      const { updatedAt, id } = input.cursor;
      filters.push(
        `or=(updated_at.lt.${updatedAt},and(updated_at.eq.${updatedAt},id.lt.${id}))`,
      );
    }

    // Order and limit (fetch one extra to detect next page)
    const fetchLimit = input.limit + 1;
    const queryParams = [
      `select=${select}`,
      ...filters,
      `order=updated_at.desc,id.desc`,
      `limit=${fetchLimit}`,
    ].join("&");

    const url = new URL(`/rest/v1/profiles?${queryParams}`, supabase.url);
    const response = await httpClient.get(url.toString(), headers);
    const rows = (await parsePostgrestArray(response)) as ProfileRow[];

    const hasMore = rows.length > input.limit;
    const profileRows = hasMore ? rows.slice(0, input.limit) : rows;

    if (profileRows.length === 0) {
      return { items: [], nextCursor: null };
    }

    const profileIds = profileRows.map((r) => r.id);

    // Fetch languages and relationships in parallel
    const [languagesMap, relationships] = await Promise.all([
      languagesRepo.getForUsers({
        accessToken: input.accessToken,
        userIds: profileIds,
      }),
      fetchRelationshipsForProfiles(
        input.accessToken,
        input.userId,
        profileIds,
      ),
    ]);

    const items = profileRows.map((row) => {
      const { speaks, learning } = splitLanguages(
        languagesMap.get(row.id) ?? [],
      );
      const rel = relationships.get(row.id) ?? null;
      return mapProfileToCard(row, speaks, learning, rel, input.userId);
    });

    const lastItem = profileRows[profileRows.length - 1]!;
    const nextCursor = hasMore
      ? encodeCursor(lastItem.updated_at, lastItem.id)
      : null;

    return { items, nextCursor };
  }

  async function fetchRelationshipsForProfiles(
    accessToken: string,
    userId: string,
    profileIds: string[],
  ): Promise<Map<string, RelationshipRow>> {
    if (profileIds.length === 0) return new Map();

    const headers = buildSupabaseHeaders(supabase, accessToken);

    const idsList = profileIds.join(",");
    const url = new URL(
      `/rest/v1/partner_relationships?select=${RELATIONSHIP_COLS}&or=(and(user_a.eq.${userId},user_b.in.(${idsList})),and(user_b.eq.${userId},user_a.in.(${idsList})))`,
      supabase.url,
    );

    const response = await httpClient.get(url.toString(), headers);
    const rows = (await parsePostgrestArray(response)) as RelationshipRow[];

    const result = new Map<string, RelationshipRow>();
    for (const row of rows) {
      const otherId = row.user_a === userId ? row.user_b : row.user_a;
      result.set(otherId, row);
    }
    return result;
  }

  async function getRequests(input: {
    accessToken: string;
    userId: string;
    direction: "incoming" | "outgoing";
    cursor?: { updatedAt: string; id: string };
    limit: number;
  }): Promise<CursorPage<ConnectionRequestItem>> {
    const headers = buildSupabaseHeaders(supabase, input.accessToken);

    const filters: string[] = [
      `status=eq.pending`,
      `or=(user_a.eq.${input.userId},user_b.eq.${input.userId})`,
    ];

    if (input.direction === "outgoing") {
      filters.push(`requested_by=eq.${input.userId}`);
    } else {
      filters.push(`requested_by=neq.${input.userId}`);
    }

    if (input.cursor) {
      const { updatedAt, id } = input.cursor;
      filters.push(
        `or=(created_at.lt.${updatedAt},and(created_at.eq.${updatedAt},id.lt.${id}))`,
      );
    }

    const fetchLimit = input.limit + 1;
    const queryParams = [
      `select=${RELATIONSHIP_COLS}`,
      ...filters,
      `order=created_at.desc,id.desc`,
      `limit=${fetchLimit}`,
    ].join("&");

    const url = new URL(
      `/rest/v1/partner_relationships?${queryParams}`,
      supabase.url,
    );
    const response = await httpClient.get(url.toString(), headers);
    const rows = (await parsePostgrestArray(response)) as RelationshipRow[];

    const hasMore = rows.length > input.limit;
    const relRows = hasMore ? rows.slice(0, input.limit) : rows;

    if (relRows.length === 0) {
      return { items: [], nextCursor: null };
    }

    // Get profile data for the "other" user in each request
    const otherIds = relRows.map((r) =>
      r.user_a === input.userId ? r.user_b : r.user_a,
    );

    const [profilesMap, languagesMap] = await Promise.all([
      fetchProfilesById(input.accessToken, otherIds),
      languagesRepo.getForUsers({
        accessToken: input.accessToken,
        userIds: otherIds,
      }),
    ]);

    const items: ConnectionRequestItem[] = relRows
      .map((rel) => {
        const otherId = rel.user_a === input.userId ? rel.user_b : rel.user_a;
        const profile = profilesMap.get(otherId);
        if (!profile) return null;

        const { speaks, learning } = splitLanguages(
          languagesMap.get(otherId) ?? [],
        );

        const card = mapProfileToCard(
          profile,
          speaks,
          learning,
          rel,
          input.userId,
        );

        return {
          id: rel.id,
          direction: input.direction,
          createdAt: rel.created_at,
          other: card,
        };
      })
      .filter((item): item is ConnectionRequestItem => item !== null);

    const lastRow = relRows[relRows.length - 1]!;
    const nextCursor = hasMore
      ? encodeCursor(lastRow.created_at, lastRow.id)
      : null;

    return { items, nextCursor };
  }

  async function fetchProfilesById(
    accessToken: string,
    ids: string[],
  ): Promise<Map<string, ProfileRow>> {
    if (ids.length === 0) return new Map();

    const headers = buildSupabaseHeaders(supabase, accessToken);
    const url = new URL(
      `/rest/v1/profiles?id=in.(${ids.join(",")})&select=${PROFILE_COLS}`,
      supabase.url,
    );

    const response = await httpClient.get(url.toString(), headers);
    const rows = (await parsePostgrestArray(response)) as ProfileRow[];

    const result = new Map<string, ProfileRow>();
    for (const row of rows) {
      result.set(row.id, row);
    }
    return result;
  }

  async function getPartners(input: {
    accessToken: string;
    userId: string;
  }): Promise<PersonCard[]> {
    const headers = buildSupabaseHeaders(supabase, input.accessToken);

    const url = new URL(
      `/rest/v1/partner_relationships?select=${RELATIONSHIP_COLS}&status=eq.accepted&or=(user_a.eq.${input.userId},user_b.eq.${input.userId})&order=updated_at.desc&limit=${PARTNERS_MAX}`,
      supabase.url,
    );

    const response = await httpClient.get(url.toString(), headers);
    const relRows = (await parsePostgrestArray(response)) as RelationshipRow[];

    if (relRows.length === 0) return [];

    const otherIds = relRows.map((r) =>
      r.user_a === input.userId ? r.user_b : r.user_a,
    );

    const [profilesMap, languagesMap] = await Promise.all([
      fetchProfilesById(input.accessToken, otherIds),
      languagesRepo.getForUsers({
        accessToken: input.accessToken,
        userIds: otherIds,
      }),
    ]);

    return relRows
      .map((rel) => {
        const otherId = rel.user_a === input.userId ? rel.user_b : rel.user_a;
        const profile = profilesMap.get(otherId);
        if (!profile) return null;

        const { speaks, learning } = splitLanguages(
          languagesMap.get(otherId) ?? [],
        );

        return mapProfileToCard(profile, speaks, learning, rel, input.userId);
      })
      .filter((item): item is PersonCard => item !== null);
  }

  async function getPersonById(input: {
    accessToken: string;
    userId: string;
    targetId: string;
  }): Promise<PersonCard> {
    const headers = buildSupabaseHeaders(supabase, input.accessToken);

    const profileUrl = new URL(
      `/rest/v1/profiles?id=eq.${input.targetId}&is_public=eq.true&select=${PROFILE_COLS}`,
      supabase.url,
    );
    const profileResponse = await httpClient.get(
      profileUrl.toString(),
      headers,
    );
    const profileRows = (await parsePostgrestArray(
      profileResponse,
    )) as ProfileRow[];

    if (profileRows.length === 0) {
      throw new NotFoundError("Profile not found");
    }

    const profile = profileRows[0]!;

    // Fetch languages and relationship in parallel
    const [languagesMap, relationships] = await Promise.all([
      languagesRepo.getForUsers({
        accessToken: input.accessToken,
        userIds: [input.targetId],
      }),
      fetchRelationshipsForProfiles(input.accessToken, input.userId, [
        input.targetId,
      ]),
    ]);

    const { speaks, learning } = splitLanguages(
      languagesMap.get(input.targetId) ?? [],
    );
    const rel = relationships.get(input.targetId) ?? null;

    return mapProfileToCard(profile, speaks, learning, rel, input.userId);
  }

  async function createRequest(input: {
    accessToken: string;
    requesterId: string;
    targetId: string;
  }): Promise<{ id: string }> {
    const { userA, userB } = orderedPair(input.requesterId, input.targetId);
    const headers = buildSupabaseHeaders(supabase, input.accessToken);

    const url = new URL(`/rest/v1/partner_relationships`, supabase.url);
    const response = await httpClient.post(
      url.toString(),
      {
        user_a: userA,
        user_b: userB,
        requested_by: input.requesterId,
        status: "pending",
      },
      headers,
    );

    const rows = (await parsePostgrestArray(response)) as RelationshipRow[];
    if (rows.length === 0) {
      throw new Error("Failed to create connection request");
    }

    return { id: rows[0]!.id };
  }

  async function respondToRequest(input: {
    accessToken: string;
    requestId: string;
    userId: string;
    action: "accept" | "decline";
  }): Promise<void> {
    const headers = buildSupabaseHeaders(supabase, input.accessToken);
    const newStatus = input.action === "accept" ? "accepted" : "declined";

    const url = new URL(
      `/rest/v1/partner_relationships?id=eq.${input.requestId}`,
      supabase.url,
    );

    const response = await httpClient.patch(
      url.toString(),
      { status: newStatus },
      headers,
    );

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 404) {
        throw new NotFoundError("Connection request not found");
      }
      if (response.status === 403) {
        throw new ForbiddenError("Not authorized to respond to this request");
      }
      throw new Error(`Failed to respond to request: ${text}`);
    }

    const rows = (await parsePostgrestArray(response)) as RelationshipRow[];
    if (rows.length === 0) {
      throw new NotFoundError("Connection request not found");
    }
  }

  async function cancelRequest(input: {
    accessToken: string;
    requestId: string;
    userId: string;
  }): Promise<void> {
    const headers = buildSupabaseHeaders(supabase, input.accessToken);

    const url = new URL(
      `/rest/v1/partner_relationships?id=eq.${input.requestId}`,
      supabase.url,
    );

    const response = await httpClient.delete(url.toString(), headers);

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 404) {
        throw new NotFoundError("Connection request not found");
      }
      if (response.status === 403) {
        throw new ForbiddenError("Not authorized to cancel this request");
      }
      throw new Error(`Failed to cancel request: ${text}`);
    }
  }

  return {
    discover,
    getRequests,
    getPartners,
    getPersonById,
    createRequest,
    respondToRequest,
    cancelRequest,
  };
}
