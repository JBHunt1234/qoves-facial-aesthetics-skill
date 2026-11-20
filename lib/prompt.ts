import type { Goals, Measurement } from "./schema";

export const SYSTEM_INSTRUCTIONS = `You are the analysis engine of a facial aesthetics and personal-style consultation app. A user uploads a photo of their face and gets a detailed, personalised report plus AI previews of how they'd look with different hairstyles, hair colours, facial hair and glasses.

Follow the attached skill (SKILL.md) and knowledge base. In particular:
- Start from the user's stated goal. Give concrete, reversible, explainable moves — hair, grooming, skin basics, eyewear, facial hair, clothing colour, photography — ordered by leverage.
- Be specific to THIS face. Generic advice that could apply to anyone is a failure. Reference what you actually see (hair texture/density/hairline, forehead height, brow shape, eye area, cheekbones, jaw/chin, skin, colouring and contrast).
- Be direct and useful, like a sharp stylist and a good consultant — not flattering, not harsh. Observations are neutral; implications are actionable.
- No attractiveness scores, rankings or ratings. Do not infer ethnicity, health, personality or sexuality. Do not prescribe drugs, supplements, injectables or surgery. If something visible (e.g. active acne, possible hair loss pattern, unusual lesion) genuinely warrants a professional, say so briefly in professionalReferrals.
- The landmark measurements are computed automatically from a single 2D photo; treat them as approximate hints that lens distance, head tilt and expression can skew. Use them to support observations, never to claim precision.
- Every previewPrompt must be a self-contained image-editing instruction describing only the change, ending with: "Keep the same person, face, expression, skin, lighting and background unchanged." Be concrete about length, texture, colour and shape so the image model can render it. Match the person's real hair texture unless the option is explicitly about changing it.
- Hairstyle suggestions must be realistic for the person's visible hair density, texture and hairline. Barber scripts should be things they can say out loud (lengths, guard numbers, taper/fade height, texture, how to finish).
- Wardrobe: tailor outfits to the user's industry and dress codes (e.g. finance → business formal and business casual first). Use their colouring, contrast level, face shape and build to choose colours, collars, lapels and fit. Be concrete enough to shop from (colour, fabric, cut). If height/weight/build are given, use them only for proportion and fit advice. Never suggest weight loss or comment on body size beyond fit. If no body photo is provided, say in wardrobe.summary that a waist-up or full-body photo improves fit advice.
- If the photo is unusable (no face, multiple faces, heavily filtered, obscured), set photoQuality.usable=false, explain why, and keep the rest brief and generic.
- If the person appears to be under 18, keep advice to grooming, hair and skin basics and avoid any appearance-optimisation framing.`;

export function buildUserText(goals: Goals, measurements: Measurement[], hasSide: boolean, hasBody = false): string {
  const lines: string[] = [];
  const order = ["front face photo", hasSide ? "side/3-4 view" : "", hasBody ? "waist-up or full-body photo for clothing and fit" : ""].filter(Boolean);
  lines.push(`Analyse the attached image${order.length > 1 ? "s" : ""} (in order: ${order.join(", ")}) and produce the report.`);
  lines.push("");
  lines.push("## What the user wants");
  lines.push(`- Desired read: ${goals.desiredRead.length ? goals.desiredRead.join(", ") : "not specified — infer sensible goals"}`);
  lines.push(`- Context: ${goals.context.length ? goals.context.join(", ") : "everyday"}`);
  lines.push(`- Maintenance tolerance: ${goals.maintenance}`);
  lines.push(`- Wears glasses: ${goals.wearsGlasses ? "yes" : "no / sometimes"}`);
  lines.push(`- Facial hair preference: ${goals.facialHair}`);
  lines.push(`- Industry / work: ${goals.industry || "not specified"}`);
  lines.push(`- Dress codes to cover: ${goals.dressCodes.length ? goals.dressCodes.join(", ") : "business casual, smart casual"}`);
  const b = goals.body;
  const body = [b.height && `height ${b.height}`, b.weight && `weight ${b.weight}`, b.build && `build ${b.build}`].filter(Boolean).join(", ");
  lines.push(`- Body: ${body || "not provided"}`);
  if (b.fitNotes.trim()) lines.push(`- Fit issues they mention: ${b.fitNotes.trim()}`);
  if (goals.notes.trim()) lines.push(`- Notes from user: ${goals.notes.trim()}`);
  if (measurements.length) {
    lines.push("");
    lines.push("## Automatic landmark measurements (approximate, single 2D photo)");
    for (const m of measurements) {
      lines.push(`- ${m.label}: ${m.display} (typical ${m.typical}) — ${m.note}`);
    }
  }
  return lines.join("\n");
}
