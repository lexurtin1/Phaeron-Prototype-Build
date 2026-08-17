/**
 * Deterministic pseudo-random source for the snapshot simulation.
 *
 * The contract this file exists to guarantee: the same CTN always produces the
 * same account, figures, tickets, projects and timestamps — on every refresh,
 * on every machine, forever. Nothing here reads the clock or Math.random().
 */

/** xmur3 string hash — turns a CTN into a 32-bit seed. */
export function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** mulberry32 — small, fast, well-distributed 32-bit PRNG. */
export function mulberry32(a) {
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A seeded generator bundle for one CTN.
 * @param {string} ctn three-digit CTN, e.g. "303"
 */
export function createRng(ctn) {
  const seedFn = xmur3(`calastone-relationship-snapshot:${ctn}`);
  const rand = mulberry32(seedFn());

  /** Float in [min, max). */
  const float = (min, max) => min + rand() * (max - min);

  /** Integer in [min, max] inclusive. */
  const int = (min, max) => Math.floor(float(min, max + 1));

  /** Pick one element. */
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  /** Pick n distinct elements, preserving relative order. */
  const sample = (arr, n) => {
    const pool = arr.map((v, i) => ({ v, i, k: rand() }));
    pool.sort((a, b) => a.k - b.k);
    return pool.slice(0, Math.min(n, arr.length)).sort((a, b) => a.i - b.i).map((x) => x.v);
  };

  /** True with probability p. */
  const chance = (p) => rand() < p;

  return { rand, float, int, pick, sample, chance };
}

/**
 * Build a monthly series with a trend and seeded noise.
 *
 * @param {ReturnType<createRng>} rng
 * @param {object} opts
 * @param {number} opts.months        how many months to emit
 * @param {number} opts.base          starting value
 * @param {number} opts.growth        per-month multiplier, e.g. 1.02
 * @param {number} opts.noise         fractional jitter, e.g. 0.08
 * @param {number} [opts.shock]       month index to apply a one-off dip/spike
 * @param {number} [opts.shockFactor] multiplier at the shock month
 * @returns {number[]}
 */
export function monthlySeries(rng, { months, base, growth, noise, shock, shockFactor }) {
  const out = [];
  let v = base;
  for (let i = 0; i < months; i++) {
    let value = v * (1 + rng.float(-noise, noise));
    if (shock != null && i === shock && shockFactor != null) value *= shockFactor;
    out.push(Math.max(0, Math.round(value)));
    v *= growth;
  }
  return out;
}

/** Offset an ISO instant by whole minutes. Keeps timestamps seeded and stable. */
export function isoMinus(iso, minutes) {
  return new Date(new Date(iso).getTime() - minutes * 60000).toISOString();
}

/** Offset an ISO instant by whole days. */
export function isoMinusDays(iso, days) {
  return isoMinus(iso, days * 24 * 60);
}
