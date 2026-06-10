// api/db.js
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query in ${duration}ms`, { text, params });
    return res;
  } catch (error) {
    console.error('Database query error', { text, params, error });
    throw error;
  }
}

module.exports = { query, getPool };
