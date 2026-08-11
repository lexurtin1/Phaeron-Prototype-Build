'use strict';

const {
  sql,
  json,
  handleOptions,
  readJsonBody,
  fetchAtlas,
  upsertCountryBundle,
  profileFromRow,
} = require('../lib/db');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const db = sql();
    const url = new URL(req.url || '/', 'http://localhost');
    const iso3 = String(
      url.searchParams.get('iso3') ||
      (req.query && req.query.iso3) ||
      ''
    ).toUpperCase();

    if (!/^[A-Z]{3}$/.test(iso3)) {
      return json(res, 400, { error: { message: 'Query param iso3 is required' } });
    }

    if (req.method === 'GET') {
      const rows = await db`
        SELECT
          c.iso3, c.iso2, c.name, c.region, c.subregion,
          p.market_classification, p.central_hub_status, p.hub_name, p.operator,
          p.opportunity_score, p.automation_rate_estimate, p.priority_tier,
          p.existing_network_presence, p.market_aum_band, p.mutual_fund_relevance,
          p.growth_signal, p.dominant_order_model, p.current_order_channels,
          p.manuality_snapshot, p.regulatory_openness, p.risks_or_barriers,
          p.flow_image, p.flow_diagram, p.last_updated
        FROM countries c
        LEFT JOIN country_profiles p ON p.iso3 = c.iso3
        WHERE c.iso3 = ${iso3}
        LIMIT 1
      `;
      if (!rows.length) {
        return json(res, 404, { error: { message: 'Country not found' } });
      }
      const notes = await db`
        SELECT body_md, version, source, created_at
        FROM research_notes
        WHERE iso3 = ${iso3}
        ORDER BY version DESC
        LIMIT 1
      `;
      return json(res, 200, {
        iso3,
        profile: profileFromRow(rows[0]),
        note: notes[0] ? notes[0].body_md : '',
        noteMeta: notes[0] || null,
      });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readJsonBody(req);
      const result = await upsertCountryBundle(
        db,
        iso3,
        body.profile || body.data || null,
        body.note != null ? body.note : body.markdown,
        body.source || 'manual'
      );
      const atlas = await fetchAtlas(db);
      return json(res, 200, { ok: true, ...result, atlas });
    }

    return json(res, 405, { error: { message: 'Method not allowed' } });
  } catch (err) {
    console.error('country API error:', err);
    return json(res, err.statusCode || 500, {
      error: { message: err.message || 'Country request failed' },
    });
  }
};
