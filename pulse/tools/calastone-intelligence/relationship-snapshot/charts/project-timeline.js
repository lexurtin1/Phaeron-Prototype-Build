/**
 * ProjectTimeline — horizontal Gantt-like view of overall project movement.
 *
 * Rendered ONLY when there is more than one active project carrying reliable
 * dates (see `shouldRender`). Project tiles remain the primary interaction and
 * detail surface; this chart exists to show relative movement, nothing more.
 *
 * Built on a custom series because ECharts has no first-class Gantt type.
 */

import { PALETTE, PROJECT_STATUS_COLORS } from './theme.js';
import { formatDate, humanise } from '../format.js';
import { mountChart } from './mount.js';

/**
 * The brief's gate: more than one active project, each with usable dates.
 * @param {import('../schemas.js').RelationshipSnapshot['projects']} projects
 */
export function shouldRender(projects) {
  const dated = activeDated(projects);
  return dated.length > 1;
}

function activeDated(projects) {
  return (projects || []).filter((p) => {
    if (p.status === 'complete') return false;
    const s = Date.parse(p.start);
    const e = Date.parse(p.end);
    return Number.isFinite(s) && Number.isFinite(e) && e > s;
  });
}

/**
 * @param {import('../schemas.js').RelationshipSnapshot['projects']} projects
 */
export function buildOption(projects) {
  const rows = activeDated(projects);
  // Newest-starting at the top reads more naturally on an inverted category axis.
  const ordered = [...rows].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const names = ordered.map((p) => p.name);

  const data = ordered.map((p, i) => ({
    value: [i, Date.parse(p.start), Date.parse(p.end)],
    itemStyle: { color: PROJECT_STATUS_COLORS[p.status] || PALETTE.teal },
    project: p,
  }));

  return {
    animation: true,
    grid: { left: 4, right: 20, top: 12, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params.data?.project;
        if (!p) return '';
        return [
          `<strong>${p.name}</strong>`,
          `Status: ${humanise(p.status)}`,
          `${formatDate(p.start)} → ${formatDate(p.end)}`,
          `Current milestone: ${p.currentMilestone}`,
        ].join('<br/>');
      },
    },
    xAxis: {
      type: 'time',
      axisLabel: { formatter: '{MMM} {yy}' },
      splitLine: { show: true, lineStyle: { color: 'rgba(34,50,61,0.08)' } },
    },
    yAxis: {
      type: 'category',
      data: names,
      inverse: true,
      axisLine: { show: false },
      axisLabel: { color: PALETTE.muted, fontSize: 11.5, width: 150, overflow: 'truncate' },
    },
    series: [{
      type: 'custom',
      renderItem: renderBar,
      encode: { x: [1, 2], y: 0 },
      data,
    }],
  };
}

/** Draws one rounded bar spanning start→end on the time axis. */
function renderBar(params, api) {
  const categoryIndex = api.value(0);
  const start = api.coord([api.value(1), categoryIndex]);
  const end = api.coord([api.value(2), categoryIndex]);
  const height = 16;

  const rect = {
    x: start[0],
    y: start[1] - height / 2,
    width: Math.max(3, end[0] - start[0]),
    height,
  };

  const clipped = clipRect(rect, params.coordSys);
  if (!clipped) return null;

  return {
    type: 'rect',
    shape: { ...clipped, r: 4 },
    style: api.style(),
  };
}

function clipRect(rect, coord) {
  const x = Math.max(rect.x, coord.x);
  const width = Math.min(rect.x + rect.width, coord.x + coord.width) - x;
  if (width <= 0) return null;
  return { x, y: rect.y, width, height: rect.height };
}

export function mount(el, projects) {
  return mountChart(el, buildOption(projects));
}
