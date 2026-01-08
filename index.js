const express = require('express');
const app = express();
const db = require('./db');

app.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT 1 + 1 AS solution');
    res.send('Database result: ' + result.rows[0].solution);
  } catch (err) {
    res.send('Database query error: ' + err);
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

