/**
 * ECharts mounting helper.
 *
 * Kept in its own module so that chart files can export a pure `buildOption()`
 * without ever importing ECharts — that separation is what makes the option
 * builders unit-testable under `node --test`, where no ECharts global exists.
 *
 * ECharts itself is loaded as a UMD <script> by the host page, so it arrives on
 * `window.echarts` rather than through an import.
 */

import { registerCalastoneTheme, THEME_NAME } from './theme.js';
import { prefersReducedMotion } from '../motion/motion.js';

/** Live instances, so a re-render or a viewport change can dispose/resize them. */
const instances = new Set();
let resizeBound = false;

/**
 * Charts in the one-screen layout sit in flex cells whose height is decided
 * after they mount — a window listener never fires for that. Each instance
 * watches its own element instead, so a chart is always the size of the box it
 * is in rather than the size that box happened to be at mount time.
 */
const observer = typeof ResizeObserver !== 'undefined'
  ? new ResizeObserver((entries) => {
    for (const entry of entries) {
      const chart = window.echarts?.getInstanceByDom?.(entry.target);
      if (!chart || chart.isDisposed?.()) continue;
      applyDensity(chart, entry.target);
      chart.resize();
    }
  })
  : null;

/** Options a chart was mounted with, so density can be re-derived on resize. */
const mountedOptions = new WeakMap();

/** Below this the axis labels, the in-chart title and the plot all cannot fit. */
const COMPACT_HEIGHT = 152;

/**
 * Thin a chart down when its box is short.
 *
 * A chart in the one-screen layout gets whatever height its tile has left,
 * which can be under 100px. At that size the in-chart title is a duplicate of
 * the section heading above it and the legend and axis labels are eating the
 * plot. Nothing is removed that is not stated elsewhere on the tile.
 *
 * This lives here rather than in the option builders so that `buildOption()`
 * stays pure and testable in Node, and so the density follows the element when
 * the window is resized rather than being fixed at mount time.
 */
function applyDensity(chart, el) {
  const option = mountedOptions.get(el);
  if (!option) return;

  const compact = el.clientHeight > 0 && el.clientHeight < COMPACT_HEIGHT;
  if (chart.__rsCompact === compact) return;
  chart.__rsCompact = compact;

  const patch = {
    title: compact
      ? { show: false }
      : { show: option.title?.show !== false, ...(option.title || {}) },
    legend: compact
      ? { top: 0, itemHeight: 8, itemWidth: 8, itemGap: 10, textStyle: { fontSize: 10 } }
      : (option.legend || {}),
  };

  if (option.grid) {
    patch.grid = compact
      ? { ...option.grid, top: option.legend ? 24 : 8, bottom: 0, containLabel: true }
      : option.grid;
  }

  // Four gridlines in 40px of plot is a smudge, not a scale. Two readable
  // values beat five overlapping ones. The axis name goes with them: at this
  // width it lands on top of the legend, and the unit it carries is already on
  // the KPI card, in the legend keys and in the monthly table.
  if (option.yAxis && !Array.isArray(option.yAxis)) {
    patch.yAxis = compact
      ? {
        ...option.yAxis,
        name: '',
        splitNumber: 2,
        axisLabel: { ...(option.yAxis.axisLabel || {}), fontSize: 10 },
      }
      : option.yAxis;
  }
  if (option.xAxis && !Array.isArray(option.xAxis)) {
    patch.xAxis = compact
      ? { ...option.xAxis, axisLabel: { ...(option.xAxis.axisLabel || {}), fontSize: 10 } }
      : option.xAxis;
  }

  // Centre labels are drawn at a fixed pixel size and positioned as a
  // percentage of the box, so a doughnut that has shrunk to fit a short tile
  // ends up with its own ring drawn through the number. The count they carry is
  // already printed in full above the chart, so they simply go.
  // Hidden rather than removed: ECharts merges graphic elements by position,
  // so a shorter array leaves the originals on the canvas.
  if (Array.isArray(option.graphic)) {
    // A group does not pass its own invisibility down, so the children are
    // hidden individually.
    patch.graphic = option.graphic.map((g) => ({
      ...g,
      invisible: compact,
      children: Array.isArray(g.children)
        ? g.children.map((c) => ({ ...c, invisible: compact }))
        : g.children,
    }));
  }

  chart.setOption(patch, { notMerge: false, lazyUpdate: false });
}

function bindResize() {
  if (resizeBound || typeof window === 'undefined') return;
  let frame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      for (const chart of instances) {
        if (!chart.isDisposed?.()) chart.resize();
      }
    });
  });
  resizeBound = true;
}

/**
 * Create an ECharts instance on `el` with the Calastone theme applied.
 *
 * @param {HTMLElement} el
 * @param {object} option
 * @returns {any|null} the instance, or null when ECharts is unavailable
 */
export function mountChart(el, option) {
  if (!el) return null;
  const echarts = typeof window !== 'undefined' ? window.echarts : null;

  if (!echarts) {
    // Fail visibly and factually rather than leaving a silent empty box.
    el.innerHTML = '<p class="rs-chart-error">Chart library unavailable — the figures remain in the table below.</p>';
    return null;
  }

  registerCalastoneTheme(echarts);
  bindResize();

  const existing = echarts.getInstanceByDom(el);
  if (existing) existing.dispose();

  const chart = echarts.init(el, THEME_NAME, { renderer: 'canvas' });
  chart.setOption({
    ...option,
    // Chart entry animation is motion; honour the same accessibility setting.
    animation: option.animation !== false && !prefersReducedMotion(),
  });
  instances.add(chart);
  mountedOptions.set(el, option);
  applyDensity(chart, el);
  observer?.observe(el);
  return chart;
}

/** Dispose every chart. Called before the dashboard re-renders. */
export function disposeAll() {
  for (const chart of instances) {
    const el = chart.getDom?.();
    if (el) {
      observer?.unobserve(el);
      mountedOptions.delete(el);
    }
    if (!chart.isDisposed?.()) chart.dispose();
  }
  instances.clear();
}

/** Resize all charts — used after a layout/focus change settles. */
export function resizeAll() {
  for (const chart of instances) {
    if (!chart.isDisposed?.()) chart.resize();
  }
}
