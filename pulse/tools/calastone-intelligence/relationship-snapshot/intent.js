/**
 * Workflow intent: classification, and the CTN gate.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  DIVISION OF RESPONSIBILITY
 *
 *  Claude decides   : is this a relationship_snapshot request? which display
 *                     focus? which period? which approved block order? what
 *                     factual title?
 *
 *  Code decides     : whether a valid CTN is present, and therefore whether ANY
 *                     data may be retrieved.
 *
 *  The CTN gate is deliberately NOT delegated to the model. It is a regex, it
 *  is exact, and it cannot be talked out of its answer. Claude is never asked
 *  to guess a CTN or to map an organisation name onto one.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { WorkflowDecisionSchema, safeValidate } from './schemas.js';
import { DEFAULT_BLOCK_ORDER, FOCUS_VALUES, PERIOD_VALUES } from './config.js';

/** A valid CTN is exactly `CTN` followed by three digits. */
export const CTN_PATTERN = /\bCTN\s*([0-9]{3})\b/i;

/**
 * Extract the CTN from free text.
 *
 * Deterministic. Returns the first match, or null. Note the `\b` on both sides:
 * "CTN 3033" and "CTN 30" are rejected rather than truncated, because a partial
 * match on an identifier is worse than no match at all.
 *
 * @param {string} text
 * @returns {string|null} three digits, e.g. "303"
 */
export function extractCtn(text) {
  if (typeof text !== 'string') return null;
  const match = text.match(CTN_PATTERN);
  return match ? match[1] : null;
}

/** @param {string} text */
export function hasValidCtn(text) {
  return extractCtn(text) !== null;
}

/* ───────────────────── local classifier (offline fallback) ───────────────────── */

const SNAPSHOT_HINTS = [
  /relationship\s+(snapshot|overview|summary|review)/i,
  /account\s+(snapshot|overview|summary)/i,
  /\bsnapshot\b/i,
  /show\s+(me\s+)?(billing|transactions|operational|operations|delivery|projects)/i,
  /billing\s+and\s+transactions/i,
  /operational\s+activity/i,
];

const FOCUS_HINTS = [
  { focus: 'billing', re: /\bbilling\b|\brevenue\b|\binvoic/i },
  { focus: 'transactions', re: /\btransaction/i },
  { focus: 'operations', re: /\boperational\b|\boperations\b|\bticket/i },
  { focus: 'delivery', re: /\bdelivery\b|\bproject|\bjira\b|\bmilestone/i },
  { focus: 'relationship', re: /\brelationship\b|\bowner|\bcontact|\bstakeholder/i },
];

const PERIOD_HINTS = [
  { period: 'current_month', re: /\bthis month\b|\bcurrent month\b/i },
  { period: 'last_3_months', re: /\blast (3|three) months\b|\blast quarter\b/i },
  { period: 'last_6_months', re: /\blast (6|six) months\b|\bhalf year\b/i },
  { period: 'ytd', re: /\bytd\b|\byear to date\b|\bthis year\b/i },
];

/**
 * A deterministic classifier used when the server route is unavailable, and as
 * the reference implementation the model's output is compared against in tests.
 *
 * @param {string} text
 * @returns {import('./schemas.js').WorkflowDecision}
 */
export function classifyLocally(text) {
  const isSnapshot = SNAPSHOT_HINTS.some((re) => re.test(text));

  // A bare "CTN 303" with no other intent still reads as a snapshot request.
  const bareCtn = !isSnapshot && hasValidCtn(text) && text.trim().length <= 24;

  if (!isSnapshot && !bareCtn) {
    return WorkflowDecisionSchema.parse({ workflow: 'other' });
  }

  const focus = FOCUS_HINTS.find((h) => h.re.test(text))?.focus ?? null;
  const period = PERIOD_HINTS.find((h) => h.re.test(text))?.period ?? 'ytd';

  return WorkflowDecisionSchema.parse({
    workflow: 'relationship_snapshot',
    focus,
    period,
    blockOrder: null,
    title: null,
  });
}

/* ───────────────────── server classification ───────────────────── */

/**
 * Ask the server route to classify the prompt.
 *
 * Falls back to `classifyLocally` on ANY failure — a missing API key, a network
 * error, or a malformed response. A degraded classifier is far better than a
 * dead feature, and the CTN gate and all figures are unaffected either way.
 *
 * @param {string} text
 * @param {{signal?: AbortSignal, endpoint?: string}} [opts]
 * @returns {Promise<{decision: import('./schemas.js').WorkflowDecision, source: 'server'|'local', error?: string}>}
 */
export async function classifyWorkflow(text, opts = {}) {
  const endpoint = opts.endpoint || '/api/snapshot-intent';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: text }),
      signal: opts.signal,
    });

    if (!res.ok) {
      return { decision: classifyLocally(text), source: 'local', error: `HTTP ${res.status}` };
    }

    const payload = await res.json();

    // The route answers 200 with source:'default' when it could not actually
    // consult the model (no API key, upstream error, timeout). That is a
    // placeholder, not a classification — treating it as authoritative would
    // silently misclassify every prompt as 'other'.
    if (payload?.source !== 'model') {
      return {
        decision: classifyLocally(text),
        source: 'local',
        error: payload?.note || 'server did not classify',
      };
    }

    // Re-validate on the client even though the server allow-lists: the browser
    // must never trust a payload just because it arrived from our own origin.
    const parsed = safeValidate(WorkflowDecisionSchema, payload?.decision);
    if (!parsed.ok) {
      return { decision: classifyLocally(text), source: 'local', error: parsed.error };
    }

    return { decision: parsed.data, source: 'server' };
  } catch (err) {
    return {
      decision: classifyLocally(text),
      source: 'local',
      error: err?.name === 'AbortError' ? 'aborted' : String(err?.message || err),
    };
  }
}

/* ───────────────────── the gate ───────────────────── */

/**
 * @typedef {object} PendingWorkflow
 * @property {string} prompt   the original prompt, preserved verbatim
 * @property {import('./schemas.js').WorkflowDecision} decision
 * @property {number} at
 */

/**
 * Decide what to do with a prompt.
 *
 * Returns one of:
 *   {action:'ignore'}                     not our workflow — the host chat handles it
 *   {action:'clarify', pending}           snapshot wanted, CTN missing. NO DATA FETCHED.
 *   {action:'run', ctn, decision}         snapshot wanted, CTN valid
 *
 * @param {string} text
 * @param {import('./schemas.js').WorkflowDecision} decision
 * @param {PendingWorkflow|null} pending a workflow awaiting a CTN from a prior turn
 */
export function gate(text, decision, pending = null) {
  const ctn = extractCtn(text);

  // A pending workflow is resolved by any later message carrying a valid CTN,
  // even one as terse as "CTN 101".
  if (pending && ctn) {
    return {
      action: 'run',
      ctn,
      decision: pending.decision,
      resumed: true,
      originalPrompt: pending.prompt,
    };
  }

  if (decision.workflow !== 'relationship_snapshot') {
    return { action: 'ignore' };
  }

  if (!ctn) {
    return {
      action: 'clarify',
      pending: { prompt: text, decision, at: Date.now() },
    };
  }

  return { action: 'run', ctn, decision, resumed: false };
}

export { DEFAULT_BLOCK_ORDER, FOCUS_VALUES, PERIOD_VALUES };
