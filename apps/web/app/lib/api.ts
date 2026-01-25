import { ErrorCode, isTokenInvalidCode } from "@repo/validators/error-codes";

// Re-export for convenience
export { ErrorCode };

// Session storage key to prevent logout loops
const LOGOUT_IN_PROGRESS_KEY = "paliku:logout_in_progress";

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

function getErrorCode(json: unknown): number | null {
  if (!isRecord(json)) return null;
  if (typeof json.code === "number") return json.code;
  return null;
}

async function parseErrorCode(response: Response): Promise<number | null> {
  try {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;

    const json: unknown = await response.clone().json();
    return getErrorCode(json);
  } catch {
    return null;
  }
}

function isLogoutInProgress(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(LOGOUT_IN_PROGRESS_KEY) === "true";
  } catch {
    return false;
  }
}

function setLogoutInProgress(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      sessionStorage.setItem(LOGOUT_IN_PROGRESS_KEY, "true");
    } else {
      sessionStorage.removeItem(LOGOUT_IN_PROGRESS_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

async function clientSignoutAndGoToLogin(): Promise<void> {
  if (typeof window === "undefined") return;

  // Prevent infinite loops: if we're already in the middle of a logout
  // (including across page reloads), don't start another one
  if (logoutInFlight) return logoutInFlight;
  if (isLogoutInProgress()) return;

  setLogoutInProgress(true);

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
      logoutInFlight = null;
      setLogoutInProgress(false);
      return;
    }

    // Clear the flag before redirect - the login page will clear it on successful load
    // This ensures that if redirect fails, we don't stay stuck
    setLogoutInProgress(false);
    logoutInFlight = null;
    window.location.replace(href);
  })();

  return logoutInFlight;
}

/**
 * Clears the logout-in-progress flag. Call this from auth pages (login, register)
 * when they successfully mount to ensure the flag is cleared after redirect.
 */
export function clearLogoutState(): void {
  setLogoutInProgress(false);
  logoutInFlight = null;
  // Also reset refresh failure state to allow fresh auth attempts
  refreshFailedUntilMs = 0;
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
    if (isMeEndpoint(normalizedPath)) {
      const errorCode = await parseErrorCode(firstResponse);
      if (isTokenInvalidCode(errorCode)) {
        void clientSignoutAndGoToLogin();
      }
    }
    return firstResponse;
  }

  const secondResponse = await fetch(url, withCredentials(init));
  if (secondResponse.status === 401) {
    if (isMeEndpoint(normalizedPath)) {
      const errorCode = await parseErrorCode(secondResponse);
      if (isTokenInvalidCode(errorCode)) {
        void clientSignoutAndGoToLogin();
      }
    }
  }

  return secondResponse;
}
