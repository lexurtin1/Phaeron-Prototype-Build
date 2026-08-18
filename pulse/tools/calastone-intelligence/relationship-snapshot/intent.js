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
 *
 *  A name IS resolved to a CTN, but by exact lookup over a fixed directory of
 *  fictional accounts (data/directory.js) — still code, still deterministic,
 *  and still never the model. A name the directory does not hold resolves to
 *  nothing at all, and the user is told which name was not recognised rather
 *  than being shown a dashboard headed with some other company.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { WorkflowDecisionSchema, safeValidate } from './schemas.js';
import { DEFAULT_BLOCK_ORDER, FOCUS_VALUES, PERIOD_VALUES } from './config.js';
import { lookupAccount, namedEntity, accountForCtn } from './data/directory.js';

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
  /relationship\s+(snapshot|overview|summary|review|picture)/i,
  /account\s+(snapshot|overview|summary|review|picture)/i,
  /\bsnapshot\b/i,
  /show\s+(me\s+)?(the\s+)?(billing|transactions|operational|operations|delivery|projects)/i,
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
 * Three independent signals claim a prompt:
 *
 *   1. A valid CTN anywhere in the message. `CTN nnn` is this feature's own
 *      identifier and nothing else in the module recognises it, so its presence
 *      is unambiguous however the sentence around it is phrased — "how are
 *      things going with CTN 303" needs no hint list to be understood.
 *   2. One of the phrasings below — a snapshot, overview, summary, review or
 *      picture. On its own this leads to the clarification card, not to data;
 *      combined with an account name it runs that account.
 *
 *  An account name on its own is NOT one of the signals, and that is deliberate.
 *  The accounts are real firms, and the host's own canned answers are about the
 *  same firms — "How are we charging BlackRock?" and "Relationship status with
 *  Legal & General" are questions this feature has no business taking. The name
 *  decides WHICH account once a request has been recognised as a snapshot; it
 *  never decides that a request is one.
 *
 * The hint list is deliberately narrow: it must not swallow prompts the host's
 * own answers cover (e.g. "Relationship status with Legal & General").
 *
 * This is the CEILING on recognition, not the floor. `tryHandle` has to answer
 * the host synchronously, so this function alone decides whether we claim a
 * turn; the server classifier runs afterwards and only refines focus, period,
 * block order and title. A prompt this function passes on is never shown to the
 * model at all.
 *
 * @param {string} text
 * @returns {import('./schemas.js').WorkflowDecision}
 */
export function classifyLocally(text) {
  const isSnapshot = hasValidCtn(text) || SNAPSHOT_HINTS.some((re) => re.test(text));

  if (!isSnapshot) {
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
 * The account, when one has been identified, goes with the prompt. It is what
 * lets the model shape the view for THIS account — the title it returns names
 * the firm, and the focus it picks is a decision about that account's request
 * rather than about a sentence in the abstract. It is told the answer; it is
 * never asked to work it out.
 *
 * @param {string} text
 * @param {{signal?: AbortSignal, endpoint?: string, account?: object|null}} [opts]
 * @returns {Promise<{decision: import('./schemas.js').WorkflowDecision, source: 'server'|'local', error?: string}>}
 */
export async function classifyWorkflow(text, opts = {}) {
  const endpoint = opts.endpoint || '/api/snapshot-intent';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(opts.account
        ? { prompt: text, account: opts.account }
        : { prompt: text }),
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
 * @property {string|null} entity  the organisation the prompt named, if it named
 *   one the directory does not hold. Quoted back to the user; never retrieved on.
 * @property {number} at
 */

/**
 * Decide what to do with a prompt.
 *
 * Returns one of:
 *   {action:'ignore'}                     not our workflow — the host chat handles it
 *   {action:'clarify', pending}           snapshot wanted, account unidentified. NO DATA FETCHED.
 *   {action:'run', ctn, decision, …}      snapshot wanted, account identified
 *
 * An account is identified two ways, in this order: an explicit `CTN nnn`, or a
 * name held in the directory. The CTN wins when both are present — it is the
 * exact identifier, and a message carrying one is answering a question about
 * which account, not describing one.
 *
 * @param {string} text
 * @param {import('./schemas.js').WorkflowDecision} decision
 * @param {PendingWorkflow|null} pending a workflow awaiting an account from a prior turn
 */
export function gate(text, decision, pending = null) {
  const ctn = extractCtn(text);
  const named = ctn ? null : lookupAccount(text);

  const run = (id, matched, extra) => ({
    action: 'run',
    ctn: id,
    account: accountForCtn(id),
    matchedName: matched?.name ?? null,
    matchedAlias: matched?.alias ?? null,
    decision: extra?.decision ?? decision,
    resumed: Boolean(extra?.resumed),
    originalPrompt: extra?.originalPrompt,
  });

  // A pending workflow is resolved by any later message that identifies an
  // account, whether by CTN — "CTN 101" — or by name.
  if (pending && (ctn || named)) {
    // The pending decision says what the user wanted to SEE — focus, period,
    // block order — and that still holds. Its title does not: it was written
    // about an organisation we could not show, and carrying it over would put
    // "snapshot for Barclays" above a dashboard headed abrdn, which is the
    // exact confusion this gate exists to prevent.
    const decision = pending.entity
      ? { ...pending.decision, title: null }
      : pending.decision;

    return run(ctn || named.ctn, named, {
      decision,
      resumed: true,
      originalPrompt: pending.prompt,
    });
  }

  if (decision.workflow !== 'relationship_snapshot') {
    return { action: 'ignore' };
  }

  if (ctn) return run(ctn, null);
  if (named) return run(named.ctn, named);

  return {
    action: 'clarify',
    pending: { prompt: text, decision, entity: namedEntity(text), at: Date.now() },
  };
}

export { lookupAccount, namedEntity, accountForCtn, ACCOUNT_DIRECTORY } from './data/directory.js';

export { DEFAULT_BLOCK_ORDER, FOCUS_VALUES, PERIOD_VALUES };
