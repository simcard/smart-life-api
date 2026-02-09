import express from "express";
import { pool } from "../dbclient.js";
import { authMiddleware } from "../auth.js";
import bcrypt from 'bcrypt';
import dotenv from "dotenv";

dotenv.config();

const usersRouter = express.Router();

/* ======================================================
   Constants
====================================================== */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *         full_name:
 *           type: string
 *         avatar_url:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
usersRouter.get('/users', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM public.users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               full_name:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Email already exists
 */
usersRouter.post('/users', async (req, res) => {

  try {
    const { email, password, full_name, avatar_url } = req.body;

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) return res.status(400).json({ error: 'Email already exists' });

  const password_hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash, full_name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name',
    [email, password_hash, full_name || null, avatar_url || null]
  );


  res.json({ user: rows[0]});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               full_name:
 *                 type: string
 *               password:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Email already exists
 *       404:
 *         description: User not found
 */
usersRouter.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { email, full_name, password, avatar_url } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE public.users
       SET email = COALESCE($1, email),
           full_name = COALESCE($2, full_name),
           password_hash = CASE WHEN $3 IS NOT NULL THEN $3 ELSE password_hash END,
           avatar_url = COALESCE($4, avatar_url)
       WHERE id = $5
       RETURNING *`,
      [email, full_name, password ? await bcrypt.hash(password, 10) : null,  avatar_url, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      // unique_violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default usersRouter;
