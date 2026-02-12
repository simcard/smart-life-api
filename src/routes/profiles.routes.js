import express from 'express';
import { pool } from '../dbclient.js';
import { authMiddleware } from '../auth.js';

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 10
 *         full_name:
 *           type: string
 *           example: Simcelile Mafunda
 *         avatar_url:
 *           type: string
 *           nullable: true
 *           example: https://example.com/avatar.jpg
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2026-02-10T09:00:00Z
 *
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         full_name:
 *           type: string
 *           example: Simcelile Mafunda
 *         avatar_url:
 *           type: string
 *           example: https://example.com/avatar.jpg
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Profile]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch profile
 */
router.get('/profile', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('SET app.current_user_id = $1', [req.user.id]);

    const { rows } = await client.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Profile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to update profile
 */
router.put('/profile', authMiddleware, async (req, res) => {
  const { full_name, avatar_url } = req.body;
  const client = await pool.connect();

  try {
    await client.query('SET app.current_user_id = $1', [req.user.id]);

    const { rows } = await client.query(
      `UPDATE profiles
       SET full_name = $1,
           avatar_url = $2
       WHERE user_id = $3
       RETURNING *`,
      [full_name, avatar_url, req.user.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  } finally {
    client.release();
  }
});

export default router;
