import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Legacy URLs → canonical auth routes. Auth session uses localStorage; route protection runs in `DashboardShell`. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/auth/register", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register"],
};
