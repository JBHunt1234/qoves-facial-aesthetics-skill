"use client";

import { useState } from "react";
import { postJson } from "@/lib/api";
import { downloadDataUrl } from "@/lib/image";
import type { Report } from "@/lib/schema";
import { BeforeAfter } from "./BeforeAfter";

type Option = { name: string; why: string; previewPrompt: string; extra?: string };
type Gen = { status: "loading" | "done" | "error"; image?: string; error?: string; label: string };

const QUICK_IDEAS: { label: string; prompt: string }[] = [
  { label: "Buzz cut", prompt: "Change the hairstyle to an even #2 buzz cut all over." },
  { label: "Textured crop", prompt: "Change the hairstyle to a short textured French crop with a mid skin fade and a short choppy fringe." },
  { label: "Slicked back", prompt: "Change the hairstyle to a medium-length slicked-back style with natural shine and tapered sides." },
  { label: "Curtains / middle part", prompt: "Change the hairstyle to medium-length curtain hair with a soft middle part falling to the cheekbones." },
  { label: "Shoulder length", prompt: "Change the hairstyle to shoulder-length layered hair with natural movement." },
  { label: "Long & wavy", prompt: "Change the hairstyle to long, loose, natural waves past the shoulders." },
  { label: "Sharp side part", prompt: "Change the hairstyle to a classic tapered side part with a defined part line and natural matte finish." },
  { label: "Platinum blonde", prompt: "Change the hair colour to an icy platinum blonde, keeping the same haircut." },
  { label: "Dark brunette", prompt: "Change the hair colour to a rich dark chocolate brunette, keeping the same haircut." },
  { label: "Full beard", prompt: "Add a well-groomed full beard about 2 cm long with a clean cheek line and neckline." },
  { label: "Heavy stubble", prompt: "Add even 5 mm heavy stubble along the jaw, chin and upper lip with a clean neckline." },
  { label: "Clean shaven", prompt: "Make the face clean shaven with no facial hair." },
  { label: "Round glasses", prompt: "Add thin round tortoiseshell glasses that fit the face width." },
  { label: "Bold black frames", prompt: "Add bold black rectangular acetate glasses sized to the face." },
  { label: "No glasses", prompt: "Remove the glasses, showing the eyes naturally." },
];

