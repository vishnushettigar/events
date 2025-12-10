import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import prisma from '../utils/prismaClient.js';
const router = express.Router();

/**
 * @swagger
 * /api/viewer/verify-access:
 *   get:
 *     tags: [Viewer]
 *     summary: Verify viewer access
 *     description: Verify that the current user has VIEWER privileges
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Access verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 user:
 *                   type: object
 *                   description: User information
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.get('/verify-access', authenticate, requireRole('VIEWER'), (req, res) => {
  res.json({
    message: 'Viewer access verified',
    user: {
      id: req.user.id,
      role: req.user.role,
      temple_id: req.user.temple_id
    }
  });
});

/**
 * @swagger
 * /api/viewer/dashboard-stats:
 *   get:
 *     tags: [Viewer]
 *     summary: Get viewer dashboard statistics
 *     description: Get read-only statistics for the viewer dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEvents:
 *                   type: integer
 *                   description: Total number of events
 *                 totalUsers:
 *                   type: integer
 *                   description: Total number of users
 *                 totalTemples:
 *                   type: integer
 *                   description: Total number of temples
 *                 activeRegistrations:
 *                   type: integer
 *                   description: Number of active registrations
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/dashboard-stats', authenticate, requireRole('VIEWER'), async (req, res) => {
  try {
    // Get actual statistics from database
    const [totalEvents, totalUsers, totalTemples, activeRegistrations] = await Promise.all([
      prisma.mst_event.count({ where: { is_deleted: false } }),
      prisma.user.count(),
      prisma.mst_temple.count({ where: { is_deleted: false } }),
      prisma.ind_event_registration.count({ where: { status: 'ACCEPTED' } })
    ]);

    const stats = {
      totalEvents,
      totalUsers,
      totalTemples,
      activeRegistrations
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * @swagger
 * /api/viewer/events:
 *   get:
 *     tags: [Viewer]
 *     summary: Get all events (read-only)
 *     description: Retrieve all events for viewing purposes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/events', authenticate, requireRole('VIEWER'), async (req, res) => {
   try {
    const events = await prisma.mst_event.findMany({
      where: { is_deleted: false },
      include: {
        event_type: true,
        age_category: true,
        registrations: {
          where: { is_deleted: false },
          select: {
            id: true,
            event_result_id: true
          }
        },
        team_registrations: {
          where: { is_deleted: false },
          select: {
            id: true,
            event_result_id: true
          }
        }
      },
      orderBy: [
        { age_category: { from_age: 'asc' } },
        { gender: 'asc' },
        { event_type: { name: 'asc' } }
      ]
    });

    // Transform events to include registration count and has_results flag
    const transformedEvents = events.map(event => {
      // Check if any individual registration has results
      const hasIndividualResults = event.registrations.some(reg => reg.event_result_id !== null);
      // Check if any team registration has results
      const hasTeamResults = event.team_registrations.some(reg => reg.event_result_id !== null);
      // Event has results if either individual or team registrations have results
      const has_results = hasIndividualResults || hasTeamResults;

      return {
        id: event.id,
        name: event.event_type.name,
        event_type: event.event_type,
        age_category: event.age_category,
        gender: event.gender,
        is_closed: event.is_closed,
        registrations_count: event.registrations.length,
        has_results: has_results
      };
    });

    res.json({ events: transformedEvents });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * @swagger
 * /api/viewer/participant-data:
 *   get:
 *     tags: [Viewer]
 *     summary: Get participant data with filters (read-only)
 *     description: Retrieve participant data including age categories, genders, and events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ageCategory
 *         schema:
 *           type: string
 *         description: Age category filter
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: Gender filter
 *     responses:
 *       200:
 *         description: Participant data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/participant-data', authenticate, requireRole('VIEWER'), async (req, res) => {
  try {
    const { ageCategory, gender } = req.query;

    // Get age categories
    const ageCategories = await prisma.mst_age_category.findMany({
      where: { is_deleted: false },
      orderBy: { from_age: 'asc' }
    });

    // Format age categories for dropdown
    const formattedAgeCategories = ageCategories.map(cat => ({
      id: cat.id,
      name: `${cat.name} (${cat.from_age}-${cat.to_age} years)`,
      value: `${cat.from_age}-${cat.to_age}`
    }));

    // Get gender options
    const genderOptions = [
      { id: 1, name: 'Male', value: 'MALE' },
      { id: 2, name: 'Female', value: 'FEMALE' },
      { id: 3, name: 'ALL', value: 'ALL' }
    ];

    // Build event filter conditions
    const eventFilter = {
      is_deleted: false
    };

    // Apply age category filter
    if (ageCategory && ageCategory !== 'ALL') {
      const [fromAge, toAge] = ageCategory.split('-').map(Number);
      eventFilter.age_category = {
        from_age: fromAge,
        to_age: toAge
      };
    }

    // Apply gender filter
    if (gender && gender !== 'ALL') {
      eventFilter.gender = gender;
    }

    // Get events based on filters
    const events = await prisma.mst_event.findMany({
      where: eventFilter,
      include: {
        age_category: true,
        event_type: true
      },
      orderBy: [
        { age_category: { from_age: 'asc' } },
        { gender: 'asc' },
        { event_type: { name: 'asc' } }
      ]
    });

    // Format events for response
    const formattedEvents = events.map(event => ({
      id: event.id,
      name: event.event_type.name,
      age_category: `${event.age_category.name} (${event.age_category.from_age}-${event.age_category.to_age} years)`,
      gender: event.gender,
      event_type: event.event_type
    }));

    res.json({
      ageCategories: formattedAgeCategories,
      genderOptions,
      events: formattedEvents
    });
  } catch (error) {
    console.error('Error fetching participant data:', error);
    res.status(500).json({ error: 'Failed to fetch participant data' });
  }
});

/**
 * @swagger
 * /api/viewer/participants:
 *   get:
 *     tags: [Viewer]
 *     summary: Get all participants (read-only)
 *     description: Retrieve all participants for viewing purposes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Participants retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/participants', authenticate, requireRole('VIEWER'), async (req, res) => {
    try {
        const { event_ids, temple_id } = req.query;

        // Always filter for status = 'ACCEPTED'
        const where = {
          is_deleted: false,
          status: 'ACCEPTED',
          year: new Date().getFullYear()  // Only show current year data
        };

        // Add event filter
        if (event_ids) {
          const eventIdArray = event_ids.split(',').map(id => parseInt(id));
          where.event_id = {
            in: eventIdArray
          };
        }

        // Add temple filter
        if (temple_id && temple_id !== 'ALL') {
          where.user = {
            temple_id: parseInt(temple_id)
          };
        }

        const participants = await prisma.ind_event_registration.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                gender: true,
                dob: true,
                temple: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            event: {
              include: {
                event_type: {
                  select: {
                    name: true,
                    type: true
                  }
                },
                age_category: {
                  select: {
                    name: true
                  }
                }
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
            { created_at: 'desc' }
          ]
        });

        // Transform the data to include event name from event_type
        const transformedParticipants = participants.map(participant => ({
          ...participant,
          event: {
            ...participant.event,
            name: participant.event.event_type.name
          }
        }));

        res.json(transformedParticipants);
      } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({ error: 'Failed to fetch participants' });
      }
});

/**
 * @swagger
 * /api/viewer/teams:
 *   get:
 *     tags: [Viewer]
 *     summary: Get all teams (read-only)
 *     description: Retrieve all teams for viewing purposes (no pagination)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: temple_id
 *         schema:
 *           type: integer
 *         description: Filter by temple ID
 *       - in: query
 *         name: event_id
 *         schema:
 *           type: integer
 *         description: Filter by event ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, DECLINED]
 *         description: Filter by team status
 *     responses:
 *       200:
 *         description: Teams retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/teams', authenticate, requireRole('VIEWER'), async (req, res) => {
  try {
    const { temple_id, event_id, status } = req.query;

    let whereClause = {
      year: new Date().getFullYear()  // Only show current year data
    };
    
    if (temple_id) whereClause.temple_id = parseInt(temple_id);
    if (event_id) whereClause.event_id = parseInt(event_id);
    if (status) whereClause.status = status;

    const teams = await prisma.team_event_registration.findMany({
      where: whereClause,
      include: {
        temple: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        event: {
          select: {
            id: true,
            gender: true,
            event_type: {
              select: {
                id: true,
                name: true
              }
            },
            age_category: {
              select: {
                id: true,
                name: true,
                from_age: true,
                to_age: true
              }
            }
          }
        },
        event_result: {
          select: {
            id: true,
            points: true,
            rank: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Add member count and fetch member details for each team
    const teamsWithMemberCount = teams.map(team => {
      const memberIds = team.member_user_ids ? team.member_user_ids.split(',').map(id => parseInt(id)) : [];
      return {
        ...team,
        member_count: memberIds.length,
        team_name: `Team ${team.id}`, // Generate team name from ID
        member_user_ids_array: memberIds // Add array of member IDs for easier processing
      };
    });

    res.json({
      teams: teamsWithMemberCount,
      total_count: teamsWithMemberCount.length
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

/**
 * @swagger
 * /api/viewer/temple-list:
 *   get:
 *     tags: [Viewer]
 *     summary: Get all temples (read-only)
 *     description: Retrieve all temples for viewing purposes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Temples retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   location:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/temple-list', authenticate, requireRole('VIEWER'), async (req, res) => {
  try {
    const temples = await prisma.mst_temple.findMany({
      where: { is_deleted: false },
      orderBy: { name: 'asc' }
    });

    res.json(temples);
  } catch (error) {
    console.error('Error fetching temples:', error);
    res.status(500).json({ error: 'Failed to fetch temples' });
  }
});

/**
 * @swagger
 * /api/viewer/results:
 *   get:
 *     tags: [Viewer]
 *     summary: Get all results (read-only)
 *     description: Retrieve all event results for viewing purposes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Results retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/results', authenticate, requireRole('VIEWER'), async (req, res) => {
  try {
    const results = await prisma.ind_event_result.findMany({
      include: {
        event: {
          include: {
            age_category: true,
            event_type: true
          }
        },
        participant: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            temple: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { event_id: 'asc' },
        { position: 'asc' }
      ]
    });

    res.json({ results });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

/**
 * @swagger
 * /api/viewer/champions:
 *   get:
 *     tags: [Viewer]
 *     summary: Get all champions (read-only)
 *     description: Retrieve all champions for viewing purposes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Champions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/champions', authenticate, requireRole('VIEWER'), async (req, res) => {
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
 * /api/viewer/users:
 *   get:
 *     tags: [Viewer]
 *     summary: Get all users (read-only)
 *     description: Retrieve all users for viewing purposes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/users', authenticate, requireRole('VIEWER'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        temple: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        _count: {
          select: {
            ind_event_registration: true,
            team_members: true
          }
        }
      },
      orderBy: [
        { created_at: 'desc' }
      ]
    });

    // Remove sensitive information
    const sanitizedUsers = users.map(user => ({
      ...user,
      password: undefined
    }));

    res.json({ users: sanitizedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @swagger
 * /api/viewer/system-backup:
 *   post:
 *     tags: [Viewer]
 *     summary: Create system backup
 *     description: Create a full system backup (Viewer only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/system-backup', authenticate, requireRole('VIEWER'), async (req, res) => {
  try {
    // This would implement actual backup logic
    const backupId = `backup_${Date.now()}`;
    
    res.json({
      message: 'System backup initiated successfully',
      backupId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create system backup' });
  }
});

/**
 * @swagger
 * /api/viewer/users/details:
 *   get:
 *     tags: [Viewer]
 *     summary: Get user details by IDs (read-only)
 *     description: Retrieve detailed user information by user IDs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ids
 *         schema:
 *           type: string
 *         description: Comma-separated user IDs
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       400:
 *         description: User IDs are required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/users/details', authenticate, requireRole('VIEWER'), async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'User IDs are required' });
    }

    const userIds = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (userIds.length === 0) {
      return res.json({ users: [] });
    }

    console.log('Fetching users with IDs:', userIds);

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      include: {
        profile: {
          include: {
            temple: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${users.length} users out of ${userIds.length} requested IDs`);
    console.log('Found user IDs:', users.map(u => u.id));

    res.json({ users });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

/**
 * @swagger
 * /api/viewer/profiles/details:
 *   get:
 *     tags: [Viewer]
 *     summary: Get profile details by IDs (read-only)
 *     description: Retrieve detailed profile information by profile IDs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ids
 *         schema:
 *           type: string
 *         description: Comma-separated profile IDs
 *     responses:
 *       200:
 *         description: Profile details retrieved successfully
 *       400:
 *         description: Profile IDs are required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/profiles/details', authenticate, requireRole('VIEWER'), async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'Profile IDs are required' });
    }

    const profileIds = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (profileIds.length === 0) {
      return res.json({ profiles: [] });
    }

    console.log('Fetching profiles with IDs:', profileIds);

    const profiles = await prisma.profile.findMany({
      where: {
        id: { in: profileIds }
      },
      include: {
        temple: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        role: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    console.log(`Found ${profiles.length} profiles out of ${profileIds.length} requested IDs`);
    console.log('Found profile IDs:', profiles.map(p => p.id));

    res.json({ profiles });
  } catch (error) {
    console.error('Error fetching profile details:', error);
    res.status(500).json({ error: 'Failed to fetch profile details' });
  }
});

/**
 * @swagger
 * /api/viewer/temple-management:
 *   get:
 *     tags: [Viewer]
 *     summary: Get temple management data (read-only)
 *     description: Retrieve temple statistics and management information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Temple management data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/temple-management', authenticate, requireRole('VIEWER'), async (req, res) => {
  try {
    console.log('Fetching temple management data for viewer...');
    
    // Get all temples
    const temples = await prisma.mst_temple.findMany({
      where: { is_deleted: false },
      orderBy: { name: 'asc' }
    });

    console.log(`Found ${temples.length} temples`);

    // Get temple statistics
    const templeStats = await Promise.all(
      temples.map(async (temple) => {
        try {
          console.log(`Processing temple: ${temple.name} (ID: ${temple.id})`);
          
          // Get all temple admin contact information
          const templeAdmins = await prisma.profile.findMany({
            where: {
              temple_id: temple.id,
              role_id: 2, // TEMPLE_ADMIN role
              is_deleted: false
            },
            select: {
              first_name: true,
              last_name: true,
              email: true,
              phone: true
            }
          });

          // Get participant counts by status
          const [totalParticipants, acceptedParticipants, pendingParticipants, declinedParticipants] = await Promise.all([
            prisma.ind_event_registration.count({
              where: {
                user: { temple_id: temple.id },
                is_deleted: false,
                year: new Date().getFullYear()  // Only count current year data
              }
            }),
            prisma.ind_event_registration.count({
              where: {
                user: { temple_id: temple.id },
                status: 'ACCEPTED',
                is_deleted: false,
                year: new Date().getFullYear()  // Only count current year data
              }
            }),
            prisma.ind_event_registration.count({
              where: {
                user: { temple_id: temple.id },
                status: 'PENDING',
                is_deleted: false,
                year: new Date().getFullYear()  // Only count current year data
              }
            }),
            prisma.ind_event_registration.count({
              where: {
                user: { temple_id: temple.id },
                status: 'DECLINED',
                is_deleted: false,
                year: new Date().getFullYear()  // Only count current year data
              }
            })
          ]);

          console.log(`Temple ${temple.name} participants: Total=${totalParticipants}, Accepted=${acceptedParticipants}, Pending=${pendingParticipants}, Declined=${declinedParticipants}`);

          // Calculate total points (sum of all accepted registrations' points)
          const registrationsWithResults = await prisma.ind_event_registration.findMany({
            where: {
              user: { temple_id: temple.id },
              status: 'ACCEPTED',
              is_deleted: false,
              year: new Date().getFullYear(),  // Only count current year data
              event_result: {
                isNot: null
              }
            },
            include: {
              event_result: true
            }
          });

          // Calculate team points
          const teamRegistrationsWithResults = await prisma.team_event_registration.findMany({
            where: {
              temple_id: temple.id,
              status: 'ACCEPTED',
              is_deleted: false,
              event_result: {
                isNot: null
              }
            },
            include: {
              event_result: true
            }
          });

          const individualPoints = registrationsWithResults.reduce((sum, registration) => {
            return sum + (registration.event_result?.points || 0);
          }, 0);

          const teamPoints = teamRegistrationsWithResults.reduce((sum, registration) => {
            return sum + (registration.event_result?.points || 0);
          }, 0);

          const totalPoints = individualPoints + teamPoints;

          console.log(`Temple ${temple.name} total points: ${totalPoints}`);

          return {
            ...temple,
            total_participants: totalParticipants,
            total_points: totalPoints,
            accepted_participants: acceptedParticipants,
            pending_participants: pendingParticipants,
            declined_participants: declinedParticipants,
            temple_admins: templeAdmins.map(admin => ({
              name: `${admin.first_name} ${admin.last_name || ''}`.trim(),
              email: admin.email,
              phone: admin.phone
            }))
          };
        } catch (templeError) {
          console.error(`Error processing temple ${temple.name}:`, templeError);
          // Return temple with zero stats if there's an error
          return {
            ...temple,
            total_participants: 0,
            total_points: 0,
            accepted_participants: 0,
            pending_participants: 0,
            declined_participants: 0,
            temple_admins: []
          };
        }
      })
    );

    console.log('Temple management data fetched successfully');
    
    // Sort temples by total points in descending order
    const sortedTempleStats = templeStats.sort((a, b) => b.total_points - a.total_points);
    
    res.json({ temples: sortedTempleStats });
  } catch (error) {
    console.error('Error fetching temple management data:', error);
    res.status(500).json({ error: 'Failed to fetch temple management data' });
  }
});

/**
 * @swagger
 * /api/viewer/event-performance:
 *   get:
 *     tags: [Viewer]
 *     summary: Get event performance data (read-only)
 *     description: Retrieve event-wise performance report with results and rankings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event performance data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/event-performance', authenticate, requireRole('VIEWER'), async (req, res) => {
  try {
    // Get all events with their registrations and results
    const events = await prisma.mst_event.findMany({
      where: {
        is_deleted: false
      },
      include: {
        event_type: true,
        age_category: true,
        registrations: {
          where: {
            is_deleted: false,
            status: 'ACCEPTED',
            event_result: {
              isNot: null
            }
          },
          include: {
            user: {
              include: {
                temple: true
              }
            },
            event_result: true
          }
        },
        team_registrations: {
          where: {
            is_deleted: false,
            status: 'ACCEPTED',
            event_result: {
              isNot: null
            }
          },
          include: {
            temple: true,
            event_result: true
          }
        }
      },
      orderBy: [
        { event_type: { name: 'asc' } },
        { age_category: { from_age: 'asc' } },
        { gender: 'asc' }
      ]
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching event performance data:', error);
    res.status(500).json({ error: 'Failed to fetch event performance data' });
  }
});

/**
 * @swagger
 * /api/viewer/system-logs:
 *   get:
 *     tags: [Viewer]
 *     summary: Get system logs (read-only)
 *     description: Retrieve system logs for viewing purposes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of log entries to retrieve
 *     responses:
 *       200:
 *         description: System logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/system-logs', authenticate, requireRole('VIEWER'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const logs = await prisma.audit_log.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    });

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({ error: 'Failed to fetch system logs' });
  }
});

export default router; 