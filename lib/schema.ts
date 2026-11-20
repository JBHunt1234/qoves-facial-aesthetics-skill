import { z } from "zod";

/** What the user tells us before the analysis runs. */
export const GoalsSchema = z.object({
  desiredRead: z.array(z.string()).default([]),
  context: z.array(z.string()).default([]),
  maintenance: z.string().default("medium"),
  wearsGlasses: z.boolean().default(false),
  facialHair: z.string().default("unsure"),
  hairLength: z.string().default("Keep my length"),
  notes: z.string().max(1500).default(""),
  industry: z.string().max(80).default(""),
  dressCodes: z.array(z.string()).default([]),
  body: z
    .object({
      height: z.string().max(40).default(""),
      weight: z.string().max(40).default(""),
      build: z.string().max(40).default(""),
      fitNotes: z.string().max(500).default(""),
    })
    .default({ height: "", weight: "", build: "", fitNotes: "" }),
});
export type Goals = z.infer<typeof GoalsSchema>;

/** Geometry measured in the browser from face landmarks. */
export const MeasurementSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number(),
  display: z.string(),
  typical: z.string(),
  note: z.string(),
});
export type Measurement = z.infer<typeof MeasurementSchema>;

const Confidence = z.enum(["high", "medium", "low"]);

const PreviewOption = z.object({
  name: z.string().describe("Short name, e.g. 'Textured crop with low taper'"),
  why: z.string().describe("One or two sentences tying the option to this person's features and goal"),
  previewPrompt: z
    .string()
    .describe(
      "An image-editing instruction for a photo of this person. Describe ONLY the change (e.g. 'Change the hairstyle to a short textured crop with a low taper fade, keeping natural dark brown colour'), then 'Keep the same person, face, expression, skin, lighting and background unchanged.'",
    ),
});

/** The structured report Claude returns. */
export const ReportSchema = z.object({
  summary: z
    .string()
    .describe("2-3 sentence plain-language read of the face and what will move the needle most for the stated goal"),
  photoQuality: z.object({
    usable: z.boolean(),
    notes: z.string().describe("Lighting, angle, lens distortion, expression or obstruction issues that limit the read"),
  }),
  faceShape: z.object({
    read: z.string().describe("e.g. 'Oval leaning long' — a soft read, not a label"),
    notes: z.string(),
  }),
  goldenRatioNote: z
    .string()
    .describe("2-3 sentences interpreting the golden-ratio numbers if provided: which proportions sit closest/furthest from 1.618, and which styling levers (hair height, fringe, beard length at the chin, collar) visually shift them. Never frame it as an attractiveness score. Empty string if no golden-ratio data was provided.")
    .default(""),
  features: z
    .array(
      z.object({
        area: z.string().describe("e.g. Hairline & forehead, Brows, Eye area, Nose, Cheekbones & midface, Lips, Jaw & chin, Skin, Neck & posture"),
        observation: z.string().describe("Neutral visual observation"),
        implication: z.string().describe("What this means for styling choices"),
        confidence: Confidence,
      }),
    )
    .describe("6-9 feature-by-feature notes"),
  priorities: z
    .array(
      z.object({
        title: z.string(),
        category: z.enum(["hair", "skin", "grooming", "facial_hair", "eyewear", "style", "photo"]),
        why: z.string(),
        how: z.string().describe("Concrete steps"),
        effort: z.enum(["low", "medium", "high"]),
        impact: z.enum(["low", "medium", "high"]),
      }),
    )
    .describe("The 3-5 highest-leverage reversible moves, most important first"),
  hairstyles: z
    .array(
      PreviewOption.extend({
        maintenance: z.string().describe("Styling time, product, how often to cut"),
        barberScript: z.string().describe("What to literally say to the barber/stylist, including guard numbers or lengths where useful"),
      }),
    )
    .min(3)
    .describe("4-6 hairstyle options suited to this person, always included even if the photo is limited: a safe refinement of their current cut, a sharper/shorter option, and a longer or more textured option"),
  hairColors: z.array(PreviewOption).describe("2-3 hair colour options; first should be a subtle, natural option"),
  facialHair: z.object({
    recommendation: z.string(),
    options: z.array(PreviewOption).describe("0-3 options; empty if not relevant to this person"),
  }),
  eyewear: z.object({
    recommendation: z.string().describe("Frame sizing and shape guidance"),
    frames: z.array(PreviewOption).describe("2-3 frame styles"),
  }),
  skincare: z.object({
    morning: z.array(z.string()),
    evening: z.array(z.string()),
    weekly: z.array(z.string()),
    notes: z.string(),
    clearSkinNote: z
      .string()
      .describe("One or two sentences on visible skin concerns (breakouts, redness, marks, uneven tone, under-eye darkness) and the realistic, non-prescriptive route to improving them (consistent routine, dermatologist for persistent acne). Neutral if skin is clear."),
  }),
  style: z.object({
    palette: z
      .array(z.object({ name: z.string(), hex: z.string().describe("#RRGGBB") }))
      .describe("5-7 clothing colours that suit their colouring/contrast"),
    paletteReason: z.string(),
    avoidColors: z.array(z.string()),
    tips: z.array(z.string()).describe("Necklines, fit, accessories"),
  }),
  wardrobe: z.object({
    summary: z.string().describe("2-3 sentences: how this person should dress for their industry and dress codes, given their colouring, face and build"),
    fitNotes: z.array(z.string()).describe("3-5 fit and proportion rules specific to their height/build/face (collar, lapel, jacket length, rise, break, pattern scale)"),
    keyPieces: z
      .array(z.object({ item: z.string(), spec: z.string().describe("Colour, fabric, cut and fit details to buy"), why: z.string() }))
      .describe("5-8 core pieces to own or buy first, in priority order"),
    outfits: z
      .array(
        PreviewOption.extend({
          occasion: z.enum(["business_formal", "business_casual", "smart_casual", "casual", "evening"]),
          pieces: z.array(z.string()).describe("Each garment and accessory, e.g. 'Navy worsted 2-button suit'"),
        }),
      )
      .describe(
        "5-7 complete outfits covering the user's dress codes. previewPrompt describes ONLY the clothing change in detail (garments, colours, fabrics, fit), ending with: 'Keep the same person, face, hair, body shape, pose, lighting and background unchanged.'",
      ),
    avoid: z.array(z.string()).describe("2-3 clothing choices that work against them"),
  }),
  photography: z.array(z.string()).describe("How to get better photos of this face: angle, distance, light"),
  avoid: z.array(z.object({ move: z.string(), why: z.string() })).describe("1-3 moves likely to work against the goal for now"),
  professionalReferrals: z
    .array(z.string())
    .describe("Only if something visible genuinely warrants a dermatologist/doctor/other professional; otherwise empty"),
  caveats: z.array(z.string()),
});
export type Report = z.infer<typeof ReportSchema>;

export const AnalyzeRequestSchema = z.object({
  image: z.string().describe("data URL of the front photo"),
  sideImage: z.string().optional(),
  bodyImage: z.string().optional(),
  goals: GoalsSchema,
  measurements: z.array(MeasurementSchema).default([]),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const VisualizeRequestSchema = z.object({
  image: z.string(),
  prompt: z.string().min(3).max(1000),
});
