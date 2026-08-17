/**
 * ExpandableKpiRail — five expandable KPI cards under the account header.
 *
 * Interaction rules from the brief:
 *   · one card expanded at a time
 *   · cards stagger in after the assembly wheel completes
 *   · siblings reflow smoothly (FLIP — Motion has no vanilla `layout` prop)
 *   · restrained 150-350ms, transform/opacity only
 *
 * Every figure originates in the repository. Nothing here computes a rating,
 * a ranking or a judgement — a KPI either has a value or says it has none.
 */

import {
  esc, formatCurrency, formatCount, formatRelative, formatVariance,
  variance, varianceDirection, formatAge, humanise,
} from '../format.js';
import { fromHTML } from './dom.js';
import { animate, flip, stagger, enter, DUR } from '../motion/motion.js';
import { mountSparkline as mountBillingSpark } from '../charts/billing-revenue.js';
import { mountSparkline as mountTxSpark, mountCategories } from '../charts/transactions.js';
import { mountSeverity } from '../charts/operations.js';
import { resizeAll } from '../charts/mount.js';

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

  wireExpansion(rail, snapshot);
  return rail;
}

/* ───────────────────────── card builders ───────────────────────── */

function shell({ id, label, value, sub, meta, tone = 'neutral', unavailable = false }) {
  return fromHTML(`
    <article class="rs-kpi" role="listitem" data-kpi="${esc(id)}"
             data-expanded="false" ${unavailable ? 'data-unavailable="true"' : ''}>
      <button type="button" class="rs-kpi-head" aria-expanded="false" aria-controls="rs-kpi-panel-${esc(id)}">
        <span class="rs-kpi-label">${esc(label)}</span>
        <span class="rs-kpi-value rs-pill-tone-${esc(tone)}">${value}</span>
        ${sub ? `<span class="rs-kpi-sub">${sub}</span>` : ''}
        ${meta ? `<span class="rs-kpi-meta">${esc(meta)}</span>` : ''}
        <span class="rs-kpi-chevron" aria-hidden="true"></span>
      </button>
      <div class="rs-kpi-panel" id="rs-kpi-panel-${esc(id)}" hidden></div>
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
    label: 'Production status',
    value: `${p.servicesLive}<span class="rs-kpi-of">/${p.servicesTotal}</span>`,
    sub: `<span class="rs-kpi-note">services live · ${esc(formatCount(p.currentMonth))} messages</span>`,
    meta: p.period,
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

/* ───────────────────────── expansion panels ───────────────────────── */

function buildPanel(id, s) {
  switch (id) {
    case 'billing': return billingPanel(s);
    case 'transactions': return transactionsPanel(s);
    case 'production': return productionPanel(s);
    case 'tickets': return ticketsPanel(s);
    case 'projects': return projectsPanel(s);
    default: return null;
  }
}

function monthTable(months, rows) {
  return `
    <div class="rs-mini-table-wrap">
      <table class="rs-mini-table">
        <thead><tr><th scope="col">Month</th>${rows.map((r) => `<th scope="col" class="rs-num">${esc(r.label)}</th>`).join('')}</tr></thead>
        <tbody>
          ${months.map((m, i) => `
            <tr>
              <th scope="row">${esc(m)}</th>
              ${rows.map((r) => `<td class="rs-num">${esc(r.format(r.data[i]))}</td>`).join('')}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function sourceMeta(src) {
  if (!src) return '';
  return `
    <dl class="rs-evidence">
      <div><dt>Source</dt><dd>${esc(src.name)} (simulated)</dd></div>
      <div><dt>State</dt><dd>${esc(humanise(src.state))}</dd></div>
      <div><dt>Last refresh</dt><dd>${esc(formatRelative(src.lastRefresh))}</dd></div>
      <div><dt>Records used</dt><dd>${esc(formatCount(src.recordsUsed))}</dd></div>
      <div><dt>Evidence ref</dt><dd class="rs-mono">${esc(src.evidenceId)}</dd></div>
    </dl>`;
}

function billingPanel(s) {
  const b = s.billing;
  const src = s.sources.find((x) => x.id === 'billing');
  const node = fromHTML(`
    <div class="rs-kpi-panel-inner">
      <div class="rs-spark" data-spark="billing"></div>
      ${monthTable(b.months, [
        { label: `This year (${b.currency})`, data: b.monthly, format: (v) => formatCurrency(v) },
        { label: `Prior year (${b.currency})`, data: b.priorMonthly, format: (v) => formatCurrency(v) },
      ])}
      ${sourceMeta(src)}
    </div>`);
  node.__mount = () => mountBillingSpark(node.querySelector('[data-spark="billing"]'), b);
  return node;
}

function transactionsPanel(s) {
  const t = s.transactions;
  const src = s.sources.find((x) => x.id === 'transactions');
  const node = fromHTML(`
    <div class="rs-kpi-panel-inner">
      <div class="rs-spark" data-spark="tx"></div>
      ${monthTable(t.months, [
        { label: 'This year', data: t.monthly, format: (v) => formatCount(v) },
        { label: 'Prior year', data: t.priorMonthly, format: (v) => formatCount(v) },
      ])}
      ${t.categories.length ? `
        <h4 class="rs-panel-sub">Category split (${esc(t.unit)})</h4>
        <div class="rs-spark rs-spark-tall" data-spark="tx-cat"></div>` : ''}
      ${sourceMeta(src)}
    </div>`);
  node.__mount = () => {
    mountTxSpark(node.querySelector('[data-spark="tx"]'), t);
    const cat = node.querySelector('[data-spark="tx-cat"]');
    if (cat) mountCategories(cat, t);
  };
  return node;
}

function productionPanel(s) {
  const p = s.production;
  return fromHTML(`
    <div class="rs-kpi-panel-inner">
      <dl class="rs-evidence">
        <div><dt>Measure</dt><dd>${esc(p.measure)}</dd></div>
        <div><dt>Period</dt><dd>${esc(p.period)}</dd></div>
        <div><dt>Services live</dt><dd>${p.servicesLive} of ${p.servicesTotal}</dd></div>
        <div><dt>Messages this period</dt><dd>${esc(formatCount(p.currentMonth))}</dd></div>
      </dl>
      ${monthTable(p.months, [
        { label: 'Messages', data: p.monthly, format: (v) => formatCount(v) },
      ])}
    </div>`);
}

function ticketsPanel(s) {
  const t = s.tickets;
  const src = s.sources.find((x) => x.id === 'jira');
  const open = t.items.filter((i) => i.status !== 'resolved');
  const node = fromHTML(`
    <div class="rs-kpi-panel-inner">
      <div class="rs-spark rs-spark-tall" data-spark="severity"></div>
      <h4 class="rs-panel-sub">Open tickets</h4>
      ${open.length ? `
        <ul class="rs-mini-list">
          ${open.slice(0, 6).map((i) => `
            <li>
              <span class="rs-sev rs-sev-${esc(i.severity)}">${esc(humanise(i.severity))}</span>
              <span class="rs-mini-list-title">${esc(i.title)}</span>
              <span class="rs-mini-list-meta">${esc(i.id)} · ${esc(formatAge(i.ageDays))}</span>
            </li>`).join('')}
        </ul>` : '<p class="rs-empty-inline">No open account-linked operational tickets in the selected period.</p>'}
      ${sourceMeta(src)}
    </div>`);
  node.__mount = () => {
    const sev = node.querySelector('[data-spark="severity"]');
    if (t.bySeverity.length) mountSeverity(sev, t);
    else sev.remove();
  };
  return node;
}

function projectsPanel(s) {
  const active = s.projects.filter((p) => p.status !== 'complete');
  if (!active.length) {
    return fromHTML(`<div class="rs-kpi-panel-inner">
      <p class="rs-empty-inline">No active Jira-linked initiatives for this account.</p></div>`);
  }
  return fromHTML(`
    <div class="rs-kpi-panel-inner">
      <ul class="rs-mini-projects">
        ${active.map((p) => `
          <li>
            <div class="rs-mini-project-head">
              <span class="rs-mini-list-title">${esc(p.name)}</span>
              <span class="rs-pill rs-pill-${statusTone(p.status)}">${esc(humanise(p.status))}</span>
            </div>
            <div class="rs-mini-list-meta">
              ${esc(p.owner)} · ${esc(p.team)} · ${esc(p.openItems)} open items
            </div>
            <div class="rs-mini-list-meta">Current milestone: ${esc(p.currentMilestone)}</div>
          </li>`).join('')}
      </ul>
    </div>`);
}

function statusTone(status) {
  if (status === 'blocked') return 'severe';
  if (status === 'complete') return 'live';
  if (status === 'not_started') return 'neutral';
  return 'progress';
}

/* ───────────────────────── behaviour ───────────────────────── */

function wireExpansion(rail, snapshot) {
  const cards = [...rail.querySelectorAll('.rs-kpi')];

  for (const card of cards) {
    const head = card.querySelector('.rs-kpi-head');
    head.addEventListener('click', () => toggle(card));
  }

  function toggle(card) {
    const isOpen = card.dataset.expanded === 'true';
    const siblings = cards;

    // FLIP the whole rail so neighbours slide rather than jump.
    flip(siblings, () => {
      for (const other of cards) {
        if (other !== card) close(other);
      }
      if (isOpen) close(card);
      else open(card);
    }).finished.then(() => resizeAll());
  }

  function open(card) {
    const id = card.dataset.kpi;
    const panel = card.querySelector('.rs-kpi-panel');
    if (!panel.firstChild) {
      const inner = buildPanel(id, snapshot);
      if (inner) {
        panel.appendChild(inner);
        // Charts must mount after the panel is in the document and visible.
        requestAnimationFrame(() => inner.__mount?.());
      }
    }
    panel.hidden = false;
    card.dataset.expanded = 'true';
    card.querySelector('.rs-kpi-head').setAttribute('aria-expanded', 'true');
    enter(panel, { duration: DUR.base, y: 6 });
  }

  function close(card) {
    const panel = card.querySelector('.rs-kpi-panel');
    panel.hidden = true;
    card.dataset.expanded = 'false';
    card.querySelector('.rs-kpi-head').setAttribute('aria-expanded', 'false');
  }
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
