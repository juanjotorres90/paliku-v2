import type { Intent } from "@repo/validators/profile";
import type {
  LanguageCode,
  LanguageKind,
  Proficiency,
  RelationshipStatus,
} from "@repo/validators/people";

export interface UserLanguage {
  kind: LanguageKind;
  languageCode: LanguageCode;
  level: Proficiency;
}

export interface LanguageEntry {
  languageCode: LanguageCode;
  level: Proficiency;
}

export interface PersonCard {
  id: string;
  displayName: string;
  location: string;
  bio: string;
  avatarUrl: string | null;
  updatedAt: string;
  intents: Intent[];
  speaks: LanguageEntry[];
  learning: LanguageEntry[];
  relationshipStatus: RelationshipStatus | null;
  relationshipId: string | null;
  isRequester: boolean | null;
}

export interface ConnectionRequestItem {
  id: string;
  direction: "incoming" | "outgoing";
  createdAt: string;
  other: PersonCard;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PeopleDiscoverQuery {
  q?: string;
  native?: string;
  learning?: string;
  learningLevel?: string;
  cursor?: string;
  limit: number;
}
