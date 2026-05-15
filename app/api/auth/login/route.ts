import { NextRequest, NextResponse } from "next/server";
import {
  createSessionCookieValue,
  getAuthSetupProblem,
  getSessionMaxAgeSeconds,
  isValidPassword,
  SESSION_COOKIE,
} from "../../../lib/server/auth";
import { assertSameOrigin } from "../../../lib/server/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch {
    return new NextResponse("Cross-origin requests are not allowed.", { status: 403 });
  }

  const setupProblem = getAuthSetupProblem();
  if (setupProblem) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("setup", "missing");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const nextPath = sanitizeNextPath(String(formData.get("next") || "/"));

  if (!isValidPassword(password)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "1");
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), { status: 303 });
  response.cookies.set(SESSION_COOKIE, await createSessionCookieValue(), {
    httpOnly: true,
    maxAge: getSessionMaxAgeSeconds(),
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });

  return response;
}

function sanitizeNextPath(nextPath: string) {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return "/";
  return nextPath;
}
