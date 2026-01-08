const { Pool } = require('pg');

const pool = new Pool({
  user: 'sanhub_user',         // your PostgreSQL username
  host: 'dpg-d5165mh5pdvs73cip7h0-a.oregon-postgres.render.com',             // e.g., dbname.postgres.database.azure.com
  database: 'sanhub',       // your database name
  password: '0d7WYAyHXtSO8mZguqrN35Vh28iUfgw4',     // your password
  port: 5432,                   // default PostgreSQL port
  ssl: {
    rejectUnauthorized: false   // allows SSL without verifying certificate
  }
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

module.exports = pool;
