import type { PersonCard } from "../../domain/types";
import type { PeopleRepositoryPort } from "../ports";

export interface GetPartnersInput {
  accessToken: string;
  userId: string;
}

export interface GetPartnersContext {
  peopleRepo: PeopleRepositoryPort;
}

export async function getPartners(
  input: GetPartnersInput,
  ctx: GetPartnersContext,
): Promise<PersonCard[]> {
  return ctx.peopleRepo.getPartners({
    accessToken: input.accessToken,
    userId: input.userId,
  });
}
