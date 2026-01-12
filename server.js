// server.js
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // PostgreSQL connection
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const path = require('path');

const app = express();

// Enable CORS and handle preflight
app.use(cors({ origin: '*' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());

// Swagger setup (no hardcoded server URL)
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Milk Delivery Admin API', version: '1.0.0' }
  },
  apis: [path.join(__dirname, 'server.js')]
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});

app.get('/hello', (req, res) => res.send('Hello World'));

/**
 * @swagger
 * /api/payment-page/{farmerId}:
 *   get:
 *     summary: Get payment info for a farmer
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: farmerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: payments
 */
app.get('/api/payment-page/:farmerId', async (req, res) => {
  try {
    const farmerId = req.params.farmerId;
    const paymentResult = await pool.query(
      `SELECT quantity, amount, payment_method, created_at
       FROM payments
       WHERE farmer_id = $1
       ORDER BY created_at DESC`,
      [farmerId]
    );
    res.json({ payments: paymentResult.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/collections/user/{user_id}:
 *   get:
 *     summary: Retrieve collections for a user including center name and location
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: collections
 */
app.get('/api/collections/user/:user_id', async (req, res) => {
  try {
    const userId = req.params.user_id;
    const q = `
      SELECT cc.name AS collection_center_name, cc.location AS collection_center_location,
             c.quantity::text AS quantity, c.quality, c.created_at
      FROM created_collection c
      JOIN collection_center cc ON c.collection_center_id = cc.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(q, [userId]);
    res.json({ collections: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/user/{user_id}/summary:
 *   get:
 *     summary: Get today's delivery and payment summary for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Brief summary with today's delivery, total payments, and last payment
 */
app.get('/api/user/:user_id/summary', async (req, res) => {
  try {
    const userId = req.params.user_id;

    // ensure user exists
    const userRes = await pool.query('SELECT id FROM register WHERE id = $1', [userId]);
    if (userRes.rowCount === 0) return res.status(404).json({ message: 'User not found' });

    // Today's delivery quantity
    const todayRes = await pool.query(
      `SELECT COALESCE(SUM(quantity),0) AS total FROM created_collection WHERE user_id = $1 AND created_at::date = CURRENT_DATE`,
      [userId]
    );
    const todaysTotal = parseFloat(todayRes.rows[0].total) || 0;

    // Total payments amount
    const paymentsRes = await pool.query('SELECT COALESCE(SUM(amount),0) AS total_paid FROM payments WHERE farmer_id = $1', [userId]);
    const totalPaid = parseFloat(paymentsRes.rows[0].total_paid) || 0;

    // Last payment
    const lastPaymentRes = await pool.query('SELECT amount, created_at FROM payments WHERE farmer_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
    const last = lastPaymentRes.rowCount ? lastPaymentRes.rows[0] : null;

    res.json({
      todays_delivery_quantity: todaysTotal.toFixed(2),
      total_payments_amount: totalPaid.toFixed(2),
      last_payment: last ? { amount: parseFloat(last.amount).toFixed(2), date: new Date(last.created_at).toISOString() } : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Brief summary: today's delivery quantity, total payments amount, and last payment
 */
app.get('/api/user/:user_id/brief', async (req, res) => {
  try {
    const userId = req.params.user_id;

    // ensure user exists
    const userRes = await pool.query('SELECT id FROM register WHERE id = $1', [userId]);
    if (userRes.rowCount === 0) return res.status(404).json({ message: 'User not found' });

    const todayRes = await pool.query(
      `SELECT COALESCE(SUM(quantity),0) AS total FROM created_collection WHERE user_id = $1 AND created_at::date = CURRENT_DATE`,
      [userId]
    );
    const todaysTotal = parseFloat(todayRes.rows[0].total) || 0;

    const paymentsRes = await pool.query('SELECT COALESCE(SUM(amount),0) AS total_paid FROM payments WHERE farmer_id = $1', [userId]);
    const totalPaid = parseFloat(paymentsRes.rows[0].total_paid) || 0;

    const lastPaymentRes = await pool.query('SELECT amount, created_at FROM payments WHERE farmer_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
    const last = lastPaymentRes.rowCount ? lastPaymentRes.rows[0] : null;

    res.json({
      todays_delivery_quantity: todaysTotal.toFixed(2),
      total_payments_amount: totalPaid.toFixed(2),
      last_payment: last ? { amount: parseFloat(last.amount).toFixed(2), date: new Date(last.created_at).toISOString() } : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server (respect process.env.PORT and --port)
const argvPortIndex = process.argv.indexOf('--port');
const argvPort = argvPortIndex !== -1 ? process.argv[argvPortIndex + 1] : undefined;
const PORT = process.env.PORT || argvPort || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📄 Swagger docs at http://localhost:${PORT}/api-docs`);
});
