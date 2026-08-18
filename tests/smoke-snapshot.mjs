/**
 * Relationship Snapshot — browser smoke driver.
 *
 * Drives the real Intelligence Module page in headless Chromium and checks the
 * behaviours that only exist in a DOM: the assembly wheel, dashboard assembly,
 * KPI expansion exclusivity, the CTN clarification flow, degraded sources,
 * reduced motion, and that the existing canned-answer path still works.
 *
 * Usage:
 *   node scripts/local-pulse-server.js &     (or: PORT=3111 npm run dev)
 *   node tests/smoke-snapshot.mjs [baseUrl]
 */

import { launch } from './cdp.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] || 'http://localhost:3111';
const URL = `${BASE}/pulse/tools/calastone-intelligence/index.html`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tests', 'screenshots');

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? '  PASS' : '  FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

/** Type a prompt into the chat and submit it through the real handler. */
const ask = (text) => `
  const input = document.getElementById('chatInput');
  input.value = ${JSON.stringify(text)};
  input.dispatchEvent(new Event('input'));
  document.getElementById('sendBtn').click();
  return true;
`;

/** Poll until an expression is truthy. */
const waitFor = (expr, timeout = 15000) => `
  const t0 = Date.now();
  while (Date.now() - t0 < ${timeout}) {
    try { if (${expr}) return true; } catch (e) {}
    await new Promise(r => setTimeout(r, 120));
  }
  return false;
`;

/**
 * The account name of the most recently rendered dashboard.
 *
 * Snapshots now live in the chat thread, so earlier ones stay on screen —
 * always read the last, never `querySelector`, which would answer with a stale
 * dashboard from a previous scenario.
 */
const LAST_ACCOUNT = '[...document.querySelectorAll(".rs-account-name")].pop()?.textContent?.trim()';

/** Wait for a snapshot belonging to a SPECIFIC account. */
const waitForAccount = (name, timeout = 15000) =>
  waitFor(`${LAST_ACCOUNT} === ${JSON.stringify(name)}`, timeout);

/**
 * Clear feature state AND the thread itself, so each scenario starts from an
 * empty conversation. Emptying the thread matters now that snapshots and
 * clarification cards persist in it as ordinary messages — leaving them behind
 * makes later "is anything rendered?" checks answer about the wrong turn.
 */
const resetToChat = `
  window.RelationshipSnapshot.reset();
  document.getElementById('threadInner').replaceChildren();
  await new Promise(r => setTimeout(r, 500));
  return true;
`;

/** Let the assembly sequence finish before a capture, so shots aren't mid-stagger. */
const settle = 'await new Promise(r => setTimeout(r, 1400)); return true;';

const page = await launch({ headless: true });

