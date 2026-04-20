import type { PeopleRepositoryPort } from "../ports";

export interface CancelRequestInput {
  accessToken: string;
  requestId: string;
  userId: string;
}

export interface CancelRequestContext {
  peopleRepo: PeopleRepositoryPort;
}

export async function cancelRequest(
  input: CancelRequestInput,
  ctx: CancelRequestContext,
): Promise<void> {
  return ctx.peopleRepo.cancelRequest({
    accessToken: input.accessToken,
    requestId: input.requestId,
    userId: input.userId,
  });
}
