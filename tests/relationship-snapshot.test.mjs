/**
 * Relationship Snapshot — pure-logic unit tests.
 *
 *   node --test tests/
 *
 * Everything exercised here is DOM-free by design: the CTN gate, the workflow
 * schemas, the seeded repository, the block allow-list, the chart option
 * builders and the formatters. That separation is deliberate — the parts that
 * decide what is true are testable without a browser; the parts that decide
 * what it looks like are covered by tests/smoke-snapshot.mjs.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const FEATURE = '../pulse/tools/calastone-intelligence/relationship-snapshot';

const { extractCtn, hasValidCtn, classifyLocally, gate, CTN_PATTERN } = await import(`${FEATURE}/intent.js`);
const { getSnapshot, loadSnapshot, sortTickets } = await import(`${FEATURE}/data/mock-repo.js`);
const { ACCOUNT_DIRECTORY, lookupAccount, namedEntity, accountForCtn } = await import(`${FEATURE}/data/directory.js`);
const { rmFor, STAFF } = await import(`${FEATURE}/data/scenarios.js`);
const { renderRich, buildDigest } = await import(`${FEATURE}/qa.js`);
const { RelationshipSnapshotSchema, WorkflowDecisionSchema, safeValidate } = await import(`${FEATURE}/schemas.js`);
const { ALLOWED_BLOCK_IDS, BLOCKS } = await import(`${FEATURE}/blocks/registry.js`);
const { DEFAULT_BLOCK_ORDER, BLOCK_IDS, PAIRED_BLOCKS, BLOCK_ROWS } = await import(`${FEATURE}/config.js`);
const fmt = await import(`${FEATURE}/format.js`);
const billing = await import(`${FEATURE}/charts/billing-revenue.js`);
const transactions = await import(`${FEATURE}/charts/transactions.js`);
const operations = await import(`${FEATURE}/charts/operations.js`);
const progress = await import(`${FEATURE}/charts/billing-progress.js`);

const require = createRequire(import.meta.url);
const intentRoute = require('../api/snapshot-intent.js');
const qaRoute = require('../api/snapshot-qa.js');

/* ═══════════════════════ CTN extraction and validation ═══════════════════════ */

test('extractCtn accepts valid CTN forms', () => {
  assert.equal(extractCtn('Give me a relationship snapshot for CTN 303'), '303');
  assert.equal(extractCtn('ctn303'), '303');
  assert.equal(extractCtn('CTN  404'), '404');
  assert.equal(extractCtn('ctn 101'), '101');
  assert.equal(extractCtn('CTN\t202'), '202');
  assert.equal(extractCtn('(CTN 505)'), '505');
});

test('extractCtn rejects malformed identifiers rather than truncating', () => {
  assert.equal(extractCtn('CTN 30'), null, 'two digits');
  assert.equal(extractCtn('CTN 3033'), null, 'four digits must not truncate to 303');
  assert.equal(extractCtn('CTNX 303'), null);
  assert.equal(extractCtn('just 303'), null, 'bare number is not a CTN');
  assert.equal(extractCtn('CTN abc'), null);
  assert.equal(extractCtn(''), null);
});

test('extractCtn is defensive about input type', () => {
  for (const bad of [null, undefined, 42, {}, []]) {
    assert.equal(extractCtn(bad), null);
  }
});

test('extractCtn returns the first match when several are present', () => {
  assert.equal(extractCtn('compare ctn 101 and CTN 202'), '101');
});

test('hasValidCtn mirrors extractCtn', () => {
  assert.equal(hasValidCtn('CTN 303'), true);
  assert.equal(hasValidCtn('CTN 30'), false);
});

test('CTN_PATTERN is the exact pattern the brief specifies', () => {
  assert.equal(CTN_PATTERN.source, '\\bCTN\\s*([0-9]{3})\\b');
  assert.ok(CTN_PATTERN.flags.includes('i'));
});

/* ═══════════════════════ workflow classification ═══════════════════════ */

test('the brief\'s example prompts classify as relationship_snapshot', () => {
  const examples = [
    'Give me a relationship snapshot for CTN 303.',
    'Show billing and transactions for CTN 202.',
    'Show operational activity for CTN 404.',
    'Prepare a relationship overview for CTN 101.',
  ];
  for (const prompt of examples) {
    assert.equal(classifyLocally(prompt).workflow, 'relationship_snapshot', prompt);
  }
});

test('unrelated prompts are not claimed', () => {
  for (const prompt of ['What stage is Digital TA at?', 'How are we charging BlackRock?', 'Hello']) {
    assert.equal(classifyLocally(prompt).workflow, 'other', prompt);
  }
});

test('the classifier decides workflow and period, and nothing about layout', () => {
  // The dashboard is a fixed template, so there is no focus to extract and no
  // ordering to propose. What is left is: is this ours, and over what period.
  const d = classifyLocally('Show billing for CTN 202 over the last 3 months');
  assert.deepEqual(Object.keys(d).sort(), ['period', 'title', 'workflow']);
  assert.equal(d.workflow, 'relationship_snapshot');
  assert.equal(d.period, 'last_3_months');
});

test('period defaults to YTD and is extracted when stated', () => {
  assert.equal(classifyLocally('relationship snapshot for CTN 303').period, 'ytd');
  assert.equal(classifyLocally('relationship snapshot for CTN 303 this month').period, 'current_month');
  assert.equal(classifyLocally('relationship snapshot for CTN 303, last 6 months').period, 'last_6_months');
});

