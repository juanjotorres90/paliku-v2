function normalizePath(path: string): string {
  if (!path) return "/";
  if (path.startsWith("/")) return path;
  return `/${path}`;
}

function getApiUrl(): string {
  // API is mounted at /api in the Next.js app (same-origin)
  return "/api";
}

function withCredentials(init: RequestInit | undefined): RequestInit {
  if (!init) return { credentials: "include" };
  if (init.credentials) return init;
  return { ...init, credentials: "include" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

let refreshInFlight: Promise<boolean> | null = null;
let refreshFailedUntilMs = 0;

let logoutInFlight: Promise<void> | null = null;

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

function isMeEndpoint(path: string): boolean {
  const pathname = path.split(/[?#]/, 1)[0] ?? path;
  const normalized = pathname.replace(/\/+$/, "");
  return normalized.endsWith("/me");
}

async function isTokenInvalid(response: Response): Promise<boolean> {
  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return false;

    const json: unknown = await response.clone().json();
    if (!isRecord(json)) return false;

    return (
      json.errorKey === "api.errors.auth.token_invalid" ||
      json.error === "api.errors.auth.token_invalid"
    );
  } catch {
    return false;
  }
}

async function clientSignoutAndGoToLogin(): Promise<void> {
  if (typeof window === "undefined") return;
  if (logoutInFlight) return logoutInFlight;

  logoutInFlight = (async () => {
    try {
      await fetch(`${getApiUrl()}/auth/signout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }

    const pathname = window.location.pathname;
    const search = window.location.search;
    const current = `${pathname}${search}`;

    const publicAuthPages = ["/login", "/register", "/auth/check-email"];
    const isPublicAuthPage = publicAuthPages.some(
      (page) => pathname === page || pathname.startsWith(page + "/"),
    );

    const redirect = isPublicAuthPage ? "/" : current;
    const loginUrl = new URL("/login", window.location.origin);
    if (redirect !== "/") {
      loginUrl.searchParams.set("redirect", redirect);
    }
    const href = loginUrl.toString();
    const isJsdom = window.navigator.userAgent.includes("jsdom");
    if (isJsdom) {
      window.history.replaceState({}, "", href);
      return;
    }

    window.location.replace(href);
  })();

  return logoutInFlight;
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
  if (!refreshed) {
    if (isMeEndpoint(normalizedPath) && (await isTokenInvalid(firstResponse))) {
      void clientSignoutAndGoToLogin();
    }
    return firstResponse;
  }

  const secondResponse = await fetch(url, withCredentials(init));
  if (secondResponse.status === 401) {
    if (
      isMeEndpoint(normalizedPath) &&
      (await isTokenInvalid(secondResponse))
    ) {
      void clientSignoutAndGoToLogin();
    }
  }

  return secondResponse;
}
