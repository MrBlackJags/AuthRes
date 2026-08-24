/**
 * AuthRos Dual-Engine Database Client
 * Supports:
 *  1. Neon Serverless PostgreSQL (via DATABASE_URL / NEON_DATABASE_URL)
 *  2. Embedded SQLite3 (Local fallback when no cloud database is configured)
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

let dbEngine = 'sqlite';
let pgPool = null;
let sqliteDb = null;
let connectionInfo = { engine: 'sqlite', host: 'local', status: 'initializing' };

// ─── Database Engine Selection ───────────────────────────────────────────────
const neonUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL;

if (neonUrl && (neonUrl.startsWith('postgres://') || neonUrl.startsWith('postgresql://'))) {
  try {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: neonUrl,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
    dbEngine = 'neon';
    connectionInfo.engine = 'neon';
    connectionInfo.host = neonUrl.split('@')[1]?.split('/')[0] || 'neon.tech';
    connectionInfo.status = 'connected';
    console.log('✓ AuthRos Database: Connected to Neon Serverless PostgreSQL (' + connectionInfo.host + ')');
    initNeonSchema();
  } catch (err) {
    console.warn('! Neon PostgreSQL connection failed, falling back to SQLite:', err.message);
    initSqlite();
  }
} else {
  initSqlite();
}

function initSqlite() {
  dbEngine = 'sqlite';
  const sqlite3 = require('sqlite3').verbose();
  let dbPath = path.join(__dirname, 'authros.db');
  if (!fs.existsSync(dbPath) && fs.existsSync(path.join(__dirname, 'biotrack.db'))) {
    dbPath = path.join(__dirname, 'biotrack.db');
  }
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to open SQLite database:', err.message);
      connectionInfo.status = 'error';
    } else {
      // Enable WAL mode for better concurrency
      sqliteDb.run('PRAGMA journal_mode=WAL');
      sqliteDb.run('PRAGMA foreign_keys=ON');
      connectionInfo.engine = 'sqlite';
      connectionInfo.host = 'localhost (' + path.basename(dbPath) + ')';
      connectionInfo.status = 'connected';
      console.log('✓ AuthRos Database: Connected to local SQLite (' + dbPath + ')');
    }
  });
}

async function initNeonSchema() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pgPool.query(sql);
      console.log('✓ Neon PostgreSQL Schema verified and ready.');
    }
  } catch (e) {
    console.warn('! Note on Neon schema init:', e.message);
  }
}

// ─── SQL placeholder normalizer (? → $1, $2 ...) ────────────────────────────
function normalizeSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// ─── dbQuery — SELECT wrapper ────────────────────────────────────────────────
async function dbQuery(sql, params = []) {
  if (dbEngine === 'neon' && pgPool) {
    const result = await pgPool.query(normalizeSql(sql), params);
    return result.rows;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// ─── dbGet — SELECT single row ───────────────────────────────────────────────
async function dbGet(sql, params = []) {
  const rows = await dbQuery(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

// ─── dbRun — INSERT/UPDATE/DELETE wrapper ───────────────────────────────────
async function dbRun(sql, params = []) {
  if (dbEngine === 'neon' && pgPool) {
    const result = await pgPool.query(normalizeSql(sql), params);
    return { rowCount: result.rowCount };
  }
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ rowCount: this.changes, lastID: this.lastID });
    });
  });
}

// ─── dbTransaction — Atomic transaction ─────────────────────────────────────
async function dbTransaction(callback) {
  if (dbEngine === 'neon' && pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback({
        query: async (sql, params = []) => {
          const r = await client.query(normalizeSql(sql), params);
          return r.rows;
        },
        run: async (sql, params = []) => {
          const r = await client.query(normalizeSql(sql), params);
          return { rowCount: r.rowCount };
        }
      });
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    // SQLite transactions using serialized mode
    return new Promise((resolve, reject) => {
      sqliteDb.serialize(() => {
        sqliteDb.run('BEGIN TRANSACTION', async (err) => {
          if (err) return reject(err);
          try {
            const result = await callback({
              query: (sql, params = []) => new Promise((res, rej) =>
                sqliteDb.all(sql, params, (e, rows) => e ? rej(e) : res(rows || []))),
              run: (sql, params = []) => new Promise((res, rej) =>
                sqliteDb.run(sql, params, function(e) { e ? rej(e) : res({ rowCount: this.changes }); }))
            });
            sqliteDb.run('COMMIT', (e) => e ? reject(e) : resolve(result));
          } catch (err) {
            sqliteDb.run('ROLLBACK', () => reject(err));
          }
        });
      });
    });
  }
}

// ─── getDbInfo — Connection metadata ────────────────────────────────────────
function getDbInfo() {
  return {
    engine: dbEngine === 'neon' ? 'Neon Serverless PostgreSQL' : 'Embedded SQLite3 (Local)',
    engineKey: dbEngine,
    host: connectionInfo.host,
    status: connectionInfo.status,
    neonConfigured: Boolean(neonUrl)
  };
}

module.exports = { dbQuery, dbGet, dbRun, dbTransaction, getDbInfo, dbEngine };
