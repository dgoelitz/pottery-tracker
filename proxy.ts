import { NextRequest, NextResponse } from "next/server";
import { getAuthSetupProblem, isAuthorizedRequest, shouldRequireAuth } from "./app/lib/server/auth";

const PUBLIC_PATHS = [
  "/favicon.ico",
  "/manifest.json",
  "/placeholder.jpg",
  "/file.svg",
  "/globe.svg",
  "/next.svg",
  "/vercel.svg",
  "/window.svg",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();
  if (!shouldRequireAuth()) return NextResponse.next();

  const setupProblem = getAuthSetupProblem();
  if (setupProblem) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: setupProblem }, { status: 503 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("setup", "missing");
    return NextResponse.redirect(loginUrl);
  }

  if (await isAuthorizedRequest(request)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/") ||
    PUBLIC_PATHS.includes(pathname)
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
