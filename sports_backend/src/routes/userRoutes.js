const express = require('express');
const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');
const { authenticate, requireRole } = require('../middleware/auth');
const { TEMPLES } = require('../constants');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
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
 *               - temple_name
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
 *               temple_name:
 *                 type: string
 *                 enum: [TEMPLE_1, TEMPLE_2, TEMPLE_3]
 *                 description: User's temple name
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
  body('temple_name')
    .notEmpty().withMessage('Temple name is required')
    .custom((value) => {
      const templeName = value.toUpperCase();
      if (!Object.keys(TEMPLES).includes(templeName)) {
        throw new Error('Invalid temple name');
      }
      return true;
    })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password, email, first_name, last_name, phone, aadhar_number, dob, gender, temple_name } = req.body;
    const templeName = temple_name.toUpperCase();
    const temple_id = TEMPLES[templeName].id;
    const user = await userService.register(username, password, email, first_name, last_name, phone, aadhar_number, dob, gender, temple_id);
    
    // Generate JWT token after successful registration
    const result = await userService.login(username, password);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error registering user:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return res.status(400).json({ 
        error: 'This Aadhaar number is already registered. Please use a different Aadhaar number or try logging in.',
        code: error.code,
        meta: error.meta
      });
    }
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

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get user profile
 *     description: Get the profile of the currently logged-in user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/profile', authenticate, async (req, res) => {
    try {
        console.log('Fetching profile for user ID:', req.user.id);
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                profile: {
                    include: {
                        temple: true
                    }
                }
            }
        });

        if (!user) {
            console.log('User not found:', req.user.id);
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.profile) {
            console.log('Profile not found for user:', req.user.id);
            return res.status(404).json({ error: 'Profile not found' });
        }

        // Calculate age
        const today = new Date();
        const birthDate = new Date(user.profile.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        // Get temple admin information
        const templeAdmin = await prisma.profile.findFirst({
            where: {
                temple_id: user.profile.temple_id,
                role_id: 2, // TEMPLE_ADMIN role
                is_deleted: false
            },
            select: {
                first_name: true,
                last_name: true,
                phone: true
            }
        });

        // Format response
        const profileData = {
            ...user.profile,
            age,
            temple: user.profile.temple.name,
            temple_admin_name: templeAdmin ? `${templeAdmin.first_name} ${templeAdmin.last_name}` : null,
            temple_admin_phone: templeAdmin?.phone || null
        };

        console.log('Profile found:', profileData);
        res.json(profileData);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
    }
});

/**
 * @swagger
 * /api/users/available-events:
 *   get:
 *     tags: [Users]
 *     summary: Get available events for user
 *     description: Get list of events that the user can register for based on their age and gender
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available events
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/available-events', authenticate, async (req, res) => {
  try {
    // Get user's profile
    const userProfile = await prisma.profile.findUnique({
      where: { user_id: req.user.id },
      include: {
        temple: true
      }
    });

    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Calculate user's age
    const today = new Date();
    const birthDate = new Date(userProfile.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Get all age categories
    const ageCategories = await prisma.mst_age_category.findMany({
      where: {
        is_deleted: false
      }
    });

    // Find matching age category
    const matchingAgeCategory = ageCategories.find(category => 
      age >= category.from_age && age <= category.to_age
    );

    if (!matchingAgeCategory) {
      return res.status(400).json({ error: 'No matching age category found for user' });
    }

    // Get available events
    const availableEvents = await prisma.mst_event.findMany({
      where: {
        age_category_id: matchingAgeCategory.id,
        gender: {
          in: [userProfile.gender, 'ALL']
        },
        is_deleted: false,
        is_closed: false
      },
      include: {
        event_type: true,
        age_category: true,
        registrations: {
          where: {
            user_id: userProfile.id,
            is_deleted: false
          }
        }
      }
    });

    // Format response
    const formattedEvents = availableEvents.map(event => ({
      id: event.id,
      name: event.event_type.name,
      type: event.event_type.type,
      participant_count: event.event_type.participant_count,
      age_category: {
        id: event.age_category.id,
        name: event.age_category.name,
        from_age: event.age_category.from_age,
        to_age: event.age_category.to_age
      },
      gender: event.gender,
      is_registered: event.registrations.length > 0,
      registration_status: event.registrations[0]?.status || null
    }));

    res.json({
      user: {
        age,
        gender: userProfile.gender,
        temple: userProfile.temple.name
      },
      events: formattedEvents
    });
  } catch (error) {
    console.error('Error fetching available events:', error);
    res.status(500).json({ error: 'Failed to fetch available events' });
  }
});

// Debug endpoint to check user info
router.get('/debug-info', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: {
          include: {
            temple: true,
            role: true
          }
        }
      }
    });

    res.json({
      jwt_user: req.user,
      db_user: user
    });
  } catch (error) {
    console.error('Error in debug-info endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch debug info' });
  }
});

module.exports = router; 