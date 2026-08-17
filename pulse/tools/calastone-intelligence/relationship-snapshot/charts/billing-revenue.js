/**
 * BillingRevenueYtdChart — billed revenue by month, with prior-year comparison.
 *
 * Revenue and transactions are deliberately NEVER merged into one chart: they
 * are different measures in different units, and overlaying them would invite a
 * comparison the data does not support.
 *
 * `buildOption()` is pure (no ECharts import) so it is unit-testable in Node.
 */

import { PALETTE, axisCompact } from './theme.js';
import { formatCurrency } from '../format.js';
import { mountChart } from './mount.js';

/**
 * @param {import('../schemas.js').RelationshipSnapshot['billing']} billing
 * @param {{months?: string[]}} [opts] optional narrowed month window
 */
export function buildOption(billing, opts = {}) {
  const months = opts.months || billing.months;
  const count = months.length;
  const offset = billing.months.length - count; // narrowed periods slice from the end

  const current = billing.monthly.slice(offset);
  const prior = billing.priorMonthly.slice(offset);

  return {
    animation: true,
    grid: { left: 4, right: 14, top: 30, bottom: 4, containLabel: true },
    legend: {
      show: true,
      top: 0,
      right: 0,
      data: [`${billing.currency} this year`, `${billing.currency} prior year`],
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => (v == null ? 'No data' : formatCurrency(v)),
    },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      name: `Billed revenue (${billing.currency})`,
      nameTextStyle: { color: PALETTE.faint, fontSize: 11, align: 'left' },
      nameGap: 12,
      axisLabel: { formatter: axisCompact },
    },
    series: [
      {
        name: `${billing.currency} this year`,
        type: 'line',
        data: current,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2.4, color: PALETTE.teal },
        itemStyle: { color: PALETTE.teal },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(45,154,142,0.22)' },
              { offset: 1, color: 'rgba(45,154,142,0.01)' },
            ],
          },
        },
      },
      {
        name: `${billing.currency} prior year`,
        type: 'line',
        data: prior,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.6, color: PALETTE.grey, type: 'dashed' },
        itemStyle: { color: PALETTE.grey },
      },
    ],
  };
}

/** Compact sparkline for the KPI expansion. Same data, no chrome. */
export function buildSparklineOption(billing) {
  return {
    animation: false,
    grid: { left: 2, right: 2, top: 4, bottom: 2 },
    xAxis: { type: 'category', data: billing.months, show: false, boundaryGap: false },
    yAxis: { type: 'value', show: true, axisLabel: { show: false }, splitLine: { show: false } },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => formatCurrency(v),
    },
    series: [{
      type: 'line',
      data: billing.monthly,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2, color: PALETTE.teal },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(45,154,142,0.24)' },
            { offset: 1, color: 'rgba(45,154,142,0.02)' },
          ],
        },
      },
    }],
  };
}

export function mount(el, billing, opts) {
  return mountChart(el, buildOption(billing, opts));
}

export function mountSparkline(el, billing) {
  return mountChart(el, buildSparklineOption(billing));
}
