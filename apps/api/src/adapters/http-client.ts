export function createFetchHttpClient() {
  return {
    async post(url: string, body: unknown, headers: Record<string, string>) {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      return {
        ok: response.ok,
        status: response.status,
        text: () => response.text(),
      };
    },
  };
}
