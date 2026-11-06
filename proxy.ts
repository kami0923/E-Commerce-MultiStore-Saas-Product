import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const path = request.nextUrl.pathname;

  if (path.startsWith("/dashboard") && !sessionCookie) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("redirectTo", path);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
