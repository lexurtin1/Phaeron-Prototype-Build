/**
 * Account header — identity, tier, source status and refresh time.
 *
 * Hosts the "sources live" chip that the SnapshotAssemblyWheel collapses into.
 * The chip is present but hidden from the first paint so the wheel has a real
 * element to measure and morph towards.
 */

import { esc, formatRelative, formatDateTime } from '../format.js';
import { fromHTML } from './dom.js';
import { toneForState } from './states.js';

/**
 * @param {import('../schemas.js').RelationshipSnapshot} snapshot
 * @param {{title?: string|null}} [opts] optional factual title from the workflow decision
 */
export function render(snapshot, opts = {}) {
  const { account, sources } = snapshot;
  const liveCount = sources.filter((s) => s.state === 'live').length;
  const degraded = sources.filter((s) => s.state === 'delayed' || s.state === 'unavailable');

  // The chip states the true mix rather than rounding up to "all live".
  const chipText = degraded.length === 0
    ? `${liveCount} sources live`
    : `${liveCount} of ${sources.length} sources live`;
  const chipTone = degraded.some((s) => s.state === 'unavailable') ? 'severe'
    : degraded.length ? 'attention' : 'live';

  const lastRefresh = sources
    .map((s) => s.lastRefresh)
    .filter(Boolean)
    .sort()
    .pop();

  return fromHTML(`
    <header class="rs-header" data-block="account-header">
      <div class="rs-header-main">
        <div class="rs-header-identity">
          <h1 class="rs-account-name">${esc(account.name)}</h1>
          <div class="rs-header-meta">
            <span class="rs-ctn">${esc(snapshot.ctnLabel)}</span>
            <span class="rs-dot-sep" aria-hidden="true"></span>
            <span>${esc(account.tier)} · ${esc(account.segment)}</span>
            <span class="rs-dot-sep" aria-hidden="true"></span>
            <span>${esc(account.region)}</span>
          </div>
          ${opts.title ? `<p class="rs-header-title">${esc(opts.title)}</p>` : ''}
        </div>

        <div class="rs-header-status">
          <span class="rs-source-chip rs-pill-${esc(chipTone)}" id="rs-source-chip">
            <span class="rs-status-dot" aria-hidden="true"></span>
            ${esc(chipText)}
          </span>
          <span class="rs-refresh" title="${esc(formatDateTime(lastRefresh))}">
            Last refreshed ${esc(formatRelative(lastRefresh))}
          </span>
        </div>
      </div>

      <div class="rs-header-sources" aria-label="Source systems">
        ${sources.map((s) => `
          <span class="rs-src-chip" data-state="${esc(s.state)}" data-tone="${esc(toneForState(s.state))}">
            <span class="rs-status-dot" aria-hidden="true"></span>
            ${esc(s.name)}
          </span>`).join('')}
      </div>

      <p class="rs-simulated-note">
        Simulated data. Figures are generated for this prototype and are not drawn from any live
        Salesforce, billing, transaction or Jira system.
      </p>
    </header>
  `);
}

/** The chip the assembly wheel collapses into. */
export function statusChip(root) {
  return root.querySelector('#rs-source-chip');
}
