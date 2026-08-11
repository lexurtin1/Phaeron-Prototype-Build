'use strict';

const { neon } = require('@neondatabase/serverless');

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ''
  );
}

function sql() {
  const url = getDatabaseUrl();
  if (!url) {
    const err = new Error('DATABASE_URL is not set on the server');
    err.statusCode = 500;
    throw err;
  }
  return neon(url);
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return true;
  }
  return false;
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    return req.body ? JSON.parse(req.body) : {};
  }
  // Vercel Node may already parse; local server may pass raw string via faux req
  return {};
}

function profileFromRow(row) {
  if (!row) return null;
  return {
    country: row.name,
    iso3: row.iso3,
    region: row.region || '',
    subregion: row.subregion || '',
    market_classification: row.market_classification || 'Unknown',
    central_hub_status: row.central_hub_status || 'No central hub',
    hub_name: row.hub_name || '—',
    operator: row.operator || '—',
    opportunity_score: row.opportunity_score ?? 0,
    automation_rate_estimate: row.automation_rate_estimate ?? 0,
    priority_tier: row.priority_tier || 'Watch',
    existing_network_presence: row.existing_network_presence || 'None',
    market_aum_band: row.market_aum_band || '',
    mutual_fund_relevance: row.mutual_fund_relevance || '',
    growth_signal: row.growth_signal || '',
    dominant_order_model: row.dominant_order_model || '',
    current_order_channels: row.current_order_channels || '',
    manuality_snapshot: row.manuality_snapshot || '',
    regulatory_openness: row.regulatory_openness || '',
    risks_or_barriers: row.risks_or_barriers || '',
    flow_image: row.flow_image || '',
    flow_diagram: row.flow_diagram || [],
    last_updated: row.last_updated || '',
  };
}

async function fetchAtlas(db) {
  const rows = await db`
    SELECT
      c.iso3, c.iso2, c.name, c.region, c.subregion,
      p.market_classification, p.central_hub_status, p.hub_name, p.operator,
      p.opportunity_score, p.automation_rate_estimate, p.priority_tier,
      p.existing_network_presence, p.market_aum_band, p.mutual_fund_relevance,
      p.growth_signal, p.dominant_order_model, p.current_order_channels,
      p.manuality_snapshot, p.regulatory_openness, p.risks_or_barriers,
      p.flow_image, p.flow_diagram, p.last_updated, p.updated_at AS profile_updated_at
    FROM countries c
    LEFT JOIN country_profiles p ON p.iso3 = c.iso3
    ORDER BY c.name
  `;

  const notes = await db`
    SELECT DISTINCT ON (iso3) iso3, body_md, version, source, created_at
    FROM research_notes
    ORDER BY iso3, version DESC
  `;

  const data = {};
  for (const row of rows) {
    if (!row.market_classification && row.opportunity_score == null) continue;
    data[row.iso3] = profileFromRow(row);
  }

  const markdown = {};
  for (const n of notes) {
    markdown[n.iso3] = n.body_md;
  }

  return {
    data,
    markdown,
    savedAt: new Date().toISOString(),
    source: 'neon',
  };
}

async function upsertCountryBundle(db, iso3, profile, note, source = 'manual') {
  const code = String(iso3 || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    const err = new Error('iso3 must be a 3-letter code');
    err.statusCode = 400;
    throw err;
  }

  const name = (profile && profile.country) || code;
  const region = (profile && profile.region) || null;
  const subregion = (profile && profile.subregion) || null;
  const iso2 = (profile && profile.iso2) || null;

  await db`
    INSERT INTO countries (iso3, iso2, name, region, subregion, updated_at)
    VALUES (${code}, ${iso2}, ${name}, ${region}, ${subregion}, now())
    ON CONFLICT (iso3) DO UPDATE SET
      iso2 = COALESCE(EXCLUDED.iso2, countries.iso2),
      name = EXCLUDED.name,
      region = COALESCE(EXCLUDED.region, countries.region),
      subregion = COALESCE(EXCLUDED.subregion, countries.subregion),
      updated_at = now()
  `;

  if (profile) {
    const flow = Array.isArray(profile.flow_diagram) ? profile.flow_diagram : [];
    await db`
      INSERT INTO country_profiles (
        iso3, market_classification, central_hub_status, hub_name, operator,
        opportunity_score, automation_rate_estimate, priority_tier, existing_network_presence,
        market_aum_band, mutual_fund_relevance, growth_signal, dominant_order_model,
        current_order_channels, manuality_snapshot, regulatory_openness, risks_or_barriers,
        flow_image, flow_diagram, last_updated, updated_at
      ) VALUES (
        ${code},
        ${profile.market_classification || null},
        ${profile.central_hub_status || null},
        ${profile.hub_name || null},
        ${profile.operator || null},
        ${profile.opportunity_score ?? null},
        ${profile.automation_rate_estimate ?? null},
        ${profile.priority_tier || null},
        ${profile.existing_network_presence || null},
        ${profile.market_aum_band || null},
        ${profile.mutual_fund_relevance || null},
        ${profile.growth_signal || null},
        ${profile.dominant_order_model || null},
        ${profile.current_order_channels || null},
        ${profile.manuality_snapshot || null},
        ${profile.regulatory_openness || null},
        ${profile.risks_or_barriers || null},
        ${profile.flow_image || null},
        ${JSON.stringify(flow)},
        ${profile.last_updated || null},
        now()
      )
      ON CONFLICT (iso3) DO UPDATE SET
        market_classification = EXCLUDED.market_classification,
        central_hub_status = EXCLUDED.central_hub_status,
        hub_name = EXCLUDED.hub_name,
        operator = EXCLUDED.operator,
        opportunity_score = EXCLUDED.opportunity_score,
        automation_rate_estimate = EXCLUDED.automation_rate_estimate,
        priority_tier = EXCLUDED.priority_tier,
        existing_network_presence = EXCLUDED.existing_network_presence,
        market_aum_band = EXCLUDED.market_aum_band,
        mutual_fund_relevance = EXCLUDED.mutual_fund_relevance,
        growth_signal = EXCLUDED.growth_signal,
        dominant_order_model = EXCLUDED.dominant_order_model,
        current_order_channels = EXCLUDED.current_order_channels,
        manuality_snapshot = EXCLUDED.manuality_snapshot,
        regulatory_openness = EXCLUDED.regulatory_openness,
        risks_or_barriers = EXCLUDED.risks_or_barriers,
        flow_image = EXCLUDED.flow_image,
        flow_diagram = EXCLUDED.flow_diagram,
        last_updated = EXCLUDED.last_updated,
        updated_at = now()
    `;
  }

  let noteVersion = null;
  if (typeof note === 'string' && note.trim()) {
    const latest = await db`
      SELECT COALESCE(MAX(version), 0) AS v FROM research_notes WHERE iso3 = ${code}
    `;
    const next = Number(latest[0].v) + 1;
    // Skip insert if identical to latest
    const prev = await db`
      SELECT body_md FROM research_notes
      WHERE iso3 = ${code}
      ORDER BY version DESC
      LIMIT 1
    `;
    if (!prev.length || prev[0].body_md !== note) {
      await db`
        INSERT INTO research_notes (iso3, body_md, version, source)
        VALUES (${code}, ${note}, ${next}, ${source})
      `;
      noteVersion = next;
    } else {
      noteVersion = Number(latest[0].v);
    }
  }

  return { iso3: code, noteVersion };
}

module.exports = {
  sql,
  getDatabaseUrl,
  json,
  handleOptions,
  readJsonBody,
  fetchAtlas,
  upsertCountryBundle,
  profileFromRow,
};
