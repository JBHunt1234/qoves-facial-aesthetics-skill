import { readFile } from "node:fs/promises";
import path from "node:path";

const FILES = [
  "SKILL.md",
  "knowledge/facial-proportions.md",
  "knowledge/face-shapes.md",
  "knowledge/hairstyles-guide.md",
  "knowledge/mens-specific.md",
  "knowledge/glasses-selection-guide.md",
  "knowledge/skincare-guide.md",
  "knowledge/style-principles.md",
  "knowledge/common-mistakes.md",
  "knowledge/attractiveness-science.md",
];

let cached: string | null = null;

/** Concatenate the skill + knowledge base. Order is fixed so the prompt cache prefix stays stable. */
export async function loadKnowledge(): Promise<string> {
  if (cached) return cached;
  const parts = await Promise.all(
    FILES.map(async (rel) => {
      try {
        const text = await readFile(path.join(process.cwd(), rel), "utf8");
        return `<document path="${rel}">\n${text.trim()}\n</document>`;
      } catch {
        return "";
      }
    }),
  );
  cached = parts.filter(Boolean).join("\n\n");
  return cached;
}
