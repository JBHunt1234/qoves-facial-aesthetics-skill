import { NextResponse } from "next/server";
import { editImage, ProviderError } from "@/lib/image-providers";
import { VisualizeRequestSchema } from "@/lib/schema";
import { checkAccess, jsonError, parseDataUrl } from "@/lib/server-utils";

export const runtime = "nodejs";
export const maxDuration = 300;

const IDENTITY_SUFFIX =
  " Keep the same person, face, facial features, expression, skin tone, body shape, pose, lighting, camera angle and background unchanged. Photorealistic.";

export async function POST(req: Request) {
  const denied = checkAccess(req);
  if (denied) return denied;

  let body;
  try {
    body = VisualizeRequestSchema.parse(await req.json());
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  if (!parseDataUrl(body.image)) return jsonError("Photo must be an image data URL.", 400);

  const prompt = /keep the same person/i.test(body.prompt) ? body.prompt : body.prompt.trim() + IDENTITY_SUFFIX;

  try {
    const image = await editImage(body.image, prompt);
    return NextResponse.json({ image });
  } catch (error) {
    if (error instanceof ProviderError) return jsonError(error.message, error.status);
    console.error(error);
    return jsonError("Unexpected error generating the preview.", 500);
  }
}
