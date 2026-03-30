// Database migration runner
// Usage: node src/migrate.js
// Runs supabase-migration.sql against DATABASE_URL (any standard PostgreSQL server)
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is required in .env');
  process.exit(1);
}

const isLocal = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
const ssl = isLocal ? false : { rejectUnauthorized: process.env.DATABASE_SSL_VERIFY !== 'false' };
const pool = new Pool({ connectionString: DATABASE_URL, ssl });

async function migrate() {
  const sqlPath = path.join(__dirname, '..', 'supabase-migration.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Migration file not found:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Running migration against:', DATABASE_URL.replace(/:\/\/[^@]+@/, '://***@'));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
