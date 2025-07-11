import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @swagger
 * /api/admin/verify-access:
 *   get:
 *     tags: [Admin]
 *     summary: Verify admin access
 *     description: Verify that the current user has SUPER_USER privileges
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
router.get('/verify-access', authenticate, requireRole('SUPER_USER'), (req, res) => {
  res.json({
    message: 'Admin access verified',
    user: {
      id: req.user.id,
      role: req.user.role,
      temple_id: req.user.temple_id
    }
  });
});

/**
 * @swagger
 * /api/admin/dashboard-stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard statistics
 *     description: Get statistics for the admin dashboard
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
router.get('/dashboard-stats', authenticate, requireRole('SUPER_USER'), async (req, res) => {
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
 * /api/admin/profiles/details:
 *   get:
 *     tags: [Admin]
 *     summary: Get profile details by IDs
 *     description: Retrieve profile details for multiple profile IDs (for team members)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of profile IDs
 *     responses:
 *       200:
 *         description: Profile details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/profiles/details', authenticate, requireRole('SUPER_USER'), async (req, res) => {
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
 * /api/admin/users/details:
 *   get:
 *     tags: [Admin]
 *     summary: Get user details by IDs
 *     description: Retrieve user details for multiple user IDs (for team members)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of user IDs
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/users/details', authenticate, requireRole('SUPER_USER'), async (req, res) => {
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
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users
 *     description: Retrieve all users with their profiles and roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for username, email, or name
 *       - in: query
 *         name: role
 *         schema:
 *           type: integer
 *         description: Filter by role ID
 *       - in: query
 *         name: temple
 *         schema:
 *           type: integer
 *         description: Filter by temple ID
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                       profile:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           first_name:
 *                             type: string
 *                           last_name:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           aadhar_number:
 *                             type: string
 *                           dob:
 *                             type: string
 *                           gender:
 *                             type: string
 *                           temple:
 *                             type: object
 *                           role:
 *                             type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/users', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const roleFilter = req.query.role ? parseInt(req.query.role) : null;
    const templeFilter = req.query.temple ? parseInt(req.query.temple) : null;

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      profile: {
        is_deleted: false
      }
    };

    if (search) {
      whereClause.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { 
          OR: [
            { first_name: { contains: search, mode: 'insensitive' } },
            { last_name: { contains: search, mode: 'insensitive' } },
            { aadhar_number: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ];
    }

    if (roleFilter) {
      whereClause.profile.role_id = roleFilter;
    }

    if (templeFilter) {
      whereClause.profile.temple_id = templeFilter;
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          profile: {
            include: {
              temple: true,
              role: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/users/:id', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/update-role:
 *   put:
 *     tags: [Admin]
 *     summary: Update user role
 *     description: Update the role of a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_id
 *             properties:
 *               role_id:
 *                 type: integer
 *                 description: New role ID
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.put('/users/:id/update-role', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role_id } = req.body;

    if (!role_id || ![1, 2, 3, 4].includes(role_id)) {
      return res.status(400).json({ error: 'Invalid role ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.profile) {
      return res.status(400).json({ error: 'User profile not found' });
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: user.profile.id },
      data: { role_id },
      include: {
        role: true
      }
    });

    // Log the role update in audit_log
    await prisma.audit_log.create({
      data: {
        user_id: req.user.id,
        action: 'UPDATE_USER_ROLE',
        table_name: 'Profile',
        record_id: updatedProfile.id,
        old_value: JSON.stringify({ role_id: user.profile.role_id }),
        new_value: JSON.stringify({ role_id })
      }
    });

    res.json({
      message: 'User role updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * @swagger
 * /api/admin/roles:
 *   get:
 *     tags: [Admin]
 *     summary: Get all roles
 *     description: Retrieve all available roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
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
 *                   description:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/roles', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const roles = await prisma.mst_role.findMany({
      orderBy: { id: 'asc' }
    });

    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

/**
 * @swagger
 * /api/admin/temples:
 *   get:
 *     tags: [Admin]
 *     summary: Get all temples
 *     description: Retrieve all temples for filtering
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
router.get('/temples', authenticate, requireRole('SUPER_USER'), async (req, res) => {
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
 * /api/admin/temple-management:
 *   get:
 *     tags: [Admin]
 *     summary: Get temple management data
 *     description: Retrieve all temples with their statistics and participant counts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Temple management data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 temples:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       address:
 *                         type: string
 *                       contact_name:
 *                         type: string
 *                       contact_phone:
 *                         type: string
 *                       total_participants:
 *                         type: integer
 *                       total_points:
 *                         type: integer
 *                       accepted_participants:
 *                         type: integer
 *                       pending_participants:
 *                         type: integer
 *                       declined_participants:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/temple-management', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    console.log('Fetching temple management data...');
    
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
          
          // Get temple admin contact information
          const templeAdmin = await prisma.profile.findFirst({
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
                is_deleted: false
              }
            }),
            prisma.ind_event_registration.count({
              where: {
                user: { temple_id: temple.id },
                status: 'ACCEPTED',
                is_deleted: false
              }
            }),
            prisma.ind_event_registration.count({
              where: {
                user: { temple_id: temple.id },
                status: 'PENDING',
                is_deleted: false
              }
            }),
            prisma.ind_event_registration.count({
              where: {
                user: { temple_id: temple.id },
                status: 'DECLINED',
                is_deleted: false
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
            temple_admin: templeAdmin ? {
              name: `${templeAdmin.first_name} ${templeAdmin.last_name || ''}`.trim(),
              email: templeAdmin.email,
              phone: templeAdmin.phone
            } : null
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
            temple_admin: null
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
 * /api/admin/participants:
 *   get:
 *     tags: [Admin]
 *     summary: Get all participants
 *     description: Retrieve all participants across all temples with filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: event_ids
 *         schema:
 *           type: string
 *         description: Comma-separated list of event IDs
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, DECLINED]
 *         description: Filter by registration status
 *       - in: query
 *         name: temple_id
 *         schema:
 *           type: integer
 *         description: Filter by temple ID
 *     responses:
 *       200:
 *         description: Participants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   status:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       gender:
 *                         type: string
 *                       dob:
 *                         type: string
 *                       temple:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                   event:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       age_category:
 *                         type: string
 *                       gender:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/participants', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const { event_ids, status, temple_id } = req.query;
    
    console.log('Admin participants request:', { event_ids, status, temple_id });

    // Build where clause
    const where = {
      is_deleted: false
    };

    // Add event filter
    if (event_ids) {
      const eventIdArray = event_ids.split(',').map(id => parseInt(id));
      where.event_id = {
        in: eventIdArray
      };
    }

    // Add status filter
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Add temple filter
    if (temple_id && temple_id !== 'ALL') {
      where.user = {
        temple_id: parseInt(temple_id)
      };
    }

    console.log('Query where clause:', JSON.stringify(where, null, 2));

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

    console.log('Found participants:', participants.length);

    // Transform the data to include event name from event_type
    const transformedParticipants = participants.map(participant => ({
      ...participant,
      event: {
        ...participant.event,
        name: participant.event.event_type.name
      }
    }));

    console.log('Transformed participants:', transformedParticipants.length);
    res.json(transformedParticipants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

/**
 * @swagger
 * /api/admin/teams:
 *   get:
 *     tags: [Admin]
 *     summary: Get all teams
 *     description: Retrieve all teams with their details and member counts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of teams per page
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teams:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                       status:
 *                         type: string
 *                       temple:
 *                         type: object
 *                       event:
 *                         type: object
 *                       member_count:
 *                         type: integer
 *                       team_members:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             participant:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 name:
 *                                   type: string
 *                                 aadhar_number:
 *                                   type: string
 *                       event_result:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           points:
 *                             type: integer
 *                           rank:
 *                             type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/teams', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const { page = 1, limit = 10, temple_id, event_id, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
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
          include: {
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
      skip: offset,
      take: parseInt(limit),
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

    const total = await prisma.team_event_registration.count({ where: whereClause });

    res.json({
      teams: teamsWithMemberCount,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_count: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

/**
 * @swagger
 * /api/admin/events:
 *   get:
 *     tags: [Admin]
 *     summary: Get all events
 *     description: Retrieve all events with their details organized by age category and gender
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
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       event_type:
 *                         type: object
 *                       age_category:
 *                         type: object
 *                       gender:
 *                         type: string
 *                       is_closed:
 *                         type: boolean
 *                       registrations_count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/events', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const events = await prisma.mst_event.findMany({
      where: { is_deleted: false },
      include: {
        event_type: true,
        age_category: true,
        registrations: {
          where: { is_deleted: false }
        }
      },
      orderBy: [
        { age_category: { from_age: 'asc' } },
        { gender: 'asc' },
        { event_type: { name: 'asc' } }
      ]
    });

    // Transform events to include registration count
    const transformedEvents = events.map(event => ({
      id: event.id,
      name: event.event_type.name,
      event_type: event.event_type,
      age_category: event.age_category,
      gender: event.gender,
      is_closed: event.is_closed,
      registrations_count: event.registrations.length
    }));

    res.json({ events: transformedEvents });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * @swagger
 * /api/admin/participants/{registrationId}/update-status:
 *   put:
 *     tags: [Admin]
 *     summary: Update participant registration status
 *     description: Update the registration status of a participant (SUPER_USER only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Registration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, ACCEPTED, DECLINED]
 *                 description: New registration status
 *     responses:
 *       200:
 *         description: Registration status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Registration not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.put('/participants/:registrationId/update-status', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const registrationId = parseInt(req.params.registrationId);
    const { status } = req.body;

    console.log('Admin updating registration status:', { registrationId, status });

    if (!status || !['PENDING', 'ACCEPTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: PENDING, ACCEPTED, DECLINED' });
    }

    // Get the registration details
    const registration = await prisma.ind_event_registration.findUnique({
      where: { id: registrationId },
      include: {
        user: {
          select: { temple_id: true }
        }
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    console.log('Found registration:', registration);

    // Update the registration status
    const updatedRegistration = await prisma.ind_event_registration.update({
      where: { id: registrationId },
      data: { status },
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
            event_type: true
          }
        }
      }
    });

    // Log the action in audit_log
    await prisma.audit_log.create({
      data: {
        user_id: req.user.id,
        action: 'UPDATE_REGISTRATION_STATUS',
        table_name: 'Ind_event_registration',
        record_id: registrationId,
        old_value: JSON.stringify({ status: registration.status }),
        new_value: JSON.stringify({ status })
      }
    });

    console.log('Registration updated successfully:', updatedRegistration);

    res.json({
      message: 'Registration status updated successfully',
      registration: updatedRegistration
    });
  } catch (error) {
    console.error('Error updating registration status:', error);
    res.status(500).json({ error: 'Failed to update registration status' });
  }
});

export default router; 