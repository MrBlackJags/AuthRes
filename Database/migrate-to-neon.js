/**
 * AuthRos - SQLite to Neon PostgreSQL Data Migration Tool
 * Reads all records from local authros.db (SQLite) and writes them to Neon PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
require('dotenv').config();

const neonUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (!neonUrl || (!neonUrl.startsWith('postgres://') && !neonUrl.startsWith('postgresql://'))) {
  console.error('\n❌ ERROR: Neon DATABASE_URL not found in .env');
  console.error('Please add your Neon PostgreSQL connection string to .env, e.g.:');
  console.error('DATABASE_URL=postgresql://user:pass@ep-mute-night-39759461.us-east-2.aws.neon.tech/neondb?sslmode=require\n');
  process.exit(1);
}

const sqliteDbPath = path.join(__dirname, 'authros.db');
if (!fs.existsSync(sqliteDbPath)) {
  console.error('❌ ERROR: Local database file not found at:', sqliteDbPath);
  process.exit(1);
}

const sqliteDb = new sqlite3.Database(sqliteDbPath);
const pgPool = new Pool({
  connectionString: neonUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 15000
});

function getSqliteRows(query) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(query, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function runMigration() {
  console.log('🚀 Starting AuthRos -> Neon PostgreSQL Migration...');
  console.log(`📡 Connecting to Neon database: ${neonUrl.split('@')[1]?.split('/')[0] || 'neon.tech'}`);

  // 1. Connect & execute schema.sql
  const client = await pgPool.connect();
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    console.log('📦 Applying schema.sql DDL to Neon PostgreSQL...');
    await client.query(schemaSql);
    console.log('✓ Schema and indexes ready on Neon.\n');

    // List of tables in topological foreign-key order
    const tableOrder = [
      'organizations',
      'users',
      'research_projects',
      'milestones',
      'datasets',
      'donations',
      'hospital_cohorts',
      'project_members',
      'audit_logs'
    ];

    for (const table of tableOrder) {
      const rows = await getSqliteRows(`SELECT * FROM ${table}`);
      if (rows.length === 0) {
        console.log(`- ${table}: 0 rows (skipped)`);
        continue;
      }

      console.log(`⏳ Migrating table '${table}' (${rows.length.toLocaleString()} rows)...`);

      const columns = Object.keys(rows[0]);
      const colNames = columns.map(c => `"${c}"`).join(', ');

      // Insert in chunks of 200
      const CHUNK_SIZE = 200;
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const valuePlaceholders = [];
        const params = [];
        let pIdx = 1;

        for (const row of chunk) {
          const rowParams = [];
          for (const col of columns) {
            let val = row[col];
            // Format booleans for Postgres
            if (col === 'is_completed') {
              val = Boolean(val);
            }
            params.push(val);
            rowParams.push(`$${pIdx++}`);
          }
          valuePlaceholders.push(`(${rowParams.join(', ')})`);
        }

        const insertQuery = `
          INSERT INTO ${table} (${colNames})
          VALUES ${valuePlaceholders.join(', ')}
          ON CONFLICT (id) DO UPDATE SET
          ${columns.filter(c => c !== 'id').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')}
        `;

        await client.query(insertQuery, params);
      }

      const res = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ✓ Successfully migrated '${table}': ${res.rows[0].count} rows in Neon.`);
    }

    console.log('\n🎉 ALL TABLES AND DATA SUCCESSFULLY MIGRATED TO NEON POSTGRESQL!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    sqliteDb.close();
    await pgPool.end();
  }
}

runMigration();
