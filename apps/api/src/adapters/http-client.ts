export interface HttpClient {
  post(
    url: string,
    body: unknown,
    headers: Record<string, string>,
  ): Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
  }>;
  get(
    url: string,
    headers: Record<string, string>,
  ): Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
  }>;
  patch(
    url: string,
    body: unknown,
    headers: Record<string, string>,
  ): Promise<{
    ok: boolean;
    status: number;
    text: () => Promise<string>;
  }>;
}

export function createFetchHttpClient(): HttpClient {
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
    async get(url: string, headers: Record<string, string>) {
      const response = await fetch(url, {
        method: "GET",
        headers,
      });
      return {
        ok: response.ok,
        status: response.status,
        text: () => response.text(),
      };
    },
    async patch(url: string, body: unknown, headers: Record<string, string>) {
      const response = await fetch(url, {
        method: "PATCH",
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
