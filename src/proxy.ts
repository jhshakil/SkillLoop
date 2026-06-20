import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const userRole = req.auth?.user?.role as string | undefined;

  const pathname = nextUrl.pathname;

  if (
    !isLoggedIn &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/super-admin") ||
      pathname.startsWith("/moderator") ||
      pathname.startsWith("/user"))
  ) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (pathname.startsWith("/admin") && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (pathname.startsWith("/super-admin") && userRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (
    pathname.startsWith("/moderator") &&
    userRole !== "MODERATOR" &&
    userRole !== "ADMIN" &&
    userRole !== "SUPER_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (pathname.startsWith("/user") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
    const dashboardUrl = getDashboardUrl(userRole || "USER");
    return NextResponse.redirect(new URL(dashboardUrl, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg).*)"],
};

function getDashboardUrl(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin/analytics";
    case "ADMIN":
      return "/admin/courses";
    case "MODERATOR":
      return "/moderator/notifications";
    default:
      return "/user/dashboard";
  }
}
