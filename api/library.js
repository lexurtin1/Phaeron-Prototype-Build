'use strict';

/**
 * Global research library — cross-market documents that do not belong to one country.
 *
 *   GET    /api/library            → { docs: [...] }  index only, no body_md
 *   GET    /api/library?ids=1,4    → { docs: [...] }  full documents incl. body_md (max 5)
 *   PUT    /api/library            → upsert one document, returns { doc, docs }
 *   DELETE /api/library?id=3       → delete, returns { docs }
 */

const {
  sql,
  json,
  handleOptions,
  readJsonBody,
  fetchLibraryIndex,
  fetchLibraryDocs,
  upsertGlobalDoc,
  deleteGlobalDoc,
} = require('../lib/db');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const db = sql();
    const url = new URL(req.url || '/', 'http://localhost');
    const param = (name) =>
      url.searchParams.get(name) || (req.query && req.query[name]) || '';

    if (req.method === 'GET') {
      const ids = String(param('ids') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length) {
        return json(res, 200, { docs: await fetchLibraryDocs(db, ids) });
      }
      return json(res, 200, { docs: await fetchLibraryIndex(db) });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readJsonBody(req);
      const doc = await upsertGlobalDoc(db, body.doc || body);
      return json(res, 200, { ok: true, doc, docs: await fetchLibraryIndex(db) });
    }

    if (req.method === 'DELETE') {
      const result = await deleteGlobalDoc(db, param('id'));
      return json(res, 200, { ok: true, ...result, docs: await fetchLibraryIndex(db) });
    }

    return json(res, 405, { error: { message: 'Method not allowed' } });
  } catch (err) {
    console.error('library API error:', err);
    return json(res, err.statusCode || 500, {
      error: { message: err.message || 'Library request failed' },
    });
  }
};
