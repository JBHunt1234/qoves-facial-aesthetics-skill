"use client";

import { useState } from "react";
import { postJson } from "@/lib/api";
import { downloadDataUrl } from "@/lib/image";
import type { Report } from "@/lib/schema";
import { BeforeAfter } from "./BeforeAfter";

type Option = { name: string; why: string; previewPrompt: string; extra?: string; pieces?: string[]; occasion?: string; tag?: string };

/** The user's saved inspiration cuts. Always shown in the Hairstyles tab. */
const MY_PICKS: Option[] = [
  {
    tag: "Your picks",
    name: "Swept-back flow, tucked behind the ears",
    why: "Medium length combed back off the forehead with a soft, natural (not wet) finish. The sides are long enough to tuck behind the ears and the back reaches the collar.",
    previewPrompt:
      "Change the hairstyle to medium-length dark hair swept back off the forehead with natural volume and a soft matte finish, sides long enough to tuck behind the ears, back length reaching the shirt collar, slightly piecey and lived-in.",
    extra: "Growing it out, about 10–13 cm on top and 7–9 cm on the sides, no fade or clippers. Keep length over the ears so it tucks back, and leave the back at collar length, just tidied. Texturise it so it sits back without looking heavy.",
  },
  {
    tag: "Your picks",
    name: "Classic slick back with volume (Bateman)",
    why: "Polished and sharp. Hair is combed up and back with height at the front, a subtle side part and a medium-shine finish. Reads very finance.",
    previewPrompt:
      "Change the hairstyle to a classic 1980s executive slicked-back style: dark hair combed up and back with noticeable height at the front, a subtle side part, neat tapered sides combed back over the ears, medium-shine pomade finish, every strand controlled.",
    extra: "Scissor cut all over, no clippers. About 10–12 cm on top, graduated shorter to 5–6 cm on the sides so they comb back cleanly over the ears. Tapered neckline. I'll style it back with pomade and a blow-dry for height.",
  },
  {
    tag: "Your picks",
    name: "Textured wavy side-sweep",
    why: "Loose natural waves with volume, swept to one side and falling around the ears. Softer and more approachable, and it looks good with a suit or open collar.",
    previewPrompt:
      "Change the hairstyle to medium-length dark hair with loose natural waves and volume, swept to one side off the forehead, falling around the tops of the ears and touching the collar, soft and slightly tousled with a natural matte finish.",
    extra: "Keep it long all over, about 12 cm on top and 8 cm on the sides. Layer it so the waves have movement and it doesn't go triangular. Remove a bit of bulk around the ears, no fade. I'll style it with sea salt spray and a light cream.",
  },
  {
    tag: "Your picks",
    name: "Long wet-look slick back",
    why: "Longer hair combed straight back with a glossy, wet-look hold. Ends fall behind the ears to the nape. Bold, and best with stubble.",
    previewPrompt:
      "Change the hairstyle to long dark hair combed straight back off the forehead with a glossy wet-look gel finish and visible comb lines, length falling behind the ears to the nape of the neck, a few strands slightly loose.",
    extra: "Growing it long, 13–15 cm on top with the sides past the ears, all scissor work. Keep the weight so it lies flat when combed back, and tidy the ends at the nape. I'll wear it with a strong-hold gel combed straight back.",
  },
  {
    tag: "Your picks",
    name: "Undone curtains, strands over the eyes",
    why: "Long, loose middle-part curtains with heavy front pieces falling across the forehead and eyes. The relaxed, after-hours version of the slick back.",
    previewPrompt:
      "Change the hairstyle to long dark curtain hair with a loose centre part, heavy front pieces falling across the forehead and partly over the eyes, messy and undone, sides past the ears, natural matte texture.",
    extra: "Long curtains, with the front pieces long enough to reach the cheekbones or eyes and the sides past the ears. Point-cut the ends so they separate into strands, and keep it heavy at the front. No fade.",
  },
];
type Gen = { status: "loading" | "done" | "error"; image?: string; error?: string; label: string; base: string };
export type StudioTab = "hair" | "skin" | "color" | "beard" | "glasses" | "outfits" | "custom";
type Tab = StudioTab;

const NATURAL_SKIN =
  " Keep natural skin texture, pores and the person's real skin tone so it looks like an unfiltered photo, not airbrushed. Do not change face shape, features, hair, expression, lighting or background.";

