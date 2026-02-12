import express from 'express';
import { pool } from '../dbclient.js';
import { authMiddleware } from '../auth.js';

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 10
 *         title:
 *           type: string
 *           example: Reminder Due Soon
 *         message:
 *           type: string
 *           example: Your doctor appointment is tomorrow at 14:30.
 *         read:
 *           type: boolean
 *           example: false
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2026-02-12T08:30:00Z
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for authenticated user
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized
 */
router.get('/notifications', authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('SET app.current_user_id = $1', [req.user.id]);

    const { rows } = await client.query(`
      SELECT n.*
      FROM notifications n
      ORDER BY n.created_at DESC
    `);

    res.json(rows);
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.patch('/notifications/:id/read', authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('SET app.current_user_id = $1', [req.user.id]);

    const { rows } = await client.query(
      `UPDATE notifications
       SET read = true
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
