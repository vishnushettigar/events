import express from 'express';
import { body, validationResult } from 'express-validator';
import * as userService from '../services/userService.js';
import * as eventService from '../services/eventService.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { TEMPLES } from '../constants.js';
import { PrismaClient } from '@prisma/client';

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
            role: user.profile.role.name,
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
                temple_id: true
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
            temple_id: user.temple_id
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
 *     description: Fetch all participants from the authenticated user's temple with their details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of temple participants
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/templeusers', authenticate, async (req, res) => {
    try {
        // Get the authenticated user's profile to determine their temple
        const userProfile = await prisma.profile.findUnique({
            where: { user_id: req.user.id },
            select: { temple_id: true }
        });

        if (!userProfile) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        // Fetch all participants from the same temple
        const participants = await prisma.profile.findMany({
            where: {
                temple_id: userProfile.temple_id,
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

        // Calculate age category for each participant
        const participantsWithAgeCategory = participants.map(participant => {
            const today = new Date();
            const birthDate = new Date(participant.dob);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            // Determine age category based on age
            let ageCategory = '';
            if (age >= 0 && age <= 5) ageCategory = '0-5';
            else if (age >= 6 && age <= 10) ageCategory = '6-10';
            else if (age >= 11 && age <= 14) ageCategory = '11-14';
            else if (age >= 15 && age <= 18) ageCategory = '15-18';
            else if (age >= 19 && age <= 24) ageCategory = '19-24';
            else if (age >= 25 && age <= 35) ageCategory = '25-35';
            else if (age >= 36 && age <= 48) ageCategory = '36-48';
            else if (age >= 49 && age <= 60) ageCategory = '49-60';
            else if (age >= 61 && age <= 90) ageCategory = '61-90';
            else ageCategory = '90+';

            return {
                id: participant.id,
                name: `${participant.first_name} ${participant.last_name || ''}`.trim(),
                age_category: ageCategory,
                aadhar_number: participant.aadhar_number,
                date_of_birth: participant.dob.toISOString().split('T')[0], // Format as YYYY-MM-DD
                gender: participant.gender,
                phone_number: participant.phone
            };
        });

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
router.get('/temple/:templeId', authenticate, async (req, res) => {
    try {
        const { templeId } = req.params;
        
        const temple = await prisma.mst_temple.findUnique({
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
router.get('/temples', authenticate, async (req, res) => {
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
        
        // Verify temple exists
        const temple = await prisma.mst_temple.findUnique({
            where: { 
                id: parseInt(templeId),
                is_deleted: false
            }
        });

        if (!temple) {
            return res.status(404).json({ error: 'Temple not found' });
        }

        // Generate detailed temple report
        const templeReport = await eventService.generateTempleReport(parseInt(templeId));
        
        // Transform the data for frontend consumption
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
        res.status(500).json({ error: 'Failed to fetch temple detailed report' });
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
router.get('/champions', authenticate, async (req, res) => {
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
                    points: champion.total_points,
                    events: champion.events
                })) : [],
                total_participants: participantsArray.length,
                total_points_in_category: participantsArray.reduce((sum, p) => sum + p.total_points, 0)
            };
        });

        // Sort by age category and gender
        championsArray.sort((a, b) => {
            if (a.age_category !== b.age_category) {
                return a.age_category.localeCompare(b.age_category);
            }
            return a.gender.localeCompare(b.gender);
        });

        res.json(championsArray);
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

        console.log('Team registrations found:', teamRegistrations.length);
        console.log('Sample team registration:', teamRegistrations[0]);

        // Group individual events by age category and gender
        const individualEventsByCategory = {};

        individualRegistrations.forEach(registration => {
            const ageCategory = registration.event.age_category.name;
            const gender = registration.event.gender;
            const eventName = registration.event.event_type.name;
            const participantName = `${registration.user.first_name} ${registration.user.last_name || ''}`.trim();
            const templeName = registration.user.temple.name;
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
                points: points
            };

            if (rank === 'FIRST' && !individualEventsByCategory[key].events[eventName].first) {
                individualEventsByCategory[key].events[eventName].first = participantData;
            } else if (rank === 'SECOND' && !individualEventsByCategory[key].events[eventName].second) {
                individualEventsByCategory[key].events[eventName].second = participantData;
            } else if (rank === 'THIRD' && !individualEventsByCategory[key].events[eventName].third) {
                individualEventsByCategory[key].events[eventName].third = participantData;
            }
        });

        // Group team events by age category and gender
        const teamEventsByCategory = {};

        teamRegistrations.forEach(registration => {
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

            if (rank === 'FIRST' && !teamEventsByCategory[key].events[eventName].first) {
                teamEventsByCategory[key].events[eventName].first = teamData;
            } else if (rank === 'SECOND' && !teamEventsByCategory[key].events[eventName].second) {
                teamEventsByCategory[key].events[eventName].second = teamData;
            } else if (rank === 'THIRD' && !teamEventsByCategory[key].events[eventName].third) {
                teamEventsByCategory[key].events[eventName].third = teamData;
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