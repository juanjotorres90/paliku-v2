import { decodeCursor } from "../../domain/cursor";
import type { CursorPage, PersonCard } from "../../domain/types";
import type { PeopleRepositoryPort } from "../ports";

export interface DiscoverPeopleInput {
  accessToken: string;
  userId: string;
  q?: string;
  native?: string;
  learning?: string;
  learningLevel?: string;
  cursor?: string;
  limit: number;
}

export interface DiscoverPeopleContext {
  peopleRepo: PeopleRepositoryPort;
}

export async function discoverPeople(
  input: DiscoverPeopleInput,
  ctx: DiscoverPeopleContext,
): Promise<CursorPage<PersonCard>> {
  const decoded = input.cursor ? decodeCursor(input.cursor) : undefined;

  return ctx.peopleRepo.discover({
    accessToken: input.accessToken,
    userId: input.userId,
    q: input.q,
    native: input.native,
    learning: input.learning,
    learningLevel: input.learningLevel,
    cursor: decoded,
    limit: input.limit,
  });
}
