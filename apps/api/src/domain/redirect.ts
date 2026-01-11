export function getSafeNext(value: string | null | undefined): string {
  if (!value) return "/";
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  ) {
    return value;
  }
  return "/";
}
