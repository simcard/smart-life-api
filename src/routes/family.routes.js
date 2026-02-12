import express from 'express';
import { pool } from '../dbclient.js';
import { authMiddleware } from '../auth.js';

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Family
 *   description: Family member management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FamilyMember:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         account_owner_id:
 *           type: integer
 *           example: 10
 *         name:
 *           type: string
 *           example: John Mafunda
 *         email:
 *           type: string
 *           example: john@example.com
 *         relationship:
 *           type: string
 *           example: Brother
 *         avatar_url:
 *           type: string
 *           nullable: true
 *           example: https://example.com/avatar.jpg
 *         is_active:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: 2026-02-12T09:00:00Z
 *
 *     CreateFamilyMemberRequest:
 *       type: object
 *       required:
 *         - name
 *         - relationship
 *       properties:
 *         name:
 *           type: string
 *           example: John Mafunda
 *         email:
 *           type: string
 *           example: john@example.com
 *         relationship:
 *           type: string
 *           example: Brother
 *         avatar_url:
 *           type: string
 *           example: https://example.com/avatar.jpg
 *
 *     UpdateFamilyMemberRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: John Mafunda
 *         email:
 *           type: string
 *           example: john@example.com
 *         relationship:
 *           type: string
 *           example: Brother
 *         avatar_url:
 *           type: string
 *           example: https://example.com/avatar.jpg
 *         is_active:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/family:
 *   get:
 *     summary: Get all family members for authenticated user
 *     tags: [Family]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of family members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FamilyMember'
 *       401:
 *         description: Unauthorized
 */
router.get('/family', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('SET app.current_user_id = $1', [req.user.id]);

    const { rows } = await client.query(
      'SELECT * FROM family_members WHERE account_owner_id = $1',
      [req.user.id]
    );

    res.json(rows);
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/family:
 *   post:
 *     summary: Create a new family member
 *     tags: [Family]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFamilyMemberRequest'
 *     responses:
 *       201:
 *         description: Family member created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FamilyMember'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/family', authMiddleware, async (req, res) => {
  const { name, email, relationship, avatar_url } = req.body;
  const client = await pool.connect();

  try {
    await client.query('SET app.current_user_id = $1', [req.user.id]);

    const { rows } = await client.query(
      `INSERT INTO family_members
       (account_owner_id, name, email, relationship, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, name, email, relationship, avatar_url]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * @swagger
 * /api/family/{id}:
 *   put:
 *     summary: Update a family member
 *     tags: [Family]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Family member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFamilyMemberRequest'
 *     responses:
 *       200:
 *         description: Family member updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FamilyMember'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Family member not found
 */
router.put('/family/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, email, relationship, avatar_url, is_active } = req.body;
  const client = await pool.connect();

  try {
    await client.query('SET app.current_user_id = $1', [req.user.id]);

    const { rows } = await client.query(
      `UPDATE family_members
       SET name=$1,
           email=$2,
           relationship=$3,
           avatar_url=$4,
           is_active=$5
       WHERE id=$6
       RETURNING *`,
      [name, email, relationship, avatar_url, is_active, id]
    );

    res.json(rows[0]);
  } finally {
    client.release();
  }
});


/**
 * @swagger
 * /api/family/{id}:
 *   delete:
 *     summary: Delete a family member
 *     tags: [Family]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Family member ID
 *     responses:
 *       200:
 *         description: Family member deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Family member not found
 */
router.delete('/family/:id', authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('SET app.current_user_id = $1', [req.user.id]);

    await client.query(
      'DELETE FROM family_members WHERE id=$1',
      [req.params.id]
    );

    res.json({ success: true });
  } finally {
    client.release();
  }
});

export default router;
