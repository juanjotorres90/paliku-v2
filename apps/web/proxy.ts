import { NextResponse, type NextRequest } from "next/server";

import { getSafeRedirect } from "./lib/redirect";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for API routes - they handle their own auth
  if (pathname.startsWith("/api")) {
    return NextResponse.next({ request });
  }

  const accessToken = request.cookies.get(
    request.cookies.getAll().find((c) => c.name.endsWith("-access-token"))
      ?.name ?? "",
  )?.value;

  // If not authenticated and not on login/register page, redirect to login
  if (!accessToken && pathname !== "/login" && pathname !== "/register") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const safeRedirect = getSafeRedirect(
      `${pathname}${request.nextUrl.search}`,
    );
    url.searchParams.set("redirect", safeRedirect);
    return NextResponse.redirect(url);
  }

  // If authenticated and on login page, redirect to home
  if (accessToken && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("redirect");
    return NextResponse.redirect(url);
  }

  return NextResponse.next({
    request,
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Common static file extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
