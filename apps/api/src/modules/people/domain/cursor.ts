import { ValidationError } from "../../../shared/domain/errors";

const SEPARATOR = "::";

export function encodeCursor(updatedAt: string, id: string): string {
  const raw = `${updatedAt}${SEPARATOR}${id}`;
  return Buffer.from(raw).toString("base64url");
}

export function decodeCursor(cursor: string): {
  updatedAt: string;
  id: string;
} {
  let raw: string;
  try {
    raw = Buffer.from(cursor, "base64url").toString("utf-8");
  } catch {
    throw new ValidationError("Invalid cursor");
  }

  const separatorIndex = raw.indexOf(SEPARATOR);
  if (separatorIndex === -1) {
    throw new ValidationError("Invalid cursor format");
  }

  const updatedAt = raw.slice(0, separatorIndex);
  const id = raw.slice(separatorIndex + SEPARATOR.length);

  if (!updatedAt || !id) {
    throw new ValidationError("Invalid cursor content");
  }

  return { updatedAt, id };
}
