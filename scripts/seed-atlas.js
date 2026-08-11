'use strict';

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { neon } = require('@neondatabase/serverless');
const { upsertCountryBundle } = require('../lib/db');

const ISO3_TO_ISO2 = {
  GBR: 'GB', AUS: 'AU', BRA: 'BR', SGP: 'SG', HKG: 'HK', JPN: 'JP', USA: 'US',
  LUX: 'LU', IND: 'IN', DEU: 'DE', ZAF: 'ZA', ARE: 'AE', CHE: 'CH', IDN: 'ID',
  SAU: 'SA', TUR: 'TR', VNM: 'VN', CHN: 'CN', NOR: 'NO', SWE: 'SE', DNK: 'DK',
  FIN: 'FI', FRA: 'FR', ITA: 'IT', ESP: 'ES', NLD: 'NL', IRL: 'IE', CAN: 'CA',
  MEX: 'MX', KOR: 'KR', TWN: 'TW', THA: 'TH', MYS: 'MY', PHL: 'PH', NZL: 'NZ',
  BEL: 'BE', AUT: 'AT', PRT: 'PT', POL: 'PL', QAT: 'QA', ISR: 'IL', EGY: 'EG',
  NGA: 'NG', KEN: 'KE', ARG: 'AR', CHL: 'CL', COL: 'CO', PER: 'PE',
};

function loadCountriesJs() {
  const file = path.join(__dirname, '..', 'pulse', 'tools', 'market-research', 'data', 'countries.js');
  const src = fs.readFileSync(file, 'utf8');
  const sandbox = { console };
  vm.createContext(sandbox);
  vm.runInContext(src + '\n;this.COUNTRY_DATA=COUNTRY_DATA;this.COUNTRY_MARKDOWN=COUNTRY_MARKDOWN;', sandbox);
  return {
    data: sandbox.COUNTRY_DATA,
    markdown: sandbox.COUNTRY_MARKDOWN || {},
  };
}

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
  }
  process.env.DATABASE_URL = url;
  const db = neon(url);
  const { data, markdown } = loadCountriesJs();
  const isos = Object.keys(data);
  console.log(`Seeding ${isos.length} profiles, ${Object.keys(markdown).length} notes…`);

  for (const iso3 of isos) {
    const profile = { ...data[iso3], iso2: ISO3_TO_ISO2[iso3] || null };
    await upsertCountryBundle(db, iso3, profile, markdown[iso3] || null, 'seed');
    console.log(' seeded', iso3, markdown[iso3] ? '(with note)' : '');
  }

  const counts = await db`
    SELECT
      (SELECT COUNT(*)::int FROM countries) AS countries,
      (SELECT COUNT(*)::int FROM country_profiles) AS profiles,
      (SELECT COUNT(*)::int FROM research_notes) AS notes
  `;
  console.log('Done:', counts[0]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
