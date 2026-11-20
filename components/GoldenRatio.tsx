"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FaceGeometry, Pt } from "@/lib/face";
import { computeGolden, PHI, type GoldenItem, type GoldenResult } from "@/lib/golden";

const GOLD = "#d4a72c";
const GOLD_SOFT = "#f3d27a";

export function GoldenRatio({ src, geometry }: { src: string; geometry: FaceGeometry }) {
  const base = useMemo(() => computeGolden(geometry.points), [geometry]);
  const lv = base.levelled;
  const glabellaY = lv[9].y;
  const mid = lv[2].y - lv[9].y;
  const [hairline, setHairline] = useState(base.hairlineDefault);
  const result = useMemo(() => computeGolden(geometry.points, hairline), [geometry, hairline]);
  const [active, setActive] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => draw(canvas, img, geometry, result, hairline, active);
    img.src = src;
  }, [src, geometry, result, hairline, active]);

  const best = [...result.items].sort((a, b) => b.match - a.match)[0];
  const worst = [...result.items].sort((a, b) => a.match - b.match)[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <canvas ref={canvasRef} className="block h-auto w-full rounded-xl bg-surface-2" />
        <div className="no-print mt-4">
          <label className="text-sm font-medium" htmlFor="hairline">
            Line up the top gold line with your hairline
          </label>
          <input
            id="hairline"
            type="range"
            className="mt-2 w-full accent-[#d4a72c]"
            min={glabellaY - mid * 1.7}
            max={glabellaY - mid * 0.4}
            step={0.5}
            value={hairline}
            onChange={(e) => setHairline(Number(e.target.value))}
          />
          <div className="flex justify-between text-xs text-muted">
            <span>Higher</span>
            <button className="underline" onClick={() => setHairline(base.hairlineDefault)}>
              Reset estimate
            </button>
            <span>Lower</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            The face model can&apos;t see where your hair starts, so face length uses this line. Only that one proportion changes when you move it.
          </p>
        </div>
      </div>

      <div>
        <div className="card flex items-center gap-5 p-5">
          <Ring value={result.overall} />
          <div>
            <p className="eyebrow">Golden ratio match</p>
            <p className="mt-1 font-serif text-4xl leading-none">{result.overall.toFixed(1)}%</p>
            <p className="mt-2 text-sm text-muted">
              Average closeness of 6 proportions to φ = 1.618. Closest: <span className="text-ink">{best.label}</span>. Furthest:{" "}
              <span className="text-ink">{worst.label}</span>.
            </p>
          </div>
        </div>

        <div className="card mt-3 divide-y divide-line">
          {result.items.map((it) => (
            <GoldenRow key={it.key} item={it} active={active === it.key} onHover={(on) => setActive(on ? it.key : null)} />
          ))}
        </div>

        <p className="mt-4 text-xs text-muted">
          How to read this: the golden ratio is a popular reference, not a beauty score. Research finds averageness, symmetry,
          skin and expression matter more than hitting 1.618, and many striking faces sit well off it. Expression-sensitive
          ratios (marked ✱) need a neutral, closed-mouth photo to mean much. Hairstyle height and beard shape change how
          these proportions look, even though they can&apos;t change the bone.
        </p>
      </div>
    </div>
  );
}

function GoldenRow({ item, active, onHover }: { item: GoldenItem; active: boolean; onHover: (on: boolean) => void }) {
  // Scale 1.0 – 2.2 with phi marked.
  const min = 1.0, max = 2.2;
  const pos = (v: number) => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`;
  const dir = item.deviation >= 0 ? "above" : "below";
  return (
    <div
      className={`p-4 transition ${active ? "bg-surface-2" : ""}`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium">
            {item.label}
            {item.expressionSensitive && <span className="text-muted"> ✱</span>}
          </p>
          <p className="text-xs text-muted">{item.formula}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-serif text-2xl leading-none">{item.value.toFixed(2)}</p>
          <p className="text-xs text-muted">{item.match.toFixed(0)}% match</p>
        </div>
      </div>
      <div className="relative mt-3 h-2 rounded-full bg-surface-2">
        <div className="absolute inset-y-0 w-0.5 -translate-x-1/2" style={{ left: pos(PHI), background: GOLD }} title="1.618" />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink"
          style={{ left: pos(item.value) }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>1.0</span>
        <span>φ 1.618</span>
        <span>2.2</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {Math.abs(item.deviation) < 3 ? "Essentially on the golden ratio." : `${Math.abs(item.deviation).toFixed(0)}% ${dir} 1.618.`}
      </p>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0" aria-hidden>
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
      <circle
        cx="38"
        cy="38"
        r={r}
        fill="none"
        stroke={GOLD}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`}
        transform="rotate(-90 38 38)"
      />
      <text x="38" y="43" textAnchor="middle" fontSize="15" fill="currentColor" className="font-serif">
        φ
      </text>
    </svg>
  );
}

function draw(
  visible: HTMLCanvasElement,
  img: HTMLImageElement,
  g: FaceGeometry,
  res: GoldenResult,
  hairline: number,
  active: string | null,
) {
  const sx = img.naturalWidth / g.width, sy = img.naturalHeight / g.height;
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const lv = res.levelled;
  const faceW = Math.abs(lv[454].x - lv[234].x) * sx;
  const unit = faceW / 260;

  ctx.save();
  ctx.scale(sx, sy);
  ctx.translate(res.center.x, res.center.y);
  ctx.rotate(res.roll);
  ctx.translate(-res.center.x, -res.center.y);
  const line = (a: Pt, b: Pt, color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    for (const p of [a, b]) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.6 * unit, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  // Hairline guide
  ctx.setLineDash([6 * unit, 5 * unit]);
  line({ x: lv[234].x - 30 * unit, y: hairline }, { x: lv[454].x + 30 * unit, y: hairline }, GOLD_SOFT, 1.6 * unit);
  ctx.setLineDash([]);
  for (const it of res.items) {
    const on = !active || active === it.key;
    const alpha = on ? 1 : 0.18;
    ctx.globalAlpha = alpha;
    line(it.segments[0][0], it.segments[0][1], GOLD, (active === it.key ? 3 : 1.8) * unit);
    line(it.segments[1][0], it.segments[1][1], "#ffffff", (active === it.key ? 3 : 1.6) * unit);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Crop to the face including the hairline.
  const xs = g.points.map((p) => p.x * sx), ys = g.points.map((p) => p.y * sy);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const top = Math.min(Math.min(...ys), hairline * sy) , maxY = Math.max(...ys);
  const fw = maxX - minX, fh = maxY - top;
  let cw = fw * 1.9, ch = fh * 1.35;
  if (cw / ch > 0.8) ch = cw / 0.8;
  else cw = ch * 0.8;
  cw = Math.min(cw, canvas.width);
  ch = Math.min(ch, canvas.height);
  const cx = Math.max(0, Math.min(canvas.width - cw, (minX + maxX) / 2 - cw / 2));
  const cy = Math.max(0, Math.min(canvas.height - ch, (top + maxY) / 2 - ch / 2));
  visible.width = Math.round(cw);
  visible.height = Math.round(ch);
  visible.getContext("2d")!.drawImage(canvas, cx, cy, cw, ch, 0, 0, visible.width, visible.height);
}
