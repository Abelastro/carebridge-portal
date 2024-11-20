import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "carebridge_session";

export function middleware(request: NextRequest) {
  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/patients/:path*", "/admin/:path*"],
};
