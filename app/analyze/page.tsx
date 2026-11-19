"use client";

import { useEffect, useRef, useState } from "react";
import { ReportView } from "@/components/ReportView";
import { Spinner } from "@/components/PreviewStudio";
import { ApiError, getAccessCode, postJson, setAccessCode } from "@/lib/api";
import { detectFace, type FaceGeometry } from "@/lib/face";
import { fileToDataUrl, loadImage } from "@/lib/image";
import type { Goals, Report } from "@/lib/schema";
import { DEMO_REPORT } from "@/lib/demo-report";

type Step = "upload" | "goals" | "analyzing" | "report";
type Status = { analysis: boolean; previews: string | null; accessCode: boolean };

const READS = ["More put-together", "Sharper / more defined", "Softer / approachable", "Better on camera", "More attractive for dating", "More professional", "Lower maintenance", "More distinctive"];
const CONTEXTS = ["Everyday", "Work / office", "Dating", "Social media", "Interviews", "Stage / video"];
const FACIAL_HAIR = ["Open to it", "Prefer clean shaven", "Keep my current beard", "Can't grow much", "Not applicable"];

const PROGRESS = [
  "Reading your photo…",
  "Mapping proportions and features…",
  "Checking hair texture, density and hairline…",
  "Matching hairstyles to your face…",
  "Choosing frames, colours and grooming…",
  "Ranking the highest-impact changes…",
  "Writing your report…",
];

