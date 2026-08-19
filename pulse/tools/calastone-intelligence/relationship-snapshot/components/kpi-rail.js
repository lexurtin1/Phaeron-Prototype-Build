/**
 * KpiRail — the five headline figures under the account header.
 *
 * Static tiles. There is no toggle, no chevron and nothing to click: a figure
 * that has to be opened is a figure the reader has to already suspect is worth
 * opening, and these five are the ones nobody should have to go looking for.
 *
 * The detail that used to sit behind each card now lives in the always-open
 * card that owns it — the trend chart, the progress ring, the severity strip,
 * the project tiles — and the header names the sources with their refresh
 * times. The rail states; the cards below it explain.
 *
 * Every figure originates in the repository. Nothing here computes a rating,
 * a ranking or a judgement — a KPI either has a value or says it has none.
 */

import {
  esc, formatCurrency, formatCount, formatRelative, formatVariance,
  variance, varianceDirection, formatAge,
} from '../format.js';
import { fromHTML } from './dom.js';
import { animate, stagger, DUR } from '../motion/motion.js';

/**
 * @param {import('../schemas.js').RelationshipSnapshot} snapshot
 */
export function render(snapshot) {
  const cards = [
    billingCard(snapshot),
    transactionsCard(snapshot),
    productionCard(snapshot),
    ticketsCard(snapshot),
    projectsCard(snapshot),
  ];

  const rail = fromHTML(`
    <div class="rs-kpi-rail" data-block="kpi-rail">
      <div class="rs-kpi-track" role="list"></div>
    </div>
  `);

  const track = rail.querySelector('.rs-kpi-track');
  for (const card of cards) track.appendChild(card);

  return rail;
}

/* ───────────────────────── card builders ───────────────────────── */

/**
 * `tone` rides on the article rather than the number: an amber figure reads as
 * a judgement about the figure, an amber card edge reads as a card to look at.
 */
function shell({ id, label, value, sub, meta, tone = 'neutral', unavailable = false }) {
  return fromHTML(`
    <article class="rs-kpi" role="listitem" data-kpi="${esc(id)}" data-tone="${esc(tone)}"
             ${unavailable ? 'data-unavailable="true"' : ''}>
      <div class="rs-kpi-head">
        <span class="rs-kpi-label">${esc(label)}</span>
        <span class="rs-kpi-value">${value}</span>
        ${sub ? `<span class="rs-kpi-sub">${sub}</span>` : ''}
        ${meta ? `<span class="rs-kpi-meta">${esc(meta)}</span>` : ''}
      </div>
    </article>
  `);
}

function deltaMarkup(v, { label }) {
  if (v == null) return `<span class="rs-delta rs-delta-none">No prior-year comparison</span>`;
  const dir = varianceDirection(v);
  return `<span class="rs-delta rs-delta-${dir}">${esc(formatVariance(v))} ${esc(label)}</span>`;
}

function billingCard(s) {
  const b = s.billing;
  const src = s.sources.find((x) => x.id === 'billing');
  if (!b.available) {
    return shell({
      id: 'billing', label: 'Billing revenue YTD', value: 'Unavailable',
      meta: src?.note ? 'Source did not return data' : '', tone: 'severe', unavailable: true,
    });
  }
  const v = variance(b.ytd, b.priorYtd);
  return shell({
    id: 'billing',
    label: `Billing revenue YTD (${b.currency})`,
    value: esc(formatCurrency(b.ytd)),
    sub: deltaMarkup(v, { label: 'vs prior year' }),
    meta: `Refreshed ${formatRelative(src?.lastRefresh)}`,
    tone: src?.state === 'delayed' ? 'attention' : 'neutral',
  });
}

function transactionsCard(s) {
  const t = s.transactions;
  const src = s.sources.find((x) => x.id === 'transactions');
  if (!t.available) {
    return shell({
      id: 'transactions', label: 'Transactions YTD', value: 'Unavailable',
      meta: 'Source did not return data', tone: 'severe', unavailable: true,
    });
  }
  const v = variance(t.ytd, t.priorYtd);
  return shell({
    id: 'transactions',
    label: 'Transactions YTD (count)',
    value: esc(formatCount(t.ytd)),
    sub: deltaMarkup(v, { label: 'vs prior year' }),
    meta: `Refreshed ${formatRelative(src?.lastRefresh)}`,
  });
}

function productionCard(s) {
  const p = s.production;
  if (!p.available) {
    return shell({
      id: 'production', label: 'Production status', value: 'Unavailable',
      meta: 'Depends on the transaction source', tone: 'severe', unavailable: true,
    });
  }
  const tone = p.servicesLive < p.servicesTotal ? 'attention' : 'live';
  return shell({
    id: 'production',
    // The period qualifies the label, the way the other two carry their unit:
    // it travelled in `meta`, which the one-screen template hides, and a message
    // count without the month it covers is not a figure. On the label it costs
    // nothing — as a second line in the sub it cost every chart below ~10% of
    // its height.
    label: `Production status · ${p.period}`,
    value: `${p.servicesLive}<span class="rs-kpi-of">/${p.servicesTotal}</span>`,
    sub: `<span class="rs-kpi-note">services live · ${esc(formatCount(p.currentMonth))} messages</span>`,
    meta: p.measure,
    tone,
  });
}

function ticketsCard(s) {
  const t = s.tickets;
  if (!t.available) {
    return shell({
      id: 'tickets', label: 'Operational tickets', value: 'Unavailable',
      meta: 'Jira did not return data', tone: 'severe', unavailable: true,
    });
  }
  const tone = t.highSeverity > 0 ? 'attention' : 'neutral';
  return shell({
    id: 'tickets',
    label: 'Operational tickets',
    value: esc(formatCount(t.open)),
    sub: `<span class="rs-kpi-note">${esc(formatCount(t.highSeverity))} high severity</span>`,
    meta: t.open > 0 ? `Oldest open ${formatAge(t.oldestOpenDays)}` : 'None open',
    tone,
  });
}

function projectsCard(s) {
  const active = s.projects.filter((p) => p.status !== 'complete');
  const blocked = active.filter((p) => p.status === 'blocked').length;
  return shell({
    id: 'projects',
    label: 'Active projects',
    value: esc(formatCount(active.length)),
    sub: blocked
      ? `<span class="rs-kpi-note">${blocked} blocked</span>`
      : `<span class="rs-kpi-note">Jira-linked initiatives</span>`,
    meta: active.length ? 'Delivery in progress' : 'None active',
    tone: blocked ? 'attention' : 'neutral',
  });
}

/**
 * Staggered entrance, called once the wheel has collapsed.
 *
 * The rail container is revealed directly rather than animated: the assembly
 * sequence hides every block at opacity 0 up front, and only the individual
 * cards should stagger. Animating just the children would leave the container
 * itself invisible.
 */
export function animateIn(rail) {
  rail.style.opacity = '1';
  const cards = rail.querySelectorAll('.rs-kpi');
  if (!cards.length) return { finished: Promise.resolve() };
  return animate(
    cards,
    { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0px)'] },
    { duration: DUR.slow, delay: stagger(0.05) },
  );
}
