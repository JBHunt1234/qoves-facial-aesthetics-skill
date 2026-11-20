"use client";

import { useState } from "react";
import { postJson } from "@/lib/api";
import { downloadDataUrl } from "@/lib/image";
import type { Report } from "@/lib/schema";
import { BeforeAfter } from "./BeforeAfter";

type Option = { name: string; why: string; previewPrompt: string; extra?: string; pieces?: string[]; occasion?: string };
type Gen = { status: "loading" | "done" | "error"; image?: string; error?: string; label: string; base: string };
type Tab = "hair" | "color" | "beard" | "glasses" | "outfits" | "custom";

const KEEP_BODY = " Keep the same person, face, hair, body shape, pose, lighting and background unchanged.";

const QUICK_IDEAS: { label: string; prompt: string }[] = [
  { label: "Buzz cut", prompt: "Change the hairstyle to an even #2 buzz cut all over." },
  { label: "Textured crop", prompt: "Change the hairstyle to a short textured French crop with a mid skin fade and a short choppy fringe." },
  { label: "Slicked back", prompt: "Change the hairstyle to a medium-length slicked-back style with natural shine and tapered sides." },
  { label: "Curtains / middle part", prompt: "Change the hairstyle to medium-length curtain hair with a soft middle part falling to the cheekbones." },
  { label: "Shoulder length", prompt: "Change the hairstyle to shoulder-length layered hair with natural movement." },
  { label: "Sharp side part", prompt: "Change the hairstyle to a classic tapered side part with a defined part line and natural matte finish." },
  { label: "Platinum blonde", prompt: "Change the hair colour to an icy platinum blonde, keeping the same haircut." },
  { label: "Dark brunette", prompt: "Change the hair colour to a rich dark chocolate brunette, keeping the same haircut." },
  { label: "Full beard", prompt: "Add a well-groomed full beard about 2 cm long with a clean cheek line and neckline." },
  { label: "Heavy stubble", prompt: "Add even 5 mm heavy stubble along the jaw, chin and upper lip with a clean neckline." },
  { label: "Clean shaven", prompt: "Make the face clean shaven with no facial hair." },
  { label: "Round glasses", prompt: "Add thin round tortoiseshell glasses that fit the face width." },
  { label: "No glasses", prompt: "Remove the glasses, showing the eyes naturally." },
];

const QUICK_OUTFITS: { label: string; prompt: string }[] = [
  { label: "Navy suit + tie", prompt: "Dress the person in a tailored navy worsted wool two-button suit, crisp white poplin dress shirt with a semi-spread collar, solid navy silk tie and white pocket square." },
  { label: "Charcoal suit, open collar", prompt: "Dress the person in a tailored charcoal wool suit with a light-blue dress shirt worn open at the collar, no tie." },
  { label: "Pinstripe power suit", prompt: "Dress the person in a tailored dark navy chalk-stripe suit, white spread-collar shirt and burgundy silk tie." },
  { label: "Double-breasted", prompt: "Dress the person in a tailored charcoal double-breasted 6x2 suit with peak lapels, white shirt and dark green grenadine tie." },
  { label: "Blazer + grey trousers", prompt: "Dress the person in an unstructured navy blazer, white oxford button-down shirt open at the collar, and mid-grey wool trousers." },
  { label: "Merino over oxford", prompt: "Dress the person in a fine-gauge navy merino crewneck sweater over a light-blue oxford shirt with the collar showing, and grey tailored trousers." },
  { label: "Quarter-zip (finance casual)", prompt: "Dress the person in a fine-knit charcoal merino quarter-zip over a white button-down shirt, with navy chinos." },
  { label: "Knit polo", prompt: "Dress the person in a fitted navy knitted polo shirt and stone-coloured tailored trousers." },
  { label: "Roll-neck + suit", prompt: "Dress the person in a charcoal suit with a black fine-knit merino roll-neck sweater instead of a shirt." },
  { label: "Weekend casual", prompt: "Dress the person in an olive overshirt over a white crewneck t-shirt with dark indigo selvedge jeans." },
];

