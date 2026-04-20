import { decodeCursor } from "../../domain/cursor";
import type { ConnectionRequestItem, CursorPage } from "../../domain/types";
import type { PeopleRepositoryPort } from "../ports";

export interface GetRequestsInput {
  accessToken: string;
  userId: string;
  direction: "incoming" | "outgoing";
  cursor?: string;
  limit: number;
}

export interface GetRequestsContext {
  peopleRepo: PeopleRepositoryPort;
}

export async function getRequests(
  input: GetRequestsInput,
  ctx: GetRequestsContext,
): Promise<CursorPage<ConnectionRequestItem>> {
  const decoded = input.cursor ? decodeCursor(input.cursor) : undefined;

  return ctx.peopleRepo.getRequests({
    accessToken: input.accessToken,
    userId: input.userId,
    direction: input.direction,
    cursor: decoded,
    limit: input.limit,
  });
}
