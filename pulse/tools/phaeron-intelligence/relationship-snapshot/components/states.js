/**
 * Empty, unavailable, delayed and error states.
 *
 * These exist so a block never renders a blank box or, worse, a plausible-
 * looking zero. When data is missing the surface says exactly what is missing
 * and why — factually, with no assessment of what it means.
 */

import { esc } from '../format.js';
import { fromHTML } from './dom.js';
import { ACCOUNT_DIRECTORY } from '../data/directory.js';

/** Maps a source state to the tone used across pills, dots and panels. */
export function toneForState(state) {
  switch (state) {
    case 'live': return 'live';
    case 'delayed': return 'attention';
    case 'unavailable': return 'severe';
    default: return 'neutral';
  }
}

/**
 * A block whose source returned nothing.
 * @param {string} sourceName
 * @param {string|null} reason exact text from the mock source, if present
 */
export function unavailableBlock(sourceName, reason) {
  return fromHTML(`
    <div class="rs-state rs-state-severe" role="status">
      <span class="rs-state-dot" aria-hidden="true"></span>
      <div>
        <p class="rs-state-title">${esc(sourceName)} unavailable</p>
        <p class="rs-state-body">${esc(reason || `No data was returned by ${sourceName} for this snapshot.`)}</p>
      </div>
    </div>
  `);
}

/**
 * A block whose source responded, but with stale data.
 * The figures still render — this banner sits above them.
 */
export function delayedNotice(sourceName, reason) {
  return fromHTML(`
    <div class="rs-state rs-state-attention" role="status">
      <span class="rs-state-dot" aria-hidden="true"></span>
      <div>
        <p class="rs-state-title">${esc(sourceName)} delayed</p>
        <p class="rs-state-body">${esc(reason || `The most recent ${sourceName} refresh did not complete. Figures shown are from the last successful extract.`)}</p>
      </div>
    </div>
  `);
}

/** A genuinely empty result — the query ran and found nothing. */
export function emptyState(message) {
  return fromHTML(`
    <div class="rs-state rs-state-empty" role="status">
      <p class="rs-state-body">${esc(message)}</p>
    </div>
  `);
}

/** A failure in the application itself, not in a source. */
export function errorState(message) {
  return fromHTML(`
    <div class="rs-state rs-state-severe" role="alert">
      <span class="rs-state-dot" aria-hidden="true"></span>
      <div>
        <p class="rs-state-title">Could not complete the snapshot</p>
        <p class="rs-state-body">${esc(message)}</p>
      </div>
    </div>
  `);
}

/**
 * The account clarification card.
 *
 * Shown when a relationship snapshot was requested and no account could be
 * identified. Critically, NO data has been retrieved at the point this renders
 * — the gate runs before the repository is ever called.
 *
 * When the request named an organisation the directory does not hold, the card
 * says so in the user's own words. That sentence is the whole point of the
 * card: without it a user who asked about one company, then answered with a
 * CTN, was shown a dashboard headed with a different company's name and no
 * indication that the two were unrelated.
 *
 * @param {(ctn:string)=>void} onPick called when a user selects an account
 * @param {{entity?: string|null}} [opts] the unrecognised name, if one was given
 */
export function clarificationCard(onPick, opts = {}) {
  const entity = opts.entity;

  const lead = entity
    ? `<p class="rs-clarify-body">
         There is no account named <strong>${esc(entity)}</strong> in this simulation, so no
         snapshot can be assembled for it. Pick one of the simulated accounts below, or give a
         three-digit CTN ID.
       </p>`
    : `<p class="rs-clarify-body">
         Which account? Give the three-digit CTN ID — for example CTN 303 — or pick one below.
       </p>`;

  const node = fromHTML(`
    <div class="rs-clarify" role="status">
      ${lead}
      <div class="rs-clarify-examples">
        <span class="rs-clarify-label">Accounts in this simulation</span>
        <div class="rs-clarify-chips">
          ${ACCOUNT_DIRECTORY.map((a) => `
            <button type="button" class="rs-clarify-chip" data-ctn="${esc(a.ctn)}">
              <span class="rs-clarify-ctn">CTN ${esc(a.ctn)}</span>
              <span class="rs-clarify-name">${esc(a.name)}</span>
            </button>`).join('')}
        </div>
      </div>
    </div>
  `);

  node.querySelectorAll('.rs-clarify-chip').forEach((btn) => {
    btn.addEventListener('click', () => onPick?.(btn.dataset.ctn));
  });

  return node;
}
