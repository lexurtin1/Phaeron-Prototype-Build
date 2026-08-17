/**
 * Empty, unavailable, delayed and error states.
 *
 * These exist so a block never renders a blank box or, worse, a plausible-
 * looking zero. When data is missing the surface says exactly what is missing
 * and why — factually, with no assessment of what it means.
 */

import { esc } from '../format.js';
import { fromHTML } from './dom.js';

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
 * The CTN clarification card.
 *
 * Shown when a relationship snapshot was requested without a CTN. Critically,
 * NO data has been retrieved at the point this renders — the gate runs before
 * the repository is ever called.
 *
 * @param {(ctn:string)=>void} onPick called when a user selects an example CTN
 */
export function clarificationCard(onPick) {
  const node = fromHTML(`
    <div class="rs-clarify" role="status">
      <p class="rs-clarify-body">
        Please provide the three-digit CTN ID for the specific entity, for example CTN 303.
      </p>
      <div class="rs-clarify-examples">
        <span class="rs-clarify-label">Examples in this simulation</span>
        <div class="rs-clarify-chips">
          ${['101', '202', '303', '404', '505']
            .map((c) => `<button type="button" class="rs-clarify-chip" data-ctn="${c}">CTN ${c}</button>`)
            .join('')}
        </div>
      </div>
    </div>
  `);

  node.querySelectorAll('.rs-clarify-chip').forEach((btn) => {
    btn.addEventListener('click', () => onPick?.(btn.dataset.ctn));
  });

  return node;
}