export function PreviewStudio({
  photo,
  bodyPhoto,
  report,
  provider,
}: {
  photo: string;
  bodyPhoto: string | null;
  report: Report;
  provider: string | null;
}) {
  const [gens, setGens] = useState<Record<string, Gen>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("hair");
  const [custom, setCustom] = useState("");
  const [customTarget, setCustomTarget] = useState<"face" | "body">("face");

  const outfitBase = bodyPhoto ?? photo;
  const tabBase = tab === "outfits" || (tab === "custom" && customTarget === "body" && bodyPhoto) ? outfitBase : photo;

  const generate = async (key: string, label: string, prompt: string, base: string) => {
    setGens((g) => ({ ...g, [key]: { status: "loading", label, base } }));
    setSelected(key);
    try {
      const { image } = await postJson<{ image: string }>("/api/visualize", { image: base, prompt });
      setGens((g) => ({ ...g, [key]: { status: "done", image, label, base } }));
    } catch (e) {
      setGens((g) => ({ ...g, [key]: { status: "error", error: (e as Error).message, label, base } }));
    }
  };

  const tabs: { key: Tab; label: string; items: readonly Option[] }[] = [
    { key: "outfits", label: "Outfits", items: report.wardrobe?.outfits ?? [] },
    { key: "hair", label: "Hairstyles", items: report.hairstyles.map((h) => ({ ...h, extra: h.barberScript })) },
    { key: "color", label: "Hair colour", items: report.hairColors },
    { key: "beard", label: "Facial hair", items: report.facialHair.options },
    { key: "glasses", label: "Glasses", items: report.eyewear.frames },
    { key: "custom", label: "Try anything", items: [] },
  ];
  const active = tabs.find((t) => t.key === tab)!;
  const sel = selected ? gens[selected] : null;
  const viewerBase = sel?.base ?? tabBase;
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
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-3">
            {sel?.status === "done" && sel.image ? (
              <BeforeAfter before={sel.base} after={sel.image} label={sel.label} />
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={viewerBase} alt="Your photo" className="block w-full rounded-xl" />
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
                <button
                  className="btn-ghost !py-1 !text-xs"
                  onClick={() => downloadDataUrl(sel.image!, `facelab-${sel.label.replace(/\W+/g, "-").toLowerCase()}.jpg`)}
                >
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
                    <img src={g.image} alt={g.label} className="aspect-square w-full object-cover object-top" />
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
              <button
                key={t.key}
                className="chip"
                data-active={tab === t.key}
                onClick={() => {
                  setTab(t.key);
                  setSelected(null);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "outfits" && !bodyPhoto && (
            <p className="mt-4 rounded-xl border border-line bg-surface-2 p-3 text-sm text-muted">
              Outfits are rendered on your face photo, so mostly the collar and shoulders will change. Add a waist-up or full-body
              photo on the upload step to see whole outfits.
            </p>
          )}

          {tab === "custom" ? (
            <div className="mt-5">
              <p className="text-sm text-muted">
                Describe any change, or pick a quick idea. Combine them freely, e.g. “textured crop + light stubble” or “navy suit with a
                burgundy tie”.
              </p>
              {bodyPhoto && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-muted">Apply to:</span>
                  <button className="chip !py-1 !text-xs" data-active={customTarget === "face"} onClick={() => setCustomTarget("face")}>
                    Face photo
                  </button>
                  <button className="chip !py-1 !text-xs" data-active={customTarget === "body"} onClick={() => setCustomTarget("body")}>
                    Body photo
                  </button>
                </div>
              )}
              <form
                className="mt-3 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (custom.trim().length < 3) return;
                  generate(`custom-${Date.now()}`, custom.trim().slice(0, 40), custom.trim(), tabBase);
                }}
              >
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="e.g. Grey flannel suit, white shirt, no tie"
                  className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
                />
                <button className="btn-primary" disabled={!provider || custom.trim().length < 3}>
                  Generate
                </button>
              </form>
              <p className="eyebrow mb-2 mt-5">Hair, beard & glasses</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_IDEAS.map((q) => (
                  <QuickChip key={q.label} label={q.label} loading={gens[`quick-${q.label}`]?.status === "loading"} disabled={!provider}
                    onClick={() => generate(`quick-${q.label}`, q.label, q.prompt, photo)} />
                ))}
              </div>
              <p className="eyebrow mb-2 mt-5">Clothing</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_OUTFITS.map((q) => (
                  <QuickChip key={q.label} label={q.label} loading={gens[`outfit-${q.label}`]?.status === "loading"} disabled={!provider}
                    onClick={() => generate(`outfit-${q.label}`, q.label, q.prompt + KEEP_BODY, outfitBase)} />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {tab === "beard" && <p className="text-sm text-muted">{report.facialHair.recommendation}</p>}
              {tab === "glasses" && <p className="text-sm text-muted">{report.eyewear.recommendation}</p>}
              {active.items.length === 0 && <p className="text-sm text-muted">No suggestions in this category for you. Try “Try anything”.</p>}
              {active.items.map((o, i) => {
                const key = `${tab}-${i}`;
                const g = gens[key];
                return (
                  <div key={key} className={`card p-4 ${selected === key ? "border-accent" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {o.occasion && <p className="eyebrow mb-1">{o.occasion.replace(/_/g, " ")}</p>}
                        <h4 className="font-semibold">{o.name}</h4>
                        <p className="mt-1 text-sm text-muted">{o.why}</p>
                      </div>
                      <button
                        className={g?.status === "done" ? "btn-ghost shrink-0 !px-4 !py-1.5 !text-xs" : "btn-primary shrink-0 !px-4 !py-1.5 !text-xs"}
                        disabled={!provider || g?.status === "loading"}
                        onClick={() => (g?.status === "done" ? setSelected(key) : generate(key, o.name, o.previewPrompt, tabBase))}
                      >
                        {g?.status === "loading" ? "Rendering…" : g?.status === "done" ? "View" : g?.status === "error" ? "Retry" : "Preview on me"}
                      </button>
                    </div>
                    {o.pieces && o.pieces.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {o.pieces.map((p) => (
                          <li key={p} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs">
                            {p}
                          </li>
                        ))}
                      </ul>
                    )}
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
              {tab === "outfits" && (
                <div className="pt-3">
                  <p className="eyebrow mb-2">More to try</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_OUTFITS.map((q) => (
                      <QuickChip key={q.label} label={q.label} loading={gens[`outfit-${q.label}`]?.status === "loading"} disabled={!provider}
                        onClick={() => generate(`outfit-${q.label}`, q.label, q.prompt + KEEP_BODY, outfitBase)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <p className="mt-6 text-xs text-muted">
            Previews are AI renderings, not promises. They show shape, colour and overall look. Real results depend on your hair,
            your barber and your tailor.
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickChip({ label, loading, disabled, onClick }: { label: string; loading?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button className="chip !text-xs" disabled={disabled || loading} onClick={onClick}>
      {loading ? "… " : ""}
      {label}
    </button>
  );
}

export function Spinner() {
  return <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}
