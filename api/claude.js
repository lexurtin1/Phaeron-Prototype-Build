// Proxies Anthropic Messages API using server-side ANTHROPIC_API_KEY.
// Keeps the key out of the browser bundle / config.js.
//
// Large Market Research uploads (PDF + long notes) can exceed the default
// Hobby function duration. Configure maxDuration in vercel.json (up to 300s
// with Fluid Compute). Abort upstream slightly earlier so the client gets a
// JSON error instead of a bare Vercel 504 when possible.

const UPSTREAM_TIMEOUT_MS = Number(process.env.CLAUDE_UPSTREAM_TIMEOUT_MS || 280_000);

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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Lightweight health check — never returns the key.
  if (req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      keyConfigured: !!readKey(),
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
      upstreamTimeoutMs: UPSTREAM_TIMEOUT_MS,
    });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: { message: 'Method not allowed' } });
    return;
  }

  const apiKey = readKey();
  if (!apiKey) {
    sendJson(res, 500, {
      error: {
        message:
          'ANTHROPIC_API_KEY is not set on the server. Add it in Vercel Project Settings → Environment Variables (Production + Preview), then redeploy. For local use: put the key in .env.local and run `npm run dev`.',
      },
    });
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
  if (!body || typeof body !== 'object') {
    sendJson(res, 400, { error: { message: 'Request body required' } });
    return;
  }

  const model = body.model || process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
  const payload = { ...body, model };
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
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(text);
  } catch (err) {
    const aborted = err && (err.name === 'AbortError' || err.code === 'ABORT_ERR');
    console.error('Anthropic proxy failed:', aborted ? 'upstream timeout' : err);
    sendJson(res, aborted ? 504 : 502, {
      error: {
        message: aborted
          ? `Claude took longer than ${Math.round(UPSTREAM_TIMEOUT_MS / 1000)}s on a single request. The client will retry/continue when possible; for huge PDFs, split the file.`
          : (err && err.message) || 'Upstream request failed',
        code: aborted ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR',
      },
    });
  } finally {
    clearTimeout(timer);
  }
};
