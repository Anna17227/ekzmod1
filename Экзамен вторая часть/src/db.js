const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'ekz',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '123',
  connectionTimeoutMillis: 3000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
