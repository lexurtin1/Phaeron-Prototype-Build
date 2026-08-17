// Relationship Snapshot — workflow classification.
//
// Classifies a natural-language prompt and extracts APPROVED DISPLAY
// PREFERENCES ONLY. Follows the same CommonJS handler shape as api/claude.js so
// it works unchanged under Vercel's zero-config function detection and under
// scripts/local-pulse-server.js.
//
// ══════════════════════════════════════════════════════════════════════════
//  WHY THIS ROUTE EXISTS RATHER THAN REUSING /api/claude
//
//  /api/claude is a transparent pass-through: the browser supplies the system
//  prompt and receives raw model output. That is fine for a chat surface, but
//  it would mean the Relationship Snapshot's rules ("never invent a figure",
//  "never emit HTML", "never guess a CTN") lived in browser code where anyone
//  could edit them, and the model's raw text would reach the renderer.
//
//  Here the server owns the system prompt AND normalises the reply against a
//  fixed allow-list before returning it. Anything the model says that is not on
//  the list is dropped, not rejected — a weird answer degrades to the default
//  view rather than failing the request.
//
//  The model never sees or supplies account data. It classifies text. Every
//  figure the dashboard renders comes from the client-side simulated
//  repository, which this route does not touch.
// ══════════════════════════════════════════════════════════════════════════

const UPSTREAM_TIMEOUT_MS = Number(process.env.SNAPSHOT_INTENT_TIMEOUT_MS || 20_000);
const MAX_PROMPT_CHARS = 2000;

// Kept in sync with relationship-snapshot/config.js. Duplicated deliberately:
// this file is CommonJS and cannot import the browser ES module, and a server
// allow-list that silently inherited client edits would not be much of a guard.
const BLOCK_IDS = [
  'account-header', 'kpi-rail', 'relationship',
  'billing-revenue', 'transactions', 'operations', 'projects',
];
const FOCUS_VALUES = ['relationship', 'billing', 'transactions', 'operations', 'delivery'];
const PERIOD_VALUES = ['ytd', 'last_6_months', 'last_3_months', 'current_month'];
const WORKFLOWS = ['relationship_snapshot', 'other'];

const SYSTEM_PROMPT = `You classify internal account queries for Calastone's Intelligence Module.

Return ONLY a JSON object matching this shape, with no prose and no code fences:
{
  "workflow": "relationship_snapshot" | "other",
  "focus": "relationship" | "billing" | "transactions" | "operations" | "delivery" | null,
  "period": "ytd" | "last_6_months" | "last_3_months" | "current_month",
  "blockOrder": string[] | null,
  "title": string | null
}

WORKFLOW
"relationship_snapshot" when the user asks for a relationship snapshot, account
overview, or to see billing, transactions, operational activity or delivery
projects for an account. Otherwise "other".

FOCUS
The single area the user emphasised, or null when they asked for a general
overview. Do not guess a focus from a passing mention.

PERIOD
The period the user asked for. Default to "ytd" when none is stated.

BLOCKORDER
Optional. An ordering of these exact ids, no others, no repeats:
${BLOCK_IDS.join(', ')}
Use null unless the user clearly asked to see something first.

TITLE
A short factual description of what was requested, 90 characters maximum, plain
text only. Example: "Relationship snapshot, billing focus". Do not name the
account, do not state any figure, do not characterise the account.

HARD RULES
- Never calculate or state revenue, transaction counts, health, ticket ages,
  project status or source freshness. You do not have that data.
- Never emit HTML, CSS, chart configuration, tables or any markup.
- Never offer recommendations, next steps, assessments, risk rankings or
  commercial judgement of any kind.
- Never guess a CTN ID and never map an organisation name to one. Application
  code extracts the CTN; it is not your decision and you must not mention it.
- Return the JSON object and nothing else.`;

function readKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'PASTE-YOUR-KEY-HERE') return null;
  return apiKey;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

/** The default decision. Used whenever the model is unavailable or unusable. */
function defaultDecision(workflow) {
  return {
    workflow: workflow || 'other',
    focus: null,
    period: 'ytd',
    blockOrder: null,
    title: null,
  };
}

