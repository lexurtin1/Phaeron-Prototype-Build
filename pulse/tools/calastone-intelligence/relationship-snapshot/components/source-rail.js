/**
 * SourceStatusRail — the evidence surface.
 *
 * A strip along the foot of the dashboard. Each card states the source, its
 * state, its last successful refresh, how many records fed the snapshot, and an
 * evidence identifier.
 *
 * The cards fold away behind a disclosure. In the one-screen layout they start
 * folded: the account header already shows all four sources and their states,
 * so what the cards add is the evidence behind them — worth one click, not
 * worth a fifth of the dashboard.
 *
 * Delayed and unavailable states say *why*, quoting the mock source's own note,
 * and stop there — no commentary, no assessment of impact.
 */

import { esc, formatCount, formatRelative, formatDateTime, humanise } from '../format.js';
import { fromHTML } from './dom.js';
import { toneForState } from './states.js';
import { animate, stagger, DUR } from '../motion/motion.js';

/**
 * @param {import('../schemas.js').RelationshipSnapshot} snapshot
 */
/**
 * @param {import('../schemas.js').RelationshipSnapshot} snapshot
 * @param {{collapsed?: boolean}} [opts] start folded — used by the one-screen layout
 */
export function render(snapshot, opts = {}) {
  const sources = snapshot.sources;
  const collapsed = Boolean(opts.collapsed);
  const live = sources.filter((s) => s.state === 'live').length;

  const rail = fromHTML(`
    <aside class="rs-rail" aria-labelledby="rs-rail-title">
      <div class="rs-rail-head">
        <h2 class="rs-rail-title" id="rs-rail-title">Sources</h2>
        <span class="rs-rail-sub">Evidence for every figure shown · ${live} of ${sources.length} live</span>
        <button type="button" class="rs-rail-toggle" aria-controls="rs-rail-body"
                aria-expanded="${collapsed ? 'false' : 'true'}">
          ${collapsed ? 'Show evidence' : 'Hide evidence'}
          <span class="rs-kpi-chevron" aria-hidden="true"></span>
        </button>
      </div>
      <div class="rs-rail-body" id="rs-rail-body"${collapsed ? ' hidden' : ''}>
        <div class="rs-rail-list"></div>
        <p class="rs-rail-note">
          All four sources are simulated for this prototype. Evidence references are generated
          placeholders and do not resolve to a real record.
        </p>
      </div>
    </aside>
  `);

  const list = rail.querySelector('.rs-rail-list');
  for (const s of sources) list.appendChild(card(s));

  const toggle = rail.querySelector('.rs-rail-toggle');
  const railBody = rail.querySelector('.rs-rail-body');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    railBody.hidden = open;
    toggle.firstChild.textContent = open ? 'Show evidence ' : 'Hide evidence ';
  });

  return rail;
}

function card(s) {
  const tone = toneForState(s.state);
  return fromHTML(`
    <article class="rs-src" data-source="${esc(s.id)}" data-state="${esc(s.state)}" data-tone="${esc(tone)}">
      <div class="rs-src-head">
        <span class="rs-status-dot" aria-hidden="true"></span>
        <span class="rs-src-name">${esc(s.name)}</span>
        <span class="rs-pill rs-pill-${esc(tone)}">${esc(humanise(s.state))}</span>
      </div>
      <p class="rs-src-label">${esc(s.label)}</p>

      <dl class="rs-src-facts">
        <div>
          <dt>Last successful refresh</dt>
          <dd${s.lastRefresh ? ` title="${esc(formatDateTime(s.lastRefresh))}"` : ''}>${
            s.lastRefresh ? esc(formatRelative(s.lastRefresh)) : 'No successful refresh'
          }</dd>
        </div>
        <div>
          <dt>Records used</dt>
          <dd>${s.state === 'unavailable' ? 'None' : esc(formatCount(s.recordsUsed))}</dd>
        </div>
        <div>
          <dt>Evidence ref</dt>
          <dd class="rs-mono">${esc(s.evidenceId)}</dd>
        </div>
      </dl>

      ${s.note ? `<p class="rs-src-note">${esc(s.note)}</p>` : ''}

      <a class="rs-src-link" href="#" aria-disabled="true"
         title="Placeholder — this prototype does not link to a live record"
         onclick="return false">Open in ${esc(s.name)} →</a>
    </article>
  `);
}

/**
 * Put every card into its "checking" state, with the teal sweep, before
 * retrieval begins. Called while the assembly wheel is running.
 */
export function renderChecking() {
  const rail = fromHTML(`
    <aside class="rs-rail" aria-labelledby="rs-rail-title">
      <div class="rs-rail-head">
        <h2 class="rs-rail-title" id="rs-rail-title">Sources</h2>
        <span class="rs-rail-sub">Checking availability…</span>
      </div>
      <div class="rs-rail-list"></div>
    </aside>
  `);
  return rail;
}

/** Cards appear last in the assembly sequence. */
export function animateIn(rail) {
  const cards = rail.querySelectorAll('.rs-src');
  if (!cards.length) return { finished: Promise.resolve() };
  return animate(
    cards,
    { opacity: [0, 1], transform: ['translateX(8px)', 'translateX(0px)'] },
    { duration: DUR.base, delay: stagger(0.05) },
  );
}
