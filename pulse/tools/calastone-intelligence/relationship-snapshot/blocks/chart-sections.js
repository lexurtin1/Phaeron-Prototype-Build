/**
 * The paired row: transaction volume and billing revenue year to date.
 *
 * Two cards of equal width, side by side, showing the same period through two
 * different questions. Transaction volume is a trend — the shape of the year.
 * Billing revenue is a position — how far through last year's number this year
 * has come. Neither card hides anything behind a toggle: what the source gave
 * us is on the face of the card, including the evidence for it.
 */

import {
  esc, formatCurrency, formatCount, formatRelative, formatVariance,
  variance, varianceDirection, humanise,
} from '../format.js';
import { fromHTML, section, body } from '../components/dom.js';
import { unavailableBlock, delayedNotice } from '../components/states.js';
import { PERIOD_MONTHS } from '../config.js';
import { mount as mountTransactions } from '../charts/transactions.js';
import { hasTarget, buildOption as buildProgress } from '../charts/billing-progress.js';
import { mountChart } from '../charts/mount.js';

/** Narrow the month window when a period other than YTD was requested. */
function windowFor(series, period) {
  const count = PERIOD_MONTHS[period] ?? series.months.length;
  if (!count || count >= series.months.length) return undefined;
  return { months: series.months.slice(-count) };
}

/**
 * The headline figures printed on the card's own head.
 *
 * A card that says only "Billing revenue" is a filing cabinet. The figure the
 * card is about belongs where the eye lands first.
 */
function headline(value, v) {
  if (value == null) return '<span class="rs-sum-none">No figures available</span>';
  return `<span class="rs-sum-fig">${esc(value)}</span>`
    + (v == null ? ''
      : ` <span class="rs-sum-delta rs-tone-${esc(varianceDirection(v))}">${esc(formatVariance(v))}</span>`);
}

/**
 * The evidence for a card, on the card.
 *
 * This used to live behind a disclosure. It does not any more: a figure whose
 * provenance is one click away is a figure most people never check.
 */
function evidenceLine(src, note = '') {
  return fromHTML(`
    <p class="rs-evidence-line">
      ${note ? `${esc(note)} · ` : ''}${esc(src?.name || 'Source')} · ${esc(humanise(src?.state))}
      · refreshed ${esc(formatRelative(src?.lastRefresh))}
      · ${esc(formatCount(src?.recordsUsed))} records
      · <span class="rs-mono">${esc(src?.evidenceId || '—')}</span>
    </p>`);
}

/* ─────────────────── transaction volume ─────────────────── */

export function renderTransactionsSection(snapshot, ctx = {}) {
  const t = snapshot.transactions;
  const src = snapshot.sources.find((s) => s.id === 'transactions');
  const v = t.available ? variance(t.ytd, t.priorYtd) : null;

  const sec = section('transactions', 'Transaction volume', {
    subtitle: `${snapshot.period.label} · Transactions (simulated)`,
    summary: headline(t.available ? formatCount(t.ytd) : null, v),
  });
  const host = body(sec);

  if (!t.available) {
    host.appendChild(unavailableBlock('Transactions', src?.note));
    return sec;
  }

  if (src?.state === 'delayed') host.appendChild(delayedNotice('Transactions', src.note));

  const chartCard = fromHTML(`
    <div class="rs-chart-card">
      <div class="rs-chart" data-chart="transactions"></div>
    </div>`);
  host.appendChild(chartCard);
  host.appendChild(evidenceLine(src, 'A count of transactions processed, not a monetary value'));

  sec.__mount = () => mountTransactions(
    chartCard.querySelector('[data-chart="transactions"]'), t, windowFor(t, ctx.period),
  );

  return sec;
}

/* ─────────────────── billing revenue year to date ─────────────────── */

export function renderBillingSection(snapshot) {
  const b = snapshot.billing;
  const src = snapshot.sources.find((s) => s.id === 'billing');
  const v = b.available ? variance(b.ytd, b.priorYtd) : null;

  const sec = section('billing-revenue', 'Billing revenue YTD', {
    subtitle: `Against last year · Billing (simulated)`,
    summary: headline(b.available ? formatCurrency(b.ytd) : null, v),
  });
  const host = body(sec);

  if (!b.available) {
    host.appendChild(unavailableBlock('Billing', src?.note));
    return sec;
  }

  if (src?.state === 'delayed') host.appendChild(delayedNotice('Billing', src.note));

  if (!hasTarget(b)) {
    // No prior year, so no ring: a circle at a percentage of nothing would be
    // an invented figure, which is the one thing this feature must never show.
    host.appendChild(fromHTML(`
      <div class="rs-progress-empty">
        <div class="rs-progress-total">${esc(formatCurrency(b.ytd))}</div>
        <p class="rs-empty-inline">No prior-year total is recorded, so there is nothing to track against.</p>
      </div>`));
    host.appendChild(evidenceLine(src));
    return sec;
  }

  const ring = fromHTML(`
    <div class="rs-progress">
      <div class="rs-chart rs-progress-ring" data-chart="billing-progress"></div>
      <dl class="rs-progress-facts">
        <div>
          <dt>Billed this year</dt>
          <dd class="rs-progress-total">${esc(formatCurrency(b.ytd))}</dd>
        </div>
        <div>
          <dt>Last year, full year</dt>
          <dd>${esc(formatCurrency(b.priorFullYear))}</dd>
        </div>
      </dl>
    </div>`);
  host.appendChild(ring);
  host.appendChild(evidenceLine(src));

  sec.__mount = () => {
    const option = buildProgress(b);
    if (option) {
      mountChart(ring.querySelector('[data-chart="billing-progress"]'), option, { density: false });
    }
  };

  return sec;
}
