import type { Report } from "./schema";

const KEEP = " Keep the same person, face, expression, skin, lighting and background unchanged.";

/** Sample report used by /analyze?demo=1 so the UI can be explored without API keys. */
export const DEMO_REPORT: Report = {
  summary:
    "Sample report. Balanced, slightly long oval face with a strong brow line and a moderately tapered jaw. The biggest gain is a cut that keeps height without adding length, plus light stubble to give the lower third more structure.",
  photoQuality: { usable: true, notes: "Demo image. Upload a straight-on, evenly lit photo taken at arm's length for a real read." },
  faceShape: { read: "Oval leaning long", notes: "Forehead and cheekbones are close in width and the jaw tapers gently. Height on top will lengthen it further." },
  features: [
    { area: "Hairline & forehead", observation: "Even hairline, forehead moderately tall.", implication: "A short textured fringe or forward-styled top shortens the upper third without hiding it.", confidence: "medium" },
    { area: "Brows", observation: "Straight, medium-density brows with a soft tail.", implication: "Tidy the area between the brows only. The straight shape already reads calm and masculine.", confidence: "high" },
    { area: "Eye area", observation: "Mild positive canthal tilt and some under-eye shadow.", implication: "Better sleep and a caffeine eye gel help a little. Overhead lighting makes the shadow worse, so it's mostly a photo issue.", confidence: "medium" },
    { area: "Cheekbones & midface", observation: "Cheekbones are the widest point of the face.", implication: "Keep the sides short and tight so the cheekbones stay the widest point.", confidence: "medium" },
    { area: "Jaw & chin", observation: "Moderate taper with a slightly short chin.", implication: "Stubble kept a little fuller at the chin adds length and definition to the lower third.", confidence: "medium" },
    { area: "Skin", observation: "Even tone, slight shine in the T-zone.", implication: "A gel moisturiser and daily SPF are enough. A matte finish photographs better.", confidence: "low" },
  ],
  priorities: [
    { title: "Switch to a textured crop with a low taper", category: "hair", why: "It adds texture on top without adding height, which balances the longer face.", how: "Keep 4–6 cm on top, point-cut for texture, with a low taper fade on the sides. Style with matte clay pushed forward.", effort: "low", impact: "high" },
    { title: "Grow 3–5 mm stubble, fuller at the chin", category: "facial_hair", why: "Adds visual mass to a tapered lower third.", how: "Trim weekly at 3 mm on the cheeks and 5 mm at the chin. Set the neckline one finger above the Adam's apple.", effort: "low", impact: "medium" },
    { title: "Frames as wide as your face, with a solid browline", category: "eyewear", why: "A strong top line repeats the brow and breaks up the face's length vertically.", how: "Pick 135–140 mm frames with a keyhole or mid-height bridge.", effort: "medium", impact: "medium" },
  ],
  hairstyles: [
    { name: "Textured crop, low taper", why: "Forward texture shortens the upper third. A low taper keeps width at the cheekbones.", previewPrompt: "Change the hairstyle to a short textured French crop with a low taper fade and a short choppy fringe, matte finish." + KEEP, maintenance: "2 min with clay. Cut every 3–4 weeks.", barberScript: "Low taper on the sides, number 2 at the bottom blending up. Leave about 5 cm on top, point-cut for texture, and push the fringe forward. Short and choppy, not blunt." },
    { name: "Short side part, natural finish", why: "Reads professional and adds a slight asymmetry that softens a long face.", previewPrompt: "Change the hairstyle to a short classic side part with tapered scissor-cut sides and a natural matte finish." + KEEP, maintenance: "3 min with a light cream. Cut every 4 weeks.", barberScript: "Scissor taper on the sides, not too tight. Around 6 cm on top, a soft natural part on the left, no hard line." },
    { name: "Grown-out curtains", why: "Side volume and a curtain fringe widen and shorten the face. Works if your hair has some wave.", previewPrompt: "Change the hairstyle to medium-length curtain hair with a soft middle part falling to the cheekbones, with natural texture." + KEEP, maintenance: "5 min with sea salt spray and a blow-dry. Trim every 6–8 weeks.", barberScript: "Growing it out into curtains. Keep length at the front to the cheekbones, layer the back and sides so it doesn't go triangular, and thin the bulk over the ears." },
  ],
  hairColors: [
    { name: "Natural, slightly richer", why: "A gloss makes hair look healthier without visible regrowth.", previewPrompt: "Make the hair colour a slightly richer, glossier version of the current natural shade, keeping the same haircut." + KEEP },
    { name: "Soft ash brown", why: "Cooler tone that suits medium contrast.", previewPrompt: "Change the hair colour to a soft cool ash brown, keeping the same haircut." + KEEP },
  ],
  facialHair: {
    recommendation: "Light to medium stubble with a defined neckline is the best fit. A full beard is fine if your cheek coverage is even.",
    options: [
      { name: "5 mm stubble, fuller chin", why: "Adds definition at the chin and jaw.", previewPrompt: "Add even 4 mm stubble on the cheeks and 6 mm on the chin with a clean neckline." + KEEP },
      { name: "Short boxed beard", why: "More structure for formal settings.", previewPrompt: "Add a short boxed beard about 1 cm long with a sharp cheek line and neckline." + KEEP },
    ],
  },
  eyewear: {
    recommendation: "Frames as wide as your face (about 135–140 mm), lenses deeper than narrow rectangles, and a defined browline.",
    frames: [
      { name: "Browline frames", why: "A bold top line with a light bottom.", previewPrompt: "Add browline glasses with a black acetate top and thin metal lower rims, sized to the face." + KEEP },
      { name: "Tortoiseshell rounded square", why: "Softer, warm and versatile.", previewPrompt: "Add medium tortoiseshell rounded-square acetate glasses sized to the face." + KEEP },
    ],
  },
  skincare: {
    morning: ["Rinse or gentle cleanser", "Gel moisturiser", "SPF 30+ every day"],
    evening: ["Gentle cleanser", "Moisturiser", "Optional: retinoid 2–3 nights a week once tolerated"],
    weekly: ["Exfoliate once, gently (BHA if oily)", "Trim the brows and stubble line"],
    notes: "Keep it simple and consistent. See a dermatologist for any persistent breakouts or irritation.",
  },
  style: {
    palette: [
      { name: "Navy", hex: "#1F2A44" },
      { name: "Olive", hex: "#5A5F3C" },
      { name: "Oatmeal", hex: "#D8CDB8" },
      { name: "Charcoal", hex: "#36393D" },
      { name: "Rust", hex: "#9A4A2A" },
      { name: "Soft white", hex: "#F2EFE8" },
    ],
    paletteReason: "Medium contrast between hair, skin and eyes suits mid-depth colours. Very stark black and white can overpower it.",
    avoidColors: ["Neon brights near the face", "Very pale yellows that wash out the skin"],
    tips: ["Crew necks and open collars work. Avoid very deep V-necks, which lengthen the face.", "Fitted shoulders and a structured collar frame the jaw."],
  },
  wardrobe: {
    summary:
      "Sample. For a finance role, build on navy and charcoal tailoring with white and light-blue shirts. Medium contrast and a longer face suit spread collars and mid-width lapels. Add a waist-up photo for fit-specific advice.",
    fitNotes: [
      "Spread or semi-spread collars widen the neckline and balance a longer face. Skip narrow point collars.",
      "Mid-width lapels (about 8–9 cm) with a matching tie width.",
      "Jacket long enough to cover the seat, sleeves showing ¼–½ inch of cuff.",
      "Trousers with a mid rise and slight or no break for a clean line.",
    ],
    keyPieces: [
      { item: "Navy suit", spec: "Worsted wool, 2-button, notch lapel, half-canvas if budget allows; tailored at sleeves and waist", why: "Covers pitches, interviews and client meetings." },
      { item: "Charcoal suit", spec: "Same cut as the navy; mid-weight wool for year-round wear", why: "Second formal option that rotates with the navy." },
      { item: "Shirts", spec: "3 white and 3 light-blue, poplin and twill, semi-spread collar, slim fit", why: "These two colours cover 80% of finance dress codes." },
      { item: "Grey wool trousers", spec: "Mid-grey, flat front, mid rise, no break", why: "Base for business casual with blazers and knitwear." },
      { item: "Navy unstructured blazer", spec: "Hopsack or wool-cotton, soft shoulder, patch pockets", why: "Lifts business casual without looking like half a suit." },
      { item: "Fine merino knits", spec: "Navy and charcoal crewnecks, fitted at the hem", why: "A sharper alternative to the fleece vest." },
      { item: "Shoes", spec: "Black cap-toe oxfords, dark-brown suede loafers, matching belts", why: "Formal and business-casual footwear covered." },
    ],
    outfits: [
      { occasion: "business_formal", name: "Client pitch", pieces: ["Navy worsted suit", "White poplin shirt", "Navy grenadine tie", "Black cap-toe oxfords"], why: "The highest-trust combination. Navy flatters medium contrast.", previewPrompt: "Dress the person in a tailored navy two-button suit, white semi-spread collar shirt and solid navy grenadine tie." + " Keep the same person, face, hair, body shape, pose, lighting and background unchanged." },
      { occasion: "business_formal", name: "Board meeting", pieces: ["Charcoal suit", "Light-blue shirt", "Burgundy tie", "Black oxfords"], why: "Serious without being severe. Burgundy adds warmth near the face.", previewPrompt: "Dress the person in a tailored charcoal suit, light-blue dress shirt and burgundy silk tie." + " Keep the same person, face, hair, body shape, pose, lighting and background unchanged." },
      { occasion: "business_casual", name: "Everyday desk", pieces: ["Navy merino crewneck", "Light-blue oxford", "Grey wool trousers", "Brown derbies"], why: "Polished with no tie. The collar under the knit frames the jaw.", previewPrompt: "Dress the person in a fine navy merino crewneck sweater over a light-blue oxford shirt with the collar showing, and mid-grey wool trousers." + " Keep the same person, face, hair, body shape, pose, lighting and background unchanged." },
      { occasion: "business_casual", name: "Elevated casual", pieces: ["Navy unstructured blazer", "White OCBD", "Grey trousers", "Brown suede loafers"], why: "Reads senior on a business-casual floor.", previewPrompt: "Dress the person in an unstructured navy blazer over a white oxford button-down shirt open at the collar, with mid-grey trousers." + " Keep the same person, face, hair, body shape, pose, lighting and background unchanged." },
      { occasion: "smart_casual", name: "Casual Friday", pieces: ["Navy knit polo", "Stone chinos", "Suede loafers"], why: "Relaxed but still deliberate.", previewPrompt: "Dress the person in a fitted navy knitted polo shirt and stone-coloured chinos." + " Keep the same person, face, hair, body shape, pose, lighting and background unchanged." },
    ],
    avoid: ["Black suits for business", "Fleece vests as a default layer", "Skinny ties and very slim lapels"],
  },
  photography: [
    "Shoot from 1.5–2 m away and zoom in. Phone-at-arm's-length selfies widen the nose.",
    "Keep the camera at eye level or slightly above, with the chin slightly forward and down.",
    "Face a window. Avoid overhead light, which deepens under-eye shadows.",
  ],
  avoid: [
    { move: "Tall quiffs or pompadours", why: "Extra height makes a long face longer." },
    { move: "Very tight high skin fades", why: "Narrows the sides and makes the face look longer and thinner." },
  ],
  professionalReferrals: [],
  caveats: [
    "This is a demo report, not an analysis of a real photo.",
    "Ratios from a single photo are approximate. Camera distance and head angle change them.",
  ],
};
