'use strict';

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

function splitSql(schema) {
  const noBlock = schema.replace(/\/\*[\s\S]*?\*\//g, '');
  const lines = noBlock.split(/\r?\n/).map((l) => {
    const i = l.indexOf('--');
    return i >= 0 ? l.slice(0, i) : l;
  });
  const cleaned = lines.join('\n');
  return cleaned
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const url =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL;
  if (!url) {
    console.error('Missing DATABASE_URL / DATABASE_URL_UNPOOLED');
    process.exit(1);
  }
  const sql = neon(url);
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const statements = splitSql(fs.readFileSync(schemaPath, 'utf8'));
  console.log(`Running ${statements.length} statements…`);
  for (const stmt of statements) {
    await sql.query(stmt);
    console.log('OK:', stmt.slice(0, 72).replace(/\s+/g, ' '));
  }
  console.log('Schema migration complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