test('a bare CTN reads as a snapshot request', () => {
  assert.equal(classifyLocally('CTN 101').workflow, 'relationship_snapshot');
});

test('a CTN anywhere in the message claims it, however it is phrased', () => {
  // The hint list cannot anticipate natural phrasing, but the CTN can: nothing
  // else in the module recognises `CTN nnn`, so its presence is decisive.
  const prompts = [
    'how are things going with CTN 303 lately',
    'any issues at CTN 505?',
    'CTN 404 please',
    'can you pull together what we know about ctn202',
    'I have a call with CTN 101 tomorrow — what should I have in front of me',
  ];
  for (const prompt of prompts) {
    assert.equal(classifyLocally(prompt).workflow, 'relationship_snapshot', prompt);
  }
});

test('the host\'s own canned prompts are still not claimed', () => {
  // Regression guard on broadening the classifier: these are answered by the
  // Intelligence Module itself and must fall straight through.
  const hostPrompts = [
    'What stage is Digital TA at?',
    'How are we charging BlackRock?',
    'Relationship status with Legal & General',
    'Thailand network presence',
    'Who is the RM for this Goldman ISIN?',
    'Q3 ETF pipeline weighting',
  ];
  for (const prompt of hostPrompts) {
    assert.equal(classifyLocally(prompt).workflow, 'other', prompt);
  }
});

/* ═══════════════════════ the CTN gate ═══════════════════════ */

test('a snapshot request without a CTN asks for clarification and fetches nothing', () => {
  const decision = classifyLocally('Prepare a relationship overview');
  const outcome = gate('Prepare a relationship overview', decision);

  assert.equal(outcome.action, 'clarify');
  assert.equal(outcome.ctn, undefined, 'no CTN may be inferred');
  assert.ok(outcome.pending, 'the workflow must be preserved');
  assert.equal(outcome.pending.prompt, 'Prepare a relationship overview');
  assert.equal(outcome.pending.decision.workflow, 'relationship_snapshot');
});

test('a valid CTN runs the workflow immediately', () => {
  const decision = classifyLocally('relationship snapshot for CTN 303');
  const outcome = gate('relationship snapshot for CTN 303', decision);
  assert.equal(outcome.action, 'run');
  assert.equal(outcome.ctn, '303');
  assert.equal(outcome.resumed, false);
});

test('a pending workflow resumes on a later message carrying a CTN', () => {
  const first = 'Prepare a relationship overview';
  const pending = gate(first, classifyLocally(first)).pending;

  const outcome = gate('CTN 101', classifyLocally('CTN 101'), pending);
  assert.equal(outcome.action, 'run');
  assert.equal(outcome.ctn, '101');
  assert.equal(outcome.resumed, true);
  assert.equal(outcome.originalPrompt, first, 'the original prompt is preserved verbatim');
  assert.equal(outcome.decision.period, pending.decision.period, 'the original decision is reused');
});

test('a pending workflow is not resumed by a message with no CTN', () => {
  const pending = gate('Prepare a relationship overview',
    classifyLocally('Prepare a relationship overview')).pending;
  const outcome = gate('actually never mind', classifyLocally('actually never mind'), pending);
  assert.notEqual(outcome.action, 'run');
});

test('non-snapshot prompts are ignored by the gate', () => {
  const decision = classifyLocally('What stage is Digital TA at?');
  assert.equal(gate('What stage is Digital TA at?', decision).action, 'ignore');
});

/* ═══════════════════════ resolving a name to an account ═══════════════════════ */

test('the directory is derived from the scenarios, not maintained beside them', () => {
  assert.equal(ACCOUNT_DIRECTORY.length, 5);
  for (const account of ACCOUNT_DIRECTORY) {
    assert.equal(getSnapshot(account.ctn).account.name, account.name);
  }
});

test('an account is found by its name or one of its declared aliases', () => {
  assert.equal(lookupAccount('relationship snapshot for BlackRock')?.ctn, '303');
  assert.equal(lookupAccount('how are things at HSBC?')?.ctn, '101');
  assert.equal(lookupAccount('HSBC ASSET MANAGEMENT')?.ctn, '101');
  assert.equal(lookupAccount('snapshot for abrdn')?.ctn, '505');
  // Firms are known by abbreviations no algorithm would derive from the name.
  assert.equal(lookupAccount('LGIM overview')?.ctn, '404');
  assert.equal(lookupAccount('legal and general')?.ctn, '404');
});

test('an alias never leaks into an ordinary word', () => {
  // "Legal & General Investment Management" must not be reachable as "general".
  assert.equal(lookupAccount('who is the general manager'), null);
  assert.equal(lookupAccount('the legal position'), null);
});

test('generic words in a name identify nobody', () => {
  // "Partners", "Capital" and "Fund Services" are shared furniture. Matching on
  // them would answer a question about one account with another one's figures.
  for (const vague of ['show me capital', 'the partners account', 'fund services please']) {
    assert.equal(lookupAccount(vague), null, vague);
  }
});

test('an organisation outside the directory resolves to nothing at all', () => {
  // Never to the nearest entry: a wrong account is worse than no account.
  for (const name of ['Barclays', 'Fidelity International', 'Goldman', 'Vanguard']) {
    assert.equal(lookupAccount(name), null, name);
  }
});

