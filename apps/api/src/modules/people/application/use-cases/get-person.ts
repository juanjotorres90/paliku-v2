import type { PersonCard } from "../../domain/types";
import type { PeopleRepositoryPort } from "../ports";

export interface GetPersonInput {
  accessToken: string;
  userId: string;
  targetId: string;
}

export interface GetPersonContext {
  peopleRepo: PeopleRepositoryPort;
}

export async function getPerson(
  input: GetPersonInput,
  ctx: GetPersonContext,
): Promise<PersonCard> {
  return ctx.peopleRepo.getPersonById({
    accessToken: input.accessToken,
    userId: input.userId,
    targetId: input.targetId,
  });
}
