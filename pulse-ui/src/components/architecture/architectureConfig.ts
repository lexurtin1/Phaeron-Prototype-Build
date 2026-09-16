/**
 * Tunables for the System Architecture sticky reveal.
 *
 * SCROLL_VH — total scroll length behind the pinned scene (higher = slower scrub)
 * DEPTH_* — transform intensity applied to the stack as progress advances
 * IDLE_* — soft floating motion when the scene is near rest
 * COPY_RANGES — normalized progress windows [start, peak, end] for each one-liner
 */

export const ASSET_BASE = '/tools/product-demo/assets/architecture';

export const IMAGE_WIDTH = 1619;
export const IMAGE_HEIGHT = 971;

/** Progressive assembly frames (bottom → top build). */
export const STAGES = [
  { id: 'stage-1', src: `${ASSET_BASE}/stage-1.png`, label: 'Data foundation' },
  { id: 'stage-2', src: `${ASSET_BASE}/stage-2.png`, label: 'Security layer' },
  { id: 'stage-3', src: `${ASSET_BASE}/stage-3.png`, label: 'Ontology engine' },
  { id: 'stage-4', src: `${ASSET_BASE}/stage-4.png`, label: 'Pulse plate' },
  { id: 'stage-5', src: `${ASSET_BASE}/stage-5.png`, label: 'Pulse globe' },
  { id: 'stage-6', src: `${ASSET_BASE}/stage-6.png`, label: 'Full assembly' },
] as const;

/** Exact HomePage SoftAurora props — do not diverge unless intentional. */
export const SOFT_AURORA_PROPS = {
  lightMode: true as const,
  color1: '#07111F',
  color2: '#1B3A6B',
  brightness: 0.95,
  speed: 0.55,
  scale: 1.05,
  enableMouseInteraction: false,
};

/** Scroll pin length in viewport heights. */
export const SCROLL_VH = 340;

/** Depth motion intensity (0 = flat, 1 = planned default). */
export const DEPTH_INTENSITY = 1;

/** Max translateY (px) applied to the stack across the reveal. */
export const DEPTH_Y = 28;

/** Scale delta from rest (1) across the reveal. */
export const DEPTH_SCALE = 0.035;

/** Max blur (px) mid-transition between stages. */
export const BLUR_MAX = 1.25;

/** Idle float amplitude (px) and period (s). */
export const IDLE_AMPLITUDE = 4.5;
export const IDLE_DURATION = 5.5;
export const IDLE_ROTATE = 0.35;

/**
 * Copy windows as fractions of scroll progress 0–1.
 * Format: [fadeInStart, fullVisibleStart, fullVisibleEnd, fadeOutEnd]
 * Aligned to rebuild phase after the assembled intro hold (~0.10).
 */
export const LAYER_COPY = [
  {
    id: 'data',
    title: 'Data, Logic & Action Services',
    body: 'Connects the messy reality of enterprise systems into one usable foundation.',
    range: [0.1, 0.14, 0.26, 0.34] as const,
    side: 'right' as const,
  },
  {
    id: 'security',
    title: 'Security & Governance',
    body: 'Makes the intelligence trustworthy, controlled, and enterprise-safe.',
    range: [0.28, 0.34, 0.46, 0.54] as const,
    side: 'left' as const,
  },
  {
    id: 'ontology',
    title: 'Ontology Engine',
    body: 'Turns disconnected facts into context, meaning, and explainable relevance.',
    range: [0.46, 0.52, 0.64, 0.72] as const,
    side: 'right' as const,
  },
  {
    id: 'pulse',
    title: 'Pulse System',
    body: 'Surfaces what matters now, ranked and ready for action.',
    range: [0.7, 0.78, 0.94, 1.01] as const,
    side: 'left' as const,
  },
] as const;

export const INTRO = {
  headline: 'The architecture behind the intelligence.',
  subline:
    'Phaeron turns fragmented systems into governed, explainable, decision-ready intelligence.',
};

/** Progress band where intro fades out (start assembled calm → dive into stack). */
export const INTRO_FADE = [0, 0.04, 0.12] as const;

/** End-state “alive” bloom kicks in above this progress. */
export const ALIVE_THRESHOLD = 0.88;

/** Chrome (72) + Studio topbar (52) — keep pin below sticky headers. */
export const PIN_OFFSET_PX = 124;
