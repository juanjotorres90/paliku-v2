function normalizePath(path: string): string {
  if (!path) return "/";
  if (path.startsWith("/")) return path;
  return `/${path}`;
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";
}

function withCredentials(init: RequestInit | undefined): RequestInit {
  if (!init) return { credentials: "include" };
  if (init.credentials) return init;
  return { ...init, credentials: "include" };
}

let refreshInFlight: Promise<boolean> | null = null;
let refreshFailedUntilMs = 0;

async function ensureSessionRefreshed(apiUrl: string): Promise<boolean> {
  const now = Date.now();
  if (now < refreshFailedUntilMs) return false;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        refreshFailedUntilMs = Date.now() + 60_000;
        return false;
      }

      refreshFailedUntilMs = 0;
      return true;
    } catch {
      refreshFailedUntilMs = Date.now() + 60_000;
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}${normalizePath(path)}`;
  return fetch(url, withCredentials(init));
}

export async function apiFetchWithRefresh(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const normalizedPath = normalizePath(path);
  if (normalizedPath.startsWith("/auth/")) {
    return apiFetch(normalizedPath, init);
  }

  const apiUrl = getApiUrl();
  const url = `${apiUrl}${normalizedPath}`;
  const firstResponse = await fetch(url, withCredentials(init));

  if (firstResponse.status !== 401) return firstResponse;

  const refreshed = await ensureSessionRefreshed(apiUrl);
  if (!refreshed) return firstResponse;

  return fetch(url, withCredentials(init));
}
