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
const { RelationshipSnapshotSchema, WorkflowDecisionSchema, safeValidate } = await import(`${FEATURE}/schemas.js`);
const { resolveOrder, ALLOWED_BLOCK_IDS, BLOCKS } = await import(`${FEATURE}/blocks/registry.js`);
const { DEFAULT_BLOCK_ORDER, FOCUS_ORDERS, BLOCK_IDS } = await import(`${FEATURE}/config.js`);
const fmt = await import(`${FEATURE}/format.js`);
const billing = await import(`${FEATURE}/charts/billing-revenue.js`);
const transactions = await import(`${FEATURE}/charts/transactions.js`);
const operations = await import(`${FEATURE}/charts/operations.js`);
const timeline = await import(`${FEATURE}/charts/project-timeline.js`);

const require = createRequire(import.meta.url);
const intentRoute = require('../api/snapshot-intent.js');

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

test('display focus is extracted from the prompt', () => {
  assert.equal(classifyLocally('Show billing for CTN 202').focus, 'billing');
  assert.equal(classifyLocally('Show operational activity for CTN 404').focus, 'operations');
  assert.equal(classifyLocally('relationship snapshot: show projects for CTN 404').focus, 'delivery');
  assert.equal(classifyLocally('Show transactions for CTN 202').focus, 'transactions');
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
  assert.equal(outcome.decision.focus, pending.decision.focus, 'the original decision is reused');
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

test('an account is found by its full name or its distinctive word', () => {
  assert.equal(lookupAccount('relationship snapshot for Meridian')?.ctn, '303');
  assert.equal(lookupAccount('Meridian Asset Partners overview')?.ctn, '303');
  assert.equal(lookupAccount('how are things at thornbury?')?.ctn, '505');
  assert.equal(lookupAccount('KESTREL FUND SERVICES')?.ctn, '101');
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
  for (const name of ['blackrock', 'HSBC', 'Legal & General', 'Goldman']) {
    assert.equal(lookupAccount(name), null, name);
  }
});

test('a named account claims the prompt and runs without a clarification', () => {
  const text = 'give me a relationship snapshot for Meridian';
  const decision = classifyLocally(text);
  assert.equal(decision.workflow, 'relationship_snapshot');

  const outcome = gate(text, decision);
  assert.equal(outcome.action, 'run');
  assert.equal(outcome.ctn, '303');
  assert.equal(outcome.matchedName, 'Meridian Asset Partners');
  assert.equal(outcome.matchedAlias, 'meridian');
});

test('an explicit CTN outranks a name in the same message', () => {
  const text = 'snapshot for Meridian, CTN 101';
  const outcome = gate(text, classifyLocally(text));
  assert.equal(outcome.ctn, '101');
  assert.equal(outcome.matchedName, null);
});

test('an unrecognised organisation is quoted back, not resolved', () => {
  const text = 'relationship snapshot for blackrock';
  const outcome = gate(text, classifyLocally(text));
  assert.equal(outcome.action, 'clarify');
  assert.equal(outcome.pending.entity, 'blackrock');
});

test('the entity extractor does not mistake the request for a name', () => {
  assert.equal(namedEntity('give me a relationship snapshot'), null);
  assert.equal(namedEntity('Prepare a relationship overview'), null);
  assert.equal(namedEntity('snapshot for CTN 303'), null);
  assert.equal(namedEntity('relationship snapshot for HSBC'), 'HSBC');
});

test('a pending workflow resumes on a later message naming an account', () => {
  const first = 'relationship snapshot for blackrock';
  const pending = gate(first, classifyLocally(first)).pending;
  const outcome = gate('Thornbury', classifyLocally('Thornbury'), pending);
  assert.equal(outcome.action, 'run');
  assert.equal(outcome.ctn, '505');
  assert.equal(outcome.resumed, true);
  assert.equal(outcome.originalPrompt, first);
});

test('every runnable outcome carries the account it will actually show', () => {
  // The bug this guards: a dashboard rendered under a heading the user never
  // asked for, with nothing on screen connecting the two.
  for (const [text, expected] of [
    ['snapshot for CTN 404', 'Aldergate Investment Group'],
    ['relationship snapshot for Halden', 'Halden Capital Partners'],
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
  assert.equal(stable.account.name, 'Kestrel Fund Services');
  assert.ok(stable.sources.every((s) => s.state === 'live'), 'CTN 101 is fully live');

  const heavyOps = getSnapshot('303');
  assert.equal(heavyOps.account.name, 'Meridian Asset Partners');
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
    focus: 'billing',
    period: 'ytd',
    blockOrder: ['account-header', 'billing-revenue'],
    title: 'Relationship snapshot, billing focus',
  });
  assert.ok(r.ok, r.error);
});

test('defaults are applied for omitted optional fields', () => {
  const r = safeValidate(WorkflowDecisionSchema, { workflow: 'relationship_snapshot' });
  assert.ok(r.ok, r.error);
  assert.equal(r.data.period, 'ytd');
  assert.equal(r.data.focus, null);
  assert.equal(r.data.blockOrder, null);
});

test('unknown enum values are rejected', () => {
  assert.equal(safeValidate(WorkflowDecisionSchema, { workflow: 'delete_everything' }).ok, false);
  assert.equal(safeValidate(WorkflowDecisionSchema,
    { workflow: 'relationship_snapshot', focus: 'salary' }).ok, false);
  assert.equal(safeValidate(WorkflowDecisionSchema,
    { workflow: 'relationship_snapshot', period: 'all_time' }).ok, false);
});

test('unknown block ids are rejected', () => {
  const r = safeValidate(WorkflowDecisionSchema, {
    workflow: 'relationship_snapshot',
    blockOrder: ['account-header', 'exfiltrate-data'],
  });
  assert.equal(r.ok, false);
});

test('a repeated block id is rejected', () => {
  const r = safeValidate(WorkflowDecisionSchema, {
    workflow: 'relationship_snapshot',
    blockOrder: ['operations', 'operations'],
  });
  assert.equal(r.ok, false);
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

/* ═══════════════════════ block registry allow-list ═══════════════════════ */

test('the registry exposes exactly the allow-listed blocks', () => {
  assert.deepEqual([...ALLOWED_BLOCK_IDS].sort(), [...BLOCK_IDS].sort());
  for (const id of ALLOWED_BLOCK_IDS) {
    assert.equal(typeof BLOCKS[id], 'function', `${id} has no renderer`);
  }
});

test('non-allow-listed ids are dropped', () => {
  const order = resolveOrder(['operations', '<script>alert(1)</script>', 'made-up', '__proto__']);
  assert.ok(!order.includes('made-up'));
  assert.ok(!order.some((id) => id.includes('<')));
  assert.ok(order.every((id) => ALLOWED_BLOCK_IDS.includes(id)));
});

test('a requested order is honoured, then completed with the remaining blocks', () => {
  const order = resolveOrder(['operations', 'projects']);
  assert.equal(order[0], 'operations');
  assert.equal(order[1], 'projects');
  assert.equal(new Set(order).size, order.length, 'no duplicates');
  assert.equal(order.length, ALLOWED_BLOCK_IDS.length, 'no block is silently hidden');
});

test('duplicates collapse to the first occurrence', () => {
  const order = resolveOrder(['operations', 'operations', 'projects']);
  assert.deepEqual(order.slice(0, 2), ['operations', 'projects']);
});

test('an empty or absent order falls back to the default', () => {
  assert.deepEqual(resolveOrder(null), [...DEFAULT_BLOCK_ORDER]);
  assert.deepEqual(resolveOrder([]), [...DEFAULT_BLOCK_ORDER]);
  assert.deepEqual(resolveOrder('not-an-array'), [...DEFAULT_BLOCK_ORDER]);
});

test('focus reorders blocks without adding or removing any', () => {
  for (const [focus, expected] of Object.entries(FOCUS_ORDERS)) {
    const order = resolveOrder(null, { focus });
    assert.deepEqual(order, expected, focus);
    assert.deepEqual([...order].sort(), [...ALLOWED_BLOCK_IDS].sort(),
      `${focus} changed the block set`);
  }
});

test('focus always keeps the header and KPI rail at the top', () => {
  for (const focus of Object.keys(FOCUS_ORDERS)) {
    const order = resolveOrder(null, { focus });
    assert.equal(order[0], 'account-header');
    assert.equal(order[1], 'kpi-rail');
  }
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

test('the transactions chart states its unit and is separate from billing', () => {
  const opt = transactions.buildOption(getSnapshot('303').transactions);
  assert.match(opt.yAxis.name, /count/i, 'the measure must be unambiguous');
  assert.ok(!/GBP|£/.test(opt.yAxis.name), 'transactions are not a monetary value');
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

test('the project timeline renders only for multiple dated active projects', () => {
  assert.equal(timeline.shouldRender(getSnapshot('101').projects), false, 'one project');
  assert.equal(timeline.shouldRender(getSnapshot('404').projects), true, 'four projects');
  assert.equal(timeline.shouldRender([]), false);
  assert.equal(timeline.shouldRender(null), false);
});

test('the timeline uses one row per active dated project', () => {
  const projects = getSnapshot('404').projects;
  const opt = timeline.buildOption(projects);
  const active = projects.filter((p) => p.status !== 'complete');
  assert.equal(opt.series[0].data.length, active.length);
  assert.equal(opt.yAxis.data.length, active.length);
});

test('charts handle an empty series without throwing', () => {
  const empty = {
    available: true, currency: 'GBP', measure: 'Billed revenue',
    months: [], monthly: [], priorMonthly: [], ytd: 0, priorYtd: 0,
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
    focus: 'salary',
    period: 'all_time',
    blockOrder: ['operations', 'evil-block', 'operations'],
    title: 'Snapshot <img src=x onerror=alert(1)>',
  });

  assert.equal(d.workflow, 'other', 'unknown workflow falls back');
  assert.equal(d.focus, null);
  assert.equal(d.period, 'ytd');
  assert.deepEqual(d.blockOrder, ['operations'], 'unknown id and duplicate removed');
  assert.ok(!/[<>]/.test(d.title), 'markup stripped from the title');
});

test('the server never returns figures or free-form fields', () => {
  const d = intentRoute.normalizeDecision({
    workflow: 'relationship_snapshot',
    revenue: 999999,
    html: '<div>injected</div>',
    recommendation: 'You should upsell this client',
  });
  assert.deepEqual(Object.keys(d).sort(),
    ['blockOrder', 'focus', 'period', 'title', 'workflow']);
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
