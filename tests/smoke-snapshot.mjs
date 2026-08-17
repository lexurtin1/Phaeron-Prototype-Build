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
 * Wait for a snapshot belonging to a SPECIFIC account.
 *
 * Waiting on `.rs-header` alone races: a previously rendered dashboard is still
 * in the DOM, so the check passes instantly against stale content.
 */
const waitForAccount = (name, timeout = 15000) =>
  waitFor(`document.querySelector(".rs-account-name")?.textContent?.trim() === ${JSON.stringify(name)}`, timeout);

/** Return to the chat view and clear any rendered dashboard. */
const resetToChat = `
  window.RelationshipSnapshot.reset();
  document.querySelector('.nav-item[data-view="chat"]').click();
  await new Promise(r => setTimeout(r, 500));
  return true;
`;

const page = await launch({ headless: true });

try {
  console.log(`\nLoading ${URL}\n`);
  await page.goto(URL, { waitMs: 1200 });

  /* ─── 1. Feature registers ─── */
  check('feature module registered',
    await page.eval('return typeof window.RelationshipSnapshot === "object";'));
  check('ECharts loaded',
    await page.eval('return typeof window.echarts === "object";'));
  check('snapshot view exists',
    await page.eval('return !!document.getElementById("view-snapshot");'));

  /* ─── 2. Full snapshot run: CTN 303 ─── */
  console.log('\n[CTN 303 — full dashboard]');
  await page.eval(ask('Give me a relationship snapshot for CTN 303'));

  check('assembly wheel appeared',
    await page.eval(waitFor('document.querySelector(".rs-wheel")', 6000)));

  await page.screenshot(path.join(SHOTS, '01-assembly-wheel.png'));

  check('dashboard assembled',
    await page.eval(waitForAccount('Meridian Asset Partners', 15000)));
  check('wheel collapsed away',
    await page.eval(waitFor('!document.querySelector(".rs-wheel")', 8000)));
  check('header status chip visible',
    await page.eval(waitFor('document.querySelector("#rs-source-chip.is-visible")', 6000)));

  const account = await page.eval('return document.querySelector(".rs-account-name")?.textContent?.trim();');
  check('correct account rendered', account === 'Meridian Asset Partners', account);

  const blocks = await page.eval(
    'return [...document.querySelectorAll("#rs-main [data-block]")].map(e => e.dataset.block);');
  check('all seven blocks rendered', blocks.length === 7, blocks.join(', '));

  const kpiCount = await page.eval('return document.querySelectorAll(".rs-kpi").length;');
  check('five KPI cards', kpiCount === 5, `got ${kpiCount}`);

  const canvases = await page.eval('return document.querySelectorAll("#rs-main canvas").length;');
  check('charts rendered to canvas', canvases >= 4, `${canvases} canvases`);

  const sevTitle = await page.eval(`
    return [...document.querySelectorAll('#rs-main .rs-chart-title')]
      .some(h => h.textContent.trim() === 'Open tickets by severity');`);
  check('severity chart titled exactly (accessible HTML heading)', sevTitle);

  const railCards = await page.eval('return document.querySelectorAll(".rs-src").length;');
  check('source rail shows four sources', railCards === 4, `got ${railCards}`);

  const noAdvice = await page.eval(`
    const t = document.getElementById('view-snapshot').innerText.toLowerCase();
    const banned = ['next step','recommend','we should','you should','priorit','suggest','advis'];
    return banned.filter(b => t.includes(b));`);
  check('no advice/recommendation language', noAdvice.length === 0, noAdvice.join(', '));

  await page.screenshot(path.join(SHOTS, '02-dashboard-303.png'), { fullPage: true });

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
    await page.eval('return !document.querySelector("#rs-main .rs-header");'));
  check('pending workflow persisted',
    await page.eval('return !!window.RelationshipSnapshot.pending;'));
  const pendingPrompt = await page.eval('return window.RelationshipSnapshot.pending?.prompt;');
  check('original prompt preserved', pendingPrompt === 'Prepare a relationship overview', pendingPrompt);

  await page.screenshot(path.join(SHOTS, '04-clarification.png'));

  /* ─── 5. Follow-up CTN resolves the pending workflow ─── */
  console.log('\n[Pending workflow resumes]');
  await page.eval(ask('CTN 101'));
  check('pending workflow ran on CTN',
    await page.eval(waitForAccount('Kestrel Fund Services', 15000)));
  const resumedAccount = await page.eval('return document.querySelector(".rs-account-name")?.textContent?.trim();');
  check('resumed with correct account', resumedAccount === 'Kestrel Fund Services', resumedAccount);
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
    await page.eval('return document.querySelectorAll("#rs-main [data-block]").length === 7;'));

  await page.screenshot(path.join(SHOTS, '05-degraded-505.png'), { fullPage: true });

  /* ─── 7. Regression: canned answers still work ─── */
  console.log('\n[Regression — existing canned path]');
  await page.eval(resetToChat);
  await page.eval(ask('What stage is Digital TA at?'));
  check('canned answer still renders',
    await page.eval(waitFor('document.querySelector(".info-card")', 8000)));
  check('canned answer not hijacked',
    await page.eval('return !document.querySelector(".rs-clarify") && !document.querySelector(".rs-thread-card");'));

  /* ─── 8. Responsive ─── */
  console.log('\n[Responsive]');
  await page.setViewport(760, 900);
  await page.eval('await new Promise(r=>setTimeout(r,600)); return 1;');
  const railStacked = await page.eval(`
    const rail = document.getElementById('rs-rail-host');
    const main = document.getElementById('rs-main');
    return rail.getBoundingClientRect().top >= main.getBoundingClientRect().top;`);
  check('source rail stacks below main at 760px', railStacked);
  const noHScroll = await page.eval(
    'return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2;');
  check('no horizontal page overflow at 760px', noHScroll);
  await page.screenshot(path.join(SHOTS, '06-responsive-760.png'), { fullPage: true });
  await page.setViewport(1440, 900);

  /* ─── 9. Reduced motion ─── */
  console.log('\n[Reduced motion]');
  await page.setReducedMotion(true);
  await page.goto(URL, { waitMs: 1200 });
  await page.eval(ask('Give me a relationship snapshot for CTN 404'));
  check('dashboard assembles under reduced motion',
    await page.eval(waitForAccount('Aldergate Investment Group', 15000)));
  const allVisible = await page.eval(`
    const blocks = [...document.querySelectorAll('#rs-main [data-block]')];
    return blocks.length > 0 && blocks.every(b => parseFloat(getComputedStyle(b).opacity) > 0.95);`);
  check('all blocks fully visible (not stuck at opacity 0)', allVisible);
  check('status chip visible under reduced motion',
    await page.eval('return !!document.querySelector("#rs-source-chip.is-visible");'));
  await page.screenshot(path.join(SHOTS, '07-reduced-motion.png'), { fullPage: true });
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
