/**
 * Motion wrapper.
 *
 * Every animation in this feature routes through here for two reasons:
 *   1. `prefers-reduced-motion` is enforced in ONE place rather than being
 *      re-checked at forty call sites (and forgotten at one of them).
 *   2. Motion's vanilla build has no React `layout` prop, so shared layout
 *      transitions are done with an explicit FLIP helper — see `flip()`.
 *
 * Under reduced motion every helper still puts the element in its FINAL state.
 * Motion is decoration here, never the thing that makes content appear.
 */

import { animate as motionAnimate, stagger as motionStagger } from '../vendor/motion.js';

export { motionStagger as stagger };

/** Restrained interaction band, per the design language. */
export const DUR = {
  fast: 0.15,
  base: 0.25,
  slow: 0.35,
};

export const EASE = [0.22, 0.61, 0.36, 1]; // matches --ease-out in the design tokens

let reducedQuery = null;

/** @returns {boolean} */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  if (!reducedQuery) reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return reducedQuery.matches;
}

/**
 * Apply the end state of a keyframe set immediately, with no animation.
 * Mirrors how Motion resolves keyframe arrays: last value wins.
 */
function applyFinal(elements, keyframes) {
  const list = toArray(elements);
  for (const el of list) {
    for (const [prop, value] of Object.entries(keyframes)) {
      const final = Array.isArray(value) ? value[value.length - 1] : value;
      if (final == null) continue;
      if (prop === 'pathLength') {
        // SVG ring: express final pathLength via the dash properties Motion uses.
        el.style.strokeDasharray = '1 1';
        el.style.strokeDashoffset = String(1 - Number(final));
      } else if (prop in el.style || prop.startsWith('--')) {
        el.style[prop] = typeof final === 'number' && needsUnit(prop)
          ? `${final}px` : String(final);
      } else {
        el.style.setProperty(prop, String(final));
      }
    }
  }
}

function needsUnit(prop) {
  return ['top', 'left', 'right', 'bottom', 'width', 'height'].includes(prop);
}

function toArray(target) {
  if (!target) return [];
  if (typeof target === 'string') return [...document.querySelectorAll(target)];
  if (target instanceof Element) return [target];
  return [...target];
}

/**
 * Animate, respecting reduced motion.
 *
 * Returns a thenable-compatible object in both branches so callers can always
 * `await anim.finished` without branching themselves.
 */
export function animate(target, keyframes, options = {}) {
  if (prefersReducedMotion()) {
    applyFinal(target, keyframes);
    return { finished: Promise.resolve(), stop() {}, cancel() {} };
  }
  return motionAnimate(target, keyframes, {
    duration: DUR.base,
    ease: EASE,
    ...options,
  });
}

/**
 * Entrance animation used across the dashboard: gentle fade + rise.
 * @param {Element|Element[]|string} target
 * @param {{delay?: number|Function, duration?: number, y?: number}} [opts]
 */
export function enter(target, opts = {}) {
  const { delay = 0, duration = DUR.slow, y = 10 } = opts;
  return animate(
    target,
    { opacity: [0, 1], transform: [`translateY(${y}px)`, 'translateY(0px)'] },
    { duration, delay, ease: EASE },
  );
}

/**
 * FLIP: animate a layout change that has already been committed to the DOM.
 *
 * Vanilla Motion has no `layout` prop — this is the equivalent. Measure before,
 * mutate, measure after, then animate the inverse delta back to zero so the
 * browser paints a continuous move rather than a jump.
 *
 * @param {Element[]} elements elements whose position may change
 * @param {() => void} mutate  the DOM change to perform
 * @param {{duration?: number}} [opts]
 */
export function flip(elements, mutate, opts = {}) {
  const list = toArray(elements);

  if (prefersReducedMotion()) {
    mutate();
    return { finished: Promise.resolve() };
  }

  const before = new Map();
  for (const el of list) before.set(el, el.getBoundingClientRect());

  mutate();

  const animations = [];
  for (const el of list) {
    const first = before.get(el);
    const last = el.getBoundingClientRect();
    if (!first || !last.width) continue;

    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const dw = first.width && last.width ? first.width / last.width : 1;

    // Sub-pixel moves aren't worth a compositor layer.
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(dw - 1) < 0.01) continue;

    animations.push(motionAnimate(
      el,
      {
        transform: [`translate(${dx}px, ${dy}px) scaleX(${dw})`, 'translate(0px, 0px) scaleX(1)'],
      },
      { duration: opts.duration ?? DUR.slow, ease: EASE },
    ));
  }

  return {
    finished: Promise.all(animations.map((a) => a.finished ?? Promise.resolve())),
  };
}

/**
 * Count a number up. Used by the assembly wheel's centre readout.
 * Writes through a formatter so the caller controls the displayed string.
 *
 * @param {Element} el
 * @param {number} from
 * @param {number} to
 * @param {(v:number)=>string} format
 * @param {{duration?: number}} [opts]
 */
export function countUp(el, from, to, format, opts = {}) {
  if (!el) return { finished: Promise.resolve() };
  if (prefersReducedMotion()) {
    el.textContent = format(to);
    return { finished: Promise.resolve() };
  }
  const duration = opts.duration ?? DUR.slow;
  const start = performance.now();
  let raf = 0;
  const finished = new Promise((resolve) => {
    const tick = (now) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else resolve();
    };
    raf = requestAnimationFrame(tick);
  });
  return { finished, stop: () => cancelAnimationFrame(raf) };
}

/** Await a delay that collapses to zero under reduced motion. */
export function pause(seconds) {
  if (prefersReducedMotion()) return Promise.resolve();
  return new Promise((r) => setTimeout(r, seconds * 1000));
}