test('an account name alone does not claim a prompt', () => {
  // The accounts are real firms and the host answers its own questions about
  // the same firms. The name says WHICH account once a request has been
  // recognised as a snapshot; it never decides that a request is one.
  for (const text of ['How are we charging BlackRock?', 'HSBC', 'abrdn renewal date']) {
    assert.equal(classifyLocally(text).workflow, 'other', text);
    assert.equal(gate(text, classifyLocally(text)).action, 'ignore', text);
  }
});

test('a named account claims the prompt and runs without a clarification', () => {
  const text = 'give me a relationship snapshot for HSBC';
  const decision = classifyLocally(text);
  assert.equal(decision.workflow, 'relationship_snapshot');

  const outcome = gate(text, decision);
  assert.equal(outcome.action, 'run');
  assert.equal(outcome.ctn, '101');
  assert.equal(outcome.matchedName, 'HSBC Asset Management');
  assert.equal(outcome.matchedAlias, 'hsbc');
});

test('an explicit CTN outranks a name in the same message', () => {
  const text = 'snapshot for BlackRock, CTN 101';
  const outcome = gate(text, classifyLocally(text));
  assert.equal(outcome.ctn, '101');
  assert.equal(outcome.matchedName, null);
});

test('an unrecognised organisation is quoted back, not resolved', () => {
  const text = 'relationship snapshot for Barclays';
  const outcome = gate(text, classifyLocally(text));
  assert.equal(outcome.action, 'clarify');
  assert.equal(outcome.pending.entity, 'Barclays');
});

test('the entity extractor does not mistake the request for a name', () => {
  assert.equal(namedEntity('give me a relationship snapshot'), null);
  assert.equal(namedEntity('Prepare a relationship overview'), null);
  assert.equal(namedEntity('snapshot for CTN 303'), null);
  assert.equal(namedEntity('relationship snapshot for HSBC'), 'HSBC');
});

test('a pending workflow resumes on a later message naming an account', () => {
  const first = 'relationship snapshot for Barclays';
  const pending = gate(first, classifyLocally(first)).pending;
  const outcome = gate('abrdn', classifyLocally('abrdn'), pending);
  assert.equal(outcome.action, 'run');
  assert.equal(outcome.ctn, '505');
  assert.equal(outcome.resumed, true);
  assert.equal(outcome.originalPrompt, first);
});

test('a resumed run drops a title written about a firm we could not show', () => {
  const first = 'relationship snapshot for Barclays';
  const pending = gate(first, classifyLocally(first)).pending;
  pending.decision = { ...pending.decision, period: 'last_3_months', title: 'Billing overview for Barclays' };

  const outcome = gate('CTN 505', classifyLocally('CTN 505'), pending);
  assert.equal(outcome.ctn, '505');
  // What the user wanted to see survives; what it was called does not.
  assert.equal(outcome.decision.period, 'last_3_months');
  assert.equal(outcome.decision.title, null);
});

test('a resumed run keeps a title that named no firm', () => {
  const first = 'Prepare a relationship overview';
  const pending = gate(first, classifyLocally(first)).pending;
  pending.decision = { ...pending.decision, title: 'Relationship overview' };

  const outcome = gate('CTN 101', classifyLocally('CTN 101'), pending);
  assert.equal(outcome.decision.title, 'Relationship overview');
});

test('every runnable outcome carries the account it will actually show', () => {
  // The bug this guards: a dashboard rendered under a heading the user never
  // asked for, with nothing on screen connecting the two.
  for (const [text, expected] of [
    ['snapshot for CTN 404', 'Legal & General Investment Management'],
    ['relationship snapshot for Schroders', 'Schroders'],
  ]) {
    const outcome = gate(text, classifyLocally(text));
    assert.equal(outcome.action, 'run');
    assert.equal(outcome.account.name, expected, text);
    assert.equal(accountForCtn(outcome.ctn).name, expected);
  }
});

test('a generated CTN has no directory entry and says so', () => {
  const outcome = gate('snapshot for CTN 777', classifyLocally('snapshot for CTN 777'));
  assert.equal(outcome.action, 'run');
  assert.equal(outcome.account, null);
});

/* ═══════════════════════ deterministic simulation data ═══════════════════════ */

test('the same CTN always returns identical data', () => {
  for (const ctn of ['101', '202', '303', '404', '505', '777', '000']) {
    assert.deepEqual(getSnapshot(ctn), getSnapshot(ctn), `CTN ${ctn} is not deterministic`);
  }
});

test('every snapshot validates against the contract', () => {
  for (const ctn of ['101', '202', '303', '404', '505', '777', '000', '999']) {
    const result = safeValidate(RelationshipSnapshotSchema, getSnapshot(ctn));
    assert.ok(result.ok, `CTN ${ctn} failed validation: ${result.error}`);
  }
});

test('every snapshot is flagged as simulated', () => {
  const s = getSnapshot('303');
  assert.equal(s.simulated, true);
  assert.ok(s.sources.every((src) => src.simulated === true));
});

test('named scenarios match their documented shape', () => {
  const stable = getSnapshot('101');
  assert.equal(stable.account.name, 'HSBC Asset Management');
  assert.ok(stable.sources.every((s) => s.state === 'live'), 'CTN 101 is fully live');

  const heavyOps = getSnapshot('303');
  assert.equal(heavyOps.account.name, 'BlackRock');
  assert.ok(heavyOps.tickets.open > getSnapshot('101').tickets.open,
    'CTN 303 has more operational activity than CTN 101');

  const projects = getSnapshot('404');
  assert.equal(projects.projects.length, 4, 'CTN 404 has multiple delivery projects');

  const varied = getSnapshot('202');
  const monthly = varied.billing.monthly;
  const spread = Math.max(...monthly) / Math.min(...monthly);
  assert.ok(spread > 1.4, `CTN 202 should show billing variation, got spread ${spread.toFixed(2)}`);
});

