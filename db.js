const { Pool } = require('pg');

const pool = new Pool({
  user: 'sanhub_user',         // your PostgreSQL username
  host: 'dpg-d5165mh5pdvs73cip7h0-a.oregon-postgres.render.com',             // e.g., dbname.postgres.database.azure.com
  database: 'sanhub',       // your database name
  password: '0d7WYAyHXtSO8mZguqrN35Vh28iUfgw4',     // your password
  port: 5432,                   // default PostgreSQL port
  ssl: { rejectUnauthorized: false }

});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err);
    process.exit();
  } else {
    console.log('✅ PostgreSQL connected successfully!');
    release();
  }
});

// Helper: get payments by user_id
pool.getPaymentsByUser = async (userId) => {
  const q = `SELECT id, user_id, farmer_id, amount, payment_method, created_at
             FROM payments
             WHERE user_id = $1
             ORDER BY created_at DESC`;
  return pool.query(q, [userId]);
};

// Helper: get collections (created_collection) by user_id
pool.getCollectionsByUser = async (userId) => {
  const q = `SELECT id, collection_center_id, user_id, quantity, quality, created_at
             FROM created_collection
             WHERE user_id = $1
             ORDER BY created_at DESC`;
  return pool.query(q, [userId]);
};

module.exports = pool;