export default function AnalyzePage() {
  const [step, setStep] = useState<Step>("upload");
  const [photo, setPhoto] = useState<string | null>(null);
  const [side, setSide] = useState<string | null>(null);
  const [geometry, setGeometry] = useState<FaceGeometry | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goals>({ desiredRead: [], context: ["Everyday"], maintenance: "medium", wearsGlasses: false, facialHair: "Open to it", notes: "" });
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [code, setCode] = useState("");
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setCode(getAccessCode());
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
    if (new URLSearchParams(window.location.search).has("demo")) loadDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step !== "analyzing") return;
    setProgress(0);
    const t = setInterval(() => setProgress((p) => Math.min(p + 1, PROGRESS.length - 1)), 9000);
    return () => clearInterval(t);
  }, [step]);

  async function loadDemo() {
    // Demo mode: a sample report on a generated placeholder, for exploring the UI without API keys.
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 1000);
    g.addColorStop(0, "#d9d4c9");
    g.addColorStop(1, "#b9b2a4");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 800, 1000);
    ctx.fillStyle = "#7a6f62";
    ctx.beginPath();
    ctx.ellipse(400, 470, 210, 280, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f3efe7";
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Demo — upload your own photo", 400, 900);
    setPhoto(canvas.toDataURL("image/jpeg", 0.85));
    setGeometry(null);
    setReport(DEMO_REPORT);
    setStep("report");
  }

  async function onFile(file: File | undefined, which: "front" | "side") {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      if (which === "side") {
        setSide(dataUrl);
        return;
      }
      setPhoto(dataUrl);
      setGeometry(null);
      setDetectMsg(null);
      setDetecting(true);
      try {
        const img = await loadImage(dataUrl);
        const geo = await detectFace(img);
        setGeometry(geo);
        setDetectMsg(geo ? null : "We couldn't find a face in this photo. Try a clearer, front-facing shot.");
      } catch {
        setDetectMsg("Face mapping couldn't load in this browser. You can still run the written analysis.");
      } finally {
        setDetecting(false);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function analyze() {
    if (!photo) return;
    setError(null);
    setStep("analyzing");
    if (status?.accessCode) setAccessCode(code);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await postJson<{ report: Report }>(
        "/api/analyze",
        { image: photo, sideImage: side ?? undefined, goals, measurements: geometry?.measurements ?? [] },
        ctrl.signal,
      );
      setReport(res.report);
      setStep("report");
      window.scrollTo({ top: 0 });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof ApiError ? e.message : "Network error. Check your connection and retry.");
      setStep("goals");
    }
  }

  function reset() {
    abortRef.current?.abort();
    setPhoto(null);
    setSide(null);
    setGeometry(null);
    setReport(null);
    setError(null);
    setStep("upload");
    window.history.replaceState(null, "", "/analyze");
  }

  if (step === "report" && report && photo) {
    return <ReportView report={report} photo={photo} geometry={geometry} provider={status?.previews ?? null} onReset={reset} />;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-10 pt-10 sm:px-6">
      <Stepper step={step} />

      {status && !status.analysis && (
        <div className="mt-6 rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm">
          <code>ANTHROPIC_API_KEY</code> isn&apos;t set on this deployment, so analysis will fail.{" "}
          <a className="underline" href="/analyze?demo=1" onClick={(e) => { e.preventDefault(); loadDemo(); }}>
            View a demo report
          </a>{" "}
          to explore the interface.
        </div>
      )}

      {step === "upload" && (
        <section className="mt-8">
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Upload your photo</h1>
          <p className="mt-3 text-muted">Face the camera straight on. Neutral expression, hair as you usually wear it, even light from the front.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <DropZone label="Front photo" required image={photo} onFile={(f) => onFile(f, "front")} />
            <DropZone label="Side or 3/4 view" hint="Optional, adds detail" image={side} onFile={(f) => onFile(f, "side")} onClear={() => setSide(null)} />
          </div>

          <div className="mt-4 min-h-6 text-sm">
            {detecting && (
              <span className="inline-flex items-center gap-2 text-muted">
                <Spinner /> Mapping 478 facial landmarks…
              </span>
            )}
            {!detecting && geometry && <span className="text-accent">✓ Face mapped. {geometry.warnings[0] ?? ""}</span>}
            {!detecting && detectMsg && <span className="text-warn">{detectMsg}</span>}
            {error && <span className="text-danger">{error}</span>}
          </div>

          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            {[
              ["Distance", "Arm's length or further. Close selfies widen the nose and narrow the face."],
              ["Light", "Face a window. Avoid overhead light and harsh shadows."],
              ["Pose", "Head level, chin neither up nor down, no filters."],
            ].map(([t, b]) => (
              <div key={t} className="card p-4">
                <p className="font-medium">{t}</p>
                <p className="mt-1 text-muted">{b}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button className="btn-primary !px-7 !py-3" disabled={!photo || detecting} onClick={() => setStep("goals")}>
              Continue
            </button>
          </div>
        </section>
      )}

      {step === "goals" && (
        <section className="mt-8">
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">What are you going for?</h1>
          <p className="mt-3 text-muted">Recommendations are ranked against your goal. Pick any that apply.</p>

          <Field label="How do you want to come across?">
            <ChipGroup options={READS} value={goals.desiredRead} onChange={(v) => setGoals({ ...goals, desiredRead: v })} />
          </Field>
          <Field label="Where does it matter most?">
            <ChipGroup options={CONTEXTS} value={goals.context} onChange={(v) => setGoals({ ...goals, context: v })} />
          </Field>
          <Field label="How much daily effort will you put in?">
            <ChipGroup
              single
              options={["Minimal (under 2 min)", "Medium (5 min)", "High (happy to style daily)"]}
              value={[labelForMaintenance(goals.maintenance)]}
              onChange={(v) => setGoals({ ...goals, maintenance: v[0]?.split(" ")[0].toLowerCase() ?? "medium" })}
            />
          </Field>
          <Field label="Facial hair">
            <ChipGroup single options={FACIAL_HAIR} value={[goals.facialHair]} onChange={(v) => setGoals({ ...goals, facialHair: v[0] ?? "Open to it" })} />
          </Field>
          <Field label="Glasses">
            <ChipGroup
              single
              options={["I wear glasses", "No glasses"]}
              value={[goals.wearsGlasses ? "I wear glasses" : "No glasses"]}
              onChange={(v) => setGoals({ ...goals, wearsGlasses: v[0] === "I wear glasses" })}
            />
          </Field>
          <Field label="Anything else? (optional)">
            <textarea
              value={goals.notes}
              onChange={(e) => setGoals({ ...goals, notes: e.target.value.slice(0, 1500) })}
              rows={3}
              placeholder="e.g. Thick wavy hair, hate gel, want something my office won't blink at. Thinking about growing it out."
              className="w-full rounded-xl border border-line bg-surface p-3 text-sm outline-none focus:border-accent"
            />
          </Field>

          {status?.accessCode && (
            <Field label="Access code">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                type="password"
                className="w-full max-w-xs rounded-full border border-line bg-surface px-4 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>
          )}

          {error && <p className="mt-6 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

          <div className="mt-10 flex justify-between">
            <button className="btn-ghost" onClick={() => setStep("upload")}>
              Back
            </button>
            <button className="btn-primary !px-7 !py-3" onClick={analyze}>
              Run analysis
            </button>
          </div>
        </section>
      )}

      {step === "analyzing" && (
        <section className="mt-16 text-center">
          <div className="relative mx-auto w-56 overflow-hidden rounded-2xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photo && <img src={photo} alt="" className="block w-full opacity-80" />}
            <div className="scanline absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[var(--overlay)]/40 to-transparent" />
          </div>
          <p className="mt-8 font-serif text-3xl">{PROGRESS[progress]}</p>
          <p className="mt-2 text-sm text-muted">A detailed analysis takes about 1–2 minutes. Keep this tab open.</p>
          <button className="btn-ghost mt-8" onClick={() => { abortRef.current?.abort(); setStep("goals"); }}>
            Cancel
          </button>
          <style>{`.scanline{animation:scan 2.4s ease-in-out infinite}@keyframes scan{0%{top:-20%}50%{top:90%}100%{top:-20%}}`}</style>
        </section>
      )}
    </main>
  );
}

function labelForMaintenance(m: string) {
  if (m === "minimal") return "Minimal (under 2 min)";
  if (m === "high") return "High (happy to style daily)";
  return "Medium (5 min)";
}

function Stepper({ step }: { step: Step }) {
  const steps: [Step, string][] = [
    ["upload", "Photo"],
    ["goals", "Goals"],
    ["analyzing", "Analysis"],
  ];
  const idx = steps.findIndex(([s]) => s === step);
  return (
    <ol className="flex items-center gap-3 text-xs">
      {steps.map(([s, label], i) => (
        <li key={s} className="flex items-center gap-3">
          <span className={`flex items-center gap-2 ${i <= idx ? "text-ink" : "text-muted"}`}>
            <span className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] ${i <= idx ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>{i + 1}</span>
            {label}
          </span>
          {i < steps.length - 1 && <span className="h-px w-8 bg-line" />}
        </li>
      ))}
    </ol>
  );
}

function DropZone({
  label,
  hint,
  required,
  image,
  onFile,
  onClear,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  image: string | null;
  onFile: (f: File | undefined) => void;
  onClear?: () => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <label
      className={`card relative flex aspect-[4/5] cursor-pointer flex-col items-center justify-center overflow-hidden border-dashed text-center transition ${over ? "border-accent bg-accent-soft" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFile(e.dataTransfer.files?.[0]);
      }}
    >
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={label} className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">Click to replace</span>
          {onClear && (
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
              onClick={(e) => {
                e.preventDefault();
                onClear();
              }}
            >
              Remove
            </button>
          )}
        </>
      ) : (
        <div className="p-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mx-auto text-muted" aria-hidden>
            <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="mt-3 font-medium">
            {label}
            {required && <span className="text-danger"> *</span>}
          </p>
          <p className="mt-1 text-sm text-muted">{hint ?? "Drop an image or click to choose"}</p>
        </div>
      )}
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <p className="mb-3 text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

function ChipGroup({ options, value, onChange, single }: { options: string[]; value: string[]; onChange: (v: string[]) => void; single?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            className="chip"
            data-active={on}
            onClick={() => onChange(single ? [o] : on ? value.filter((x) => x !== o) : [...value, o])}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
