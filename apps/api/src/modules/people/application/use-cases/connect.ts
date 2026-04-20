import { ValidationError } from "../../../../shared/domain/errors";
import type { PeopleRepositoryPort } from "../ports";

export interface ConnectInput {
  accessToken: string;
  requesterId: string;
  targetId: string;
}

export interface ConnectContext {
  peopleRepo: PeopleRepositoryPort;
}

export async function connect(
  input: ConnectInput,
  ctx: ConnectContext,
): Promise<{ id: string }> {
  if (input.requesterId === input.targetId) {
    throw new ValidationError("Cannot connect with yourself");
  }

  return ctx.peopleRepo.createRequest({
    accessToken: input.accessToken,
    requesterId: input.requesterId,
    targetId: input.targetId,
  });
}
