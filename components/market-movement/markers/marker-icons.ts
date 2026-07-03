import type { MarkerShape } from '@/lib/market-movement/types'

// Simple white-filled shape masks, tinted per-instance by deck.gl's
// IconLayer `getColor`. Each shape is rendered as two stacked IconLayers
// (a larger tinted-by-temperature outer shape + a smaller solid-white
// inner shape) to approximate "neutral interior, colored ring".
function svgDataUri(path: string): string {
  // width/height (not just viewBox) are required — deck.gl's IconLayer loads
  // icons via createImageBitmap(), which needs the SVG to report natural
  // dimensions.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">${path}</svg>`
  return `data:image/svg+xml;base64,${typeof window === 'undefined' ? Buffer.from(svg).toString('base64') : window.btoa(svg)}`
}

const CIRCLE_PATH = '<circle cx="32" cy="32" r="30" fill="#ffffff"/>'
const TRIANGLE_PATH = '<polygon points="32,3 61,58 3,58" fill="#ffffff"/>'
const HEXAGON_PATH = '<polygon points="32,2 59,17 59,47 32,62 5,47 5,17" fill="#ffffff"/>'

export const MARKER_ICON_URIS: Record<MarkerShape, string> = {
  circle: svgDataUri(CIRCLE_PATH),
  triangle: svgDataUri(TRIANGLE_PATH),
  hexagon: svgDataUri(HEXAGON_PATH),
}

export const MARKER_ICON_MAPPING = {
  width: 64,
  height: 64,
  anchorY: 32,
  anchorX: 32,
}
