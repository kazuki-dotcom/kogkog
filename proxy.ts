import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/activate");

  // Unauthenticated users can only access auth pages
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Logged-in users shouldn't see auth pages
  if (isLoggedIn && isAuthPage) {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Admins cannot access /dashboard, employees cannot access /admin
  if (isLoggedIn && role === "EMPLOYEE" && nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  if (isLoggedIn && role === "ADMIN" && nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
