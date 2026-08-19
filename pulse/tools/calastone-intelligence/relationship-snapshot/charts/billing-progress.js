/**
 * Billing revenue YTD — a progress ring against last year.
 *
 * The question this card answers is not "what did we bill each month" (the
 * monthly detail is a table, and the KPI card carries the total) but "how far
 * through last year's number are we". So it is a ring: the filled arc is what
 * has been billed this year to date, the track behind it is last year's
 * full-year total, and the centre states the percentage.
 *
 * Two honesty rules are wired into the shape:
 *
 *   · Past 100% the arc stops at full and the centre keeps counting. A ring
 *     that wrapped round would read as 12% when it meant 112%.
 *   · With no prior year to compare against there is no ring at all — the
 *     caller renders the figure alone rather than a circle at an invented
 *     percentage of nothing.
 *
 * `buildOption` imports no ECharts, so it is unit-testable in Node.
 */

import { PALETTE } from './theme.js';

/**
 * Is there anything to track towards?
 * @param {import('../schemas.js').RelationshipSnapshot['billing']} billing
 */
export function hasTarget(billing) {
  return Boolean(billing?.available)
    && typeof billing.ytd === 'number'
    && typeof billing.priorFullYear === 'number'
    && billing.priorFullYear > 0;
}

/**
 * Progress towards last year's total, as a fraction. Not capped — the caller
 * decides what to draw and what to print, and those differ past 100%.
 *
 * @param {import('../schemas.js').RelationshipSnapshot['billing']} billing
 * @returns {number|null}
 */
export function progress(billing) {
  if (!hasTarget(billing)) return null;
  return billing.ytd / billing.priorFullYear;
}

/**
 * @param {import('../schemas.js').RelationshipSnapshot['billing']} billing
 */
export function buildOption(billing) {
  const ratio = progress(billing);
  if (ratio == null) return null;

  const filled = Math.max(0, Math.min(1, ratio));
  const percent = Math.round(ratio * 100);

  return {
    animation: true,
    tooltip: { show: false },
    // The Calastone theme styles a legend, and ECharts renders one for a pie as
    // soon as the component exists. There is nothing to legend here: the arc is
    // the figure and the centre says what it means.
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['72%', '92%'],
      center: ['50%', '50%'],
      startAngle: 90,
      silent: true,
      label: { show: false },
      labelLine: { show: false },
      data: [
        {
          value: filled,
          name: 'Billed year to date',
          itemStyle: {
            // The ramp runs round the arc, so the ring reads as one sweep
            // rather than two flat colours meeting.
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 1,
              colorStops: [
                { offset: 0, color: PALETTE.brandBlue },
                { offset: 0.52, color: PALETTE.brandTeal },
                { offset: 1, color: PALETTE.brandLime },
              ],
            },
            borderRadius: 6,
          },
        },
        {
          value: 1 - filled,
          name: 'Remaining against last year',
          itemStyle: { color: '#EDF1F1' },
        },
      ],
    }],
    graphic: [{
      type: 'group',
      left: 'center',
      top: 'middle',
      children: [
        {
          type: 'text',
          style: {
            text: `${percent}%`,
            textAlign: 'center',
            textVerticalAlign: 'middle',
            y: -9,
            fill: PALETTE.navy,
            font: "700 26px 'Inter', sans-serif",
          },
        },
        {
          type: 'text',
          style: {
            text: 'of last year',
            textAlign: 'center',
            textVerticalAlign: 'middle',
            y: 13,
            fill: PALETTE.faint,
            font: "500 11px 'Inter', sans-serif",
          },
        },
      ],
    }],
  };
}
