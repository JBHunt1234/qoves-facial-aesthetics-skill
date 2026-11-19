import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { loadKnowledge } from "@/lib/knowledge";
import { buildUserText, SYSTEM_INSTRUCTIONS } from "@/lib/prompt";
import { AnalyzeRequestSchema, ReportSchema } from "@/lib/schema";
import { checkAccess, jsonError, parseDataUrl } from "@/lib/server-utils";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

export async function POST(req: Request) {
  const denied = checkAccess(req);
  if (denied) return denied;

  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError("ANTHROPIC_API_KEY is not configured on the server.", 500);
  }

  let body;
  try {
    body = AnalyzeRequestSchema.parse(await req.json());
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const front = parseDataUrl(body.image);
  if (!front) return jsonError("Photo must be a JPEG, PNG, WebP or GIF data URL.", 400);
  const side = body.sideImage ? parseDataUrl(body.sideImage) : null;

  const knowledge = await loadKnowledge();
  const client = new Anthropic();

  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    { type: "image", source: { type: "base64", media_type: front.mediaType, data: front.data } },
  ];
  if (side) {
    content.push({ type: "image", source: { type: "base64", media_type: side.mediaType, data: side.data } });
  }
  content.push({ type: "text", text: buildUserText(body.goals, body.measurements, Boolean(side)) });

  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high", format: betaZodOutputFormat(ReportSchema) },
      system: [
        { type: "text", text: SYSTEM_INSTRUCTIONS },
        // Stable knowledge base last in the system prompt and cached across requests.
        { type: "text", text: `<knowledge_base>\n${knowledge}\n</knowledge_base>`, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "refusal") {
      return jsonError("The model declined to analyse this image. Try a clear, neutral photo of a single adult face.", 422);
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      return jsonError("The analysis came back incomplete. Please try again.", 502);
    }

    return NextResponse.json({ report: response.parsed_output, model: response.model });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return jsonError("The Anthropic API key is invalid.", 500);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return jsonError("Rate limited by the AI provider. Wait a minute and retry.", 429);
    }
    if (error instanceof Anthropic.BadRequestError) {
      return jsonError(`The AI provider rejected the request: ${error.message}`, 400);
    }
    if (error instanceof Anthropic.APIError) {
      return jsonError(`AI provider error (${error.status ?? "network"}). Please retry.`, 502);
    }
    console.error(error);
    return jsonError("Unexpected error while analysing the photo.", 500);
  }
}