/**
 * Reduce arbitrary model output to a safe decision.
 *
 * Drops rather than rejects: an unrecognised focus becomes null, an
 * unrecognised block id is removed, an over-long title is truncated. The caller
 * always receives a renderable decision.
 */
function normalizeDecision(raw) {
  if (!raw || typeof raw !== 'object') return defaultDecision();

  const workflow = WORKFLOWS.includes(raw.workflow) ? raw.workflow : 'other';
  const focus = FOCUS_VALUES.includes(raw.focus) ? raw.focus : null;
  const period = PERIOD_VALUES.includes(raw.period) ? raw.period : 'ytd';

  let blockOrder = null;
  if (Array.isArray(raw.blockOrder)) {
    const seen = new Set();
    const clean = [];
    for (const id of raw.blockOrder) {
      if (typeof id !== 'string') continue;
      if (!BLOCK_IDS.includes(id)) continue; // not allow-listed
      if (seen.has(id)) continue;            // duplicate
      seen.add(id);
      clean.push(id);
    }
    blockOrder = clean.length ? clean : null;
  }

  let title = null;
  if (typeof raw.title === 'string') {
    // Strip anything that could be interpreted as markup downstream, then trim.
    const cleaned = raw.title.replace(/[<>]/g, '').trim().slice(0, 90);
    title = cleaned.length ? cleaned : null;
  }

  return { workflow, focus, period, blockOrder, title };
}

/** Extract a JSON object from model text, tolerating stray prose or fences. */
function parseModelJson(text) {
  if (typeof text !== 'string') return null;
  const stripped = text.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(stripped);
  } catch (_) {
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(stripped.slice(start, end + 1));
    } catch (_) {
      return null;
    }
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      keyConfigured: !!readKey(),
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
      workflows: WORKFLOWS,
      focusValues: FOCUS_VALUES,
      periodValues: PERIOD_VALUES,
      blockIds: BLOCK_IDS,
    });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: { message: 'Method not allowed' } });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {
      sendJson(res, 400, { error: { message: 'Invalid JSON body' } });
      return;
    }
  }

  const prompt = body && typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    sendJson(res, 400, { error: { message: 'A "prompt" string is required' } });
    return;
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    sendJson(res, 413, {
      error: { message: `Prompt exceeds ${MAX_PROMPT_CHARS} characters` },
    });
    return;
  }

  const apiKey = readKey();
  if (!apiKey) {
    // Not an error for this feature: the client falls back to its local
    // classifier and the dashboard still works in full.
    sendJson(res, 200, {
      decision: defaultDecision(),
      source: 'default',
      note: 'ANTHROPIC_API_KEY is not set on the server; the client will classify locally.',
    });
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        // Pinned server-side. Unlike /api/claude, the client cannot choose it.
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
        max_tokens: 300,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error('snapshot-intent upstream error:', upstream.status, detail.slice(0, 400));
      sendJson(res, 200, {
        decision: defaultDecision(),
        source: 'default',
        note: `Upstream returned ${upstream.status}; the client will classify locally.`,
      });
      return;
    }

    const data = await upstream.json();
    const text = (data.content || [])
      .filter((b) => b && b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    const decision = normalizeDecision(parseModelJson(text));
    sendJson(res, 200, { decision, source: 'model' });
  } catch (err) {
    const aborted = err && (err.name === 'AbortError' || err.code === 'ABORT_ERR');
    console.error('snapshot-intent failed:', aborted ? 'upstream timeout' : err);
    // Degrade rather than fail: classification is an enhancement, not a gate.
    sendJson(res, 200, {
      decision: defaultDecision(),
      source: 'default',
      note: aborted ? 'Classification timed out.' : 'Classification failed.',
    });
  } finally {
    clearTimeout(timer);
  }
};

// Exported for unit tests.
module.exports.normalizeDecision = normalizeDecision;
module.exports.parseModelJson = parseModelJson;
module.exports.defaultDecision = defaultDecision;
module.exports.SYSTEM_PROMPT = SYSTEM_PROMPT;