export function PreviewStudio({ photo, report, provider }: { photo: string; report: Report; provider: string | null }) {
  const [gens, setGens] = useState<Record<string, Gen>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"hair" | "color" | "beard" | "glasses" | "custom">("hair");
  const [custom, setCustom] = useState("");

  const generate = async (key: string, label: string, prompt: string) => {
    setGens((g) => ({ ...g, [key]: { status: "loading", label } }));
    setSelected(key);
    try {
      const { image } = await postJson<{ image: string }>("/api/visualize", { image: photo, prompt });
      setGens((g) => ({ ...g, [key]: { status: "done", image, label } }));
    } catch (e) {
      setGens((g) => ({ ...g, [key]: { status: "error", error: (e as Error).message, label } }));
    }
  };

  const tabs = [
    { key: "hair", label: "Hairstyles", items: report.hairstyles.map((h) => ({ ...h, extra: h.barberScript })) },
    { key: "color", label: "Hair colour", items: report.hairColors },
    { key: "beard", label: "Facial hair", items: report.facialHair.options },
    { key: "glasses", label: "Glasses", items: report.eyewear.frames },
    { key: "custom", label: "Try anything", items: [] },
  ] as const;
  const active = tabs.find((t) => t.key === tab)!;
  const sel = selected ? gens[selected] : null;
  const done = Object.entries(gens).filter(([, g]) => g.status === "done");

  return (
    <div>
      {!provider && (
        <div className="mb-6 rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm">
          Image previews aren&apos;t configured on this deployment. Add <code>REPLICATE_API_TOKEN</code> or{" "}
          <code>OPENAI_API_KEY</code> in your environment variables to turn them on.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        {/* Viewer */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="card p-3">
            {sel?.status === "done" && sel.image ? (
              <BeforeAfter before={photo} after={sel.image} label={sel.label} />
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="Your photo" className="block w-full rounded-xl" />
                {sel?.status === "loading" && (
                  <div className="absolute inset-0 grid place-items-center rounded-xl bg-black/45 text-white">
                    <div className="text-center">
                      <Spinner />
                      <p className="mt-3 text-sm">Rendering “{sel.label}”…</p>
                      <p className="text-xs opacity-75">usually 10–40 seconds</p>
                    </div>
                  </div>
                )}
                {sel?.status === "error" && (
                  <div className="absolute inset-x-3 bottom-3 rounded-lg bg-danger/90 p-3 text-sm text-white">{sel.error}</div>
                )}
              </div>
            )}
            <div className="flex items-center justify-between px-1 pb-1 pt-3">
              <p className="text-sm font-medium">{sel?.label ?? "Your photo"}</p>
              {sel?.status === "done" && sel.image && (
                <button className="btn-ghost !py-1 !text-xs" onClick={() => downloadDataUrl(sel.image!, `facelab-${sel.label.replace(/\W+/g, "-").toLowerCase()}.jpg`)}>
                  Download
                </button>
              )}
            </div>
          </div>

          {done.length > 0 && (
            <div className="mt-4">
              <p className="eyebrow mb-2">Your looks</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {done.map(([k, g]) => (
                  <button
                    key={k}
                    onClick={() => setSelected(k)}
                    className={`relative w-20 shrink-0 overflow-hidden rounded-lg border-2 ${selected === k ? "border-accent" : "border-transparent"}`}
                    title={g.label}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.image} alt={g.label} className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button key={t.key} className="chip" data-active={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "custom" ? (
            <div className="mt-5">
              <p className="text-sm text-muted">Describe any change, or pick a quick idea. Combine them freely, e.g. “textured crop + light stubble”.</p>
              <form
                className="mt-3 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (custom.trim().length < 3) return;
                  generate(`custom-${Date.now()}`, custom.trim().slice(0, 40), custom.trim());
                }}
              >
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="e.g. Short curly hair with a low taper and a thin moustache"
                  className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                <button className="btn-primary" disabled={!provider || custom.trim().length < 3}>
                  Generate
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_IDEAS.map((q) => (
                  <button
                    key={q.label}
                    className="chip !text-xs"
                    disabled={!provider}
                    onClick={() => generate(`quick-${q.label}`, q.label, q.prompt)}
                  >
                    {gens[`quick-${q.label}`]?.status === "loading" ? "… " : ""}
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {tab === "beard" && <p className="text-sm text-muted">{report.facialHair.recommendation}</p>}
              {tab === "glasses" && <p className="text-sm text-muted">{report.eyewear.recommendation}</p>}
              {active.items.length === 0 && <p className="text-sm text-muted">No suggestions in this category for you. Try “Try anything”.</p>}
              {(active.items as readonly Option[]).map((o, i) => {
                const key = `${tab}-${i}`;
                const g = gens[key];
                return (
                  <div key={key} className={`card p-4 ${selected === key ? "border-accent" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="font-semibold">{o.name}</h4>
                        <p className="mt-1 text-sm text-muted">{o.why}</p>
                      </div>
                      <button
                        className={g?.status === "done" ? "btn-ghost shrink-0 !px-4 !py-1.5 !text-xs" : "btn-primary shrink-0 !px-4 !py-1.5 !text-xs"}
                        disabled={!provider || g?.status === "loading"}
                        onClick={() => (g?.status === "done" ? setSelected(key) : generate(key, o.name, o.previewPrompt))}
                      >
                        {g?.status === "loading" ? "Rendering…" : g?.status === "done" ? "View" : g?.status === "error" ? "Retry" : "Preview on me"}
                      </button>
                    </div>
                    {o.extra && (
                      <details className="mt-3 text-sm">
                        <summary className="cursor-pointer text-muted hover:text-ink">Barber script</summary>
                        <p className="mt-2 rounded-lg bg-surface-2 p-3">“{o.extra}”</p>
                      </details>
                    )}
                    {g?.status === "error" && <p className="mt-2 text-xs text-danger">{g.error}</p>}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-6 text-xs text-muted">
            Previews are AI renderings, not promises. They approximate shape and colour; real results depend on your hair&apos;s
            density, texture and your barber.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Spinner() {
  return <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}
