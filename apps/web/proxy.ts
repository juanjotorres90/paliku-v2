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

  // Public auth pages that don't require authentication
  const publicAuthPages = ["/login", "/register", "/auth/check-email"];
  const isPublicAuthPage = publicAuthPages.some(
    (page) => pathname === page || pathname.startsWith(page + "/"),
  );

  // If not authenticated and not on a public auth page, redirect to login
  if (!accessToken && !isPublicAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const safeRedirect = getSafeRedirect(
      `${pathname}${request.nextUrl.search}`,
    );
    url.searchParams.set("redirect", safeRedirect);
    return NextResponse.redirect(url);
  }

  // If authenticated and on a public auth page, redirect to home
  if (accessToken && isPublicAuthPage) {
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