test('CTN 505 reports delayed and unavailable sources factually', () => {
  const s = getSnapshot('505');
  const byId = Object.fromEntries(s.sources.map((x) => [x.id, x]));

  assert.equal(byId.billing.state, 'delayed');
  assert.ok(byId.billing.note, 'a delayed source must state why');
  assert.ok(byId.billing.lastRefresh, 'a delayed source still has a last successful refresh');

  assert.equal(byId.transactions.state, 'unavailable');
  assert.ok(byId.transactions.note, 'an unavailable source must state why');
  assert.equal(byId.transactions.lastRefresh, null, 'no successful refresh');
  assert.equal(byId.transactions.recordsUsed, 0);

  assert.equal(s.transactions.available, false);
  assert.equal(s.transactions.ytd, null, 'no fabricated zero for missing data');
  assert.deepEqual(s.transactions.monthly, []);

  assert.equal(s.billing.available, true, 'delayed data is stale, not absent');
  assert.equal(s.relationship.available, true, 'unrelated sources are unaffected');
  assert.equal(s.tickets.available, true);
});

test('an unknown CTN falls back to a valid generated profile', () => {
  const s = getSnapshot('742');
  assert.ok(safeValidate(RelationshipSnapshotSchema, s).ok);
  assert.equal(s.ctn, '742');
  assert.ok(s.account.name.length > 0);
  assert.notEqual(s.account.name, getSnapshot('743').account.name, 'different CTNs differ');
});

test('production services live never exceeds the total', () => {
  for (let i = 0; i < 200; i++) {
    const ctn = String(i).padStart(3, '0');
    const p = getSnapshot(ctn).production;
    assert.ok(p.servicesLive <= p.servicesTotal, `CTN ${ctn}: ${p.servicesLive}/${p.servicesTotal}`);
  }
});

test('ticket counts are internally consistent', () => {
  const t = getSnapshot('303').tickets;
  const openItems = t.items.filter((i) => i.status !== 'resolved');
  assert.equal(t.open, openItems.length);
  assert.equal(t.bySeverity.reduce((a, b) => a + b.value, 0), t.open,
    'severity breakdown must sum to the open count');
  assert.equal(t.oldestOpenDays, Math.max(...openItems.map((i) => i.ageDays)));
  assert.equal(t.highSeverity,
    openItems.filter((i) => i.severity === 'critical' || i.severity === 'high').length);
});

test('tickets sort open first, then severity, then age', () => {
  const items = getSnapshot('303').tickets.items;
  const rank = { critical: 0, high: 1, medium: 2, low: 3 };
  for (let i = 1; i < items.length; i++) {
    const a = items[i - 1];
    const b = items[i];
    const aResolved = a.status === 'resolved' ? 1 : 0;
    const bResolved = b.status === 'resolved' ? 1 : 0;
    if (aResolved !== bResolved) {
      assert.ok(aResolved < bResolved, 'resolved tickets must come after open ones');
      continue;
    }
    if (rank[a.severity] !== rank[b.severity]) {
      assert.ok(rank[a.severity] < rank[b.severity], 'severity must descend');
      continue;
    }
    assert.ok(a.ageDays >= b.ageDays, 'age must descend within a severity band');
  }
});

test('sortTickets is a pure function', () => {
  const input = getSnapshot('202').tickets.items;
  const copy = [...input];
  sortTickets(input);
  assert.deepEqual(input, copy, 'input array must not be mutated');
});

test('a blocker is only present when the source records one', () => {
  for (const ctn of ['101', '202', '303', '404', '505']) {
    for (const p of getSnapshot(ctn).projects) {
      if (p.blocker !== null) {
        assert.equal(p.status, 'blocked',
          `${ctn}/${p.name}: a blocker was invented for a non-blocked project`);
      }
    }
  }
});

test('loadSnapshot reports four retrieval stages in order', async () => {
  const stages = [];
  const snapshot = await loadSnapshot('303', (n, sources) => {
    stages.push({ n, ids: sources.map((s) => s.id) });
  }, { fast: true });

  assert.deepEqual(stages.map((s) => s.n), [1, 2, 3, 4]);
  assert.deepEqual(stages[0].ids, [], 'stage 1 is CTN confirmation, no source read yet');
  assert.deepEqual(stages[1].ids, ['salesforce']);
  assert.deepEqual(stages[2].ids, ['billing', 'transactions']);
  assert.deepEqual(stages[3].ids, ['jira']);
  assert.deepEqual(snapshot, getSnapshot('303'), 'staged load returns the same data');
});

/* ═══════════════════════ workflow decision schema ═══════════════════════ */

test('a well-formed decision parses', () => {
  const r = safeValidate(WorkflowDecisionSchema, {
    workflow: 'relationship_snapshot',
    period: 'ytd',
    title: 'Relationship snapshot for BlackRock',
  });
  assert.ok(r.ok, r.error);
});

