/**
 * Operations panel — ticket KPIs, severity ring, raised/resolved by month, and
 * an expandable factual ticket table.
 *
 * The table sorts open-first, then severity, then age (see sortTickets in the
 * repository). That ordering is a factual convention, not a prioritisation
 * recommendation — nothing here tells anyone what to do about a ticket.
 */

import { esc, formatCount, formatDate, formatAge, formatRelative, humanise } from '../format.js';
import { fromHTML, section, body, drawer } from './dom.js';
import { unavailableBlock, emptyState } from './states.js';
import { mountSeverity, mountRaisedResolved, SEVERITY_TITLE } from '../charts/operations.js';

const COLLAPSED_ROWS = 6;

/**
 * @param {import('../schemas.js').RelationshipSnapshot} snapshot
 * @param {{fit?: boolean}} [opts] fit: the tile has one screen-row of height,
 *   so the ticket table folds away rather than squeezing the charts to nothing.
 */
export function render(snapshot, opts = {}) {
  const t = snapshot.tickets;
  const sec = section('operations', 'Operations', { subtitle: 'Jira (simulated)' });
  const host = body(sec);

  if (!t.available) {
    const src = snapshot.sources.find((s) => s.id === 'jira');
    host.appendChild(unavailableBlock('Jira', src?.note));
    return sec;
  }

  host.appendChild(fromHTML(`
    <div class="rs-ops-kpis">
      <div class="rs-ops-kpi">
        <div class="rs-cell-label">Open tickets</div>
        <div class="rs-ops-value">${esc(formatCount(t.open))}</div>
      </div>
      <div class="rs-ops-kpi">
        <div class="rs-cell-label">High severity</div>
        <div class="rs-ops-value ${t.highSeverity > 0 ? 'rs-tone-attention' : ''}">${esc(formatCount(t.highSeverity))}</div>
      </div>
      <div class="rs-ops-kpi">
        <div class="rs-cell-label">Oldest open ticket</div>
        <div class="rs-ops-value">${t.open > 0 ? esc(formatAge(t.oldestOpenDays)) : '—'}</div>
      </div>
    </div>
  `));

  const charts = fromHTML(`
    <div class="rs-ops-charts">
      <div class="rs-chart-card">
        <h3 class="rs-chart-title">${esc(SEVERITY_TITLE)}</h3>
        <div class="rs-chart" data-chart="severity" style="--rs-chart-h:240px"></div>
      </div>
      <div class="rs-chart-card">
        <h3 class="rs-chart-title">Tickets raised and resolved by month</h3>
        <div class="rs-chart" data-chart="raised-resolved" style="--rs-chart-h:260px"></div>
      </div>
    </div>
  `);
  host.appendChild(charts);

  const table = ticketTable(t);
  host.appendChild(opts.fit
    ? drawer(`Ticket detail · ${t.items.length} tickets`, table, { open: false })
    : table);

  sec.__mount = () => {
    const sev = charts.querySelector('[data-chart="severity"]');
    if (t.bySeverity.length) {
      mountSeverity(sev, t);
    } else {
      sev.closest('.rs-chart-card').replaceChildren(
        emptyState('No open account-linked operational tickets in the selected period.'),
      );
    }
    mountRaisedResolved(charts.querySelector('[data-chart="raised-resolved"]'), t);
  };

  return sec;
}

function ticketTable(t) {
  if (!t.items.length) {
    const wrap = fromHTML('<div class="rs-ops-table-wrap"></div>');
    wrap.appendChild(emptyState('No open account-linked operational tickets in the selected period.'));
    return wrap;
  }

  const wrap = fromHTML(`
    <div class="rs-ops-table-wrap">
      <div class="rs-table-head">
        <h3 class="rs-chart-title">Ticket detail</h3>
        <span class="rs-table-count">${t.items.length} tickets · open first, then severity, then age</span>
      </div>
      <div class="rs-table-scroll">
        <table class="rs-table">
          <thead>
            <tr>
              <th scope="col">Ticket ID</th>
              <th scope="col">Title</th>
              <th scope="col">Severity</th>
              <th scope="col">Status</th>
              <th scope="col">Owner</th>
              <th scope="col">Opened</th>
              <th scope="col" class="rs-num">Age</th>
              <th scope="col">Latest update</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      ${t.items.length > COLLAPSED_ROWS
        ? `<button type="button" class="rs-table-toggle" aria-expanded="false">
             Show all ${t.items.length} tickets
           </button>`
        : ''}
    </div>
  `);

  const tbody = wrap.querySelector('tbody');
  const rows = t.items.map((i) => `
    <tr data-resolved="${i.status === 'resolved'}">
      <th scope="row" class="rs-mono">${esc(i.id)}</th>
      <td>${esc(i.title)}</td>
      <td><span class="rs-sev rs-sev-${esc(i.severity)}">${esc(humanise(i.severity))}</span></td>
      <td>${esc(humanise(i.status))}</td>
      <td>${esc(i.owner)}</td>
      <td>${esc(formatDate(i.openedAt))}</td>
      <td class="rs-num">${esc(formatAge(i.ageDays))}</td>
      <td>${esc(formatRelative(i.lastUpdate))}</td>
    </tr>`);

  tbody.innerHTML = rows.join('');
  applyCollapse(wrap, t.items.length, false);

  const toggle = wrap.querySelector('.rs-table-toggle');
  toggle?.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    applyCollapse(wrap, t.items.length, !expanded);
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.textContent = expanded
      ? `Show all ${t.items.length} tickets`
      : 'Show fewer tickets';
  });

  return wrap;
}

function applyCollapse(wrap, total, expanded) {
  if (total <= COLLAPSED_ROWS) return;
  const rows = wrap.querySelectorAll('tbody tr');
  rows.forEach((row, i) => {
    row.hidden = !expanded && i >= COLLAPSED_ROWS;
  });
}
