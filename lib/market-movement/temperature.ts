// Temperature score (0-100) -> color, driven by a continuous OKLCH gradient
// rather than hardcoded hex breakpoints. Not part of the design-token system —
// this is data-driven marker/gauge coloring, layered on top of it.

interface OklchAnchor {
  score: number
  l: number
  c: number
  h: number // degrees
}

const ANCHORS: OklchAnchor[] = [
  { score: 0, l: 0.55, c: 0.19, h: 25 }, // red — not engaged
  { score: 25, l: 0.68, c: 0.17, h: 55 }, // orange
  { score: 50, l: 0.8, c: 0.15, h: 90 }, // amber/yellow
  { score: 75, l: 0.75, c: 0.16, h: 142 }, // light green
  { score: 100, l: 0.6, c: 0.17, h: 152 }, // strong green
]

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function interpolateOklch(score: number): { l: number; c: number; h: number } {
  const s = clampScore(score)
  let lower = ANCHORS[0]!
  let upper = ANCHORS[ANCHORS.length - 1]!
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i]!
    const b = ANCHORS[i + 1]!
    if (s >= a.score && s <= b.score) {
      lower = a
      upper = b
      break
    }
  }
  const span = upper.score - lower.score || 1
  const t = (s - lower.score) / span
  return {
    l: lerp(lower.l, upper.l, t),
    c: lerp(lower.c, upper.c, t),
    h: lerp(lower.h, upper.h, t),
  }
}

function srgbGammaEncode(c: number): number {
  const clamped = Math.min(1, Math.max(0, c))
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
}

/** Björn Ottosson's OKLCH -> linear sRGB -> sRGB conversion. */
function oklchToRgb(l: number, c: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const okB = c * Math.sin(h)

  const l_ = l + 0.3963377774 * a + 0.2158037573 * okB
  const m_ = l - 0.1055613458 * a - 0.0638541728 * okB
  const s_ = l - 0.0894841775 * a - 1.291485548 * okB

  const lCubed = l_ ** 3
  const mCubed = m_ ** 3
  const sCubed = s_ ** 3

  const rLin = 4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed
  const gLin = -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed
  const bLin = -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed

  return [
    Math.round(srgbGammaEncode(rLin) * 255),
    Math.round(srgbGammaEncode(gLin) * 255),
    Math.round(srgbGammaEncode(bLin) * 255),
  ]
}

/** CSS oklch() string for a temperature score — for DOM/tooltip/gauge use. */
export function getTemperatureColor(score: number): string {
  const { l, c, h } = interpolateOklch(score)
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`
}

/** [r,g,b,a] 0-255 tuple for deck.gl layer getFillColor/getLineColor. */
export function getTemperatureRgba(score: number, alpha = 255): [number, number, number, number] {
  const { l, c, h } = interpolateOklch(score)
  const [r, g, bch] = oklchToRgb(l, c, h)
  return [r, g, bch, alpha]
}

export type TemperatureBand = 'Cold' | 'Cool' | 'Warm' | 'Strong' | 'Hot'

export function getTemperatureBand(score: number): TemperatureBand {
  const s = clampScore(score)
  if (s <= 20) return 'Cold'
  if (s <= 40) return 'Cool'
  if (s <= 60) return 'Warm'
  if (s <= 80) return 'Strong'
  return 'Hot'
}

export function getTemperatureLabel(score: number): string {
  return `${Math.round(clampScore(score))} — ${getTemperatureBand(score)}`
}
