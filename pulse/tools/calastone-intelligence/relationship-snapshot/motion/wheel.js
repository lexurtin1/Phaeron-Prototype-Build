/**
 * SnapshotAssemblyWheel
 *
 * A circular SVG retrieval-progress indicator shown while a relationship
 * snapshot is being assembled.
 *
 * The honesty rule this component is built around: the ring only ever advances
 * when a retrieval stage has ACTUALLY completed. `setStage(n)` is called by the
 * repository's staged loader — there is no timer quietly filling the ring, and
 * no percentage is displayed that isn't backed by a real stage transition.
 *
 * On completion the wheel FLIPs into the small "4 sources live" chip in the
 * account header, so the progress UI becomes the status UI rather than simply
 * vanishing.
 */

import { ASSEMBLY_STAGES, SOURCE_DEFS } from '../config.js';
import { esc } from '../format.js';
import { animate, countUp, prefersReducedMotion, DUR, EASE } from './motion.js';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * @param {object} opts
 * @param {number} [opts.total] number of sources (defaults to the four simulated systems)
 */
export function createAssemblyWheel({ total = SOURCE_DEFS.length } = {}) {
  const root = document.createElement('div');
  root.className = 'rs-wheel';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  root.setAttribute('aria-label', 'Assembling relationship snapshot');

  root.innerHTML = `
    <div class="rs-wheel-ring">
      <svg viewBox="0 0 128 128" aria-hidden="true">
        <circle class="rs-wheel-track" cx="64" cy="64" r="${RADIUS}" />
        <circle class="rs-wheel-progress" cx="64" cy="64" r="${RADIUS}"
                pathLength="1"
                stroke-dasharray="1 1" stroke-dashoffset="1"
                transform="rotate(-90 64 64)" />
      </svg>
      <div class="rs-wheel-centre">
        <div class="rs-wheel-count"><span class="rs-wheel-n">0</span><span class="rs-wheel-of">/${total}</span></div>
        <div class="rs-wheel-label">Sources ready</div>
      </div>
    </div>
    <ul class="rs-wheel-sources">
      ${SOURCE_DEFS.map((s) => `
        <li class="rs-wheel-source" data-source="${esc(s.id)}" data-state="pending">
          <span class="rs-wheel-dot" aria-hidden="true"></span>
          <span class="rs-wheel-name">${esc(s.name)}</span>
          <span class="rs-wheel-state">Waiting</span>
        </li>`).join('')}
    </ul>
    <p class="rs-wheel-stage" id="rs-wheel-stage">Confirming CTN…</p>
    <p class="rs-wheel-note">Simulated sources — no live system is contacted.</p>
  `;

  const progress = root.querySelector('.rs-wheel-progress');
  const nEl = root.querySelector('.rs-wheel-n');
  const stageEl = root.querySelector('.rs-wheel-stage');

  let readyCount = 0;

  /** Ring fill is driven by Motion's SVG pathLength, per the brief. */
  function setRing(fraction) {
    return animate(
      progress,
      { pathLength: [progressValue(), fraction] },
      { duration: DUR.slow, ease: EASE },
    );
  }

  function progressValue() {
    const offset = parseFloat(progress.getAttribute('stroke-dashoffset') || '1');
    return 1 - offset;
  }

  /**
   * Advance to a completed retrieval stage.
   * @param {number} stage 1-4, matching ASSEMBLY_STAGES
   * @param {Array<{id:string,name:string,state:string}>} sources sources that just resolved
   */
  function setStage(stage, sources = []) {
    const def = ASSEMBLY_STAGES[stage - 1];
    if (!def) return;

    stageEl.textContent = def.label;
    setRing(def.at);

    for (const src of sources) {
      const li = root.querySelector(`.rs-wheel-source[data-source="${src.id}"]`);
      if (!li) continue;
      li.dataset.state = src.state;
      li.querySelector('.rs-wheel-state').textContent = stateLabel(src.state);
      if (!prefersReducedMotion()) {
        animate(li, { opacity: [0.55, 1], transform: ['translateX(-4px)', 'translateX(0px)'] },
          { duration: DUR.base });
      }
      // Only a source that actually returned data counts toward "sources ready".
      if (src.state !== 'unavailable') readyCount += 1;
    }

    if (sources.length) {
      countUp(nEl, Number(nEl.textContent) || 0, readyCount, (v) => String(Math.round(v)),
        { duration: DUR.base });
    }
  }

  /**
   * Collapse the wheel into the header status chip.
   * @param {Element} targetChip the chip to morph into
   */
  async function collapseInto(targetChip) {
    if (!targetChip) {
      root.remove();
      return;
    }
    if (prefersReducedMotion()) {
      root.remove();
      targetChip.classList.add('is-visible');
      return;
    }

    const from = root.getBoundingClientRect();
    const to = targetChip.getBoundingClientRect();
    if (!from.width || !to.width) {
      root.remove();
      targetChip.classList.add('is-visible');
      return;
    }

    const scale = Math.max(0.18, to.height / from.height);
    const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2);

    root.style.transformOrigin = 'center center';
    await animate(root, {
      transform: ['translate(0px, 0px) scale(1)', `translate(${dx}px, ${dy}px) scale(${scale})`],
      opacity: [1, 0],
    }, { duration: DUR.slow, ease: EASE }).finished;

    root.remove();
    targetChip.classList.add('is-visible');
    animate(targetChip, { opacity: [0, 1], transform: ['scale(0.9)', 'scale(1)'] },
      { duration: DUR.base });
  }

  /** Mark a stage as failed without pretending it completed. */
  function fail(message) {
    stageEl.textContent = message;
    root.dataset.failed = 'true';
  }

  return { el: root, setStage, collapseInto, fail, get ready() { return readyCount; } };
}

function stateLabel(state) {
  switch (state) {
    case 'live': return 'Live';
    case 'delayed': return 'Delayed';
    case 'unavailable': return 'Unavailable';
    case 'checking': return 'Checking';
    default: return 'Waiting';
  }
}

export { CIRCUMFERENCE };