test('defaults are applied for omitted optional fields', () => {
  const r = safeValidate(WorkflowDecisionSchema, { workflow: 'relationship_snapshot' });
  assert.ok(r.ok, r.error);
  assert.equal(r.data.period, 'ytd');
  assert.equal(r.data.title, null);
});

test('unknown enum values are rejected', () => {
  assert.equal(safeValidate(WorkflowDecisionSchema, { workflow: 'delete_everything' }).ok, false);
  assert.equal(safeValidate(WorkflowDecisionSchema,
    { workflow: 'relationship_snapshot', period: 'all_time' }).ok, false);
});

test('the decision carries nothing that could describe a layout', () => {
  // The template is fixed, so an ordering or an emphasis has nowhere to go.
  const r = safeValidate(WorkflowDecisionSchema, {
    workflow: 'relationship_snapshot',
    blockOrder: ['projects', 'kpi-rail'],
    focus: 'billing',
    layout: '<div>injected</div>',
  });
  assert.ok(r.ok, r.error);
  assert.deepEqual(Object.keys(r.data).sort(), ['period', 'title', 'workflow']);
});

test('markup in the title is rejected', () => {
  for (const title of ['<script>alert(1)</script>', 'Snapshot <b>bold</b>', 'a > b']) {
    assert.equal(safeValidate(WorkflowDecisionSchema,
      { workflow: 'relationship_snapshot', title }).ok, false, title);
  }
});

test('an over-long title is rejected', () => {
  assert.equal(safeValidate(WorkflowDecisionSchema,
    { workflow: 'relationship_snapshot', title: 'x'.repeat(91) }).ok, false);
});

/* ═══════════════════════ the fixed template ═══════════════════════ */

test('the template is seven blocks in a fixed order', () => {
  assert.deepEqual([...DEFAULT_BLOCK_ORDER], [
    'account-header', 'kpi-rail',
    'operations', 'relationship',
    'transactions', 'billing-revenue',
    'projects',
  ]);
  assert.deepEqual([...BLOCK_IDS], [...DEFAULT_BLOCK_ORDER],
    'the template and the allow-list are the same thing');
});

test('operational activity is the first card under the headline figures', () => {
  // A spike in tickets is the thing here most likely to need acting on, so it
  // is not allowed to drift down the page.
  assert.equal(DEFAULT_BLOCK_ORDER.indexOf('operations'), 2);
  assert.ok(DEFAULT_BLOCK_ORDER.indexOf('operations') < DEFAULT_BLOCK_ORDER.indexOf('transactions'));
  assert.ok(DEFAULT_BLOCK_ORDER.indexOf('operations') < DEFAULT_BLOCK_ORDER.indexOf('projects'));
});

test('every paired row names two blocks that exist, in display order', () => {
  for (const row of BLOCK_ROWS) {
    assert.equal(row.length, 2);
    const [left, right] = row;
    assert.ok(DEFAULT_BLOCK_ORDER.includes(left), left);
    assert.ok(DEFAULT_BLOCK_ORDER.includes(right), right);
    assert.equal(DEFAULT_BLOCK_ORDER.indexOf(left) + 1, DEFAULT_BLOCK_ORDER.indexOf(right),
      `${left} and ${right} must be adjacent to share a row`);
  }
});

test('every id in the template has a renderer behind it', () => {
  for (const id of DEFAULT_BLOCK_ORDER) {
    assert.equal(typeof BLOCKS[id], 'function', id);
  }
  assert.deepEqual([...ALLOWED_BLOCK_IDS].sort(), [...BLOCK_IDS].sort(),
    'a block with no renderer would leave a hole in the template');
});

test('the paired row is the two measures, at equal width', () => {
  assert.deepEqual([...PAIRED_BLOCKS], ['transactions', 'billing-revenue']);
  for (const id of PAIRED_BLOCKS) {
    assert.ok(DEFAULT_BLOCK_ORDER.includes(id), id);
  }
});

test('the template is frozen', () => {
  // Nothing at runtime — model output least of all — may rewrite the layout.
  assert.ok(Object.isFrozen(BLOCK_IDS));
  assert.ok(Object.isFrozen(DEFAULT_BLOCK_ORDER));
});

/* ═══════════════════════ chart option builders ═══════════════════════ */

test('billing chart has a current and a dashed prior-year series', () => {
  const s = getSnapshot('303');
  const opt = billing.buildOption(s.billing);
  assert.equal(opt.series.length, 2);
  assert.equal(opt.series[1].lineStyle.type, 'dashed', 'comparison must be muted and dashed');
  assert.match(opt.yAxis.name, /GBP/, 'the currency must be stated on the axis');
  assert.deepEqual(opt.xAxis.data, s.billing.months);
  assert.equal(opt.series[0].data.length, s.billing.months.length);
});

test('billing months run January to the current month', () => {
  const opt = billing.buildOption(getSnapshot('303').billing);
  assert.equal(opt.xAxis.data[0], 'Jan');
  assert.equal(opt.xAxis.data.at(-1), 'Aug');
});

test('a narrowed period slices the month window', () => {
  const b = getSnapshot('303').billing;
  const opt = billing.buildOption(b, { months: b.months.slice(-3) });
  assert.equal(opt.xAxis.data.length, 3);
  assert.equal(opt.series[0].data.length, 3);
  assert.equal(opt.series[1].data.length, 3);
  assert.equal(opt.xAxis.data.at(-1), 'Aug');
});

