/**
 * Transaction volume — a trend line, month by month.
 *
 * A trend, not a tally: the shape of the year is the point, so this is a line
 * along the Phaeron ramp with a soft fill beneath it, and last year's line
 * behind it in dashed grey for reference.
 *
 * Deliberately a separate chart from billing revenue, on its own axis, with the
 * measure ("Transactions processed", a count) stated on the axis so the number
 * can't be mistaken for a value in currency.
 */

import { PALETTE, axisCompact, rampGradient } from './theme.js';
import { formatCount } from '../format.js';
import { mountChart } from './mount.js';

/**
 * @param {import('../schemas.js').RelationshipSnapshot['transactions']} tx
 * @param {{months?: string[]}} [opts]
 */
export function buildOption(tx, opts = {}) {
  const months = opts.months || tx.months;
  const offset = tx.months.length - months.length;
  const current = tx.monthly.slice(offset);
  const prior = tx.priorMonthly.slice(offset);
  const hasPrior = prior.length > 0;

  return {
    animation: true,
    grid: { left: 4, right: 14, top: 30, bottom: 4, containLabel: true },
    legend: {
      show: true,
      top: 0,
      right: 0,
      data: hasPrior ? ['This year', 'Prior year'] : ['This year'],
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => (v == null ? 'No data' : `${formatCount(v)} transactions`),
    },
    xAxis: { type: 'category', data: months },
    yAxis: {
      type: 'value',
      name: 'Transactions processed (count)',
      nameTextStyle: { color: PALETTE.faint, fontSize: 11, align: 'left' },
      nameGap: 12,
      axisLabel: { formatter: axisCompact },
    },
    series: [
      {
        name: 'This year',
        type: 'line',
        data: current,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.6, color: rampGradient() },
        itemStyle: { color: PALETTE.brandTeal },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(45,154,142,0.22)' },
              { offset: 1, color: 'rgba(107,191,89,0.01)' },
            ],
          },
        },
      },
      ...(hasPrior ? [{
        name: 'Prior year',
        type: 'line',
        data: prior,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.6, color: PALETTE.grey, type: 'dashed' },
        itemStyle: { color: PALETTE.grey },
      }] : []),
    ],
  };
}

/** Category split — only rendered when the source data actually carries one. */
export function buildCategoryOption(tx) {
  return {
    animation: true,
    grid: { left: 4, right: 14, top: 8, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (v) => `${formatCount(v)} transactions`,
    },
    xAxis: { type: 'value', axisLabel: { formatter: axisCompact }, splitLine: { show: true } },
    yAxis: {
      type: 'category',
      data: tx.categories.map((c) => c.name),
      axisLine: { show: false },
    },
    series: [{
      type: 'bar',
      data: tx.categories.map((c) => c.value),
      barMaxWidth: 16,
      itemStyle: {
        color: rampGradient({ from: PALETTE.brandBlue, to: PALETTE.brandGreen }),
        borderRadius: [0, 3, 3, 0],
      },
    }],
  };
}

export function buildSparklineOption(tx) {
  return {
    animation: false,
    grid: { left: 2, right: 2, top: 4, bottom: 2 },
    xAxis: { type: 'category', data: tx.months, show: false },
    yAxis: { type: 'value', show: true, axisLabel: { show: false }, splitLine: { show: false } },
    tooltip: { trigger: 'axis', valueFormatter: (v) => `${formatCount(v)} transactions` },
    series: [{
      type: 'line',
      data: tx.monthly,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2, color: rampGradient() },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(45,154,142,0.20)' },
            { offset: 1, color: 'rgba(107,191,89,0.01)' },
          ],
        },
      },
    }],
  };
}

export function mount(el, tx, opts) {
  return mountChart(el, buildOption(tx, opts));
}

export function mountCategories(el, tx) {
  return mountChart(el, buildCategoryOption(tx));
}

export function mountSparkline(el, tx) {
  return mountChart(el, buildSparklineOption(tx));
}
