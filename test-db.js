// test-db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'sanhub_user',             // your PostgreSQL username
  host: 'dpg-d5165mh5pdvs73cip7h0-a.oregon-postgres.render.com',
  database: 'sanhub', // your database name
  password: '0d7WYAyHXtSO8mZguqrN35Vh28iUfgw4',    // your PostgreSQL password
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL!');
    process.exit();
  })
  .catch(err => console.error('❌ Connection failed:', err));
