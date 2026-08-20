/**
 * Follow-up questions about the snapshot that is on screen.
 *
 * The dashboard answers "what". This answers the question the user asks next.
 * It sends the rendered snapshot to /api/snapshot-qa, which owns the rules and
 * talks to Claude; nothing here decides what the model is allowed to say. That
 * split is deliberate — see the header of api/snapshot-qa.js.
 *
 * What comes back is prose, and this file is the only place in the feature that
 * renders text it did not author. Everything is escaped before any markup is
 * added, never after.
 */

import { esc } from './format.js';
import { getSnapshot } from './data/mock-repo.js';
import { ACCOUNT_DIRECTORY } from './data/directory.js';

const ENDPOINT = '/api/snapshot-qa';

/* ───────────────────────── grounding ───────────────────────── */

/** Digests are deterministic, so build each one once. */
const digestCache = new Map();

/**
 * A one-line summary of an account, for comparison questions.
 *
 * Deliberately small: the account on screen goes over in full, and sending five
 * complete snapshots would be roughly 40KB of prompt for the sake of "is that
 * worse than Schroders?".
 */
function digestFor(ctn) {
  if (digestCache.has(ctn)) return digestCache.get(ctn);
  const s = getSnapshot(ctn);
  const active = s.projects.filter((p) => p.status !== 'complete');
  const digest = {
    ctn: s.ctn,
    account: s.account.name,
    segment: s.account.segment,
    tier: s.account.tier,
    relationshipManager: s.relationship.manager ? s.relationship.manager.name : null,
    billingYtd: s.billing.available ? s.billing.ytd : null,
    billingCurrency: s.billing.currency,
    transactionsYtd: s.transactions.available ? s.transactions.ytd : null,
    ticketsOpen: s.tickets.open,
    ticketsHighSeverity: s.tickets.highSeverity,
    oldestOpenTicketDays: s.tickets.oldestOpenDays,
    activeProjects: active.length,
    sourceStates: Object.fromEntries(s.sources.map((x) => [x.id, x.state])),
  };
  digestCache.set(ctn, digest);
  return digest;
}

/** Every account except the one on screen. */
export function buildDigest(currentCtn) {
  return ACCOUNT_DIRECTORY
    .filter((a) => a.ctn !== currentCtn)
    .map((a) => digestFor(a.ctn));
}

/* ───────────────────────── rendering ───────────────────────── */

/** Escape first, then promote — never the other way round. */
function inline(s) {
  return esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/**
 * The page has no markdown renderer and pulls in no library for one, so this
 * handles the three things the answer is asked to produce: paragraphs, "- "
 * lists and bold. Anything else arrives as plain escaped text, which is a fine
 * failure mode.
 */
export function renderRich(text) {
  return String(text)
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return '';
      if (lines.every((l) => l.startsWith('- '))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
      }
      return `<p>${lines.map(inline).join('<br>')}</p>`;
    })
    .join('');
}

function errorBlock(message) {
  return `<div class="rs-answer-error"><strong>That question could not be answered.</strong>`
    + `<span>${esc(message)}</span></div>`;
}

/** Match the wording the Market Research tool already uses for these. */
function describeFailure(status, detail) {
  const d = String(detail || '');
  if (status === 504 || /timeout|UPSTREAM_TIMEOUT/i.test(d)) {
    return 'Claude timed out before finishing. Try a shorter question.';
  }
  if (status === 404) {
    return 'The answering endpoint is not available on this host. Run `npm run dev` or open the deployed app — a static file:// copy has no /api routes.';
  }
  if (/ANTHROPIC_API_KEY/i.test(d)) return d;
  return d || `The request failed (HTTP ${status}).`;
}

/* ───────────────────────── the request ───────────────────────── */

/**
 * Ask a question about `snapshot` and stream the answer into `host`.
 *
 * @param {string} question
 * @param {import('./schemas.js').RelationshipSnapshot} snapshot
 * @param {HTMLElement} host   the assistant message body; its contents are replaced
 * @returns {Promise<{ok: boolean, text: string, usage?: object}>}
 */
export async function answer(question, snapshot, host) {
  const shell = document.createElement('div');
  shell.className = 'rs-answer';
  const stream = document.createElement('div');
  stream.className = 'rs-answer-body';
  shell.appendChild(stream);
  host.replaceChildren(shell);

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ctn: snapshot.ctn,
        question,
        snapshot,
        digest: buildDigest(snapshot.ctn),
      }),
    });
  } catch (err) {
    stream.innerHTML = errorBlock(`Could not reach ${ENDPOINT} (${(err && err.message) || 'network error'}).`);
    return { ok: false, text: '' };
  }

  if (!res.ok || !res.body) {
    let detail = '';
    try {
      const payload = await res.clone().json();
      detail = (payload && payload.error && payload.error.message) || '';
    } catch (_) {
      detail = (await res.text().catch(() => '')).slice(0, 240);
    }
    stream.innerHTML = errorBlock(describeFailure(res.status, detail));
    return { ok: false, text: '' };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let usage = null;
  let failure = null;

  const flush = () => { stream.innerHTML = renderRich(text); };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let cut;
    while ((cut = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, cut).trim();
      buffer = buffer.slice(cut + 1);
      if (!line) continue;
      let evt;
      try { evt = JSON.parse(line); } catch (_) { continue; }
      if (evt.type === 'text') {
        text += evt.text;
        flush();
      } else if (evt.type === 'done') {
        usage = evt.usage || null;
      } else if (evt.type === 'error') {
        failure = evt.message;
      }
    }
  }

  if (failure) {
    stream.innerHTML = errorBlock(failure);
    return { ok: false, text };
  }

  flush();

  // The dashboard says on its face that the figures are simulated. An answer
  // quoting those figures has to carry the same label, or it travels without it.
  const note = document.createElement('p');
  note.className = 'rs-answer-note';
  note.textContent = `Answered from the simulated ${snapshot.account.name} snapshot (CTN ${snapshot.ctn}). No live system was contacted.`;
  shell.appendChild(note);

  return { ok: true, text, usage };
}
