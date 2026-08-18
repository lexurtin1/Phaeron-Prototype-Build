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
    await page.eval(waitForAccount('Meridian Asset Partners', 15000)));
  check('wheel collapsed away',
    await page.eval(waitFor('!document.querySelector(".rs-wheel")', 8000)));
  check('header status chip visible',
    await page.eval(waitFor('document.querySelector("#rs-source-chip.is-visible")', 6000)));

  const account = await page.eval(`return ${LAST_ACCOUNT};`);
  check('correct account rendered', account === 'Meridian Asset Partners', account);

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

  const canvases = await page.eval('return document.querySelectorAll(".rs-main canvas").length;');
  check('charts rendered to canvas', canvases >= 4, `${canvases} canvases`);

  const sevTitle = await page.eval(`
    return [...document.querySelectorAll('.rs-main .rs-chart-title')]
      .some(h => h.textContent.trim() === 'Open tickets by severity');`);
  check('severity chart titled exactly (accessible HTML heading)', sevTitle);

  const railCards = await page.eval('return document.querySelectorAll(".rs-src").length;');
  check('source rail shows four sources', railCards === 4, `got ${railCards}`);

  const noAdvice = await page.eval(`
    const t = document.querySelector('.rs-root').innerText.toLowerCase();
    const banned = ['next step','recommend','we should','you should','priorit','suggest','advis'];
    return banned.filter(b => t.includes(b));`);
  check('no advice/recommendation language', noAdvice.length === 0, noAdvice.join(', '));

  await page.eval(settle);
  await page.screenshot(path.join(SHOTS, '02-dashboard-303.png'), { fullPage: true, expandScrollers: true });

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

  const clarifyText = await page.eval('return document.querySelector(".rs-clarify-body")?.textContent?.trim();');
  check('clarification wording exact',
    clarifyText === 'Please provide the three-digit CTN ID for the specific entity, for example CTN 303.',
    clarifyText);

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
    await page.eval(waitForAccount('Kestrel Fund Services', 15000)));
  const resumedAccount = await page.eval(`return ${LAST_ACCOUNT};`);
  check('resumed with correct account', resumedAccount === 'Kestrel Fund Services', resumedAccount);
  check('resumed-from line names the original prompt',
    await page.eval(`return document.querySelector('.rs-resumed')?.textContent
      ?.includes('Prepare a relationship overview') === true;`));
  check('pending cleared', await page.eval('return window.RelationshipSnapshot.pending === null;'));

  /* ─── 6. Degraded sources: CTN 505 ─── */
  console.log('\n[CTN 505 — degraded sources]');
  await page.eval(resetToChat);
  await page.eval(ask('Give me a relationship snapshot for CTN 505'));
  check('505 dashboard assembled',
    await page.eval(waitForAccount('Thornbury Mutual', 15000)));

  const states = await page.eval(
    'return [...document.querySelectorAll(".rs-src")].map(e => e.dataset.source + ":" + e.dataset.state);');
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
    await page.eval(waitForAccount('Halden Capital Partners', 15000)));
  await page.setViewport(760, 900);
  await page.eval('await new Promise(r=>setTimeout(r,600)); return 1;');
  const railStacked = await page.eval(`
    const root = document.querySelector('.rs-root');
    const rail = root.querySelector('.rs-rail-host');
    const main = root.querySelector('.rs-main');
    return rail.getBoundingClientRect().top >= main.getBoundingClientRect().bottom - 2;`);
  check('source rail stacks below the dashboard at 760px', railStacked);
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
    await page.eval(waitForAccount('Aldergate Investment Group', 15000)));
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
