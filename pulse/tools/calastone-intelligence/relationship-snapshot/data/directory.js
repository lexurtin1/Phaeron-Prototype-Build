/**
 * The account directory — the only place a name is turned into a CTN.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  WHY THIS EXISTS
 *
 *  Before this file, the CTN was the *only* way to identify an account, so
 *  "relationship snapshot for Meridian" asked for a CTN, and whichever CTN the
 *  user then supplied was rendered under the heading of a different company.
 *  The dashboard was correct for the CTN and wrong for the question.
 *
 *  Resolution here is an exact lookup over a fixed table of fictional accounts.
 *  It is deterministic, and it is code — Claude is still never asked to guess a
 *  CTN or to map an organisation name onto one. A name that is not in the table
 *  resolves to nothing at all, and the caller says so; it is never approximated
 *  to the nearest entry.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { SCENARIOS } from './scenarios.js';

/**
 * Words that appear in several account names and identify none of them. A
 * distinctive alias must survive the removal of every one of these — otherwise
 * "capital" would match Halden Capital Partners and any other capital.
 */
const GENERIC_TOKENS = new Set([
  'the', 'and', 'group', 'partners', 'capital', 'asset', 'assets', 'management',
  'fund', 'funds', 'services', 'service', 'investment', 'investments', 'financial',
  'securities', 'wealth', 'mutual', 'holdings', 'international', 'global', 'plc',
  'ltd', 'limited', 'llp', 'inc',
]);

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalise(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9&\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The aliases a name may be recognised by.
 *
 * A scenario may declare its own — several of these firms are known by an
 * abbreviation that no algorithm would derive from the registered name, and
 * "Legal & General Investment Management" must not be reachable as "general".
 * Where none are declared, the full name and each of its non-generic words are
 * used, so a fictional "Meridian Asset Partners" is findable as "meridian" but
 * never as "asset" or "partners".
 */
function aliasesFor(name, declared) {
  const full = normalise(name);
  if (Array.isArray(declared) && declared.length) {
    return Object.freeze([...new Set([full, ...declared.map(normalise)])].filter(Boolean));
  }
  const distinctive = full.split(' ').filter((w) => w.length > 3 && !GENERIC_TOKENS.has(w));
  return Object.freeze([full, ...distinctive.filter((w) => w !== full)]);
}

/**
 * Every account this simulation can show, derived from the scenario fixtures so
 * the two can never drift apart.
 *
 * @type {ReadonlyArray<{ctn: string, name: string, tier: string, segment: string, region: string, aliases: readonly string[]}>}
 */
export const ACCOUNT_DIRECTORY = Object.freeze(
  Object.entries(SCENARIOS)
    .map(([ctn, profile]) => Object.freeze({
      ctn,
      name: profile.accountName,
      tier: profile.tier,
      segment: profile.segment,
      region: profile.region,
      aliases: aliasesFor(profile.accountName, profile.aliases),
    }))
    .sort((a, b) => a.ctn.localeCompare(b.ctn)),
);

/** @param {string} ctn */
export function accountForCtn(ctn) {
  return ACCOUNT_DIRECTORY.find((a) => a.ctn === String(ctn)) || null;
}

/**
 * Find the account a message names, if any.
 *
 * The longest alias wins, so "Halden Capital Partners" matches on the full name
 * rather than on "halden" — the two agree here, but they would not in a
 * directory that grew a second Halden.
 *
 * @param {string} text
 * @returns {{ctn: string, name: string, alias: string}|null}
 */
export function lookupAccount(text) {
  const haystack = ` ${normalise(text)} `;
  let best = null;

  for (const account of ACCOUNT_DIRECTORY) {
    for (const alias of account.aliases) {
      if (!haystack.includes(` ${alias} `)) continue;
      if (!best || alias.length > best.alias.length) {
        best = { ctn: account.ctn, name: account.name, alias };
      }
    }
  }

  return best;
}

/**
 * Words that introduce an entity in the phrasings this feature sees, and the
 * vocabulary of the request itself — which must never be mistaken for a name.
 */
const ENTITY_LEAD = /\b(?:for|at|with|about|on|regarding|re)\s+(.+)$/i;
const REQUEST_WORDS = /\b(?:snapshot|overview|summary|review|picture|relationship|account|billing|transactions?|operations?|operational|delivery|projects?|status|ctn|me|us|it|this|that|the)\b/i;

/**
 * The organisation name a message appears to be about.
 *
 * Used only to quote the user's own words back to them when nothing in the
 * directory matches — "No account named “blackrock”…". It is a courtesy, not an
 * identifier: nothing is ever retrieved on the strength of this string.
 *
 * @param {string} text
 * @returns {string|null}
 */
export function namedEntity(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const lead = raw.match(ENTITY_LEAD);
  if (!lead) return null;

  const phrase = lead[1]
    .replace(/[?!.,;:]+\s*$/, '')
    .replace(/^(?:the|a|an)\s+/i, '')
    .trim();

  // Keep it to something that could plausibly be a name: a few words, none of
  // them part of the request's own vocabulary.
  if (!phrase || phrase.length > 60) return null;
  if (phrase.split(/\s+/).length > 5) return null;
  if (REQUEST_WORDS.test(phrase)) return null;

  return phrase;
}
