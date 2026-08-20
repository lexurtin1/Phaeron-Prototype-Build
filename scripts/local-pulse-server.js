#!/usr/bin/env node
/**
 * Local static + /api/* proxy for Pulse testing.
 * Loads env from .env.local / .env.
 * Usage: node scripts/local-pulse-server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 4173);

function loadEnvFile(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname) {
  const name = pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  if (!name || name.includes('..') || name.includes('/')) {
    send(res, 404, JSON.stringify({ error: { message: 'Not found' } }), {
      'Content-Type': 'application/json',
    });
    return;
  }
  const modPath = path.join(ROOT, 'api', name + '.js');
  if (!fs.existsSync(modPath)) {
    send(res, 404, JSON.stringify({ error: { message: 'API not found' } }), {
      'Content-Type': 'application/json',
    });
    return;
  }
  delete require.cache[require.resolve(modPath)];
  const handler = require(modPath);
  const raw = await readBody(req);
  let body = raw;
  try { body = raw ? JSON.parse(raw) : {}; } catch (_) {}
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const query = Object.fromEntries(url.searchParams.entries());

  const fauxReq = { method: req.method, body, url: req.url, query, headers: req.headers };
  let ended = false;
  // Streaming routes (api/snapshot-qa.js) call write() repeatedly before end().
  // Once the first chunk is out the status and headers are committed, which is
  // what headersSent reports — a handler checks it before trying to send an
  // error status it can no longer set.
  let streaming = false;
  const fauxRes = {
    statusCode: 200,
    headers: {},
    get headersSent() { return streaming || ended; },
    setHeader(k, v) { this.headers[k] = v; },
    flushHeaders() {
      if (streaming || ended) return;
      streaming = true;
      res.writeHead(this.statusCode, this.headers);
    },
    write(chunk) {
      if (ended) return false;
      this.flushHeaders();
      return res.write(chunk);
    },
    end(payload) {
      if (ended) return;
      if (streaming) {
        ended = true;
        if (payload) res.write(payload);
        res.end();
        return;
      }
      ended = true;
      const headers = { ...this.headers };
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
      send(res, this.statusCode, payload ?? '', headers);
    },
  };
  await handler(fauxReq, fauxRes);
  if (!ended) {
    send(res, fauxRes.statusCode || 200, '', fauxRes.headers);
  }
}

function resolveStatic(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p === '/') p = '/pulse/index.html';
  if (!p.startsWith('/api/') && !p.startsWith('/pulse/') && !p.startsWith('/config.js') && !p.startsWith('/Order') && !p.startsWith('/node_modules')) {
    const pulseCandidate = path.join(ROOT, 'pulse', p.replace(/^\//, ''));
    if (
      fs.existsSync(pulseCandidate) ||
      fs.existsSync(pulseCandidate + '.html') ||
      fs.existsSync(path.join(pulseCandidate, 'index.html'))
    ) {
      p = '/pulse' + (p.endsWith('/') ? p + 'index.html' : p);
    }
  }
  if (p.endsWith('/')) p += 'index.html';
  const abs = path.normalize(path.join(ROOT, p));
  if (!abs.startsWith(ROOT)) return null;
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    const idx = path.join(abs, 'index.html');
    return fs.existsSync(idx) ? idx : null;
  }
  return fs.existsSync(abs) ? abs : null;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url.pathname);
      return;
    }
    const file = resolveStatic(url.pathname);
    if (!file) {
      send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }
    const ext = path.extname(file).toLowerCase();
    send(res, 200, fs.readFileSync(file), { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  } catch (err) {
    console.error(err);
    send(res, 500, JSON.stringify({ error: { message: err.message || 'Server error' } }), {
      'Content-Type': 'application/json',
    });
  }
});

server.listen(PORT, () => {
  const db = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  const key = !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'PASTE-YOUR-KEY-HERE');
  console.log(`Pulse local server http://127.0.0.1:${PORT}`);
  console.log(`Market Research: http://127.0.0.1:${PORT}/tools/market-research/`);
  console.log(`Proxy health:      http://127.0.0.1:${PORT}/api/claude`);
  console.log(`DATABASE_URL: ${db ? 'set' : 'MISSING'}`);
  console.log(`ANTHROPIC_API_KEY: ${key ? 'set' : 'MISSING — copy .env → .env.local and paste your key'}`);
});