test('transaction volume is a trend line, not a tally of bars', () => {
  const opt = transactions.buildOption(getSnapshot('303').transactions);
  assert.equal(opt.series[0].type, 'line');
  assert.ok(opt.series[0].areaStyle, 'the trend carries a fill beneath it');
  assert.equal(opt.series[1].lineStyle.type, 'dashed', 'last year is muted and dashed');
});

test('the transactions chart states its unit and is separate from billing', () => {
  const opt = transactions.buildOption(getSnapshot('303').transactions);
  assert.match(opt.yAxis.name, /count/i, 'the measure must be unambiguous');
  assert.ok(!/GBP|£/.test(opt.yAxis.name), 'transactions are not a monetary value');
});

test('the billing ring measures this year against the whole of last year', () => {
  const b = getSnapshot('101').billing;
  assert.equal(progress.hasTarget(b), true);
  assert.equal(progress.progress(b), b.ytd / b.priorFullYear);

  const opt = progress.buildOption(b);
  const [filled, remaining] = opt.series[0].data;
  assert.ok(Math.abs(filled.value + remaining.value - 1) < 1e-9, 'the ring is a whole');
  assert.equal(opt.series[0].type, 'pie');
  assert.ok(opt.series[0].radius[0], 'a ring, not a pie');
});

test('the ring fills but never wraps past a full year', () => {
  const ahead = { ...getSnapshot('101').billing, ytd: 3_000_000, priorFullYear: 1_000_000 };
  const opt = progress.buildOption(ahead);
  assert.equal(opt.series[0].data[0].value, 1, 'the arc stops at full');
  assert.equal(opt.series[0].data[1].value, 0);
  // ...and the centre keeps counting, so 300% does not read as 0%.
  assert.match(opt.graphic[0].children[0].style.text, /300%/);
});

test('there is no ring when there is nothing to track towards', () => {
  for (const b of [
    { available: true, ytd: 100, priorFullYear: null },
    { available: true, ytd: 100, priorFullYear: 0 },
    { available: false, ytd: null, priorFullYear: 500 },
  ]) {
    assert.equal(progress.hasTarget(b), false, JSON.stringify(b));
    assert.equal(progress.progress(b), null);
    assert.equal(progress.buildOption(b), null, 'no invented percentage');
  }
});

test('the severity chart is titled exactly as the brief requires', () => {
  assert.equal(operations.SEVERITY_TITLE, 'Open tickets by severity');
});

test('the severity ring reflects the open ticket breakdown', () => {
  const t = getSnapshot('303').tickets;
  const opt = operations.buildSeverityOption(t);
  assert.equal(opt.series[0].data.length, t.bySeverity.length);
  assert.equal(opt.series[0].data.reduce((a, b) => a + b.value, 0), t.open);
  for (const slice of opt.series[0].data) {
    assert.ok(slice.itemStyle.color, 'each severity needs an explicit colour');
  }
});

test('raised and resolved are separate series over the same months', () => {
  const t = getSnapshot('303').tickets;
  const opt = operations.buildRaisedResolvedOption(t);
  assert.deepEqual(opt.series.map((s) => s.name), ['Raised', 'Resolved']);
  assert.equal(opt.xAxis.data.length, t.monthly.length);
  assert.ok(opt.series.every((s) => s.data.every((v) => v >= 0)));
});

test('charts handle an empty series without throwing', () => {
  const empty = {
    available: true, currency: 'GBP', measure: 'Billed revenue',
    months: [], monthly: [], priorMonthly: [], ytd: 0, priorYtd: 0, priorFullYear: 0,
  };
  assert.doesNotThrow(() => billing.buildOption(empty));
  assert.doesNotThrow(() => operations.buildSeverityOption({
    available: true, open: 0, highSeverity: 0, oldestOpenDays: 0,
    bySeverity: [], monthly: [], items: [],
  }));
});

/* ═══════════════════════ formatters ═══════════════════════ */

test('currency is formatted in the stated unit', () => {
  assert.equal(fmt.formatCurrency(2613316), '£2,613,316');
  assert.equal(fmt.formatCurrency(0), '£0');
  assert.equal(fmt.formatCurrency(null), '—');
  assert.equal(fmt.formatCurrency(NaN), '—');
});

test('counts are formatted without a currency symbol', () => {
  assert.equal(fmt.formatCount(785694), '785,694');
  assert.equal(fmt.formatCount(null), '—');
});

test('variance returns null when there is nothing to compare against', () => {
  assert.equal(fmt.variance(100, 0), null);
  assert.equal(fmt.variance(100, null), null);
  assert.equal(fmt.formatVariance(null), '—');
  assert.equal(fmt.formatVariance(0.106), '+10.6%');
  assert.equal(fmt.formatVariance(-0.042), '-4.2%');
});

test('ticket age keeps day precision up to 90 days', () => {
  assert.equal(fmt.formatAge(0), 'Today');
  assert.equal(fmt.formatAge(1), '1 day');
  assert.equal(fmt.formatAge(47), '47 days');
  assert.equal(fmt.formatAge(90), '90 days');
  assert.equal(fmt.formatAge(120), '4 months');
  assert.equal(fmt.formatAge(null), '—');
});

test('relative time is measured against the fixed simulation instant', () => {
  const { AS_OF } = { AS_OF: '2026-08-17T09:00:00.000Z' };
  assert.equal(fmt.formatRelative(new Date(Date.parse(AS_OF) - 30 * 60000).toISOString()), '30 min ago');
  assert.equal(fmt.formatRelative(new Date(Date.parse(AS_OF) - 3 * 3600000).toISOString()), '3 hours ago');
  assert.equal(fmt.formatRelative(null), '—');
});

