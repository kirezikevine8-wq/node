// server.js
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // PostgreSQL connection
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ---------------- Swagger setup ----------------
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Milk Delivery Admin API",
      version: "1.0.0",
      description: "API documentation for Milk Delivery Admin Panel"
    },
    servers: [{ url: "http://localhost:3000" }]
  },
  apis: [path.join(__dirname, "server.js")] // Absolute path ensures Swagger finds the file
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ---------------- Simple test route ----------------
app.get('/hello', (req, res) => res.send('Hello World'));

// ---------------- Farmer Payment API ----------------
/**
 * @swagger
 * /api/payment-page/{farmerId}:
 *   get:
 *     summary: Get payment info for a farmer
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: path
 *         name: farmerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Farmer ID
 *     responses:
 *       200:
 *         description: Payment info retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 quantity:
 *                   type: string
 *                   example: "120.50"
 *                 payments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: string
 *                         example: "30000.00"
 *                       payment_method:
 *                         type: string
 *                         example: "Mobile Money"
 *                       created_at:
 *                         type: string
 *                         example: "2026-01-08T09:15:00.000Z"
 */
app.get('/api/payment-page/:farmerId', async (req, res) => {
  try {
    const farmerId = req.params.farmerId;

    const milkResult = await pool.query(
      `SELECT COALESCE(SUM(quantity_liters), 0) AS quantity
       FROM milk_collections
       WHERE farmer_id = $1`,
      [farmerId]
    );

    const paymentResult = await pool.query(
      `SELECT amount, payment_method, created_at
       FROM payments
       WHERE farmer_id = $1
       ORDER BY created_at DESC`,
      [farmerId]
    );

    res.json({
      quantity: milkResult.rows[0].quantity,
      payments: paymentResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/payments/user/{user_id}:
 *   get:
 *     summary: Retrieve payments for a user by user_id
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of payments for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                       farmer_id:
 *                         type: integer
 *                       amount:
 *                         type: string
 *                       payment_method:
 *                         type: string
 *                       created_at:
 *                         type: string
 */
app.get('/api/payments/user/:user_id', async (req, res) => {
  try {
    const userId = req.params.user_id;
    const result = await pool.getPaymentsByUser(userId);
    res.json({ payments: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------- Start server ----------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📄 Swagger docs at http://localhost:${PORT}/api-docs`);
});