const SKIN_OPTIONS: { name: string; why: string; previewPrompt: string }[] = [
  {
    name: "Clear acne",
    why: "Removes active breakouts and blemishes so you can see your skin without them.",
    previewPrompt: "Retouch the skin to remove all active acne, pimples, whiteheads and blemishes." + NATURAL_SKIN,
  },
  {
    name: "Clear acne + fade marks",
    why: "Also fades post-acne marks and dark spots, which usually take longer to clear than the breakouts.",
    previewPrompt:
      "Retouch the skin to remove all acne and blemishes and fade post-acne red and dark marks and spots." + NATURAL_SKIN,
  },
  {
    name: "Smooth acne scarring",
    why: "Softens textured scarring. In real life this usually needs professional treatment.",
    previewPrompt: "Retouch the skin to smooth acne scarring and uneven texture while keeping realistic pores." + NATURAL_SKIN,
  },
  {
    name: "Calm redness",
    why: "Evens out redness around the nose, cheeks and chin.",
    previewPrompt: "Reduce facial redness and blotchiness to an even, natural complexion." + NATURAL_SKIN,
  },
  {
    name: "Even tone & rested eyes",
    why: "Evens skin tone and softens under-eye darkness, like after good sleep and a steady routine.",
    previewPrompt: "Even out the skin tone and lightly reduce under-eye darkness and puffiness so the person looks well rested." + NATURAL_SKIN,
  },
  {
    name: "Healthy glow",
    why: "Hydrated, healthy-looking skin with natural light reflection. Not makeup.",
    previewPrompt: "Make the skin look healthy, hydrated and clear with a subtle natural glow, without makeup." + NATURAL_SKIN,
  },
];

const HAIR_LIBRARY: { label: string; prompt: string }[] = [
  { label: "Buzz cut", prompt: "Change the hairstyle to an even #2 buzz cut all over." },
  { label: "Crew cut", prompt: "Change the hairstyle to a classic crew cut, short tapered sides and slightly longer top brushed forward." },
  { label: "Textured crop", prompt: "Change the hairstyle to a short textured French crop with a mid fade and a short choppy fringe." },
  { label: "Ivy League", prompt: "Change the hairstyle to an Ivy League cut, short tapered sides and a longer top with a soft side part." },
  { label: "Side part", prompt: "Change the hairstyle to a classic tapered side part with a defined part and natural matte finish." },
  { label: "Quiff", prompt: "Change the hairstyle to a modern textured quiff with short tapered sides." },
  { label: "Slick back", prompt: "Change the hairstyle to a medium-length slicked-back style with natural shine and tapered sides." },
  { label: "Messy fringe", prompt: "Change the hairstyle to a messy textured fringe with medium length on top and a low taper." },
  { label: "Curtains", prompt: "Change the hairstyle to medium-length curtain hair with a soft middle part falling to the cheekbones." },
  { label: "Flow / bro flow", prompt: "Change the hairstyle to medium-long swept-back flow hair reaching just past the ears." },
  { label: "Shoulder length", prompt: "Change the hairstyle to shoulder-length layered hair with natural movement." },
  { label: "Curly top fade", prompt: "Change the hairstyle to defined curls on top with a mid taper fade on the sides." },
];

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
  tab: controlledTab,
  onTabChange,
}: {
  photo: string;
  bodyPhoto: string | null;
  report: Report;
  provider: string | null;
  tab?: StudioTab;
  onTabChange?: (t: StudioTab) => void;
}) {
  const [gens, setGens] = useState<Record<string, Gen>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [localTab, setLocalTab] = useState<Tab>("hair");
  const tab = controlledTab ?? localTab;
  const setTab = (t: Tab) => {
    setLocalTab(t);
    onTabChange?.(t);
  };
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
    { key: "hair", label: "Hairstyles", items: [...MY_PICKS, ...report.hairstyles.map((h) => ({ ...h, extra: h.barberScript, tag: "Recommended for you" }))] },
    { key: "outfits", label: "Outfits", items: report.wardrobe?.outfits ?? [] },
    { key: "skin", label: "Clear skin", items: SKIN_OPTIONS },
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
              {tab === "skin" && (
                <p className="text-sm text-muted">
                  {report.skincare.clearSkinNote ? `${report.skincare.clearSkinNote} ` : ""}
                  These previews show what clearer skin could look like on you. They aren&apos;t a treatment plan. For acne that persists,
                  a dermatologist can tell you what will actually work for your skin.
                </p>
              )}
              {active.items.length === 0 && <p className="text-sm text-muted">No suggestions in this category for you. Try “Try anything”.</p>}
              {active.items.map((o, i) => {
                const key = `${tab}-${i}`;
                const g = gens[key];
                return (
                  <div key={key} className={`card p-4 ${selected === key ? "border-accent" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {o.occasion && <p className="eyebrow mb-1">{o.occasion.replace(/_/g, " ")}</p>}
                        {o.tag && <p className={`eyebrow mb-1 ${o.tag === "Your picks" ? "!text-[#b8891a]" : ""}`}>{o.tag}</p>}
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
              {tab === "hair" && (
                <div className="pt-3">
                  <p className="eyebrow mb-2">Style library: try any cut</p>
                  <div className="flex flex-wrap gap-2">
                    {HAIR_LIBRARY.map((q) => (
                      <QuickChip key={q.label} label={q.label} loading={gens[`lib-${q.label}`]?.status === "loading"} disabled={!provider}
                        onClick={() => generate(`lib-${q.label}`, q.label, q.prompt, photo)} />
                    ))}
                  </div>
                </div>
              )}
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
