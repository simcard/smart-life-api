import express from 'express';
import { pool } from '../dbclient.js';
import { authMiddleware } from '../auth.js';

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Reminders
 *   description: Reminder management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Reminder:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 10
 *         assigned_member_id:
 *           type: integer
 *           nullable: true
 *           example: 22
 *         title:
 *           type: string
 *           example: Doctor Appointment
 *         description:
 *           type: string
 *           example: Annual check-up
 *         category:
 *           type: string
 *           example: Health
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           example: high
 *         due_date:
 *           type: string
 *           format: date
 *           example: 2026-02-15
 *         due_time:
 *           type: string
 *           format: time
 *           example: 14:30:00
 *         location:
 *           type: string
 *           example: Johannesburg Clinic
 *         completed:
 *           type: boolean
 *           example: false
 *         completed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: 2026-02-12T10:15:30Z
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2026-02-10T09:00:00Z
 *
 *     CreateReminderRequest:
 *       type: object
 *       required:
 *         - title
 *         - due_date
 *       properties:
 *         assigned_member_id:
 *           type: integer
 *           example: 22
 *         title:
 *           type: string
 *           example: Doctor Appointment
 *         description:
 *           type: string
 *           example: Annual check-up
 *         category:
 *           type: string
 *           example: Health
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           example: high
 *         due_date:
 *           type: string
 *           format: date
 *           example: 2026-02-15
 *         due_time:
 *           type: string
 *           format: time
 *           example: 14:30:00
 *         location:
 *           type: string
 *           example: Johannesburg Clinic
 */


/**
 * @swagger
 * /api/reminders:
 *   get:
 *     summary: Get all reminders for authenticated user
 *     tags: [Reminders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of reminders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reminder'
 *       401:
 *         description: Unauthorized
 */
router.get('/reminders', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {

    await client.query('SELECT set_config($1, $2, true)', [
      'app.current_user_id',
      req.user.id,
    ]);

    // Pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Optional filter by completed
    let filterQuery = '';
    const filterParams = [];
    if (req.query.completed !== undefined) {
      filterParams.push(req.query.completed === 'true');
      filterQuery = `WHERE completed = $${filterParams.length}`;
    }

    // Get reminders
    const { rows } = await client.query(
      `SELECT * FROM reminders ${filterQuery} ORDER BY due_date ASC LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}`,
      [...filterParams, limit, offset]
    );

    res.json({
      page,
      limit,
      reminders: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/reminders:
 *   post:
 *     summary: Create a new reminder
 *     tags: [Reminders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReminderRequest'
 *     responses:
 *       201:
 *         description: Reminder created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reminder'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/reminders', authMiddleware, async (req, res) => {
  const {
    assigned_member_id,
    title,
    description,
    category,
    priority,
    due_date,
    due_time,
    location
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('SET app.current_user_id = $1', [req.user.id]);

    const { rows } = await client.query(
      `INSERT INTO reminders
       (user_id, assigned_member_id, title, description,
        category, priority, due_date, due_time, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user.id,
        assigned_member_id,
        title,
        description,
        category,
        priority,
        due_date,
        due_time,
        location
      ]
    );

    res.status(201).json(rows[0]);
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/reminders/{id}/complete:
 *   patch:
 *     summary: Mark a reminder as complete
 *     tags: [Reminders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Reminder ID
 *     responses:
 *       200:
 *         description: Reminder marked as completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reminder'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Reminder not found
 */
router.patch('/reminders/:id/complete', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('SET app.current_user_id = $1', [req.user.id]);

    const { rows } = await client.query(
      `UPDATE reminders
       SET completed = true,
           completed_at = now()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    res.json(rows[0]);
  } finally {
    client.release();
  }
});

export default router;
