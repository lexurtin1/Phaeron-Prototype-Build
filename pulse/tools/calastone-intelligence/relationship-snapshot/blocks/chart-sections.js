/**
 * The two large chart sections: billing revenue and transactions.
 *
 * Each carries its own summary strip (YTD total, variance, last refreshed) and
 * an expandable monthly table plus source metadata. They are separate sections
 * on purpose — the two measures share a month axis but nothing else.
 */

import {
  esc, formatCurrency, formatCount, formatRelative, formatVariance,
  variance, varianceDirection, humanise,
} from '../format.js';
import { fromHTML, section, body } from '../components/dom.js';
import { unavailableBlock, delayedNotice } from '../components/states.js';
import { PERIOD_MONTHS } from '../config.js';
import { mount as mountBilling } from '../charts/billing-revenue.js';
import { mount as mountTransactions } from '../charts/transactions.js';

/** Narrow the month window when a period other than YTD was requested. */
function windowFor(series, period) {
  const count = PERIOD_MONTHS[period] ?? series.months.length;
  if (!count || count >= series.months.length) return undefined;
  return { months: series.months.slice(-count) };
}

function summary(items) {
  return `
    <div class="rs-summary">
      ${items.map((i) => `
        <div class="rs-summary-item">
          <div class="rs-cell-label">${esc(i.label)}</div>
          <div class="rs-summary-value ${i.tone ? `rs-tone-${esc(i.tone)}` : ''}">${i.value}</div>
          ${i.sub ? `<div class="rs-cell-sub">${esc(i.sub)}</div>` : ''}
        </div>`).join('')}
    </div>`;
}

function evidenceDrawer(src, tableHtml) {
  const node = fromHTML(`
    <div class="rs-drawer">
      <button type="button" class="rs-drawer-toggle" aria-expanded="false">
        Monthly detail and source evidence
        <span class="rs-kpi-chevron" aria-hidden="true"></span>
      </button>
      <div class="rs-drawer-body" hidden>
        ${tableHtml}
        <dl class="rs-evidence">
          <div><dt>Source</dt><dd>${esc(src?.name || '—')} (simulated)</dd></div>
          <div><dt>State</dt><dd>${esc(humanise(src?.state))}</dd></div>
          <div><dt>Last refresh</dt><dd>${esc(formatRelative(src?.lastRefresh))}</dd></div>
          <div><dt>Records used</dt><dd>${esc(formatCount(src?.recordsUsed))}</dd></div>
          <div><dt>Evidence ref</dt><dd class="rs-mono">${esc(src?.evidenceId || '—')}</dd></div>
        </dl>
      </div>
    </div>`);

  const toggle = node.querySelector('.rs-drawer-toggle');
  const drawerBody = node.querySelector('.rs-drawer-body');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    drawerBody.hidden = open;
  });
  return node;
}

function monthlyTable(months, columns) {
  return `
    <div class="rs-table-scroll">
      <table class="rs-table rs-table-compact">
        <thead>
          <tr><th scope="col">Month</th>${columns.map((c) => `<th scope="col" class="rs-num">${esc(c.label)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${months.map((m, i) => `
            <tr>
              <th scope="row">${esc(m)}</th>
              ${columns.map((c) => `<td class="rs-num">${esc(c.format(c.data[i]))}</td>`).join('')}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ─────────────────────── billing ─────────────────────── */

export function renderBillingSection(snapshot, ctx = {}) {
  const b = snapshot.billing;
  const src = snapshot.sources.find((s) => s.id === 'billing');
  const sec = section('billing-revenue', 'Billing revenue', {
    subtitle: `${snapshot.period.label} · Billing (simulated)`,
  });
  const host = body(sec);

  if (!b.available) {
    host.appendChild(unavailableBlock('Billing', src?.note));
    return sec;
  }

  if (src?.state === 'delayed') host.appendChild(delayedNotice('Billing', src.note));

  const v = variance(b.ytd, b.priorYtd);
  host.appendChild(fromHTML(summary([
    { label: `YTD total (${b.currency})`, value: esc(formatCurrency(b.ytd)) },
    {
      label: 'Year-on-year variance',
      value: v == null ? 'No prior-year comparison' : esc(formatVariance(v)),
      tone: v == null ? null : varianceDirection(v),
      sub: v == null ? null : `Prior year ${formatCurrency(b.priorYtd)}`,
    },
    { label: 'Last refreshed', value: esc(formatRelative(src?.lastRefresh)) },
  ])));

  const chartCard = fromHTML(`
    <div class="rs-chart-card">
      <div class="rs-chart" data-chart="billing" style="--rs-chart-h:300px"></div>
    </div>`);
  host.appendChild(chartCard);

  host.appendChild(evidenceDrawer(src, monthlyTable(b.months, [
    { label: `This year (${b.currency})`, data: b.monthly, format: (x) => formatCurrency(x) },
    { label: `Prior year (${b.currency})`, data: b.priorMonthly, format: (x) => formatCurrency(x) },
  ])));

  sec.__mount = () => mountBilling(
    chartCard.querySelector('[data-chart="billing"]'), b, windowFor(b, ctx.period),
  );

  return sec;
}

/* ─────────────────────── transactions ─────────────────────── */

export function renderTransactionsSection(snapshot, ctx = {}) {
  const t = snapshot.transactions;
  const src = snapshot.sources.find((s) => s.id === 'transactions');
  const sec = section('transactions', 'Transactions', {
    subtitle: `${snapshot.period.label} · Transactions (simulated)`,
  });
  const host = body(sec);

  if (!t.available) {
    host.appendChild(unavailableBlock('Transactions', src?.note));
    return sec;
  }

  if (src?.state === 'delayed') host.appendChild(delayedNotice('Transactions', src.note));

  const v = variance(t.ytd, t.priorYtd);
  host.appendChild(fromHTML(summary([
    { label: `YTD total (${t.unit})`, value: esc(formatCount(t.ytd)) },
    {
      label: 'Change vs prior year',
      value: v == null ? 'No prior-year comparison' : esc(formatVariance(v)),
      tone: v == null ? null : varianceDirection(v),
      sub: v == null ? null : `Prior year ${formatCount(t.priorYtd)}`,
    },
    { label: 'Latest period', value: esc(formatRelative(src?.lastRefresh)) },
  ])));

  const chartCard = fromHTML(`
    <div class="rs-chart-card">
      <div class="rs-chart" data-chart="transactions" style="--rs-chart-h:300px"></div>
      <p class="rs-chart-note">Values are a count of transactions processed, not a monetary value.</p>
    </div>`);
  host.appendChild(chartCard);

  host.appendChild(evidenceDrawer(src, monthlyTable(t.months, [
    { label: 'This year (count)', data: t.monthly, format: (x) => formatCount(x) },
    { label: 'Prior year (count)', data: t.priorMonthly, format: (x) => formatCount(x) },
  ])));

  sec.__mount = () => mountTransactions(
    chartCard.querySelector('[data-chart="transactions"]'), t, windowFor(t, ctx.period),
  );

  return sec;
}
