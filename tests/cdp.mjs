/**
 * Minimal Chrome DevTools Protocol driver.
 *
 * Exists so the DOM-level checks can run against a real browser without adding
 * Playwright (or any other dependency) to package.json. It uses `ws`, which is
 * already a dependency, and whichever Chromium build is already on the machine.
 *
 * Not a general-purpose automation library — just enough to load a page,
 * evaluate expressions, click things and take screenshots.
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import os from 'node:os';
import WebSocket from 'ws';

const CANDIDATES = [
  path.join(os.homedir(), 'AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe'),
  path.join(os.homedir(), 'AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe'),
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

export function findBrowser() {
  for (const p of CANDIDATES) if (existsSync(p)) return p;
  return null;
}

export async function launch({ port = 9333, headless = true } = {}) {
  const bin = findBrowser();
  if (!bin) throw new Error('No Chromium/Edge binary found');

  const userDataDir = path.join(os.tmpdir(), `rs-cdp-${port}-${Date.now()}`);
  mkdirSync(userDataDir, { recursive: true });

  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run', '--no-default-browser-check', '--no-sandbox',
    '--disable-gpu', '--hide-scrollbars', '--mute-audio',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--window-size=1440,900',
    'about:blank',
  ];
  if (headless && !bin.includes('headless-shell')) args.unshift('--headless=new');

  const proc = spawn(bin, args, { stdio: 'ignore' });

  // Wait for the debugging endpoint to come up.
  let target = null;
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      target = list.find((t) => t.type === 'page');
      if (target) break;
    } catch (_) { /* not up yet */ }
  }
  if (!target) {
    proc.kill();
    throw new Error('Browser debugging endpoint did not start');
  }

  return connect(target.webSocketDebuggerUrl, proc, port);
}

async function connect(wsUrl, proc, port) {
  const ws = new WebSocket(wsUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
  await new Promise((res, rej) => {
    ws.once('open', res);
    ws.once('error', rej);
  });

  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  const consoleLogs = [];
  const pageErrors = [];
  const failedRequests = [];

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    const handlers = listeners.get(msg.method);
    if (handlers) for (const h of handlers) h(msg.params);
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  function on(method, handler) {
    if (!listeners.has(method)) listeners.set(method, []);
    listeners.get(method).push(handler);
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Network.enable');

  on('Runtime.consoleAPICalled', (p) => {
    const text = (p.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
    consoleLogs.push({ type: p.type, text });
  });
  on('Runtime.exceptionThrown', (p) => {
    pageErrors.push(p.exceptionDetails?.exception?.description
      || p.exceptionDetails?.text || 'unknown error');
  });
  on('Log.entryAdded', (p) => {
    if (p.entry?.level === 'error') pageErrors.push(`${p.entry.source}: ${p.entry.text}`);
  });
  on('Network.loadingFailed', (p) => {
    failedRequests.push(`${p.type} ${p.errorText}`);
  });

  const api = {
    consoleLogs,
    pageErrors,
    failedRequests,

    async goto(url, { waitMs = 0 } = {}) {
      const done = new Promise((resolve) => on('Page.loadEventFired', resolve));
      await send('Page.navigate', { url });
      await Promise.race([done, sleep(20000)]);
      if (waitMs) await sleep(waitMs);
    },

    async eval(expression, { awaitPromise = true } = {}) {
      const res = await send('Runtime.evaluate', {
        expression: `(async () => { ${expression} })()`,
        awaitPromise,
        returnByValue: true,
      });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description
          || res.exceptionDetails.text);
      }
      return res.result?.value;
    },

    /**
     * @param {string} file
     * @param {{fullPage?: boolean, expandScrollers?: boolean}} opts
     *   expandScrollers temporarily unclips inner overflow:auto containers, so
     *   a fullPage capture reaches content that lives inside an app shell
     *   rather than in the document scroll. Restored afterwards.
     */
    async screenshot(file, { fullPage = false, expandScrollers = false } = {}) {
      if (expandScrollers) {
        await api.eval(`
          const style = document.createElement('style');
          style.id = '__cdp_expand';
          style.textContent = \`
            html,body{height:auto!important;overflow:visible!important}
            .app,.body-row,.main,.view,.chat-cols,.chat-left,
            .chat-thread,.thread-inner,.rs-root,.rs-main,.rs-deck{
              height:auto!important;max-height:none!important;
              overflow:visible!important;min-height:0!important;
            }
            .rs-root{align-items:flex-start!important}\`;
          document.head.appendChild(style);
          await new Promise(r => setTimeout(r, 350));
          return true;`);
      }

      const params = { format: 'png', captureBeyondViewport: fullPage };
      if (fullPage) {
        const m = await send('Page.getLayoutMetrics');
        const h = Math.min(Math.ceil(m.cssContentSize.height), 16000);
        params.clip = { x: 0, y: 0, width: Math.ceil(m.cssContentSize.width), height: h, scale: 1 };
      }
      const { data } = await send('Page.captureScreenshot', params);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, Buffer.from(data, 'base64'));

      if (expandScrollers) {
        await api.eval(`document.getElementById('__cdp_expand')?.remove();
          await new Promise(r => setTimeout(r, 200)); return true;`);
      }
      return file;
    },

    async setReducedMotion(enabled) {
      await send('Emulation.setEmulatedMedia', {
        features: enabled ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [],
      });
    },

    async setViewport(width, height) {
      await send('Emulation.setDeviceMetricsOverride', {
        width, height, deviceScaleFactor: 1, mobile: false,
      });
    },

    sleep,

    async close() {
      try { ws.close(); } catch (_) { /* ignore */ }
      try {
        await fetch(`http://127.0.0.1:${port}/json/close`).catch(() => {});
      } catch (_) { /* ignore */ }
      proc.kill();
    },
  };

  return api;
}
