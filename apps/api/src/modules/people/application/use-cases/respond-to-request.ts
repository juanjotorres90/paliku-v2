import type { PeopleRepositoryPort } from "../ports";

export interface RespondToRequestInput {
  accessToken: string;
  requestId: string;
  userId: string;
  action: "accept" | "decline";
}

export interface RespondToRequestContext {
  peopleRepo: PeopleRepositoryPort;
}

export async function respondToRequest(
  input: RespondToRequestInput,
  ctx: RespondToRequestContext,
): Promise<void> {
  return ctx.peopleRepo.respondToRequest({
    accessToken: input.accessToken,
    requestId: input.requestId,
    userId: input.userId,
    action: input.action,
  });
}
