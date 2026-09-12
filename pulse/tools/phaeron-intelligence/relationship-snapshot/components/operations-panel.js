/**
 * Operational activity — the card that has to make a spike visible.
 *
 * Three figures on the head (open, high severity, oldest), a severity strip,
 * and raised-against-resolved by month underneath. The monthly pair is the
 * point: a count of open tickets tells you where things stand, but only the
 * shape of raised versus resolved tells you whether a month went wrong.
 *
 * Nothing here interprets the shape. The card states what was raised and what
 * was resolved; whether that is a problem is the reader's call, not ours.
 */

import { esc, formatCount, formatAge, humanise } from '../format.js';
import { fromHTML, section, body } from './dom.js';
import { unavailableBlock, emptyState } from './states.js';
import { mountRaisedResolved } from '../charts/operations.js';

/**
 * @param {import('../schemas.js').RelationshipSnapshot} snapshot
 */
export function render(snapshot) {
  const t = snapshot.tickets;
  const src = snapshot.sources.find((s) => s.id === 'jira');

  const summary = t.available
    ? `<span class="rs-sum-fig">${esc(formatCount(t.open))} open</span>`
      + ` <span class="rs-sum-delta ${t.highSeverity > 0 ? 'rs-tone-attention' : 'rs-tone-flat'}">`
      + `${esc(formatCount(t.highSeverity))} high severity</span>`
    : '<span class="rs-sum-none">Jira unavailable</span>';

  const sec = section('operations', 'Operational activity', {
    subtitle: 'Jira (simulated)',
    summary,
  });
  const host = body(sec);

  if (!t.available) {
    host.appendChild(unavailableBlock('Jira', src?.note));
    return sec;
  }

  host.appendChild(severityStrip(t));

  if (!t.monthly.length) {
    host.appendChild(emptyState('No monthly ticket history is recorded for this period.'));
    return sec;
  }

  const chartCard = fromHTML(`
    <div class="rs-chart-card">
      <div class="rs-chart" data-chart="raised-resolved"></div>
    </div>`);
  host.appendChild(chartCard);

  sec.__mount = () => mountRaisedResolved(chartCard.querySelector('[data-chart="raised-resolved"]'), t);

  return sec;
}

/**
 * Open tickets by severity, as counts rather than a ring.
 *
 * A doughnut of four slices in a card this size is a smudge; four labelled
 * numbers are readable at any width, and severity is a state, so the colours
 * are the fixed severity colours rather than anything from the brand ramp.
 */
function severityStrip(t) {
  const oldest = t.open > 0 ? formatAge(t.oldestOpenDays) : '—';

  return fromHTML(`
    <div class="rs-sev-strip">
      ${t.bySeverity.map((s) => `
        <div class="rs-sev-cell" data-severity="${esc(s.severity)}">
          <span class="rs-sev rs-sev-${esc(s.severity)}">${esc(humanise(s.severity))}</span>
          <span class="rs-sev-count">${esc(formatCount(s.value))}</span>
        </div>`).join('')}
      <div class="rs-sev-cell rs-sev-oldest">
        <span class="rs-cell-label">Oldest open</span>
        <span class="rs-sev-count">${esc(oldest)}</span>
      </div>
    </div>`);
}
