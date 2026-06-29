/**
 * smoke.mjs — Calastone Globe smoke test / screenshot driver
 *
 * Uses Playwright (Node.js) to drive the static index.html in a real
 * browser. Run from the project root:
 *
 *   node .claude/skills/run-calastone-globe/smoke.mjs
 *
 * Requires:
 *   npm install -D playwright
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const FILE = `file://${ROOT}/index.html`.replace(/\\/g, '/');
const OUT  = path.join(ROOT, '.claude', 'skills', 'run-calastone-globe', 'screenshots');

fs.mkdirSync(OUT, { recursive: true });

const ss = (name) => path.join(OUT, `${name}.png`);

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--allow-file-access-from-files',  // required for file:// + type=module
      '--disable-web-security',
      '--no-sandbox',
    ],
  });

  const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  console.log('→ Loading', FILE);
  await page.goto(FILE, { waitUntil: 'domcontentloaded' });

  // Wait for loader to disappear (globe mounted + arcs ignited)
  console.log('→ Waiting for loader to dismiss…');
  await page.waitForSelector('#loader', { state: 'detached', timeout: 12000 })
    .catch(() => console.warn('  loader never detached — continuing anyway'));

  await page.waitForTimeout(600);
  await page.screenshot({ path: ss('01-network-mode'), fullPage: false });
  console.log('✓ Screenshot: network mode');

  // Verify key DOM elements
  const checks = {
    'Globe canvas':         '#globeViz canvas',
    'Topbar':               '.topbar',
    'Mode toggle Network':  '#globeSwitchNetwork',
    'Mode toggle Research': '#globeSwitchResearch',
    'Hand gesture button':  '#hcToggleBtn',
    'Hero stats':           '#heroCountries',
    'Network UI':           '#networkUI',
  };

  let allOk = true;
  for (const [label, sel] of Object.entries(checks)) {
    const el = await page.$(sel);
    const ok = !!el;
    console.log(`  ${ok ? '✓' : '✗'} ${label} (${sel})`);
    if (!ok) allOk = false;
  }

  // Switch to Market Research
  console.log('→ Switching to Market Research mode…');
  await page.click('#globeSwitchResearch');
  await page.waitForTimeout(1400);
  await page.screenshot({ path: ss('02-research-mode'), fullPage: false });
  console.log('✓ Screenshot: research mode');

  // Verify research UI visible
  const researchVisible = await page.$eval(
    '#researchUI', el => el.style.display !== 'none'
  ).catch(() => false);
  console.log(`  ${researchVisible ? '✓' : '✗'} Research UI visible`);

  // Switch back to Network
  console.log('→ Switching back to Network mode…');
  await page.click('#globeSwitchNetwork');
  await page.waitForTimeout(800);
  await page.screenshot({ path: ss('03-network-return'), fullPage: false });
  console.log('✓ Screenshot: returned to network mode');

  // Console errors
  if (errors.length) {
    console.warn(`\n⚠ Console errors (${errors.length}):`);
    errors.forEach(e => console.warn('  ', e));
  } else {
    console.log('\n✓ No console errors');
  }

  await browser.close();

  const status = allOk ? '✓ PASS' : '✗ FAIL';
  console.log(`\n${status} — screenshots saved to ${OUT}`);
  process.exit(allOk ? 0 : 1);
})();
