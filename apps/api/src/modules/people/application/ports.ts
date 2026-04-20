import type {
  ConnectionRequestItem,
  CursorPage,
  LanguageEntry,
  PersonCard,
  UserLanguage,
} from "../domain/types";

export interface PeopleRepositoryPort {
  discover(input: {
    accessToken: string;
    userId: string;
    q?: string;
    native?: string;
    learning?: string;
    learningLevel?: string;
    cursor?: { updatedAt: string; id: string };
    limit: number;
  }): Promise<CursorPage<PersonCard>>;

  getRequests(input: {
    accessToken: string;
    userId: string;
    direction: "incoming" | "outgoing";
    cursor?: { updatedAt: string; id: string };
    limit: number;
  }): Promise<CursorPage<ConnectionRequestItem>>;

  getPartners(input: {
    accessToken: string;
    userId: string;
  }): Promise<PersonCard[]>;

  getPersonById(input: {
    accessToken: string;
    userId: string;
    targetId: string;
  }): Promise<PersonCard>;

  createRequest(input: {
    accessToken: string;
    requesterId: string;
    targetId: string;
  }): Promise<{ id: string }>;

  respondToRequest(input: {
    accessToken: string;
    requestId: string;
    userId: string;
    action: "accept" | "decline";
  }): Promise<void>;

  cancelRequest(input: {
    accessToken: string;
    requestId: string;
    userId: string;
  }): Promise<void>;
}

export interface UserLanguagesRepositoryPort {
  getForUser(input: {
    accessToken: string;
    userId: string;
  }): Promise<UserLanguage[]>;

  getForUsers(input: {
    accessToken: string;
    userIds: string[];
  }): Promise<Map<string, UserLanguage[]>>;

  replaceForUser(input: {
    accessToken: string;
    userId: string;
    speaks: LanguageEntry[];
    learning: LanguageEntry[];
  }): Promise<UserLanguage[]>;
}
