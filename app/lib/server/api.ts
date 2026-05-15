import { NextRequest, NextResponse } from "next/server";

export const DEFAULT_JSON_BODY_LIMIT_BYTES = 2_500_000;

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function readJsonBody<T>(
  request: NextRequest,
  maxBytes = DEFAULT_JSON_BODY_LIMIT_BYTES,
): Promise<T> {
  assertSameOrigin(request);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "Expected application/json.");
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    throw new HttpError(413, "Request body is too large.");
  }

  const rawBody = await request.text();
  if (rawBody.length > maxBytes) {
    throw new HttpError(413, "Request body is too large.");
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    throw new HttpError(403, "Cross-origin requests are not allowed.");
  }
}

export function noStoreJson(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return noStoreJson({ message: error.message }, { status: error.status });
  }

  console.error("API request failed:", error);
  return noStoreJson({ message: "Something went wrong." }, { status: 500 });
}
