"use client";

const CODE_KEY = "facelab.accessCode";

export function getAccessCode(): string {
  try {
    return localStorage.getItem(CODE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAccessCode(code: string) {
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

export async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-access-code": getAccessCode() },
    body: JSON.stringify(body),
    signal,
  });
  let json: Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {
    if (res.status === 413) throw new ApiError("Photo is too large to upload.", 413);
    if (res.status === 504) throw new ApiError("The server timed out. Please try again.", 504);
  }
  if (!res.ok) {
    throw new ApiError(String(json.error ?? `Request failed (${res.status})`), res.status, json.code as string | undefined);
  }
  return json as T;
}