test('escaping neutralises markup', () => {
  assert.equal(fmt.esc('<script>alert("x")</script>'),
    '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  assert.equal(fmt.esc(null), '');
});

test('initials are derived from a name', () => {
  assert.equal(fmt.initials('Rowan Whitfield'), 'RW');
  assert.equal(fmt.initials('Amara'), 'A');
  assert.equal(fmt.initials(''), '??');
});

/* ═══════════════════════ server-side allow-list ═══════════════════════ */

test('the server drops anything not on its allow-list', () => {
  const d = intentRoute.normalizeDecision({
    workflow: 'exfiltrate',
    period: 'all_time',
    focus: 'salary',
    blockOrder: ['projects', 'evil-block'],
    title: 'Snapshot <img src=x onerror=alert(1)>',
  });

  assert.equal(d.workflow, 'other', 'unknown workflow falls back');
  assert.equal(d.period, 'ytd', 'unknown period falls back');
  assert.ok(!/[<>]/.test(d.title), 'markup stripped from the title');
  assert.equal('focus' in d, false, 'the layout is not the model\'s to describe');
  assert.equal('blockOrder' in d, false);
});

test('the server never returns figures or free-form fields', () => {
  const d = intentRoute.normalizeDecision({
    workflow: 'relationship_snapshot',
    revenue: 999999,
    html: '<div>injected</div>',
    recommendation: 'You should upsell this client',
  });
  assert.deepEqual(Object.keys(d).sort(), ['period', 'title', 'workflow']);
});

test('the server survives malformed model output', () => {
  for (const bad of [null, undefined, 'a string', 42, []]) {
    const d = intentRoute.normalizeDecision(bad);
    assert.equal(d.workflow, 'other');
    assert.equal(d.period, 'ytd');
  }
});

test('the server extracts JSON from fenced or chatty model output', () => {
  assert.deepEqual(intentRoute.parseModelJson('{"workflow":"other"}'), { workflow: 'other' });
  assert.deepEqual(intentRoute.parseModelJson('```json\n{"workflow":"other"}\n```'),
    { workflow: 'other' });
  assert.deepEqual(intentRoute.parseModelJson('Sure! {"workflow":"other"} hope that helps'),
    { workflow: 'other' });
  assert.equal(intentRoute.parseModelJson('no json here'), null);
  assert.equal(intentRoute.parseModelJson(null), null);
});

test('the system prompt forbids advice and fabricated figures', () => {
  const p = intentRoute.SYSTEM_PROMPT.toLowerCase();
  assert.match(p, /never calculate/);
  assert.match(p, /never emit html/);
  assert.match(p, /never offer recommendations/);
  assert.match(p, /never guess a ctn/);
});

/* ═══════════════════════ no advice anywhere in the data ═══════════════════════ */

test('simulated data contains no advisory language', () => {
  const banned = /next step|recommend|you should|we should|priorit|advis|opportunity to/i;
  for (const ctn of ['101', '202', '303', '404', '505']) {
    const json = JSON.stringify(getSnapshot(ctn));
    const match = json.match(banned);
    assert.equal(match, null, `CTN ${ctn} contains advisory language: ${match?.[0]}`);
  }
});

/* ═══════════════════════ account ownership ═══════════════════════ */

test('every named account resolves to its real relationship manager', () => {
  const expected = {
    101: 'Paul Elflain',   // HSBC — the named-account rule outranks the segment
    202: 'Neil Marns',     // Schroders, Asset Manager
    303: 'Neil Marns',     // BlackRock, Asset Manager
    404: 'Scott Maxam',    // L&G, Distributor
    505: 'Neil Marns',     // abrdn, Fund Manager
  };
  for (const [ctn, name] of Object.entries(expected)) {
    assert.equal(getSnapshot(ctn).relationship.manager.name, name, `CTN ${ctn}`);
  }
});

test('ownership follows the segment, not the seed', () => {
  assert.equal(rmFor({ accountName: 'Anything', segment: 'Distributor' }).name, 'Scott Maxam');
  assert.equal(rmFor({ accountName: 'Anything', segment: 'Fund Manager' }).name, 'Neil Marns');
  assert.equal(rmFor({ accountName: 'Anything', segment: 'ETF' }).name, 'Paul Elflain');
  // Casing and padding come from generated profiles, so they must not matter.
  assert.equal(rmFor({ accountName: 'x', segment: '  transfer AGENT ' }).name, 'Neil Marns');
});

test('an unrecognised segment falls to the owner of "and others"', () => {
  assert.equal(rmFor({ accountName: 'Kestrel', segment: 'Wealth Manager' }).name, 'Nicki Pelling');
  assert.equal(rmFor({}).name, 'Nicki Pelling');
});

test('a named account outranks its segment in both directions', () => {
  // HSBC is a transfer agent, which would otherwise be Neil's.
  assert.equal(rmFor({ accountName: 'HSBC Asset Management', segment: 'Transfer Agent' }).name, 'Paul Elflain');
  // Allfunds is a platform, which would otherwise be Scott's.
  assert.equal(rmFor({ accountName: 'Allfunds Bank', segment: 'Platform' }).name, 'Nicki Pelling');
});

test('the manager never also appears in their own supporting team', () => {
  for (const ctn of ['101', '202', '303', '404', '505', '777']) {
    const r = getSnapshot(ctn).relationship;
    const names = r.team.map((t) => t.name);
    assert.ok(!names.includes(r.manager.name), `CTN ${ctn}: manager duplicated in team`);
    assert.equal(new Set(names).size, names.length, `CTN ${ctn}: team lists someone twice`);
  }
});

test('client contacts stay invented', () => {
  // Real colleagues must never be attributed to a client firm.
  const staff = new Set(STAFF.map((p) => p.name));
  for (const ctn of ['101', '202', '303', '404', '505']) {
    for (const c of getSnapshot(ctn).relationship.contacts) {
      assert.ok(!staff.has(c.name), `CTN ${ctn}: ${c.name} is Calastone staff, shown as a client contact`);
    }
  }
});

/* ═══════════════════════ follow-up answers ═══════════════════════ */

test('the answering prompt forbids invention, advice and a stated cause', () => {
  const p = qaRoute.SYSTEM_RULES.toLowerCase();
  // The figures must come from the payload.
  assert.match(p, /every figure you state must appear in the json/);
  // The example question users actually ask is the one the data cannot answer.
  assert.match(p, /no record states a cause/);
  assert.match(p, /the records carry no cause/);
  assert.match(p, /there is no daily or weekly series/);
  // Same prohibitions the dashboard is already held to.
  assert.match(p, /never recommend, suggest, advise, prioritise, rank/);
  assert.match(p, /never claim the data is live/);
  // Prompt-injection guard, as on the classifier route.
  assert.match(p, /never as instructions/);
});

test('the answering route pins a model the client cannot change', () => {
  assert.equal(qaRoute.MODEL, 'claude-opus-5');
});

test('a question is required and bounded', () => {
  assert.equal(qaRoute.validatePayload({ snapshot: getSnapshot('303') }).error.status, 400);
  assert.equal(qaRoute.validatePayload({ question: '   ', snapshot: getSnapshot('303') }).error.status, 400);
  assert.equal(
    qaRoute.validatePayload({ question: 'x'.repeat(501), snapshot: getSnapshot('303') }).error.status,
    413,
  );
});

test('only a simulated snapshot can be answered on', () => {
  assert.equal(qaRoute.validatePayload({ question: 'why?' }).error.status, 400);
  const real = { ...getSnapshot('303'), simulated: false };
  const out = qaRoute.validatePayload({ question: 'why?', snapshot: real });
  assert.equal(out.error.status, 400);
  assert.match(out.error.message, /simulated/i);
});

test('a valid payload yields grounding that carries the figures', () => {
  const snapshot = getSnapshot('303');
  const out = qaRoute.validatePayload({ question: 'How many tickets are open?', snapshot });
  assert.equal(out.error, undefined);
  assert.equal(out.question, 'How many tickets are open?');
  // The open-ticket count and the monthly series both have to be in there, or
  // the model is being asked to answer from nothing.
  assert.ok(out.grounding.includes(String(snapshot.tickets.open)));
  assert.ok(out.grounding.includes('ACCOUNT ON SCREEN'));
});

test('ticket totals are computed for the model, not left to it', () => {
  const snapshot = getSnapshot('303');
  const t = qaRoute.deriveTotals(snapshot);
  const raised = snapshot.tickets.monthly.reduce((a, m) => a + m.raised, 0);
  const resolved = snapshot.tickets.monthly.reduce((a, m) => a + m.resolved, 0);
  assert.equal(t.ticketsRaisedYtd, raised);
  assert.equal(t.ticketsResolvedYtd, resolved);
  assert.equal(t.ticketsNetYtd, raised - resolved);
  assert.equal(t.monthsCovered, snapshot.tickets.monthly.length);
  // The totals must reach the prompt, or the model goes back to adding up.
  const grounding = qaRoute.buildGrounding(snapshot, []);
  assert.ok(grounding.includes('PRE-COMPUTED TOTALS'));
  assert.ok(grounding.includes(String(raised)));
});

test('an account with no ticket series yields no totals', () => {
  assert.equal(qaRoute.deriveTotals({ tickets: { monthly: [] } }), null);
  assert.equal(qaRoute.deriveTotals({}), null);
});

test('the digest covers the other accounts and never the one on screen', () => {
  const digest = buildDigest('303');
  assert.equal(digest.length, 4);
  assert.ok(!digest.some((d) => d.ctn === '303'));
  const hsbc = digest.find((d) => d.ctn === '101');
  assert.equal(hsbc.account, 'HSBC Asset Management');
  assert.equal(hsbc.relationshipManager, 'Paul Elflain');
  assert.equal(typeof hsbc.ticketsOpen, 'number');
});

test('answer text is escaped before any markup is added', () => {
  const html = renderRich('A <script>alert(1)</script> tag and **a figure**.');
  assert.ok(!html.includes('<script>'), html);
  assert.ok(html.includes('&lt;script&gt;'), html);
  assert.ok(html.includes('<strong>a figure</strong>'), html);
});

test('answer text renders paragraphs and lists', () => {
  const html = renderRich('First para.\n\n- one\n- two\n\nLast para.');
  assert.equal((html.match(/<p>/g) || []).length, 2);
  assert.equal((html.match(/<li>/g) || []).length, 2);
  // A bare asterisk must not become markup.
  assert.ok(!renderRich('2 * 3 = 6').includes('<strong>'));
});