try {
  console.log(`\nLoading ${URL}\n`);
  await page.setViewport(1600, 1000);
  await page.goto(URL, { waitMs: 1200 });

  /* ─── 1. Feature registers ─── */
  check('feature module registered',
    await page.eval('return typeof window.RelationshipSnapshot === "object";'));
  check('ECharts loaded',
    await page.eval('return typeof window.echarts === "object";'));
  // The feature deliberately has no view or nav item of its own — it is
  // recognised from the chat and answered in the thread.
  check('no separate snapshot view',
    await page.eval('return !document.getElementById("view-snapshot");'));
  check('no snapshot nav item',
    await page.eval('return !document.querySelector(\'.nav-item[data-view="snapshot"]\');'));

  // The load-failure banner must stay silent when the module actually loaded.
  check('no module-failure banner over http',
    await page.eval("return document.getElementById('moduleWarning').textContent.trim() === '';"));

  /* ─── 2. Full snapshot run: CTN 303 ─── */
  console.log('\n[CTN 303 — full dashboard]');
  await page.eval(ask('Give me a relationship snapshot for CTN 303'));

  // Generous: with a real ANTHROPIC_API_KEY set, classification is a network
  // round trip to the model before retrieval — and therefore the wheel — starts.
  check('assembly wheel appeared',
    await page.eval(waitFor('document.querySelector(".rs-wheel")', 15000)));

  await page.screenshot(path.join(SHOTS, '01-assembly-wheel.png'));

  check('dashboard assembled',
    await page.eval(waitForAccount('BlackRock', 15000)));
  check('wheel collapsed away',
    await page.eval(waitFor('!document.querySelector(".rs-wheel")', 8000)));
  check('header status chip visible',
    await page.eval(waitFor('document.querySelector("#rs-source-chip.is-visible")', 6000)));

  const account = await page.eval(`return ${LAST_ACCOUNT};`);
  check('correct account rendered', account === 'BlackRock', account);

  check('dashboard rendered inside a chat message',
    await page.eval('return !!document.querySelector("#threadInner .msg.assistant .assistant-body .rs-root");'));
  check('thread column widened for the snapshot',
    await page.eval('return document.getElementById("threadInner").classList.contains("has-wide");'));
  check('chat view still active',
    await page.eval('return document.querySelector(".view.active")?.id === "view-chat";'));

  const blocks = await page.eval(
    'return [...document.querySelectorAll(".rs-main [data-block]")].map(e => e.dataset.block);');
  check('all seven blocks rendered', blocks.length === 7, blocks.join(', '));

  const kpiCount = await page.eval('return document.querySelectorAll(".rs-kpi").length;');
  check('five KPI cards', kpiCount === 5, `got ${kpiCount}`);

  // Only the open card renders its detail; the closed ones are strips. Charts
  // mount on first open, which the deck section below exercises.
  const openBody = await page.eval(`
    const open = document.querySelector('.rs-deck > .rs-section[data-open="true"]');
    const b = open?.querySelector('.rs-section-body');
    return { block: open?.dataset.block, visible: !!b && !b.hidden, children: b?.children.length || 0 };`);
  check('the open card shows its detail',
    openBody.visible && openBody.children > 0, `${openBody.block}: ${openBody.children} children`);

  const sevTitle = await page.eval(`
    return [...document.querySelectorAll('.rs-main .rs-chart-title')]
      .some(h => h.textContent.trim() === 'Open tickets by severity');`);
  check('severity chart titled exactly (accessible HTML heading)', sevTitle);

  // The rail was removed: the header already carries a chip per source, and
  // the per-section evidence drawers carry the refresh time and record counts.
  check('no source rail in the dashboard',
    await page.eval('return !document.querySelector(".rs-rail");'));
  const headerSources = await page.eval(
    'return document.querySelectorAll(".rs-header-sources .rs-src-chip").length;');
  check('the header names all four sources', headerSources === 4, `got ${headerSources}`);

  const noAdvice = await page.eval(`
    const t = document.querySelector('.rs-root').innerText.toLowerCase();
    const banned = ['next step','recommend','we should','you should','priorit','suggest','advis'];
    return banned.filter(b => t.includes(b));`);
  check('no advice/recommendation language', noAdvice.length === 0, noAdvice.join(', '));

  await page.eval(settle);
  await page.screenshot(path.join(SHOTS, '02-dashboard-303.png'), { fullPage: true, expandScrollers: true });

  /* ─── 2b. One screen, as a deck of expandable cards ─── */
  console.log('\n[One screen]');
  const deck = await page.eval(`
    const root = document.querySelector('.rs-root');
    const thread = document.getElementById('chatThread');
    const cards = [...root.querySelectorAll('.rs-deck > .rs-section')];
    return {
      mode: root.dataset.fit || 'list',
      rootH: Math.round(root.getBoundingClientRect().height),
      threadH: thread.clientHeight,
      overflowX: thread.scrollWidth - thread.clientWidth,
      cards: cards.map(c => c.dataset.block),
      open: cards.filter(c => c.dataset.open === 'true').map(c => c.dataset.block),
      summaries: cards.map(c => (c.querySelector('.rs-section-summary')?.textContent || '').trim()),
      strip: Math.round(cards.find(c => c.dataset.open === 'false').getBoundingClientRect().height),
    };`);
  check('dashboard uses the one-screen layout', deck.mode === 'on', deck.mode);
  check('dashboard fits the thread viewport without scrolling',
    deck.rootH <= deck.threadH + 2, `${deck.rootH}px in ${deck.threadH}px`);
  check('no horizontal scroll', deck.overflowX === 0, `${deck.overflowX}px`);
  check('five cards in the deck', deck.cards.length === 5, deck.cards.join(', '));
  check('exactly one card open', deck.open.length === 1, deck.open.join(', '));
  // A closed card is not an empty label: it carries its own headline figures.
  check('every card carries a summary on its strip',
    deck.summaries.every(t => t.length > 0), deck.summaries.join(' | '));
  check('a closed card is a strip, not a panel', deck.strip < 70, `${deck.strip}px`);

  /* opening another card closes the first */
  const exclusive = await page.eval(`
    const cards = [...document.querySelectorAll('.rs-deck > .rs-section')];
    const shut = cards.find(c => c.dataset.open === 'false');
    shut.querySelector('.rs-section-toggle').click();
    await new Promise(r => setTimeout(r, 700));
    const open = cards.filter(c => c.dataset.open === 'true');
    const root = document.querySelector('.rs-root');
    const thread = document.getElementById('chatThread');
    return {
      opened: shut.dataset.block,
      openCount: open.length,
      openIs: open[0]?.dataset.block,
      stillFits: root.getBoundingClientRect().height <= thread.clientHeight + 2,
      mounted: shut.querySelectorAll('canvas').length,
    };`);
  check('opening a card opens it', exclusive.openIs === exclusive.opened, exclusive.openIs);
  check('opening a card closes the other', exclusive.openCount === 1, `${exclusive.openCount} open`);
  check('still one screen after expanding', exclusive.stillFits);
  check('a card mounts its charts when first opened', exclusive.mounted >= 1,
    `${exclusive.mounted} canvases`);

  /* ─── 3. KPI expansion exclusivity ─── */
  console.log('\n[KPI expansion]');
  await page.eval('document.querySelector(\'.rs-kpi[data-kpi="billing"] .rs-kpi-head\').click(); return 1;');
  await page.eval(waitFor('document.querySelector(\'.rs-kpi[data-kpi="billing"][data-expanded="true"]\')', 4000));
  check('billing KPI expanded',
    await page.eval('return document.querySelector(\'.rs-kpi[data-kpi="billing"]\').dataset.expanded === "true";'));

  await page.eval('document.querySelector(\'.rs-kpi[data-kpi="tickets"] .rs-kpi-head\').click(); return 1;');
  await page.eval(waitFor('document.querySelector(\'.rs-kpi[data-kpi="tickets"][data-expanded="true"]\')', 4000));
  const openCount = await page.eval('return document.querySelectorAll(\'.rs-kpi[data-expanded="true"]\').length;');
  check('only one KPI expanded at a time', openCount === 1, `${openCount} open`);

  // The run ends scrolled to the foot of the dashboard; frame the rail itself.
  await page.eval(`document.querySelector('.rs-kpi-track')
    .scrollIntoView({ block: 'center' }); return 1;`);
  await page.eval(settle);
  await page.screenshot(path.join(SHOTS, '03-kpi-expanded.png'));

  /* ─── 4. Missing CTN → clarification, no data fetched ─── */
  console.log('\n[Missing CTN gate]');
  await page.eval(resetToChat);
  await page.eval(ask('Prepare a relationship overview'));

  check('clarification card shown',
    await page.eval(waitFor('document.querySelector(".rs-clarify")', 8000)));

  const clarifyText = await page.eval(`return document.querySelector(".rs-clarify-body")
    ?.textContent?.replace(/\\s+/g, ' ').trim();`);
  check('clarification wording exact',
    clarifyText === 'Which account? Give the three-digit CTN ID — for example CTN 303 — or pick one below.',
    clarifyText);
  // Five bare codes told a user who knows the account by name nothing at all.
  const chipText = await page.eval(`return document.querySelector('.rs-clarify-chip')
    ?.textContent?.replace(/\\s+/g, ' ').trim();`);
  check('clarification chips name the account, not just the code',
    chipText === 'CTN 101 HSBC Asset Management', chipText);

  check('no dashboard rendered before CTN',
    await page.eval('return !document.querySelector(".rs-main .rs-header");'));
  check('pending workflow persisted',
    await page.eval('return !!window.RelationshipSnapshot.pending;'));
  const pendingPrompt = await page.eval('return window.RelationshipSnapshot.pending?.prompt;');
  check('original prompt preserved', pendingPrompt === 'Prepare a relationship overview', pendingPrompt);

  await page.eval(settle);
  await page.screenshot(path.join(SHOTS, '04-clarification.png'));

  /* ─── 5. Follow-up CTN resolves the pending workflow ─── */
  console.log('\n[Pending workflow resumes]');
  await page.eval(ask('CTN 101'));
  check('pending workflow ran on CTN',
    await page.eval(waitForAccount('HSBC Asset Management', 15000)));
  const resumedAccount = await page.eval(`return ${LAST_ACCOUNT};`);
  check('resumed with correct account', resumedAccount === 'HSBC Asset Management', resumedAccount);
  check('resumed-from line names the original prompt',
    await page.eval(`return document.querySelector('.rs-resumed')?.textContent
      ?.includes('Prepare a relationship overview') === true;`));
  check('pending cleared', await page.eval('return window.RelationshipSnapshot.pending === null;'));

  /* ─── 5b. An organisation the simulation does not hold ─── */
  console.log('\n[Unrecognised organisation]');
  await page.eval(resetToChat);
  await page.eval(ask('relationship snapshot for Barclays'));
  check('clarification shown for an organisation we do not hold',
    await page.eval(waitFor('document.querySelector(".rs-clarify")', 10000)));
  const unknownText = await page.eval(`return document.querySelector('.rs-clarify-body')
    ?.textContent?.replace(/\\s+/g, ' ').trim();`);
  // The whole point of the card: a user must never be shown a dashboard headed
  // with a different company without being told which name was not recognised.
  check('the card names the organisation it does not have',
    unknownText?.includes('Barclays') === true, unknownText);
  check('nothing retrieved for an unrecognised organisation',
    await page.eval('return !document.querySelector(".rs-main .rs-header");'));

  /* ─── 5c. An account named rather than numbered ─── */
  console.log('\n[Account named, not numbered]');
  await page.eval(resetToChat);
  // No snapshot wording at all: this is claimed purely because it names an
  // account the host has no prepared answer about.
  await page.eval(ask('how is billing looking for HSBC this year?'));
  check('a name in the directory resolves to its CTN',
    await page.eval(waitForAccount('HSBC Asset Management', 15000)));
  check('no clarification asked for a name we do hold',
    await page.eval('return !document.querySelector(".rs-clarify");'));
  const matchLine = await page.eval(`return document.querySelector('.rs-resumed')
    ?.textContent?.replace(/\\s+/g, ' ').trim();`);
  check('the match is stated above the dashboard',
    matchLine?.includes('hsbc') === true && matchLine?.includes('CTN 101') === true,
    matchLine);

  /* ─── 6. Degraded sources: CTN 505 ─── */
  console.log('\n[CTN 505 — degraded sources]');
  await page.eval(resetToChat);
  await page.eval(ask('Give me a relationship snapshot for CTN 505'));
  check('505 dashboard assembled',
    await page.eval(waitForAccount('abrdn', 15000)));

  const states = await page.eval(
    'return [...document.querySelectorAll(".rs-header-sources .rs-src-chip")].map(e => e.textContent.trim().toLowerCase() + ":" + e.dataset.state);');
  check('billing delayed + transactions unavailable',
    states.includes('billing:delayed') && states.includes('transactions:unavailable'),
    states.join(', '));
  check('unavailable block rendered',
    await page.eval('return !!document.querySelector(".rs-state-severe");'));
  check('delayed notice rendered',
    await page.eval('return !!document.querySelector(".rs-state-attention");'));
  check('dashboard still renders other blocks',
    await page.eval('return document.querySelectorAll(".rs-main [data-block]").length === 7;'));

  await page.eval(settle);
  await page.screenshot(path.join(SHOTS, '05-degraded-505.png'), { fullPage: true, expandScrollers: true });

  /* ─── 7. Regression: canned answers still work ─── */
  console.log('\n[Regression — existing canned path]');
  await page.eval(resetToChat);
  await page.eval(ask('What stage is Digital TA at?'));
  check('canned answer still renders',
    await page.eval(waitFor('document.querySelector(".info-card")', 8000)));
  check('canned answer not hijacked',
    await page.eval('return !document.querySelector(".rs-clarify") && !document.querySelector(".rs-root");'));
  check('thread stays at its normal width for a canned answer',
    await page.eval('return !document.getElementById("threadInner").classList.contains("has-wide");'));

  /* ─── 8. Responsive ─── */
  console.log('\n[Responsive]');
  await page.eval(resetToChat);
  await page.eval(ask('Give me a relationship snapshot for CTN 202'));
  check('202 dashboard assembled for the responsive pass',
    await page.eval(waitForAccount('Schroders', 15000)));
  await page.setViewport(760, 900);
  await page.eval('await new Promise(r=>setTimeout(r,600)); return 1;');
  const narrow = await page.eval(`
    const root = document.querySelector('.rs-root');
    const thread = document.getElementById('chatThread');
    return {
      cards: root.querySelectorAll('.rs-deck > .rs-section').length,
      fits: root.getBoundingClientRect().height <= thread.clientHeight + 2,
    };`);
  check('the deck survives a 760px viewport', narrow.cards === 5, `${narrow.cards} cards`);
  check('still one screen at 760px', narrow.fits);
  const noHScroll = await page.eval(
    'return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2;');
  check('no horizontal page overflow at 760px', noHScroll);
  // The widened column must never push the thread itself into a sideways scroll.
  const threadNoHScroll = await page.eval(`
    const t = document.getElementById('chatThread');
    return t.scrollWidth <= t.clientWidth + 2;`);
  check('chat thread does not scroll horizontally at 760px', threadNoHScroll);
  await page.eval(settle);
  await page.screenshot(path.join(SHOTS, '06-responsive-760.png'), { fullPage: true, expandScrollers: true });
  await page.setViewport(1440, 900);

  /* ─── 9. Reduced motion ─── */
  console.log('\n[Reduced motion]');
  await page.setReducedMotion(true);
  await page.goto(URL, { waitMs: 1200 });
  await page.eval(ask('Give me a relationship snapshot for CTN 404'));
  check('dashboard assembles under reduced motion',
    await page.eval(waitForAccount('Legal & General Investment Management', 15000)));
  const allVisible = await page.eval(`
    const blocks = [...document.querySelectorAll('.rs-main [data-block]')];
    return blocks.length > 0 && blocks.every(b => parseFloat(getComputedStyle(b).opacity) > 0.95);`);
  check('all blocks fully visible (not stuck at opacity 0)', allVisible);
  check('status chip visible under reduced motion',
    await page.eval('return !!document.querySelector("#rs-source-chip.is-visible");'));
  await page.eval(settle);
  await page.screenshot(path.join(SHOTS, '07-reduced-motion.png'), { fullPage: true, expandScrollers: true });
  await page.setReducedMotion(false);

  /* ─── 10. Console health ─── */
  console.log('\n[Console]');
  const realErrors = page.pageErrors.filter((e) => !/favicon|ERR_INTERNET_DISCONNECTED/i.test(e));
  check('no uncaught page errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

} finally {
  await page.close();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
console.log(`Screenshots: ${SHOTS}`);
if (failed.length) {
  console.log('\nFailures:');
  for (const f of failed) console.log(`  · ${f.name}${f.detail ? ` — ${f.detail}` : ''}`);
  process.exitCode = 1;
}
