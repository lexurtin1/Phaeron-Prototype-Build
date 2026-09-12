/**
 * Relationship Snapshot — display formatters.
 *
 * Pure functions, no DOM. Every figure the dashboard renders passes through
 * here so units and precision are stated consistently and never implied.
 */

import { AS_OF, MONTH_NAMES } from './config.js';

const GBP_SYMBOL = '£';

/** @param {number} n */
export function formatCurrency(n, { compact = false } = {}) {
  if (n == null || !Number.isFinite(n)) return '—';
  if (compact) return GBP_SYMBOL + compactNumber(n);
  return GBP_SYMBOL + Math.round(n).toLocaleString('en-GB');
}

/** @param {number} n */
export function formatCount(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-GB');
}

/** 1_284_000 -> "1.28m". Used only where the exact value is also available on hover. */
export function compactNumber(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return trimZero(n / 1e9) + 'bn';
  if (abs >= 1e6) return trimZero(n / 1e6) + 'm';
  if (abs >= 1e3) return trimZero(n / 1e3) + 'k';
  return String(Math.round(n));
}

function trimZero(v) {
  const s = v.toFixed(v < 10 ? 2 : 1);
  return s.replace(/\.?0+$/, '');
}

/**
 * Year-on-year variance. Returns null when there is no comparable prior figure,
 * so the UI can say "no prior-year comparison" rather than print a fake 0%.
 */
export function variance(current, prior) {
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior === 0) return null;
  return (current - prior) / prior;
}

/** @param {number|null} v fraction, e.g. 0.082 */
export function formatVariance(v) {
  if (v == null) return '—';
  const pct = v * 100;
  const sign = pct > 0 ? '+' : '';
  return sign + pct.toFixed(1) + '%';
}

/** @param {number|null} v */
export function varianceDirection(v) {
  if (v == null) return 'flat';
  if (v > 0.001) return 'up';
  if (v < -0.001) return 'down';
  return 'flat';
}

/** ISO -> "17 Aug 2026" */
export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** ISO -> "17 Aug 2026, 09:00" */
export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${formatDate(iso)}, ${hh}:${mm}`;
}

/**
 * Relative time against the simulation's fixed "as of" instant, not wall clock,
 * so "12 minutes ago" stays true whenever the prototype is opened.
 */
export function formatRelative(iso, asOf = AS_OF) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const now = new Date(asOf).getTime();
  if (Number.isNaN(then) || Number.isNaN(now)) return '—';
  const mins = Math.round((now - then) / 60000);
  if (mins < 0) return 'scheduled';
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  if (days < 31) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

/** Whole days between an ISO date and the simulation's "as of". */
export function daysSince(iso, asOf = AS_OF) {
  const then = new Date(iso).getTime();
  const now = new Date(asOf).getTime();
  if (Number.isNaN(then) || Number.isNaN(now)) return null;
  return Math.max(0, Math.floor((now - then) / 86400000));
}

/**
 * Ticket age, phrased for a table cell.
 *
 * Stays in days up to 90. "47 days" is materially more useful than "1 month"
 * when the figure is being read as an operational fact, and rounding it away
 * would be discarding precision the source actually has.
 */
export function formatAge(days) {
  if (days == null || !Number.isFinite(days)) return '—';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days <= 90) return `${days} days`;
  const months = Math.floor(days / 30);
  return `${months} months`;
}

/** snake_case enum -> "Snake case" for display. */
export function humanise(value) {
  if (!value) return '—';
  const s = String(value).replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Initials from a person's name, for avatar placeholders. */
export function initials(name) {
  if (!name) return '??';
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/** Escape untrusted text before it reaches innerHTML. */
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]));
}
