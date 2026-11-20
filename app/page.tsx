import Link from "next/link";

const STEPS = [
  {
    n: "01",
    title: "Upload a photo",
    body: "A straight-on, evenly lit photo at arm's length or further. Add a side or 3/4 view for more detail.",
  },
  {
    n: "02",
    title: "Tell us the goal",
    body: "Sharper, softer, more put-together, better on camera, lower maintenance. Advice depends on what you want.",
  },
  {
    n: "03",
    title: "Get your report and previews",
    body: "478-point facial mapping, a feature-by-feature read, and a ranked plan. AI previews show you with different hair, colour, beard and glasses.",
  },
];

const SECTIONS = [
  ["Facial mapping", "Thirds, fWHR, canthal tilt, eye spacing, jaw taper, symmetry, with notes on what each one means for styling."],
  ["Feature analysis", "Hairline, brows, eye area, midface, lips, jaw and skin. What we see, and what it means for your choices."],
  ["Priority plan", "The 3–5 changes that matter most for your goal, ranked by impact and effort. Reversible moves first."],
  ["Hairstyles + barber script", "Cuts suited to your density, texture and hairline, with the exact words to say in the chair."],
  ["Hair colour, beard, glasses", "Options matched to your colouring and proportions. Preview each one on your own face."],
  ["Wardrobe for your work", "Outfits for your dress codes (finance, consulting, law and more), key pieces to buy, and fit rules for your build. Preview each outfit on yourself."],
  ["Skin, colour and photos", "A simple AM/PM routine, a clothing palette for your contrast level, and how to photograph well."],
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-24">
        <div>
          <p className="eyebrow">Facial aesthetics · Personal style</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
            See your face the way a great stylist does.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Upload a photo and get a detailed read of your facial proportions and features. You also get a ranked plan for
            hair, grooming, skin, glasses and clothing, and previews of how you&apos;d look with each change.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/analyze" className="btn-primary !px-7 !py-3 text-base">
              Analyse my face
            </Link>
            <a href="#report" className="btn-ghost !px-7 !py-3 text-base">
              What&apos;s in the report
            </a>
          </div>
          <p className="mt-6 text-xs text-muted">No account. No ratings. Photos aren&apos;t stored.</p>
        </div>
        <HeroGraphic />
      </section>

      <section id="how" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="eyebrow">How it works</p>
          <div className="mt-8 grid gap-10 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <p className="font-serif text-4xl text-muted">{s.n}</p>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="report" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="eyebrow">The report</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Specific to your face, not a generic checklist.</h2>
          <p className="mt-4 text-muted">
            Analysis is built on a structured facial-aesthetics knowledge base: proportions, hairstyles, glasses, grooming,
            skincare and style. You get practical moves you can take to a barber, an optician or a mirror.
          </p>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(([t, b]) => (
            <div key={t} className="bg-surface p-6">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="card grid gap-8 p-8 md:grid-cols-3 md:p-12">
          <div className="md:col-span-2">
            <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">What this is and isn&apos;t.</h2>
            <p className="mt-4 text-muted">
              FaceLab gives styling and presentation guidance. It doesn&apos;t score attractiveness, diagnose conditions or
              push procedures. Measurements from one 2D photo are approximate, since lens distance and head angle change them.
              Use them as clues, not verdicts.
            </p>
          </div>
          <div className="flex items-end md:justify-end">
            <Link href="/analyze" className="btn-primary !px-7 !py-3 text-base">
              Start now
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroGraphic() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
      <div className="card absolute inset-0 overflow-hidden">
        <svg viewBox="0 0 400 500" className="h-full w-full text-ink" aria-hidden>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="currentColor" strokeOpacity=".06" />
            </pattern>
          </defs>
          <rect width="400" height="500" fill="url(#grid)" />
          {/* face outline */}
          <path
            d="M200 70c-70 0-112 52-112 130 0 46 6 84 22 118 18 38 52 74 90 84 38-10 72-46 90-84 16-34 22-72 22-118 0-78-42-130-112-130z"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".55"
            strokeWidth="1.5"
          />
          {/* thirds */}
          {[150, 262, 402].map((y, i) => (
            <g key={y}>
              <line x1="60" x2="340" y1={y} y2={y} stroke="var(--overlay)" strokeDasharray="4 5" strokeWidth="1.2" />
              <text x="346" y={y + 4} fontSize="11" fill="currentColor" fillOpacity=".55">
                {["brow", "nose", "chin"][i]}
              </text>
            </g>
          ))}
          {/* eyes */}
          <path d="M138 196c12-10 34-10 46 0-12 8-34 8-46 0z" fill="none" stroke="currentColor" strokeOpacity=".7" />
          <path d="M216 196c12-10 34-10 46 0-12 8-34 8-46 0z" fill="none" stroke="currentColor" strokeOpacity=".7" />
          <line x1="134" y1="200" x2="188" y2="191" stroke="var(--overlay)" strokeWidth="1.2" />
          <line x1="212" y1="191" x2="266" y2="200" stroke="var(--overlay)" strokeWidth="1.2" />
          {/* brows */}
          <path d="M132 176c18-10 40-10 56-2" fill="none" stroke="currentColor" strokeOpacity=".6" strokeWidth="2" />
          <path d="M212 174c16-8 38-8 56 2" fill="none" stroke="currentColor" strokeOpacity=".6" strokeWidth="2" />
          {/* nose & lips */}
          <path d="M200 205v45m-16 10c8 6 24 6 32 0" fill="none" stroke="currentColor" strokeOpacity=".5" />
          <path d="M170 312c18-8 42-8 60 0-18 12-42 12-60 0z" fill="none" stroke="currentColor" strokeOpacity=".6" />
          {/* midline & widths */}
          <line x1="200" x2="200" y1="60" y2="420" stroke="currentColor" strokeOpacity=".2" />
          <line x1="88" x2="312" y1="230" y2="230" stroke="var(--overlay)" strokeWidth="1.2" />
          <line x1="122" x2="278" y1="350" y2="350" stroke="var(--overlay)" strokeWidth="1.2" />
          {[
            [88, 230], [312, 230], [122, 350], [278, 350], [134, 200], [188, 191], [212, 191], [266, 200], [200, 402], [200, 262], [200, 150],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" fill="var(--overlay)" />
          ))}
        </svg>
      </div>
      <div className="card absolute -bottom-5 -left-4 w-48 p-3 text-xs shadow-sm sm:-left-10">
        <p className="eyebrow !text-[9px]">fWHR</p>
        <p className="mt-1 font-serif text-2xl">1.92</p>
        <p className="text-muted">within common range</p>
      </div>
      <div className="card absolute -right-3 top-8 w-52 p-3 text-xs shadow-sm sm:-right-8">
        <p className="eyebrow !text-[9px]">Priority 01 · Hair</p>
        <p className="mt-1 font-medium">Keep height on top, tighten the sides</p>
      </div>
    </div>
  );
}
