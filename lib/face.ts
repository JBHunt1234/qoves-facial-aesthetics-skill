"use client";

import type { FaceLandmarker as FaceLandmarkerType } from "@mediapipe/tasks-vision";
import type { Measurement } from "./schema";

const WASM_URL = "/mediapipe";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export type Pt = { x: number; y: number };

export interface FaceGeometry {
  /** All 478 landmarks in image pixel coordinates. */
  points: Pt[];
  width: number;
  height: number;
  /** Head roll in degrees (positive = tilted clockwise). */
  roll: number;
  /** Rough yaw indicator: -1 (turned left) .. 1 (turned right). */
  yaw: number;
  measurements: Measurement[];
  warnings: string[];
  faceCount: number;
}

let landmarkerPromise: Promise<FaceLandmarkerType> | null = null;

async function getLandmarker(): Promise<FaceLandmarkerType> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      const create = (delegate: "GPU" | "CPU") =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: "IMAGE",
          numFaces: 2,
        });
      try {
        return await create("GPU");
      } catch {
        return await create("CPU");
      }
    })();
    landmarkerPromise.catch(() => {
      landmarkerPromise = null;
    });
  }
  return landmarkerPromise;
}

// MediaPipe Face Mesh landmark indices.
const L = {
  foreheadTop: 10,
  glabella: 9,
  noseBridge: 168,
  noseTip: 1,
  subnasale: 2,
  upperLipTop: 0,
  lowerLipBottom: 17,
  chin: 152,
  rEyeOuter: 33,
  rEyeInner: 133,
  lEyeInner: 362,
  lEyeOuter: 263,
  rCheek: 234,
  lCheek: 454,
  rJaw: 172,
  lJaw: 397,
  rMouth: 61,
  lMouth: 291,
  rAla: 64,
  lAla: 294,
  rBrowPeak: 105,
  lBrowPeak: 334,
  rBrowOuter: 70,
  lBrowOuter: 300,
};

const SYMMETRY_PAIRS: [number, number][] = [
  [L.rEyeOuter, L.lEyeOuter],
  [L.rEyeInner, L.lEyeInner],
  [L.rCheek, L.lCheek],
  [L.rJaw, L.lJaw],
  [L.rMouth, L.lMouth],
  [L.rAla, L.lAla],
  [L.rBrowPeak, L.lBrowPeak],
  [L.rBrowOuter, L.lBrowOuter],
  [58, 288],
  [127, 356],
];

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

function rotate(p: Pt, c: Pt, rad: number): Pt {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
}

const fmt = (n: number, d = 2) => n.toFixed(d);

