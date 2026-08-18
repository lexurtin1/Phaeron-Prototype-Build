/**
 * TransactionYtdChart — transactions processed by month.
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
        type: 'bar',
        data: current,
        barMaxWidth: 26,
        itemStyle: {
          color: rampGradient({ vertical: true, from: PALETTE.brandBlue, to: PALETTE.brandGreen }),
          borderRadius: [3, 3, 0, 0],
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
      type: 'bar',
      data: tx.monthly,
      barMaxWidth: 8,
      itemStyle: {
        color: rampGradient({ vertical: true, from: PALETTE.brandBlue, to: PALETTE.brandGreen }),
        borderRadius: [2, 2, 0, 0],
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
