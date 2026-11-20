/**
 * Image-editing providers for the "what would I look like with..." previews.
 * Set REPLICATE_API_TOKEN (FLUX Kontext, preferred) or OPENAI_API_KEY (gpt-image-1).
 */

export type Provider = "replicate" | "openai";

export function activeProvider(): Provider | null {
  if (process.env.REPLICATE_API_TOKEN) return "replicate";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export class ProviderError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? "image/jpeg";
  return new Blob([Buffer.from(b64, "base64")], { type: mime });
}

async function toDataUrl(res: Response): Promise<string> {
  const mime = res.headers.get("content-type") || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ----------------------------- Replicate ----------------------------- */

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[] | null;
  error?: string | null;
  urls?: { get?: string };
}

async function replicateEdit(image: string, prompt: string): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN!;
  const model = process.env.REPLICATE_MODEL || "black-forest-labs/flux-kontext-max";
  const auth = { Authorization: `Bearer ${token}` };

  // Upload the photo to Replicate's file store (data URLs are size-limited).
  const form = new FormData();
  form.append("content", dataUrlToBlob(image), "photo.jpg");
  const up = await fetch("https://api.replicate.com/v1/files", { method: "POST", headers: auth, body: form });
  if (!up.ok) throw new ProviderError(`Replicate upload failed (${up.status}).`);
  const file = (await up.json()) as { urls?: { get?: string } };
  const inputImage = file.urls?.get;
  if (!inputImage) throw new ProviderError("Replicate upload returned no URL.");

  const create = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json", Prefer: "wait=60" },
    body: JSON.stringify({
      input: {
        prompt,
        input_image: inputImage,
        aspect_ratio: "match_input_image",
        output_format: "jpg",
        safety_tolerance: 2,
      },
    }),
  });
  if (create.status === 401) throw new ProviderError("Replicate API token is invalid.", 500);
  if (create.status === 402) throw new ProviderError("Replicate account has no credit.", 402);
  if (!create.ok) throw new ProviderError(`Replicate error (${create.status}): ${(await create.text()).slice(0, 300)}`);
  let pred = (await create.json()) as ReplicatePrediction;

  const deadline = Date.now() + 150_000;
  while ((pred.status === "starting" || pred.status === "processing") && Date.now() < deadline) {
    await sleep(2000);
    const poll = await fetch(pred.urls?.get ?? `https://api.replicate.com/v1/predictions/${pred.id}`, { headers: auth });
    pred = (await poll.json()) as ReplicatePrediction;
  }
  if (pred.status !== "succeeded") {
    throw new ProviderError(pred.error ? `Preview failed: ${pred.error}` : "Preview timed out. Try again.");
  }
  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  if (!url) throw new ProviderError("Replicate returned no image.");
  const img = await fetch(url);
  if (!img.ok) throw new ProviderError("Could not download the generated image.");
  return toDataUrl(img);
}

/* ------------------------------ OpenAI ------------------------------- */

async function openaiEdit(image: string, prompt: string): Promise<string> {
  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
  form.append("image", dataUrlToBlob(image), "photo.jpg");
  form.append("prompt", prompt);
  form.append("input_fidelity", "high");
  form.append("size", "auto");
  form.append("quality", "high");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (res.status === 401) throw new ProviderError("OpenAI API key is invalid.", 500);
  if (!res.ok) throw new ProviderError(`OpenAI image error (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new ProviderError("OpenAI returned no image.");
  return `data:image/png;base64,${b64}`;
}

export async function editImage(image: string, prompt: string): Promise<string> {
  const provider = activeProvider();
  if (provider === "replicate") return replicateEdit(image, prompt);
  if (provider === "openai") return openaiEdit(image, prompt);
  throw new ProviderError("No image provider configured. Set REPLICATE_API_TOKEN or OPENAI_API_KEY.", 501);
}
