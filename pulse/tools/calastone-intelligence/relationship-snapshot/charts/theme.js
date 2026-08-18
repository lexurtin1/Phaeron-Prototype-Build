/**
 * Calastone ECharts theme.
 *
 * Registered once, applied to every chart in the feature. Nothing is left with
 * ECharts' stock styling — default blues, heavy grid lines, boxy tooltips and
 * the default font stack are all replaced.
 *
 * Colour discipline (matches the Intelligence Module's token block):
 *   brand ramp — data series, in ramp order. The Calastone mark is a black
 *                wordmark over a blue → teal → green sweep, and these are that
 *                sweep: blue #1D7FB8, teal #2D9A8E, green #35B57E, lime #6BBF59.
 *   grey       — muted dashed comparison series
 *   amber      — explicit attention state only
 *   red        — explicit high severity / breach / error only
 *
 * Status colours are deliberately NOT on the ramp. A brand colour must never be
 * readable as a state, or a green bar starts meaning "good" instead of "this
 * many".
 */

export const PALETTE = {
  /* the brand ramp, blue → green */
  brandBlue: '#1D7FB8',
  brandTeal: '#2D9A8E',
  brandGreen: '#35B57E',
  brandLime: '#6BBF59',
  brandDeep: '#1C4D6A',

  teal: '#2D9A8E',
  tealBright: '#2ECBB1',
  tealSoft: 'rgba(45,154,142,0.14)',
  green: '#35B57E',
  blue: '#3D8DBC',
  grey: '#9AA6B0',
  greyLine: 'rgba(34,50,61,0.10)',
  amber: '#F59E0B',
  red: '#EF4444',
  navy: '#22323D',
  muted: '#566571',
  faint: '#9AA6B0',
  surface: '#FFFFFF',
};

/** Severity is a factual state, so its colours are fixed, not decorative. */
export const SEVERITY_COLORS = {
  critical: PALETTE.red,
  high: '#F97316',
  medium: PALETTE.amber,
  low: PALETTE.blue,
};

export const PROJECT_STATUS_COLORS = {
  in_progress: PALETTE.teal,
  complete: PALETTE.green,
  blocked: PALETTE.red,
  not_started: PALETTE.grey,
};

const FONT = "'Inter','Arial',-apple-system,BlinkMacSystemFont,sans-serif";

export const THEME_NAME = 'calastone';

/**
 * An ECharts linear-gradient along the brand ramp.
 *
 * @param {{vertical?: boolean, from?: string, to?: string, alpha?: number}} [opts]
 */
export function rampGradient(opts = {}) {
  const from = opts.from || PALETTE.brandBlue;
  const to = opts.to || PALETTE.brandLime;
  const vertical = Boolean(opts.vertical);
  return {
    type: 'linear',
    x: 0, y: 0,
    x2: vertical ? 0 : 1,
    y2: vertical ? 1 : 0,
    colorStops: [
      { offset: 0, color: from },
      { offset: 0.52, color: PALETTE.brandTeal },
      { offset: 1, color: to },
    ],
  };
}

const THEME = {
  color: [
    PALETTE.brandTeal, PALETTE.brandBlue, PALETTE.brandGreen,
    PALETTE.brandLime, PALETTE.brandDeep,
  ],
  backgroundColor: 'transparent',
  textStyle: { fontFamily: FONT, color: PALETTE.muted, fontSize: 12 },

  title: {
    textStyle: { fontFamily: FONT, color: PALETTE.navy, fontWeight: 600, fontSize: 13 },
    subtextStyle: { fontFamily: FONT, color: PALETTE.faint, fontSize: 11 },
  },

  legend: {
    textStyle: { fontFamily: FONT, color: PALETTE.muted, fontSize: 11.5 },
    icon: 'roundRect',
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 16,
  },

  tooltip: {
    backgroundColor: PALETTE.surface,
    borderColor: 'rgba(34,50,61,0.12)',
    borderWidth: 1,
    padding: [9, 12],
    extraCssText: 'box-shadow:0 4px 14px rgba(34,50,61,0.09);border-radius:7px;',
    textStyle: { fontFamily: FONT, color: PALETTE.navy, fontSize: 12 },
    axisPointer: {
      lineStyle: { color: 'rgba(45,154,142,0.35)', width: 1 },
      crossStyle: { color: 'rgba(45,154,142,0.35)' },
    },
  },

  grid: { left: 8, right: 12, top: 28, bottom: 4, containLabel: true },

  categoryAxis: {
    axisLine: { show: true, lineStyle: { color: 'rgba(34,50,61,0.14)' } },
    axisTick: { show: false },
    axisLabel: { color: PALETTE.faint, fontSize: 11, fontFamily: FONT },
    splitLine: { show: false },
  },

  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: PALETTE.faint, fontSize: 11, fontFamily: FONT },
    splitLine: { show: true, lineStyle: { color: PALETTE.greyLine, type: 'solid' } },
  },

  line: {
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { width: 2.2 },
    itemStyle: { borderWidth: 2 },
  },

  bar: {
    itemStyle: { barBorderRadius: [3, 3, 0, 0] },
  },

  pie: {
    itemStyle: { borderColor: PALETTE.surface, borderWidth: 2 },
  },
};

let registered = false;

/**
 * Register the theme with an ECharts instance. Idempotent.
 * @param {any} echarts the global ECharts UMD object
 */
export function registerCalastoneTheme(echarts) {
  if (registered || !echarts?.registerTheme) return;
  echarts.registerTheme(THEME_NAME, THEME);
  registered = true;
}

/** Shared axis-label formatter for compact monetary/large values. */
export function axisCompact(value) {
  const abs = Math.abs(value);
  if (abs >= 1e9) return (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'bn';
  if (abs >= 1e6) return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
  if (abs >= 1e3) return (value / 1e3).toFixed(0) + 'k';
  return String(value);
}

export { THEME };
