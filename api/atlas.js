'use strict';

const {
  sql,
  json,
  handleOptions,
  readJsonBody,
  fetchAtlas,
  upsertCountryBundle,
} = require('../lib/db');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const db = sql();

    if (req.method === 'GET') {
      const atlas = await fetchAtlas(db);
      return json(res, 200, atlas);
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readJsonBody(req);
      const data = body.data || {};
      const markdown = body.markdown || {};
      const source = body.source || 'sync';
      const isos = new Set([...Object.keys(data), ...Object.keys(markdown)]);
      let saved = 0;
      for (const iso3 of isos) {
        await upsertCountryBundle(db, iso3, data[iso3] || { country: iso3, iso3 }, markdown[iso3], source);
        saved += 1;
      }
      const atlas = await fetchAtlas(db);
      return json(res, 200, { ok: true, saved, atlas });
    }

    return json(res, 405, { error: { message: 'Method not allowed' } });
  } catch (err) {
    console.error('atlas API error:', err);
    return json(res, err.statusCode || 500, {
      error: { message: err.message || 'Atlas request failed' },
    });
  }
};
