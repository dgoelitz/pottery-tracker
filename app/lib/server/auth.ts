import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "pottery_session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function getSessionMaxAgeSeconds() {
  return SESSION_MAX_AGE_SECONDS;
}

export function shouldRequireAuth() {
  return (
    Boolean(process.env.POTTERY_APP_PASSWORD || process.env.POTTERY_AUTH_SECRET) ||
    process.env.NODE_ENV === "production"
  );
}

export function getAuthSetupProblem() {
  if (!shouldRequireAuth()) return null;
  if (!process.env.POTTERY_APP_PASSWORD) return "POTTERY_APP_PASSWORD is missing.";
  if (!process.env.POTTERY_AUTH_SECRET) return "POTTERY_AUTH_SECRET is missing.";

  return null;
}

export function isValidPassword(password: string) {
  const configuredPassword = process.env.POTTERY_APP_PASSWORD;
  return typeof configuredPassword === "string" && constantTimeEqual(password, configuredPassword);
}

export async function createSessionCookieValue() {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `v1.${expiresAt}`;
  const signature = await signPayload(payload);

  return `${payload}.${signature}`;
}

export async function isAuthorizedRequest(request: NextRequest) {
  if (!shouldRequireAuth()) return true;
  if (getAuthSetupProblem()) return false;

  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookieValue) return false;

  return verifySessionCookieValue(cookieValue);
}

async function verifySessionCookieValue(cookieValue: string) {
  const parts = cookieValue.split(".");
  if (parts.length !== 3) return false;

  const [version, expiresAt, signature] = parts;
  const payload = `${version}.${expiresAt}`;
  const expiresAtMs = Number(expiresAt);

  if (version !== "v1" || !expiresAt || !signature) return false;
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) return false;

  const expectedSignature = await signPayload(payload);
  return constantTimeEqual(signature, expectedSignature);
}

async function signPayload(payload: string) {
  const secret = process.env.POTTERY_AUTH_SECRET;
  if (!secret) throw new Error("POTTERY_AUTH_SECRET is missing.");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));

  return base64UrlEncode(signature);
}

function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function constantTimeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}