function measure(points: Pt[]): { measurements: Measurement[]; roll: number; yaw: number; warnings: string[] } {
  const P = (i: number) => points[i];
  const eyeR = { x: (P(L.rEyeOuter).x + P(L.rEyeInner).x) / 2, y: (P(L.rEyeOuter).y + P(L.rEyeInner).y) / 2 };
  const eyeL = { x: (P(L.lEyeOuter).x + P(L.lEyeInner).x) / 2, y: (P(L.lEyeOuter).y + P(L.lEyeInner).y) / 2 };
  const rollRad = Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x);
  const center = P(L.noseBridge);
  // Level the face so vertical/horizontal distances are measured along the face's own axes.
  const q = points.map((p) => rotate(p, center, -rollRad));
  const Q = (i: number) => q[i];

  const cheekW = Math.abs(Q(L.lCheek).x - Q(L.rCheek).x);
  const jawW = Math.abs(Q(L.lJaw).x - Q(L.rJaw).x);
  const midThird = Math.abs(Q(L.subnasale).y - Q(L.glabella).y);
  const lowThird = Math.abs(Q(L.chin).y - Q(L.subnasale).y);
  const browToLip = Math.abs(Q(L.upperLipTop).y - Q(L.glabella).y);
  const eyeWR = dist(Q(L.rEyeOuter), Q(L.rEyeInner));
  const eyeWL = dist(Q(L.lEyeOuter), Q(L.lEyeInner));
  const eyeW = (eyeWR + eyeWL) / 2;
  const intercanthal = Math.abs(Q(L.lEyeInner).x - Q(L.rEyeInner).x);
  const mouthW = Math.abs(Q(L.lMouth).x - Q(L.rMouth).x);
  const noseW = Math.abs(Q(L.lAla).x - Q(L.rAla).x);
  const upperLip = Math.abs(Q(13).y - Q(L.upperLipTop).y);
  const lowerLip = Math.abs(Q(L.lowerLipBottom).y - Q(14).y);
  const philtrum = Math.abs(Q(L.upperLipTop).y - Q(L.subnasale).y);
  const chinH = Math.abs(Q(L.chin).y - Q(L.lowerLipBottom).y);
  const faceLen = Math.abs(Q(L.chin).y - Q(L.foreheadTop).y);

  // Canthal tilt: angle of inner→outer corner, positive when the outer corner sits higher.
  const tiltR = (Math.atan2(Q(L.rEyeInner).y - Q(L.rEyeOuter).y, Q(L.rEyeInner).x - Q(L.rEyeOuter).x) * 180) / Math.PI;
  const tiltL = (Math.atan2(Q(L.lEyeInner).y - Q(L.lEyeOuter).y, Q(L.lEyeOuter).x - Q(L.lEyeInner).x) * 180) / Math.PI;
  const tilt = (tiltR + tiltL) / 2;

  // Symmetry: mirror each left landmark across the midline and compare to its right partner.
  const midX = (Q(L.noseBridge).x + Q(L.chin).x + Q(L.glabella).x) / 3;
  const asym =
    SYMMETRY_PAIRS.reduce((acc, [r, l]) => {
      const mirrored = { x: 2 * midX - Q(l).x, y: Q(l).y };
      return acc + dist(mirrored, Q(r));
    }, 0) /
    SYMMETRY_PAIRS.length /
    cheekW;

  // Yaw: nose-tip offset from the cheek midpoint, normalised.
  const yaw = ((Q(L.noseTip).x - (Q(L.rCheek).x + Q(L.lCheek).x) / 2) / (cheekW / 2)) * 1.6;

  const warnings: string[] = [];
  const mouthGap = Math.abs(Q(14).y - Q(13).y);
  if (mouthGap / browToLip > 0.06 || mouthW / noseW > 1.85)
    warnings.push("Smiling or open mouth detected — lower-face and lip ratios are inflated. A neutral, closed-mouth photo reads more accurately.");
  if (Math.abs(yaw) > 0.25) warnings.push("Head looks turned to one side — width and symmetry numbers will be skewed. A straight-on photo gives better numbers.");
  if (Math.abs((rollRad * 180) / Math.PI) > 8) warnings.push("Head is tilted; numbers were levelled, but a straight photo is better.");

  const ratio = lowThird / midThird;
  const fwhr = cheekW / browToLip;
  const spacing = intercanthal / eyeW;
  const jawRatio = jawW / cheekW;
  const mouthNose = mouthW / noseW;
  const lipRatio = lowerLip / Math.max(upperLip, 1e-3);
  const chinPhiltrum = chinH / Math.max(philtrum, 1e-3);
  const lengthWidth = faceLen / cheekW;

  const m: Measurement[] = [
    {
      key: "thirds",
      label: "Lower third vs middle third",
      value: ratio,
      display: fmt(ratio),
      typical: "0.95–1.15",
      note:
        ratio > 1.15
          ? "Lower face reads relatively long — volume on top and side-weight in hair can rebalance."
          : ratio < 0.95
            ? "Lower face reads relatively short — beard length at the chin or a cleaner neckline can add length."
            : "Middle and lower face are balanced.",
    },
    {
      key: "fwhr",
      label: "Facial width-to-height (fWHR)",
      value: fwhr,
      display: fmt(fwhr),
      typical: "1.75–2.05",
      note:
        fwhr > 2.05
          ? "Wide midface relative to height — reads strong; height in hair elongates."
          : fwhr < 1.75
            ? "Narrower, longer midface — avoid excessive height on top; side volume widens."
            : "Midface width and height are in a common range.",
    },
    {
      key: "lengthWidth",
      label: "Face length ÷ cheekbone width",
      value: lengthWidth,
      display: fmt(lengthWidth),
      typical: "1.25–1.45 (mesh top, not hairline)",
      note:
        lengthWidth > 1.45 ? "Face reads long." : lengthWidth < 1.25 ? "Face reads short/wide." : "Length and width are balanced.",
    },
    {
      key: "canthal",
      label: "Canthal tilt",
      value: tilt,
      display: `${tilt >= 0 ? "+" : ""}${fmt(tilt, 1)}°`,
      typical: "+2° to +8°",
      note:
        tilt > 8
          ? "Pronounced upward tilt."
          : tilt < 0
            ? "Neutral-to-downward tilt — brow grooming that lifts the tail can change the read."
            : "Mild positive tilt.",
    },
    {
      key: "spacing",
      label: "Eye spacing (gap ÷ eye width)",
      value: spacing,
      display: fmt(spacing),
      typical: "0.95–1.25",
      note: spacing > 1.25 ? "Wider-set eyes — frames with a lower, keyhole bridge suit." : spacing < 0.95 ? "Closer-set eyes — clear-bridge frames and a cleaner brow gap help." : "Close to one eye-width apart.",
    },
    {
      key: "jaw",
      label: "Jaw ÷ cheekbone width",
      value: jawRatio,
      display: fmt(jawRatio),
      typical: "0.75–0.90",
      note: jawRatio > 0.9 ? "Broad, square lower face." : jawRatio < 0.75 ? "Tapered lower face — stubble along the jaw adds structure." : "Moderate jaw taper.",
    },
    {
      key: "mouthNose",
      label: "Mouth ÷ nose width",
      value: mouthNose,
      display: fmt(mouthNose),
      typical: "1.40–1.65",
      note: "Expression changes this a lot — read loosely.",
    },
    {
      key: "lips",
      label: "Lower ÷ upper lip height",
      value: lipRatio,
      display: fmt(lipRatio),
      typical: "1.3–2.0",
      note: "Neutral, closed mouth needed for this to mean anything.",
    },
    {
      key: "chinPhiltrum",
      label: "Chin ÷ philtrum height",
      value: chinPhiltrum,
      display: fmt(chinPhiltrum),
      typical: "1.8–2.4",
      note:
        chinPhiltrum < 1.8
          ? "Shorter chin relative to philtrum — chin-focused beard shapes add length."
          : chinPhiltrum > 2.4
            ? "Tall chin relative to philtrum (an open smile inflates this)."
            : "Chin height in a common range.",
    },
    {
      key: "symmetry",
      label: "Landmark asymmetry",
      value: asym * 100,
      display: `${fmt(asym * 100, 1)}%`,
      typical: "under 4% (most faces)",
      note: "Every face is asymmetric; head turn, lens and expression dominate this number.",
    },
  ];

  return { measurements: m, roll: (rollRad * 180) / Math.PI, yaw, warnings };
}

export async function detectFace(img: HTMLImageElement): Promise<FaceGeometry | null> {
  const landmarker = await getLandmarker();
  const result = landmarker.detect(img);
  const faces = result.faceLandmarks ?? [];
  if (!faces.length) return null;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const points = faces[0].map((p) => ({ x: p.x * w, y: p.y * h }));
  const { measurements, roll, yaw, warnings } = measure(points);
  if (faces.length > 1) warnings.unshift("More than one face detected — measurements use the most prominent one.");
  return { points, width: w, height: h, roll, yaw, measurements, warnings, faceCount: faces.length };
}

export const LANDMARKS = L;
