const express = require('express');
const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     tags: [Users]
 *     summary: Register a new user
 *     description: Create a new user account with the provided details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - first_name
 *               - last_name
 *               - dob
 *               - gender
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username for the user
 *               password:
 *                 type: string
 *                 description: User's password
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               first_name:
 *                 type: string
 *                 description: User's first name
 *               last_name:
 *                 type: string
 *                 description: User's last name
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *               aadhar_number:
 *                 type: string
 *                 description: User's Aadhar number
 *               dob:
 *                 type: string
 *                 format: date
 *                 description: User's date of birth
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE]
 *                 description: User's gender
 *               temple_id:
 *                 type: integer
 *                 description: ID of the temple the user belongs to
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/register', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('dob').isDate().withMessage('Valid date of birth is required'),
  body('gender').isIn(['MALE', 'FEMALE']).withMessage('Valid gender is required'),
  body('temple_id').optional().isInt().withMessage('Valid temple ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password, email, first_name, last_name, phone, aadhar_number, dob, gender, temple_id } = req.body;
    const user = await userService.register(username, password, email, first_name, last_name, phone, aadhar_number, dob, gender, temple_id);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: User details
 *                 token:
 *                   type: string
 *                   description: JWT token
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const result = await userService.login(req.body.username, req.body.password);
    res.json(result);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

/**
 * @swagger
 * /api/users/update-role:
 *   put:
 *     tags: [Users]
 *     summary: Update user role
 *     description: Update the role of a user (Super User only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - new_role_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID of the user to update
 *               new_role_id:
 *                 type: integer
 *                 description: ID of the new role
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.put('/update-role', authenticate, requireRole('SUPER_USER'), [
  body('user_id').isInt().withMessage('Valid user ID is required'),
  body('new_role_id').isInt().withMessage('Valid role ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const result = await userService.updateUserRole(
      parseInt(req.body.user_id),
      parseInt(req.body.new_role_id)
    );
    res.json(result);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router; 