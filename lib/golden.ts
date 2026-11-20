import type { Pt } from "./face";
import type { Measurement } from "./schema";

export const PHI = 1.618;

export interface GoldenItem {
  key: string;
  label: string;
  /** What is divided by what, in plain words. */
  formula: string;
  value: number;
  /** 0–100: how close the ratio is to phi (100 = exactly 1.618). */
  match: number;
  /** Signed deviation from phi in percent (positive = above phi). */
  deviation: number;
  /** Segments in the levelled frame: [numerator, denominator]. */
  segments: [[Pt, Pt], [Pt, Pt]];
  expressionSensitive?: boolean;
}

export interface GoldenResult {
  items: GoldenItem[];
  overall: number;
  /** Default hairline estimate in the levelled frame (y). */
  hairlineDefault: number;
  /** Rotation used to level the face (radians) and its pivot, for drawing. */
  roll: number;
  center: Pt;
  levelled: Pt[];
}

// MediaPipe Face Mesh indices.
const I = {
  nasion: 168,
  glabella: 9,
  subnasale: 2,
  chin: 152,
  upperLipTop: 0,
  upperLipInner: 13,
  lowerLipInner: 14,
  lowerLipBottom: 17,
  rMouth: 61,
  lMouth: 291,
  rAla: 64,
  lAla: 294,
  rCheek: 234,
  lCheek: 454,
  rEyeOuter: 33,
  rEyeInner: 133,
  lEyeInner: 362,
  lEyeOuter: 263,
  rIris: 468,
  lIris: 473,
};

function rotate(p: Pt, c: Pt, rad: number): Pt {
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const dx = p.x - c.x, dy = p.y - c.y;
  return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
}

function item(
  key: string,
  label: string,
  formula: string,
  num: [Pt, Pt],
  den: [Pt, Pt],
  vertical: boolean,
  expressionSensitive = false,
): GoldenItem {
  const len = (s: [Pt, Pt]) => (vertical ? Math.abs(s[1].y - s[0].y) : Math.abs(s[1].x - s[0].x));
  const value = len(num) / Math.max(len(den), 1e-6);
  const deviation = ((value - PHI) / PHI) * 100;
  const match = Math.max(0, 100 - Math.abs(deviation));
  return { key, label, formula, value, match, deviation, segments: [num, den], expressionSensitive };
}

/**
 * Compare facial proportions to the golden ratio (1.618).
 * `hairlineY` is in the levelled frame; when omitted, it's estimated as one "middle third" above the brow.
 */
export function computeGolden(points: Pt[], hairlineY?: number): GoldenResult {
  const P = (i: number) => points[i];
  const eyeR = { x: (P(I.rEyeOuter).x + P(I.rEyeInner).x) / 2, y: (P(I.rEyeOuter).y + P(I.rEyeInner).y) / 2 };
  const eyeL = { x: (P(I.lEyeOuter).x + P(I.lEyeInner).x) / 2, y: (P(I.lEyeOuter).y + P(I.lEyeInner).y) / 2 };
  const roll = Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x);
  const center = P(I.nasion);
  const q = points.map((p) => rotate(p, center, -roll));
  const Q = (i: number) => q[i];

  const midX = (Q(I.nasion).x + Q(I.chin).x) / 2;
  const at = (y: number, x = midX): Pt => ({ x, y });
  const pupilY = q.length > I.lIris ? (Q(I.rIris).y + Q(I.lIris).y) / 2 : (eyeR.y + eyeL.y) / 2;
  const stomionY = (Q(I.upperLipInner).y + Q(I.lowerLipInner).y) / 2;
  const midThird = Q(I.subnasale).y - Q(I.glabella).y;
  const hairlineDefault = Q(I.glabella).y - midThird;
  const hairline = hairlineY ?? hairlineDefault;

  const items: GoldenItem[] = [
    item(
      "length_width",
      "Face length ÷ face width",
      "Hairline to chin, divided by cheekbone width",
      [at(hairline, Q(I.lCheek).x + 12), at(Q(I.chin).y, Q(I.lCheek).x + 12)],
      [at(Q(I.rCheek).y, Q(I.rCheek).x), { x: Q(I.lCheek).x, y: Q(I.rCheek).y }],
      false,
    ),
    item(
      "eyes_lips_chin",
      "Eyes→lips ÷ lips→chin",
      "Pupil line to lip line, divided by lip line to chin",
      [at(pupilY), at(stomionY)],
      [at(stomionY), at(Q(I.chin).y)],
      true,
      true,
    ),
    item(
      "nose_chin_lips_chin",
      "Nose→chin ÷ lips→chin",
      "Nose base to chin, divided by lip line to chin",
      [at(Q(I.subnasale).y, midX - 14), at(Q(I.chin).y, midX - 14)],
      [at(stomionY, midX + 14), at(Q(I.chin).y, midX + 14)],
      true,
      true,
    ),
    item(
      "mouth_nose",
      "Mouth width ÷ nose width",
      "Mouth corner to corner, divided by nostril width",
      [Q(I.rMouth), Q(I.lMouth)],
      [Q(I.rAla), Q(I.lAla)],
      false,
      true,
    ),
    item(
      "nose_chin_length",
      "Nose length ÷ chin height",
      "Bridge of nose to nose base, divided by lower lip to chin",
      [at(Q(I.nasion).y, midX + 18), at(Q(I.subnasale).y, midX + 18)],
      [at(Q(I.lowerLipBottom).y, midX + 18), at(Q(I.chin).y, midX + 18)],
      true,
    ),
    item(
      "lips",
      "Lower lip ÷ upper lip",
      "Lower lip height, divided by upper lip height",
      [at(Q(I.lowerLipInner).y, midX + 6), at(Q(I.lowerLipBottom).y, midX + 6)],
      [at(Q(I.upperLipTop).y, midX - 6), at(Q(I.upperLipInner).y, midX - 6)],
      true,
      true,
    ),
  ];
  // Horizontal "length ÷ width" needs a vertical numerator; fix its value explicitly.
  const lw = items[0];
  const faceLen = Math.abs(Q(I.chin).y - hairline);
  const faceW = Math.abs(Q(I.lCheek).x - Q(I.rCheek).x);
  lw.value = faceLen / faceW;
  lw.deviation = ((lw.value - PHI) / PHI) * 100;
  lw.match = Math.max(0, 100 - Math.abs(lw.deviation));

  const overall = items.reduce((a, b) => a + b.match, 0) / items.length;
  return { items, overall, hairlineDefault, roll, center, levelled: q };
}

/** Golden-ratio results in the shape the analysis API accepts. */
export function goldenAsMeasurements(g: GoldenResult): Measurement[] {
  return [
    {
      key: "golden_overall",
      label: "Golden ratio match (average of 6 proportions)",
      value: g.overall,
      display: `${g.overall.toFixed(1)}%`,
      typical: "100% would mean every proportion is exactly 1.618",
      note: "User asked for a golden-ratio comparison. Geometric curiosity, not an attractiveness score.",
    },
    ...g.items.map((it) => ({
      key: `golden_${it.key}`,
      label: `Golden ratio: ${it.label}`,
      value: it.value,
      display: `${it.value.toFixed(2)} (${it.deviation >= 0 ? "+" : ""}${it.deviation.toFixed(0)}% vs 1.618)`,
      typical: "1.618 is the golden ideal",
      note: it.key === "length_width" ? "Hairline is estimated unless the user adjusts it." : it.expressionSensitive ? "Changes with expression." : "",
    })),
  ];
}
