/**
 * Relationship Snapshot — browser smoke driver.
 *
 * Drives the real Intelligence Module page in headless Chromium and checks the
 * behaviours that only exist in a DOM: the assembly wheel, dashboard assembly,
 * the static KPI rail, the CTN clarification flow, degraded sources,
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
  check('the template renders in its fixed order',
    blocks.join(',') === 'account-header,kpi-rail,operations,relationship,transactions,billing-revenue,projects',
    blocks.join(', '));

  const kpiCount = await page.eval('return document.querySelectorAll(".rs-kpi").length;');
  check('five KPI cards', kpiCount === 5, `got ${kpiCount}`);

  // Nothing on the dashboard is behind a toggle, so every card body is showing.
  const bodies = await page.eval(`
    return [...document.querySelectorAll('.rs-main .rs-section')].map(sec => ({
      block: sec.dataset.block,
      shown: !sec.querySelector('.rs-section-body')?.hidden,
      children: sec.querySelector('.rs-section-body')?.children.length || 0,
    }));`);
  check('every card shows its body', bodies.every(b => b.shown && b.children > 0),
    bodies.map(b => `${b.block}:${b.children}`).join(', '));
  check('no card can be collapsed',
    await page.eval('return document.querySelectorAll(".rs-section-toggle").length === 0;'));

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

  /* ─── 2b. One screen, fixed cards ─── */
  console.log('\n[The template]');
  const grid = await page.eval(`
    const root = document.querySelector('.rs-root');
    const thread = document.getElementById('chatThread');
    const box = (sel) => {
      const el = root.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      mode: root.dataset.fit || 'list',
      rootH: Math.round(root.getBoundingClientRect().height),
      threadH: thread.clientHeight,
      overflowX: thread.scrollWidth - thread.clientWidth,
      header: box('[data-block="account-header"]'),
      kpi: box('[data-block="kpi-rail"]'),
      tx: box('[data-block="transactions"]'),
      billing: box('[data-block="billing-revenue"]'),
      projects: box('[data-block="projects"]'),
      projectCards: root.querySelectorAll('.rs-project').length,
      charts: [...root.querySelectorAll('.rs-chart')]
        .map(c => Math.round(c.getBoundingClientRect().height)),
      clipped: [...root.querySelectorAll('.rs-section-body, .rs-projects')]
        .filter(b => b.scrollHeight > b.clientHeight + 1)
        .map(b => b.closest('.rs-section').dataset.block),
      ring: box('.rs-progress-ring'),
      trendType: root.querySelector('[data-chart="transactions"]') ? 'chart' : 'none',
    };`);

  check('the dashboard is sized to the thread', grid.mode === 'on', grid.mode);
  // The thread height is a floor, not a ceiling. What must hold is that no
  // chart has been thinned to fit and nothing has been clipped out of sight —
  // COMPACT_HEIGHT in charts/mount.js is 152px, below which a plot drops its
  // title, its axis name and half its gridlines.
  check('no chart is thinned to fit', grid.charts.every(h => h >= 152),
    grid.charts.join(', '));
  check('nothing is clipped out of a card', grid.clipped.length === 0,
    grid.clipped.join(', '));
  check('the overrun past the thread stays modest', grid.rootH - grid.threadH <= 320,
    `${grid.rootH}px in ${grid.threadH}px`);
  check('no horizontal scroll', grid.overflowX === 0, `${grid.overflowX}px`);

  // Row order: company, key figures, the paired measures, the projects.
  check('company name is the top row', grid.header.y < grid.kpi.y);
  check('key figures sit below it', grid.kpi.y < grid.tx.y);
  check('projects are the bottom row', grid.projects.y > grid.tx.y);

  // The paired row: same row, equal width, side by side.
  check('transaction volume and billing share a row',
    Math.abs(grid.tx.y - grid.billing.y) <= 2, `${grid.tx.y} vs ${grid.billing.y}`);
  check('the pair is equal width', Math.abs(grid.tx.w - grid.billing.w) <= 2,
    `${grid.tx.w} vs ${grid.billing.w}`);
  check('transaction volume is on the left', grid.tx.x < grid.billing.x);
  check('the pair is equal height', Math.abs(grid.tx.h - grid.billing.h) <= 2,
    `${grid.tx.h} vs ${grid.billing.h}`);

  check('transaction volume is a trend chart', grid.trendType === 'chart');
  check('billing revenue is a progress ring', grid.ring !== null && grid.ring.h > 60,
    JSON.stringify(grid.ring));
  check('projects render as side-by-side cards', grid.projectCards >= 1,
    `${grid.projectCards} cards`);

  const projectRow = await page.eval(`
    const cards = [...document.querySelectorAll('.rs-project')];
    if (cards.length < 2) return { sideBySide: true, n: cards.length };
    const tops = cards.map(c => Math.round(c.getBoundingClientRect().top));
    return { sideBySide: Math.max(...tops) - Math.min(...tops) <= 2, n: cards.length };`);
  check('project cards are on one row', projectRow.sideBySide, `${projectRow.n} cards`);

  /* ─── 3. The rail states its figures outright ─── */
  console.log('\n[KPI rail]');
  const rail = await page.eval(`
    const r = document.querySelector('.rs-kpi-rail');
    return {
      panels: r.querySelectorAll('.rs-kpi-panel').length,
      chevrons: r.querySelectorAll('.rs-kpi-chevron').length,
      toggles: r.querySelectorAll('[aria-expanded], button').length,
      figures: [...r.querySelectorAll('.rs-kpi')].map(k => ({
        id: k.dataset.kpi,
        value: (k.querySelector('.rs-kpi-value')?.textContent || '').trim(),
        sub: (k.querySelector('.rs-kpi-sub')?.textContent || '').trim(),
      })),
      heights: [...r.querySelectorAll('.rs-kpi')]
        .map(k => Math.round(k.getBoundingClientRect().height)),
    };`);

  check('no KPI is behind a toggle',
    rail.panels === 0 && rail.chevrons === 0 && rail.toggles === 0,
    `${rail.panels} panels, ${rail.chevrons} chevrons, ${rail.toggles} toggles`);
  check('every KPI states its figure',
    rail.figures.length === 5 && rail.figures.every(k => k.value.length > 0),
    rail.figures.map(k => `${k.id}:${k.value || '(blank)'}`).join(', '));
  check('every KPI says what the figure is',
    rail.figures.every(k => k.sub.length > 0),
    rail.figures.map(k => `${k.id}:${k.sub || '(blank)'}`).join(', '));
  check('the tiles are one height',
    Math.max(...rail.heights) - Math.min(...rail.heights) <= 1,
    rail.heights.join(', '));

  // The run ends scrolled to the foot of the dashboard; frame the rail itself.
  await page.eval(`document.querySelector('.rs-kpi-track')
    .scrollIntoView({ block: 'center' }); return 1;`);
  await page.eval(settle);
  await page.screenshot(path.join(SHOTS, '03-kpi-rail.png'));

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
  // A degraded source changes what a card says, never which cards there are.
  check('the template is unchanged by a degraded source',
    await page.eval('return document.querySelectorAll(".rs-main [data-block]").length === 7;'));
  check('the billing card falls back to the figure alone when there is no ring',
    await page.eval(`
      const billing = document.querySelector('[data-block="billing-revenue"]');
      return !!billing.querySelector('.rs-progress-ring, .rs-progress-empty');`));

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
    const tx = root.querySelector('[data-block="transactions"]').getBoundingClientRect();
    const billing = root.querySelector('[data-block="billing-revenue"]').getBoundingClientRect();
    return {
      blocks: root.querySelectorAll('.rs-main [data-block]').length,
      stacked: billing.top > tx.top + 10,
    };`);
  check('the template survives a 760px viewport', narrow.blocks === 7, `${narrow.blocks} blocks`);
  // Too narrow for a pair: the two measures stack rather than crush.
  check('the paired row stacks at 760px', narrow.stacked);
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
