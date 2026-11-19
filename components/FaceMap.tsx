"use client";

import { useEffect, useRef, useState } from "react";
import { LANDMARKS as L, type FaceGeometry, type Pt } from "@/lib/face";

type Layer = "mesh" | "thirds" | "fifths" | "angles";
const LAYERS: { key: Layer; label: string }[] = [
  { key: "thirds", label: "Thirds" },
  { key: "fifths", label: "Fifths" },
  { key: "angles", label: "Angles & widths" },
  { key: "mesh", label: "Landmarks" },
];

export function FaceMap({ src, geometry }: { src: string; geometry: FaceGeometry }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState<Set<Layer>>(new Set(["thirds", "angles"]));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => draw(canvas, img, geometry, layers);
    img.src = src;
  }, [src, geometry, layers]);

  const toggle = (k: Layer) =>
    setLayers((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <div>
      <canvas ref={canvasRef} className="block h-auto w-full rounded-xl bg-surface-2" />
      <div className="no-print mt-3 flex flex-wrap gap-2">
        {LAYERS.map((l) => (
          <button key={l.key} className="chip !py-1 !text-xs" data-active={layers.has(l.key)} onClick={() => toggle(l.key)}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function draw(visible: HTMLCanvasElement, img: HTMLImageElement, g: FaceGeometry, layers: Set<Layer>) {
  // Render the full overlay offscreen, then crop to the face so it stays legible on half-body photos.
  const canvas = document.createElement("canvas");
  const scaleX = img.naturalWidth / g.width;
  const scaleY = img.naturalHeight / g.height;
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  render(canvas, img, g, layers, scaleX, scaleY);

  const xs = g.points.map((p) => p.x * scaleX);
  const ys = g.points.map((p) => p.y * scaleY);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const fw = maxX - minX, fh = maxY - minY;
  let cw = fw * 2.1, ch = fh * 1.75;
  // keep a 4:5 frame
  if (cw / ch > 0.8) ch = cw / 0.8;
  else cw = ch * 0.8;
  cw = Math.min(cw, canvas.width);
  ch = Math.min(ch, canvas.height);
  const cx = Math.max(0, Math.min(canvas.width - cw, (minX + maxX) / 2 - cw / 2));
  const cy = Math.max(0, Math.min(canvas.height - ch, (minY + maxY) / 2 - ch / 2 - fh * 0.05));
  visible.width = Math.round(cw);
  visible.height = Math.round(ch);
  visible.getContext("2d")!.drawImage(canvas, cx, cy, cw, ch, 0, 0, visible.width, visible.height);
}

function render(canvas: HTMLCanvasElement, img: HTMLImageElement, g: FaceGeometry, layers: Set<Layer>, scaleX: number, scaleY: number) {
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const pts = g.points.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY }));
  const P = (i: number) => pts[i];
  const center = P(L.noseBridge);
  const roll = (g.roll * Math.PI) / 180;
  // Work in a levelled frame, then rotate the context back so lines follow the face.
  const lv = (p: Pt): Pt => {
    const c = Math.cos(-roll), s = Math.sin(-roll);
    const dx = p.x - center.x, dy = p.y - center.y;
    return { x: dx * c - dy * s, y: dx * s + dy * c };
  };
  const Q = (i: number) => lv(P(i));

  const faceW = Math.hypot(P(L.lCheek).x - P(L.rCheek).x, P(L.lCheek).y - P(L.rCheek).y);
  const unit = faceW / 260;
  const green = getComputedStyle(document.documentElement).getPropertyValue("--overlay").trim() || "#1e8f6c";

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (layers.has("mesh")) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.1 * unit, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(roll);
  ctx.lineWidth = 1.6 * unit;
  ctx.font = `${12 * unit}px ui-sans-serif, system-ui`;

  const left = Q(L.rCheek).x - 40 * unit;
  const right = Q(L.lCheek).x + 40 * unit;

  const hline = (y: number, label: string, dash = true) => {
    ctx.setLineDash(dash ? [6 * unit, 6 * unit] : []);
    ctx.strokeStyle = green;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.setLineDash([]);
    tag(ctx, label, right + 6 * unit, y, unit);
  };

  if (layers.has("thirds")) {
    const yTop = Q(L.foreheadTop).y;
    const yBrow = Q(L.glabella).y;
    const yNose = Q(L.subnasale).y;
    const yChin = Q(L.chin).y;
    hline(yTop, "upper mesh");
    hline(yBrow, "brow");
    hline(yNose, "nose base");
    hline(yChin, "chin");
    const mid = yNose - yBrow;
    const low = yChin - yNose;
    ctx.fillStyle = "white";
    tag(ctx, `mid ${((mid / (mid + low)) * 100).toFixed(0)}%`, left - 4 * unit, (yBrow + yNose) / 2, unit, "right");
    tag(ctx, `low ${((low / (mid + low)) * 100).toFixed(0)}%`, left - 4 * unit, (yNose + yChin) / 2, unit, "right");
  }

  if (layers.has("fifths")) {
    const top = Q(L.foreheadTop).y;
    const bottom = Q(L.chin).y;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.setLineDash([3 * unit, 5 * unit]);
    for (const i of [L.rCheek, L.rEyeOuter, L.rEyeInner, L.lEyeInner, L.lEyeOuter, L.lCheek]) {
      const x = Q(i).x;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  if (layers.has("angles")) {
    ctx.strokeStyle = green;
    const seg = (a: Pt, b: Pt) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };
    // canthal lines (extended)
    for (const [inner, outer] of [[L.rEyeInner, L.rEyeOuter], [L.lEyeInner, L.lEyeOuter]] as const) {
      const a = Q(inner), b = Q(outer);
      const dx = b.x - a.x, dy = b.y - a.y;
      seg({ x: a.x - dx * 0.15, y: a.y - dy * 0.15 }, { x: b.x + dx * 0.25, y: b.y + dy * 0.25 });
    }
    // cheekbone and jaw widths
    seg(Q(L.rCheek), Q(L.lCheek));
    seg(Q(L.rJaw), Q(L.lJaw));
    // jawline
    seg(Q(L.rCheek), Q(L.rJaw));
    seg(Q(L.rJaw), Q(L.chin));
    seg(Q(L.lCheek), Q(L.lJaw));
    seg(Q(L.lJaw), Q(L.chin));
    // midline
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    seg({ x: Q(L.noseBridge).x, y: Q(L.foreheadTop).y }, { x: Q(L.chin).x, y: Q(L.chin).y + 20 * unit });
    ctx.fillStyle = green;
    for (const i of [L.rCheek, L.lCheek, L.rJaw, L.lJaw, L.chin, L.rEyeInner, L.rEyeOuter, L.lEyeInner, L.lEyeOuter, L.subnasale, L.glabella]) {
      const p = Q(i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.2 * unit, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function tag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, unit: number, align: "left" | "right" = "left") {
  const pad = 4 * unit;
  const w = ctx.measureText(text).width + pad * 2;
  const h = 18 * unit;
  const x0 = align === "left" ? x : x - w;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.beginPath();
  ctx.roundRect(x0, y - h / 2, w, h, 4 * unit);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(text, x0 + pad, y + 0.5 * unit);
}
