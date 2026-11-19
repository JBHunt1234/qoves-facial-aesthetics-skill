import { NextResponse } from "next/server";

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export function parseDataUrl(dataUrl: string): { mediaType: ImageMediaType; data: string } | null {
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  return { mediaType: m[1] as ImageMediaType, data: m[2] };
}

/** Optional passcode gate so a public deployment can't be used to burn your API credits. */
export function checkAccess(req: Request): NextResponse | null {
  const required = process.env.APP_ACCESS_CODE;
  if (!required) return null;
  if (req.headers.get("x-access-code") === required) return null;
  return NextResponse.json({ error: "Access code required.", code: "ACCESS_CODE" }, { status: 401 });
}

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}
