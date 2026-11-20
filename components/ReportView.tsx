"use client";

import type { FaceGeometry } from "@/lib/face";
import type { Report } from "@/lib/schema";
import { FaceMap } from "./FaceMap";
import { PreviewStudio } from "./PreviewStudio";

const NAV = [
  ["overview", "Overview"],
  ["plan", "Priority plan"],
  ["map", "Face map"],
  ["features", "Features"],
  ["looks", "Try looks"],
  ["wardrobe", "Wardrobe"],
  ["skin", "Skin"],
  ["style", "Style & colour"],
  ["photos", "Photos"],
  ["notes", "Notes"],
] as const;

const CATEGORY_LABEL: Record<string, string> = {
  hair: "Hair",
  skin: "Skin",
  grooming: "Grooming",
  facial_hair: "Facial hair",
  eyewear: "Eyewear",
  style: "Style",
  photo: "Photography",
};

export function ReportView({
  report,
  photo,
  bodyPhoto = null,
  geometry,
  provider,
  onReset,
}: {
  report: Report;
  photo: string;
  bodyPhoto?: string | null;
  geometry: FaceGeometry | null;
  provider: string | null;
  onReset: () => void;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your FaceLab report</p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">Analysis & recommendations</h1>
        </div>
        <div className="no-print flex gap-2">
          <button className="btn-ghost" onClick={() => window.print()}>
            Save as PDF
          </button>
          <button className="btn-ghost" onClick={onReset}>
            New analysis
          </button>
        </div>
      </div>

      <nav className="no-print sticky top-14 z-30 -mx-4 mt-6 overflow-x-auto border-b border-line bg-bg/90 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex gap-1 py-2">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink">
              {label}
            </a>
          ))}
        </div>
      </nav>

      {/* Overview */}
      <Section id="overview" title="Overview">
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="Your photo" className="w-full rounded-2xl border border-line object-cover md:aspect-[4/5]" />
          <div>
            <p className="font-serif text-2xl leading-snug sm:text-3xl">{report.summary}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="card p-4">
                <p className="eyebrow">Face shape read</p>
                <p className="mt-1 text-lg font-semibold">{report.faceShape.read}</p>
                <p className="mt-1 text-sm text-muted">{report.faceShape.notes}</p>
              </div>
              <div className={`card p-4 ${report.photoQuality.usable ? "" : "border-warn"}`}>
                <p className="eyebrow">Photo quality</p>
                <p className="mt-1 text-lg font-semibold">{report.photoQuality.usable ? "Usable" : "Limited"}</p>
                <p className="mt-1 text-sm text-muted">{report.photoQuality.notes}</p>
              </div>
            </div>
            {geometry?.warnings.length ? (
              <ul className="mt-4 space-y-1 text-sm text-warn">
                {geometry.warnings.map((w) => (
                  <li key={w}>• {w}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </Section>

      {/* Plan */}
      <Section id="plan" title="Priority plan" subtitle="Ranked by impact for your goal. Reversible moves first.">
        <ol className="space-y-3">
          {report.priorities.map((p, i) => (
            <li key={i} className="card grid gap-4 p-5 sm:grid-cols-[56px_1fr]">
              <p className="font-serif text-4xl text-muted">{String(i + 1).padStart(2, "0")}</p>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <Badge>{CATEGORY_LABEL[p.category] ?? p.category}</Badge>
                  <Badge tone="muted">Impact: {p.impact}</Badge>
                  <Badge tone="muted">Effort: {p.effort}</Badge>
                </div>
                <p className="mt-2 text-muted">{p.why}</p>
                <p className="mt-2 text-sm">
                  <span className="font-medium">How: </span>
                  {p.how}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Map */}
      <Section
        id="map"
        title="Face map"
        subtitle="478 landmarks measured in your browser. One 2D photo gives approximate ratios. Lens distance, tilt and expression shift them."
      >
        {geometry ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <FaceMap src={photo} geometry={geometry} />
            <div className="card divide-y divide-line">
              {geometry.measurements.map((m) => (
                <div key={m.key} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 p-4">
                  <p className="font-medium">{m.label}</p>
                  <p className="text-right font-serif text-2xl leading-none">{m.display}</p>
                  <p className="text-sm text-muted">{m.note}</p>
                  <p className="text-right text-xs text-muted">typical {m.typical}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted">
            Landmark detection didn&apos;t run on this photo (no clear face found, or the browser couldn&apos;t load the face model). The
            written analysis below is still based on your photo.
          </p>
        )}
      </Section>

      {/* Features */}
      <Section id="features" title="Feature analysis">
        <div className="grid gap-3 md:grid-cols-2">
          {report.features.map((f, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{f.area}</h3>
                <Badge tone="muted">{f.confidence} confidence</Badge>
              </div>
              <p className="mt-2 text-sm">{f.observation}</p>
              <p className="mt-2 text-sm text-muted">
                <span className="font-medium text-ink">→ </span>
                {f.implication}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Looks */}
      <Section id="looks" title="Try looks on yourself" subtitle="Preview the recommended options on your own photo, or try any idea.">
        <div className="no-print">
          <PreviewStudio photo={photo} bodyPhoto={bodyPhoto} report={report} provider={provider} />
        </div>
        <div className="hidden print:block">
          {report.hairstyles.map((h) => (
            <div key={h.name} className="mb-3">
              <p className="font-semibold">{h.name}</p>
              <p className="text-sm">{h.why}</p>
              <p className="text-sm italic">Barber: “{h.barberScript}”</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Wardrobe */}
      {report.wardrobe && (
        <Section id="wardrobe" title="Wardrobe" subtitle={report.wardrobe.summary}>
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="eyebrow mb-3">Buy or own first</p>
              <ol className="card divide-y divide-line">
                {report.wardrobe.keyPieces.map((k, i) => (
                  <li key={i} className="grid gap-1 p-4 sm:grid-cols-[28px_1fr]">
                    <span className="font-serif text-xl text-muted">{i + 1}</span>
                    <div>
                      <p className="font-semibold">{k.item}</p>
                      <p className="text-sm">{k.spec}</p>
                      <p className="mt-1 text-sm text-muted">{k.why}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="space-y-3">
              <div className="card p-5">
                <p className="eyebrow">Fit for your build</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {report.wardrobe.fitNotes.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>
              <div className="card p-5">
                <p className="eyebrow">Skip</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {report.wardrobe.avoid.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <p className="eyebrow mb-3 mt-8">Outfits for your dress codes</p>
          <div className="grid gap-3 md:grid-cols-2">
            {report.wardrobe.outfits.map((o, i) => (
              <div key={i} className="card p-5">
                <p className="eyebrow">{o.occasion.replace(/_/g, " ")}</p>
                <h3 className="mt-1 font-semibold">{o.name}</h3>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {o.pieces.map((p) => (
                    <li key={p} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs">
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-muted">{o.why}</p>
              </div>
            ))}
          </div>
          <p className="no-print mt-4 text-sm">
            <a href="#looks" className="underline">
              Preview any outfit on yourself
            </a>{" "}
            in the Outfits tab above.
          </p>
        </Section>
      )}

      {/* Skin */}
      <Section id="skin" title="Skin routine" subtitle={report.skincare.notes}>
        <div className="grid gap-3 md:grid-cols-3">
          {(
            [
              ["Morning", report.skincare.morning],
              ["Evening", report.skincare.evening],
              ["Weekly", report.skincare.weekly],
            ] as const
          ).map(([t, items]) => (
            <div key={t} className="card p-5">
              <p className="eyebrow">{t}</p>
              <ol className="mt-3 space-y-2 text-sm">
                {items.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      {/* Style */}
      <Section id="style" title="Style & colour" subtitle={report.style.paletteReason}>
        <div className="flex flex-wrap gap-3">
          {report.style.palette.map((c) => (
            <div key={c.hex + c.name} className="w-28">
              <div className="h-20 rounded-xl border border-line" style={{ background: safeHex(c.hex) }} />
              <p className="mt-1.5 text-sm font-medium">{c.name}</p>
              <p className="text-xs uppercase text-muted">{c.hex}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="card p-5">
            <p className="eyebrow">Tips</p>
            <ul className="mt-3 space-y-2 text-sm">
              {report.style.tips.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <p className="eyebrow">Colours to go easy on</p>
            <ul className="mt-3 space-y-2 text-sm">
              {report.style.avoidColors.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Photos */}
      <Section id="photos" title="Photographing your face">
        <ul className="grid gap-3 md:grid-cols-2">
          {report.photography.map((t, i) => (
            <li key={i} className="card p-4 text-sm">
              {t}
            </li>
          ))}
        </ul>
      </Section>

      {/* Notes */}
      <Section id="notes" title="Avoid for now, and caveats">
        <div className="grid gap-3 md:grid-cols-2">
          {report.avoid.map((a, i) => (
            <div key={i} className="card p-5">
              <p className="font-semibold">{a.move}</p>
              <p className="mt-1 text-sm text-muted">{a.why}</p>
            </div>
          ))}
        </div>
        {report.professionalReferrals.length > 0 && (
          <div className="mt-4 rounded-xl border border-line bg-surface-2 p-5 text-sm">
            <p className="eyebrow">Worth asking a professional</p>
            <ul className="mt-2 space-y-1">
              {report.professionalReferrals.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </div>
        )}
        <ul className="mt-4 space-y-1 text-xs text-muted">
          {report.caveats.map((c, i) => (
            <li key={i}>• {c}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 border-b border-line py-12 last:border-0">
      <h2 className="font-serif text-3xl tracking-tight">{title}</h2>
      {subtitle && <p className="mt-2 max-w-3xl text-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Badge({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "muted" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone === "accent" ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"}`}
    >
      {children}
    </span>
  );
}

function safeHex(hex: string) {
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#888888";
}
