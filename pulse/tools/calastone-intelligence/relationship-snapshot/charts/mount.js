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
  return chart;
}

/** Dispose every chart. Called before the dashboard re-renders. */
export function disposeAll() {
  for (const chart of instances) {
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
