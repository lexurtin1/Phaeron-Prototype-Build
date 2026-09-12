/**
 * OperationsCharts
 *   1. "Open tickets by severity" — doughnut/ring.
 *   2. Tickets raised vs resolved by month — stacked/grouped bars.
 *
 * Severity colours are factual, not decorative: red is reserved for critical,
 * amber for medium attention, blue for low. Nothing here ranks or prioritises —
 * it counts.
 */

import { PALETTE, SEVERITY_COLORS } from './theme.js';
import { formatCount } from '../format.js';
import { mountChart } from './mount.js';

/**
 * Title is fixed by the brief. It is rendered as an HTML <h3> above the canvas
 * rather than as an ECharts `title`, so screen readers and page search can
 * reach it — canvas-drawn text is invisible to both.
 */
export const SEVERITY_TITLE = 'Open tickets by severity';

/**
 * @param {import('../schemas.js').RelationshipSnapshot['tickets']} tickets
 */
export function buildSeverityOption(tickets) {
  const data = tickets.bySeverity.map((s) => ({
    name: s.name,
    value: s.value,
    itemStyle: { color: SEVERITY_COLORS[s.severity] || PALETTE.grey },
  }));

  return {
    animation: true,
    tooltip: {
      trigger: 'item',
      formatter: (p) => `${p.name}<br/><strong>${formatCount(p.value)}</strong> open (${p.percent}%)`,
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'middle',
      itemGap: 10,
    },
    series: [{
      type: 'pie',
      radius: ['58%', '82%'],
      center: ['34%', '52%'],
      avoidLabelOverlap: true,
      label: { show: false },
      labelLine: { show: false },
      data,
      emphasis: {
        scaleSize: 4,
        itemStyle: { shadowBlur: 12, shadowColor: 'rgba(34,50,61,0.18)' },
      },
    }],
    // Total in the ring centre — a count, clearly labelled.
    graphic: data.length ? [{
      type: 'group',
      left: '34%',
      top: '58%',
      children: [
        {
          type: 'text',
          style: {
            text: String(tickets.open ?? 0),
            textAlign: 'center', textVerticalAlign: 'middle',
            y: -8, fill: PALETTE.navy, font: "700 22px 'Inter', sans-serif",
          },
        },
        {
          type: 'text',
          style: {
            text: 'open',
            textAlign: 'center', textVerticalAlign: 'middle',
            y: 12, fill: PALETTE.faint, font: "500 11px 'Inter', sans-serif",
          },
        },
      ],
    }] : [],
  };
}

/**
 * Tickets raised versus resolved, by month.
 */
export function buildRaisedResolvedOption(tickets) {
  const months = tickets.monthly.map((m) => m.month);
  return {
    animation: true,
    grid: { left: 4, right: 12, top: 30, bottom: 4, containLabel: true },
    legend: { show: true, top: 0, right: 0, data: ['Raised', 'Resolved'] },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (v) => `${formatCount(v)} tickets`,
    },
    xAxis: { type: 'category', data: months },
    yAxis: {
      type: 'value',
      name: 'Tickets (count)',
      nameTextStyle: { color: PALETTE.faint, fontSize: 11, align: 'left' },
      nameGap: 12,
      minInterval: 1,
    },
    series: [
      {
        name: 'Raised',
        type: 'bar',
        stack: null,
        data: tickets.monthly.map((m) => m.raised),
        barMaxWidth: 14,
        barGap: '18%',
        itemStyle: { color: PALETTE.brandBlue, borderRadius: [3, 3, 0, 0] },
      },
      {
        name: 'Resolved',
        type: 'bar',
        data: tickets.monthly.map((m) => m.resolved),
        barMaxWidth: 14,
        itemStyle: { color: PALETTE.brandGreen, borderRadius: [3, 3, 0, 0] },
      },
    ],
  };
}

export function mountSeverity(el, tickets) {
  return mountChart(el, buildSeverityOption(tickets));
}

export function mountRaisedResolved(el, tickets) {
  return mountChart(el, buildRaisedResolvedOption(tickets));
}
