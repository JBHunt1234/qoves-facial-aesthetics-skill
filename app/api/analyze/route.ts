import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loadKnowledge } from "@/lib/knowledge";
import { buildUserText, SYSTEM_INSTRUCTIONS } from "@/lib/prompt";
import { AnalyzeRequestSchema, ReportSchema, type Report } from "@/lib/schema";
import { checkAccess, jsonError, parseDataUrl } from "@/lib/server-utils";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

// The report schema is too large for constrained decoding (the API rejects the compiled grammar),
// so the schema goes in the prompt as instructions and the JSON is validated here with Zod.
const REPORT_JSON_SCHEMA = JSON.stringify(z.toJSONSchema(ReportSchema));
const OUTPUT_INSTRUCTIONS = `## Output format
Respond with ONLY a single JSON object (no prose, no markdown code fences) that validates against this JSON Schema. Follow every field description. Use plain strings, no markdown inside values.

${REPORT_JSON_SCHEMA}`;

type Validated = { ok: true; report: Report } | { ok: false; error: string };

function validate(text: string): Validated {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return { ok: false, error: "No JSON object found in the response." };
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
  const parsed = ReportSchema.safeParse(raw);
  if (parsed.success) return { ok: true, report: parsed.data };
  const issues = parsed.error.issues
    .slice(0, 15)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  return { ok: false, error: `Schema errors:\n${issues}` };
}

function textOf(message: Anthropic.Beta.BetaMessage): string {
  return message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

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
  const bodyPhoto = body.bodyImage ? parseDataUrl(body.bodyImage) : null;

  const knowledge = await loadKnowledge();
  const client = new Anthropic();

  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    { type: "image", source: { type: "base64", media_type: front.mediaType, data: front.data } },
  ];
  if (side) {
    content.push({ type: "image", source: { type: "base64", media_type: side.mediaType, data: side.data } });
  }
  if (bodyPhoto) {
    content.push({ type: "image", source: { type: "base64", media_type: bodyPhoto.mediaType, data: bodyPhoto.data } });
  }
  content.push({ type: "text", text: buildUserText(body.goals, body.measurements, Boolean(side), Boolean(bodyPhoto)) });

  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    { type: "text", text: `${SYSTEM_INSTRUCTIONS}\n\n${OUTPUT_INSTRUCTIONS}` },
    // Stable knowledge base last in the system prompt and cached across requests.
    { type: "text", text: `<knowledge_base>\n${knowledge}\n</knowledge_base>`, cache_control: { type: "ephemeral" } },
  ];

  const call = (messages: Anthropic.Beta.BetaMessageParam[]) =>
    client.beta.messages
      .stream({
        model: MODEL,
        max_tokens: 32000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "high" },
        system,
        messages,
      })
      .finalMessage();

  try {
    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content }];
    let response = await call(messages);
    if (response.stop_reason === "refusal") {
      return jsonError("The model declined to analyse this image. Try a clear, neutral photo of a single adult face.", 422);
    }

    let result = validate(textOf(response));
    if (!result.ok) {
      // One repair pass: show the model its output and the validation errors.
      console.warn("Report failed validation, retrying:", result.error);
      response = await call([
        ...messages,
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: `Your response did not validate.\n${result.error}\n\nReturn the complete corrected JSON object only.`,
        },
      ]);
      if (response.stop_reason === "refusal") {
        return jsonError("The model declined to analyse this image. Try a clear, neutral photo of a single adult face.", 422);
      }
      result = validate(textOf(response));
    }
    if (!result.ok) {
      console.error("Report failed validation twice:", result.error);
      return jsonError("The analysis came back in an unexpected format. Please try again.", 502);
    }

    return NextResponse.json({ report: result.report, model: response.model });
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
