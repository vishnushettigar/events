import express from 'express';
import { body, validationResult } from 'express-validator';
import * as userService from '../services/userService.js';
import * as eventService from '../services/eventService.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { TEMPLES } from '../constants.js';
import { Gender } from '@prisma/client';
import { calculateAgeWithSettings, getAgeCategory } from '../utils/ageUtils.js';
import prisma from '../utils/prismaClient.js';
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
 *               - first_name
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
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email is required if provided'),
  body('first_name').notEmpty().withMessage('First name is required'),
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
 * /api/users/check-aadhaar:
 *   post:
 *     tags: [Users]
 *     summary: Check if Aadhaar number exists
 *     description: Check if the provided Aadhaar number is already registered
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - aadhaar
 *             properties:
 *               aadhaar:
 *                 type: string
 *                 description: Aadhaar number to check
 *     responses:
 *       200:
 *         description: Check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                   description: Whether the Aadhaar number exists
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/check-aadhaar', async (req, res) => {
  try {
    const { aadhaar } = req.body;
    
    if (!aadhaar) {
      return res.status(400).json({ error: 'Aadhaar number is required' });
    }

    const existingUser = await prisma.profile.findFirst({
      where: {
        aadhar_number: aadhaar,
        is_deleted: false
      }
    });

    res.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Error checking Aadhaar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/check-email:
 *   post:
 *     tags: [Users]
 *     summary: Check if email exists
 *     description: Check if the provided email address is already registered
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to check
 *     responses:
 *       200:
 *         description: Check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                   description: Whether the email exists
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: email
      }
    });

    res.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ error: 'Internal server error' });
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
router.put('/update-role', authenticate, requireRole('ADMIN'), [
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
                        temple: true,
                        role: true
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

        // Calculate age using cutoff date from settings
        const age = await calculateAgeWithSettings(user.profile.dob);

        // Get all age categories and find matching one
        const ageCategories = await prisma.mst_age_category.findMany({
            where: {
                is_deleted: false
            }
        });

        const matchingAgeCategory = ageCategories.find(category => 
            age >= category.from_age && age <= category.to_age
        );

        // Get all temple admin information
        const templeAdmins = await prisma.profile.findMany({
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
            age_category: matchingAgeCategory ? matchingAgeCategory.name : null,
            temple: user.profile.temple.name,
            role: user.profile.role.name,
            temple_admins: templeAdmins.map(admin => ({
                name: `${admin.first_name} ${admin.last_name}`,
                phone: admin.phone
            }))
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

    // Calculate user's age using cutoff date from settings
    const age = await calculateAgeWithSettings(userProfile.dob);

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
          in: [userProfile.gender, Gender.MIXED]
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
            is_deleted: false,
            year: new Date().getFullYear()  // Only show current year registrations
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

// Get user's team registrations
router.get('/participant-teams', authenticate, async (req, res) => {
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

    // Get team registrations where user is a member
    const teamRegistrations = await prisma.team_event_registration.findMany({
      where: {
        temple_id: userProfile.temple_id,
        is_deleted: false,
        member_user_ids: {
          contains: userProfile.id.toString()
        }
      },
      include: {
        event: {
          include: {
            event_type: true,
            age_category: true
          }
        },
        temple: true,
        event_result: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Filter to only include registrations where the user is actually a member
    const userTeamRegistrations = teamRegistrations.filter(registration => {
      const memberIds = registration.member_user_ids 
        ? registration.member_user_ids.split(',').map(id => parseInt(id.trim()))
        : [];
      return memberIds.includes(userProfile.id);
    });

    // Format response
    const formattedRegistrations = userTeamRegistrations.map(registration => {
      const memberIds = registration.member_user_ids 
        ? registration.member_user_ids.split(',').map(id => parseInt(id.trim()))
        : [];
      
      return {
        id: registration.id,
        event: {
          id: registration.event.id,
          name: registration.event.event_type.name,
          type: registration.event.event_type.type,
          age_category: registration.event.age_category,
          gender: registration.event.gender,
          participant_count: registration.event.event_type.participant_count
        },
        temple: {
          id: registration.temple.id,
          name: registration.temple.name
        },
        status: registration.status,
        member_count: memberIds.length,
        created_at: registration.created_at,
        result: registration.event_result ? {
          rank: registration.event_result.rank,
          points: registration.event_result.points
        } : null
      };
    });

    res.json({
      registrations: formattedRegistrations,
      total: formattedRegistrations.length
    });
  } catch (error) {
    console.error('Error fetching user team registrations:', error);
    res.status(500).json({ error: 'Failed to fetch team registrations' });
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

// Search users by Aadhaar number
router.get('/search-by-aadhar', authenticate, async (req, res) => {
    try {
        const { aadharNumber } = req.query;
        
        if (!aadharNumber) {
            return res.status(400).json({ error: 'Aadhaar number is required' });
        }

        const user = await prisma.profile.findFirst({
            where: {
                aadhar_number: aadharNumber
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                aadhar_number: true,
                temple_id: true,
                gender: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Combine first_name and last_name
        const name = `${user.first_name} ${user.last_name || ''}`.trim();

        res.json({
            id: user.id,
            name: name,
            aadhar_number: user.aadhar_number,
            temple_id: user.temple_id,
            gender: user.gender
        });
    } catch (error) {
        console.error('Error searching user:', error);
        res.status(500).json({ error: 'Error searching user' });
  }
});

/**
 * @swagger
 * /api/users/templeusers:
 *   get:
 *     tags: [Users]
 *     summary: Get all participants from a specific temple
 *     description: Fetch all participants from the authenticated user's temple (or specified temple_id) with their details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: temple_id
 *         schema:
 *           type: integer
 *         description: Optional temple ID. If not provided, uses the authenticated user's temple
 *     responses:
 *       200:
 *         description: List of temple participants
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Temple not found or user profile not found
 *       500:
 *         description: Server error
 */
router.get('/templeusers', authenticate, async (req, res) => {
    try {
        let templeId;
        
        // Check if temple_id is provided in query parameters
        if (req.query.temple_id) {
            templeId = parseInt(req.query.temple_id);
            
            // Verify the temple exists
            const temple = await prisma.mst_temple.findFirst({
                where: {
                    id: templeId,
                    is_deleted: false
                }
            });
            
            if (!temple) {
                return res.status(404).json({ error: 'Temple not found' });
            }
        } else {
            // Get the authenticated user's profile to determine their temple
            const userProfile = await prisma.profile.findUnique({
                where: { user_id: req.user.id },
                select: { temple_id: true }
            });

            if (!userProfile) {
                return res.status(404).json({ error: 'User profile not found' });
            }
            
            templeId = userProfile.temple_id;
        }

        // Fetch all participants from the specified temple
        const participants = await prisma.profile.findMany({
            where: {
                temple_id: templeId,
                is_deleted: false
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                aadhar_number: true,
                dob: true,
                gender: true,
                phone: true
            },
            orderBy: {
                first_name: 'asc'
            }
        });

        // Calculate age category for each participant using cutoff date from settings
        const participantsWithAgeCategory = await Promise.all(participants.map(async (participant) => {
            const age = await calculateAgeWithSettings(participant.dob);
            const ageCategory = getAgeCategory(age);

            return {
                id: participant.id,
                name: `${participant.first_name} ${participant.last_name || ''}`.trim(),
                age_category: ageCategory,
                aadhar_number: participant.aadhar_number,
                date_of_birth: participant.dob.toISOString().split('T')[0], // Format as YYYY-MM-DD
                gender: participant.gender,
                phone_number: participant.phone
            };
        }));

        res.json(participantsWithAgeCategory);
    } catch (error) {
        console.error('Error fetching temple users:', error);
        res.status(500).json({ error: 'Failed to fetch temple users' });
    }
});

/**
 * @swagger
 * /api/users/temple/:templeId:
 *   get:
 *     tags: [Users]
 *     summary: Get temple information by temple ID
 *     description: Fetch temple details using temple ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Temple ID
 *     responses:
 *       200:
 *         description: Temple information
 *       404:
 *         description: Temple not found
 *       500:
 *         description: Server error
 */
router.get('/temple/:templeId', async (req, res) => {
    try {
        const { templeId } = req.params;
        
        const temple = await prisma.mst_temple.findFirst({
            where: { 
                id: parseInt(templeId),
                is_deleted: false
            },
            select: {
                id: true,
                name: true,
                code: true,
                address: true,
                contact_name: true,
                contact_phone: true
            }
        });

        if (!temple) {
            return res.status(404).json({ error: 'Temple not found' });
        }

        res.json(temple);
    } catch (error) {
        console.error('Error fetching temple:', error);
        res.status(500).json({ error: 'Failed to fetch temple information' });
    }
});

/**
 * @swagger
 * /api/users/temples:
 *   get:
 *     tags: [Users]
 *     summary: Get all temples with total points
 *     description: Fetch all temples from the database with their calculated total points
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all temples with total points
 *       500:
 *         description: Server error
 */
router.get('/temples', async (req, res) => {
    try {
        const temples = await prisma.mst_temple.findMany({
            where: {
                is_deleted: false
            },
            select: {
                id: true,
                name: true,
                code: true,
                address: true,
                contact_name: true,
                contact_phone: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Calculate total points for each temple
        const templesWithPoints = await Promise.all(
            temples.map(async (temple) => {
                try {
                    const templeReport = await eventService.generateTempleReport(temple.id);
                    return {
                        ...temple,
                        total_points: templeReport.stats.total_points
                    };
                } catch (error) {
                    console.error(`Error calculating points for temple ${temple.id}:`, error);
                    return {
                        ...temple,
                        total_points: 0
                    };
                }
            })
        );

        // Sort by total points in descending order
        templesWithPoints.sort((a, b) => b.total_points - a.total_points);

        res.json(templesWithPoints);
    } catch (error) {
        console.error('Error fetching temples:', error);
        res.status(500).json({ error: 'Failed to fetch temples' });
    }
});

/**
 * @swagger
 * /api/users/temple-detailed-report/:templeId:
 *   get:
 *     tags: [Users]
 *     summary: Get detailed temple report by temple ID
 *     description: Fetch detailed temple report including individual and team events with results
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Temple ID
 *     responses:
 *       200:
 *         description: Detailed temple report
 *       404:
 *         description: Temple not found
 *       500:
 *         description: Server error
 */
router.get('/temple-detailed-report/:templeId', authenticate, async (req, res) => {
    try {
        const { templeId } = req.params;
        console.log('Temple detailed report requested for temple ID:', templeId);
        
        // Verify temple exists
        const temple = await prisma.mst_temple.findFirst({
            where: { 
                id: parseInt(templeId),
                is_deleted: false
            }
        });

        if (!temple) {
            console.log('Temple not found:', templeId);
            return res.status(404).json({ error: 'Temple not found' });
        }

        console.log('Temple found:', temple.name);

        // Generate detailed temple report
        console.log('Generating temple report...');
        const templeReport = await eventService.generateTempleReport(parseInt(templeId));
        console.log('Temple report generated successfully');
        
        // Transform the data for frontend consumption
        console.log('Transforming data for frontend...');
        const individualEvents = templeReport.participants
            .filter(participant => participant.event_result)
            .map(participant => {
                const eventName = participant.event.name;
                const ageCategory = participant.event.age_category?.name || 'Unknown';
                const gender = participant.user.gender;
                const rank = participant.event_result.rank;
                const points = participant.event_result.points;
                const participantName = `${participant.user.first_name} ${participant.user.last_name || ''}`.trim();
                
                return {
                    event: eventName,
                    age: ageCategory,
                    gender: gender,
                    first: rank === 'FIRST' ? participantName : '',
                    second: rank === 'SECOND' ? participantName : '',
                    third: rank === 'THIRD' ? participantName : '',
                    points: points
                };
            });

        const teamEvents = templeReport.teams
            .filter(team => team.event_result)
            .map(team => {
                const eventName = team.event.name;
                const gender = team.event.gender;
                const rank = team.event_result.rank;
                const points = team.event_result.points;
                
                return {
                    event: eventName,
                    gender: gender,
                    result: rank,
                    points: points
                };
            });

        const totalPoints = {
            individual: individualEvents.reduce((sum, event) => sum + event.points, 0),
            team: teamEvents.reduce((sum, event) => sum + event.points, 0),
            total: templeReport.stats.total_points
        };

        console.log('Data transformation completed. Sending response...');

        res.json({
            temple: {
                id: temple.id,
                name: temple.name,
                code: temple.code
            },
            individualEvents,
            teamEvents,
            totalPoints,
            stats: templeReport.stats
        });
    } catch (error) {
        console.error('Error fetching temple detailed report:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to fetch temple detailed report', details: error.message });
    }
});

/**
 * @swagger
 * /api/users/champions:
 *   get:
 *     tags: [Users]
 *     summary: Get highest point getters by age category and gender
 *     description: Fetch the participants with the highest total points in each age category and gender combination
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Highest point getters organized by age category and gender
 *       500:
 *         description: Server error
 */
router.get('/champions',  authenticate, async (req, res) => {
    try {
        // Get all individual events with results
        const individualRegistrations = await prisma.ind_event_registration.findMany({
            where: {
                is_deleted: false,
                status: 'ACCEPTED',
                event_result: {
                    isNot: null
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        aadhar_number: true,
                        temple: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                event: {
                    include: {
                        event_type: true,
                        age_category: true
                    }
                },
                event_result: {
                    select: {
                        rank: true,
                        points: true
                    }
                }
            }
        });

        // Group participants by age category and gender, then calculate total points per participant
        const participantsByCategory = {};

        individualRegistrations.forEach(registration => {
            const ageCategory = registration.event.age_category.name;
            const gender = registration.event.gender;
            const userId = registration.user.id;
            const participantName = `${registration.user.first_name} ${registration.user.last_name || ''}`.trim();
            const templeName = registration.user.temple.name;
            const aadharNumber = registration.user.aadhar_number;
            const points = registration.event_result.points;

            // Create key for grouping
            const key = `${ageCategory}::${gender}`;
            
            if (!participantsByCategory[key]) {
                participantsByCategory[key] = {
                    age_category: ageCategory,
                    gender: gender,
                    participants: {}
                };
            }

            // If participant doesn't exist, create entry
            if (!participantsByCategory[key].participants[userId]) {
                participantsByCategory[key].participants[userId] = {
                    id: userId,
                    name: participantName,
                    temple: templeName,
                    aadhar_number: aadharNumber,
                    total_points: 0,
                    events: []
                };
            }

            // Add points to participant's total and track the event
            participantsByCategory[key].participants[userId].total_points += points;
            participantsByCategory[key].participants[userId].events.push({
                event_name: registration.event.event_type.name,
                points: points,
                rank: registration.event_result.rank
            });
        });

        // Find highest point getters for each category (handle ties)
        const championsArray = Object.values(participantsByCategory).map(category => {
            // Convert participants object to array and sort by total points (highest first)
            const participantsArray = Object.values(category.participants);
            const sortedParticipants = participantsArray.sort((a, b) => b.total_points - a.total_points);
            
            // Find all participants with the same highest points (handle ties)
            const highestPoints = sortedParticipants.length > 0 ? sortedParticipants[0].total_points : 0;
            const champions = sortedParticipants.filter(participant => participant.total_points === highestPoints);

            return {
                age_category: category.age_category,
                gender: category.gender,
                champions: champions.length > 0 ? champions.map(champion => ({
                    name: champion.name,
                    temple: champion.temple,
                    aadhar_number: champion.aadhar_number,
                    points: champion.total_points,
                    events: champion.events
                })) : [],
                total_participants: participantsArray.length,
                total_points_in_category: participantsArray.reduce((sum, p) => sum + p.total_points, 0)
            };
        });

        // Define the desired age category order and filter out unwanted categories
        const allowedAgeCategories = ['11-14', '15-18', '19-24', '25-35', '36-49', '50-60'];
        const ageCategoryOrder = {
            '11-14': 1,
            '15-18': 2,
            '19-24': 3,
            '25-35': 4,
            '36-49': 5,
            '50-60': 6
        };

        // Filter out unwanted age categories and sort by specific order
        const filteredChampionsArray = championsArray
            .filter(category => allowedAgeCategories.includes(category.age_category))
            .sort((a, b) => {
                const ageOrderA = ageCategoryOrder[a.age_category] || 999;
                const ageOrderB = ageCategoryOrder[b.age_category] || 999;
                
                if (ageOrderA !== ageOrderB) {
                    return ageOrderA - ageOrderB;
                }
                return a.gender.localeCompare(b.gender);
            });

        res.json(filteredChampionsArray);
    } catch (error) {
        console.error('Error fetching champions:', error);
        res.status(500).json({ error: 'Failed to fetch champions' });
    }
});

/**
 * @swagger
 * /api/users/all-results:
 *   get:
 *     tags: [Users]
 *     summary: Get all results for individual and team events
 *     description: Fetch all winners (1st, 2nd, 3rd place) for both individual and team events organized by age category and gender
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All results organized by event type, age category and gender
 *       500:
 *         description: Server error
 */
router.get('/all-results', authenticate, async (req, res) => {
    try {
        // Get all individual events with results
        const individualRegistrations = await prisma.ind_event_registration.findMany({
            where: {
                is_deleted: false,
                status: 'ACCEPTED',
                event_result: {
                    isNot: null
                }
            },
            include: {
                user: {
                    select: {
                        first_name: true,
                        last_name: true,
                        aadhar_number: true,
                        temple: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                event: {
                    include: {
                        event_type: true,
                        age_category: true
                    }
                },
                event_result: {
                    select: {
                        rank: true,
                        points: true
                    }
                }
            },
            orderBy: [
                { event: { age_category: { name: 'asc' } } },
                { event: { gender: 'asc' } },
                { event: { event_type: { name: 'asc' } } },
                { event_result: { rank: 'asc' } }
            ]
        });

        // Get all team events with results
        const teamRegistrations = await prisma.team_event_registration.findMany({
            where: {
                is_deleted: false,
                status: 'ACCEPTED',
                event_result: {
                    isNot: null
                }
            },
            include: {
                temple: {
                    select: {
                        name: true
                    }
                },
                event: {
                    include: {
                        event_type: true,
                        age_category: true
                    }
                },
                event_result: {
                    select: {
                        rank: true,
                        points: true
                    }
                }
            },
            orderBy: [
                { event: { age_category: { name: 'asc' } } },
                { event: { gender: 'asc' } },
                { event: { event_type: { name: 'asc' } } },
                { event_result: { rank: 'asc' } }
            ]
        });

        // For mixed team events, we need to fetch participant details
        const teamRegistrationsWithParticipants = await Promise.all(
            teamRegistrations.map(async (registration) => {
                if (registration.event.gender === 'MIXED' && registration.member_user_ids) {
                    // Fetch participant details for mixed teams
                    const userIds = registration.member_user_ids.split(',').map(id => parseInt(id.trim()));
                    const participants = await prisma.profile.findMany({
                        where: {
                            user_id: { in: userIds }
                        },
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            gender: true
                        }
                    });
                    
                    return {
                        ...registration,
                        participants: participants
                    };
                }
                return registration;
            })
        );

        console.log('Team registrations found:', teamRegistrationsWithParticipants.length);
        console.log('Sample team registration:', teamRegistrationsWithParticipants[0]);

        // Group individual events by age category and gender
        const individualEventsByCategory = {};

        individualRegistrations.forEach(registration => {
            const ageCategory = registration.event.age_category.name;
            const gender = registration.event.gender;
            const eventName = registration.event.event_type.name;
            const participantName = `${registration.user.first_name} ${registration.user.last_name || ''}`.trim();
            const templeName = registration.user.temple.name;
            const aadharNumber = registration.user.aadhar_number;
            const rank = registration.event_result.rank;
            const points = registration.event_result.points;

            // Create key for grouping
            const key = `${ageCategory}::${gender}`;
            
            if (!individualEventsByCategory[key]) {
                individualEventsByCategory[key] = {
                    age_category: ageCategory,
                    gender: gender,
                    events: {}
                };
            }

            if (!individualEventsByCategory[key].events[eventName]) {
                individualEventsByCategory[key].events[eventName] = {
                    first: null,
                    second: null,
                    third: null
                };
            }

            // Add participant to appropriate rank
            const participantData = {
                name: participantName,
                temple: templeName,
                aadhar: aadharNumber,
                points: points
            };

            if (rank === 'FIRST') {
                if (!individualEventsByCategory[key].events[eventName].first) {
                    individualEventsByCategory[key].events[eventName].first = [participantData];
                } else {
                    // Check if participant already exists to avoid duplicates using Aadhar number
                    const exists = individualEventsByCategory[key].events[eventName].first.some(
                        winner => winner.aadhar === aadharNumber
                    );
                    if (!exists) {
                        individualEventsByCategory[key].events[eventName].first.push(participantData);
                    }
                }
            } else if (rank === 'SECOND') {
                if (!individualEventsByCategory[key].events[eventName].second) {
                    individualEventsByCategory[key].events[eventName].second = [participantData];
                } else {
                    // Check if participant already exists to avoid duplicates using Aadhar number
                    const exists = individualEventsByCategory[key].events[eventName].second.some(
                        winner => winner.aadhar === aadharNumber
                    );
                    if (!exists) {
                        individualEventsByCategory[key].events[eventName].second.push(participantData);
                    }
                }
            } else if (rank === 'THIRD') {
                if (!individualEventsByCategory[key].events[eventName].third) {
                    individualEventsByCategory[key].events[eventName].third = [participantData];
                } else {
                    // Check if participant already exists to avoid duplicates using Aadhar number
                    const exists = individualEventsByCategory[key].events[eventName].third.some(
                        winner => winner.aadhar === aadharNumber
                    );
                    if (!exists) {
                        individualEventsByCategory[key].events[eventName].third.push(participantData);
                    }
                }
            }
        });

        // Group team events by age category and gender
        const teamEventsByCategory = {};

        teamRegistrationsWithParticipants.forEach(registration => {
            const ageCategory = registration.event.age_category.name;
            const gender = registration.event.gender;
            const eventName = registration.event.event_type.name;
            const templeName = registration.temple.name;
            const rank = registration.event_result.rank;
            const points = registration.event_result.points;

            // Create key for grouping
            const key = `${ageCategory}::${gender}`;
            
            if (!teamEventsByCategory[key]) {
                teamEventsByCategory[key] = {
                    age_category: ageCategory,
                    gender: gender,
                    events: {}
                };
            }

            if (!teamEventsByCategory[key].events[eventName]) {
                teamEventsByCategory[key].events[eventName] = {
                    first: null,
                    second: null,
                    third: null
                };
            }

            // Add team to appropriate rank
            const teamData = {
                temple: templeName,
                points: points
            };

            // For mixed events, include participant details
            if (gender === 'MIXED' && registration.participants) {
                teamData.participants = registration.participants;
            }

            if (rank === 'FIRST') {
                if (!teamEventsByCategory[key].events[eventName].first) {
                    teamEventsByCategory[key].events[eventName].first = [teamData];
                } else {
                    // Check if team already exists to avoid duplicates
                    const exists = teamEventsByCategory[key].events[eventName].first.some(
                        winner => winner.temple === templeName
                    );
                    if (!exists) {
                        teamEventsByCategory[key].events[eventName].first.push(teamData);
                    }
                }
            } else if (rank === 'SECOND') {
                if (!teamEventsByCategory[key].events[eventName].second) {
                    teamEventsByCategory[key].events[eventName].second = [teamData];
                } else {
                    // Check if team already exists to avoid duplicates
                    const exists = teamEventsByCategory[key].events[eventName].second.some(
                        winner => winner.temple === templeName
                    );
                    if (!exists) {
                        teamEventsByCategory[key].events[eventName].second.push(teamData);
                    }
                }
            } else if (rank === 'THIRD') {
                if (!teamEventsByCategory[key].events[eventName].third) {
                    teamEventsByCategory[key].events[eventName].third = [teamData];
                } else {
                    // Check if team already exists to avoid duplicates
                    const exists = teamEventsByCategory[key].events[eventName].third.some(
                        winner => winner.temple === templeName
                    );
                    if (!exists) {
                        teamEventsByCategory[key].events[eventName].third.push(teamData);
                    }
                }
            }
        });

        // Convert to array format for easier frontend consumption
        const individualResults = Object.values(individualEventsByCategory).map(category => ({
            age_category: category.age_category,
            gender: category.gender,
            events: Object.entries(category.events).map(([eventName, winners]) => ({
                event_name: eventName,
                first: winners.first,
                second: winners.second,
                third: winners.third
            }))
        }));

        const teamResults = Object.values(teamEventsByCategory).map(category => ({
            age_category: category.age_category,
            gender: category.gender,
            events: Object.entries(category.events).map(([eventName, winners]) => ({
                event_name: eventName,
                first: winners.first,
                second: winners.second,
                third: winners.third
            }))
        }));

        console.log('Team results:', teamResults.length, 'categories');
        console.log('Individual results:', individualResults.length, 'categories');

        res.json({
            individual: individualResults,
            team: teamResults
        });
    } catch (error) {
        console.error('Error fetching all results:', error);
        res.status(500).json({ error: 'Failed to fetch all results' });
    }
});

export default router; 