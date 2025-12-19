import express from 'express';
import { body, validationResult } from 'express-validator';
import * as eventService from '../services/eventService.js';
import * as systemService from '../services/systemService.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import prisma from '../utils/prismaClient.js';

const router = express.Router();

// Test route to verify middleware is working
router.get('/test-auth', authenticate, requireRole('TEMPLE_ADMIN'), (req, res) => {
  console.log('Test route accessed successfully');
  res.json({ message: 'Authentication and authorization working', user: req.user });
});

//Individual event registration
router.post('/register-participant', authenticate, [
  body('event_id').isInt().withMessage('Invalid event ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  
  const user_id = req.user.id; // Get user ID from authenticated user (token)
  const { event_id } = req.body;
  console.log("user id from req", req.user)
  console.log('Registration attempt:', { user_id: req.user.id, event_id});

  try {
    const registration = await eventService.registerParticipant(req.user.id, event_id, req.user.temple_id);
    console.log('Registration successful:', registration);
    res.status(201).json(registration);
  } catch (error) {
    console.error('Registration error:', {
      error: error.message,
      stack: error.stack,
      user_id,
      event_id,
      auth_user: req.user
    });

    if (error.message.includes('other temples')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('registration closed') || error.message.includes('last date')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

/**
 * @swagger
 * /events/unregister-participant/{eventId}:
 *   delete:
 *     summary: Cancel participant registration for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Registration cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Server error
 */
router.delete('/unregister-participant/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id; // Get user ID from authenticated user
    
    if (!eventId || isNaN(parseInt(eventId))) {
      return res.status(400).json({ error: 'Valid event ID is required' });
    }

    const result = await eventService.unregisterParticipant(userId, parseInt(eventId));
    res.json(result);
  } catch (error) {
    console.error('Unregistration error:', {
      error: error.message,
      stack: error.stack,
      eventId: req.params.eventId,
      userId: req.user.id
    });

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('cancellation closed') || error.message.includes('deadline')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to cancel registration' });
  }
});

router.post('/register-team', authenticate, requireRole('TEMPLE_ADMIN'), [
  body('temple_id').isInt().withMessage('Invalid temple ID'),
  body('event_id').isInt().withMessage('Invalid event ID'),
  body('member_user_ids').isArray().withMessage('Member user IDs must be an array')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { temple_id, event_id, member_user_ids } = req.body;
  try {
    const registration = await eventService.registerTeamEvent(temple_id, event_id, member_user_ids);
    res.status(201).json(registration);
  } catch (error) {
    console.error('Team registration error:', error);
    if (error.message.includes('other temples') || error.message.includes('same temple')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('already registered')) {
      return res.status(409).json({ error: error.message });
    }
    if (error.message.includes('registration closed') || error.message.includes('last date')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Team registration failed' });
  }
});

router.post('/update-result', authenticate, requireRole('STAFF'), [
  body('event_id').isInt().withMessage('Invalid event ID'),
  body('result_id').isInt().withMessage('Invalid result ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { event_id, result_id } = req.body;
  try {
    const updatedEvent = await eventService.updateEventResult(event_id, result_id, req.user.id);
    res.json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Result update failed' });
  }
});

// Registration status management
router.post('/update-registration-status', authenticate, requireRole('TEMPLE_ADMIN'), [
  body('registration_id').isInt().withMessage('Invalid registration ID'),
  body('status').isIn(['PENDING', 'APPROVED', 'REJECTED']).withMessage('Invalid status')
], async (req, res) => {
  console.log('update-registration-status route called by user:', req.user);
  console.log('Request body:', req.body);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  const { registration_id, status } = req.body;
  try {
    const updatedRegistration = await eventService.updateRegistrationStatus(registration_id, status, req.user.id);
    res.json(updatedRegistration);
  } catch (error) {
    console.error('Error updating registration status:', error);
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('deadline has passed') || error.message.includes('last date')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to update registration status' });
  }
});

// Get temple participants
router.get('/temple-participants', authenticate, requireRole(2), async (req, res) => {
  try {
    const { event_ids, status } = req.query;

    if (!req.user.temple_id) {
      console.error('No temple_id found in user object');
      return res.status(400).json({ error: 'User is not associated with any temple' });
    }

    // Convert event_ids string to array
    const eventIdArray = event_ids ? event_ids.split(',').map(id => parseInt(id)) : [];

    console.log('Fetching participants for events:', eventIdArray);

    const participants = await eventService.getTempleParticipants(req.user.temple_id, {
      event_ids: eventIdArray,
      status: status
    });

    res.json(participants);
  } catch (error) {
    console.error('Error in /temple-participants route:', error);
    res.status(500).json({ error: error.message });
  }
});

// List temple teams
router.get('/temple-teams', authenticate, requireRole(2), async (req, res) => {
  try {
    console.log('temple-teams route called by user:', req.user);
    
    if (!req.user.temple_id) {
      console.error('No temple_id found in user object');
      return res.status(400).json({ error: 'User is not associated with any temple' });
    }

    const filters = {
      event_id: req.query.event_id ? parseInt(req.query.event_id) : undefined
    };
    
    console.log('Fetching teams for temple:', req.user.temple_id, 'with filters:', filters);
    
    const teams = await eventService.getTempleTeams(req.user.temple_id, filters);
    console.log('Successfully fetched teams:', teams.length);
    res.json(teams);
  } catch (error) {
    console.error('Error in /temple-teams route:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch teams' });
  }
});

/**
 * @swagger
 * /api/events/delete-team/{registrationId}:
 *   delete:
 *     tags: [Events]
 *     summary: Delete a team registration
 *     description: Soft delete a team registration (Temple Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team registration ID to delete
 *     responses:
 *       200:
 *         description: Team registration deleted successfully
 *       400:
 *         description: Invalid registration ID
 *       403:
 *         description: Not authorized to delete this registration
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Server error
 */
router.delete('/delete-team/:registrationId', authenticate, requireRole('TEMPLE_ADMIN'), async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    if (!registrationId || isNaN(parseInt(registrationId))) {
      return res.status(400).json({ error: 'Valid registration ID is required' });
    }

    const result = await eventService.deleteTeamRegistration(parseInt(registrationId), req.user.temple_id);
    res.json(result);
  } catch (error) {
    console.error('Error deleting team registration:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('own temple') || error.message.includes('only')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('deletion closed') || error.message.includes('last date')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to delete team registration' });
  }
});

/**
 * @swagger
 * /api/events/accept-team/{registrationId}:
 *   put:
 *     tags: [Events]
 *     summary: Accept a pending team registration
 *     description: Accept a PENDING team registration for mixed gender events (max 3 ACCEPTED teams allowed)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team registration ID to accept
 *     responses:
 *       200:
 *         description: Team registration accepted successfully
 *       400:
 *         description: Invalid registration ID or cannot accept more teams
 *       403:
 *         description: Not authorized or max teams reached
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Server error
 */
router.put('/accept-team/:registrationId', authenticate, requireRole('TEMPLE_ADMIN'), async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    if (!registrationId || isNaN(parseInt(registrationId))) {
      return res.status(400).json({ error: 'Valid registration ID is required' });
    }

    const result = await eventService.acceptTeamRegistration(parseInt(registrationId), req.user.temple_id);
    res.json(result);
  } catch (error) {
    console.error('Error accepting team registration:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('own temple') || error.message.includes('only') || error.message.includes('Maximum')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('PENDING') || error.message.includes('mixed gender')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to accept team registration' });
  }
});

/**
 * @swagger
 * /api/events/accepted-teams-count/{eventId}:
 *   get:
 *     tags: [Events]
 *     summary: Get count of accepted teams for an event
 *     description: Returns the count of ACCEPTED team registrations for a specific event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Count retrieved successfully
 *       400:
 *         description: Invalid event ID
 *       500:
 *         description: Server error
 */
router.get('/accepted-teams-count/:eventId', authenticate, requireRole('TEMPLE_ADMIN'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId || isNaN(parseInt(eventId))) {
      return res.status(400).json({ error: 'Valid event ID is required' });
    }

    const count = await eventService.getAcceptedTeamsCount(req.user.temple_id, parseInt(eventId));
    res.json({ count });
  } catch (error) {
    console.error('Error getting accepted teams count:', error);
    res.status(500).json({ error: error.message || 'Failed to get accepted teams count' });
  }
});

// Generate temple report
router.get('/temple-report', authenticate, requireRole('TEMPLE_ADMIN'), async (req, res) => {
  try {
    const report = await eventService.generateTempleReport(req.user.temple_id);
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get age categories
// router.get('/age-categories', authenticate, async (req, res) => {
//   try {
//     const ageCategories = await eventService.getAgeCategories();
//     res.json(ageCategories);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to fetch age categories' });
//   }
// });

// Get gender options

// router.get('/gender-options', authenticate, async (req, res) => {
//   try {
//     // Hardcoded gender options since there's no gender table
//     const genderOptions = [
//       { id: 1, name: 'Male', value: 'M' },
//       { id: 2, name: 'Female', value: 'F' }
//     ];
//     res.json(genderOptions);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to fetch gender options' });
//   }
// });

// Get events by age category
// router.get('/by-age-category/:ageCategory', authenticate, async (req, res) => {
//   try {
//     const { ageCategory } = req.params;
//     const { gender } = req.query;
//     const events = await eventService.getEventsByAgeCategory(ageCategory, gender);
//     res.json(events);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to fetch events' });
//   }
// });

// Get combined temple participant data (age categories, gender options, and events)
router.get('/participant-data', authenticate, async (req, res) => {
  try {
    const { ageCategory = 'All', gender = 'ALL' } = req.query;
    
    console.log('Participant data request:', { ageCategory, gender });

    // Get age categories
    const ageCategories = await eventService.getAgeCategories();

    // Hardcoded gender options
    const genderOptions = [
      { id: 1, name: 'Male', value: 'MALE' },
      { id: 2, name: 'Female', value: 'FEMALE' },
      { id: 3, name: 'ALL', value: 'ALL' }
    ];

    // Get events based on filters
    const events = await eventService.getEventsByAgeCategory(ageCategory, gender);

    console.log('Participant data response:', {
      ageCategoriesCount: ageCategories.length,
      genderOptionsCount: genderOptions.length,
      eventsCount: events.length
    });

    res.json({
      ageCategories,
      genderOptions,
      events
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch temple participant data' });
  }
});

// Get team events
router.get('/team-events', authenticate, async (req, res) => {
  try {
    const events = await eventService.getTeamEvents();
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch team events' });
  }
});

// Update team registration
router.put('/update-team/:registrationId', authenticate, requireRole('TEMPLE_ADMIN'), [
  body('member_user_ids').isArray().withMessage('Member user IDs must be an array')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { registrationId } = req.params;
  const { member_user_ids } = req.body;
  
  try {
    const updatedRegistration = await eventService.updateTeamRegistration(parseInt(registrationId), member_user_ids, req.user.id);
    res.json(updatedRegistration);
  } catch (error) {
    console.error('Team update error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('update closed') || error.message.includes('last date')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Team update failed' });
  }
});

// Get temple's registered teams
router.get('/temple-teams', authenticate, requireRole('TEMPLE_ADMIN'), async (req, res) => {
  try {
    const teams = await eventService.getTempleTeams(req.user.temple_id);
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

/**
 * @swagger
 * /api/events/event-participants/{eventId}:
 *   get:
 *     tags: [Events]
 *     summary: Get participants for a specific event
 *     description: Retrieve all participants (individual and team) registered for a specific event
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the event
 *     responses:
 *       200:
 *         description: Event participants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Registration ID
 *                   registration_type:
 *                     type: string
 *                     enum: [INDIVIDUAL, TEAM]
 *                     description: Type of registration
 *                   participant_name:
 *                     type: string
 *                     description: Name of individual participant (for individual events)
 *                   team_name:
 *                     type: string
 *                     description: Name of team (for team events)
 *                   temple_name:
 *                     type: string
 *                     description: Temple name
 *                   age_category:
 *                     type: string
 *                     description: Age category name
 *                   gender:
 *                     type: string
 *                     description: Gender
 *                   phone:
 *                     type: string
 *                     description: Phone number (for individual participants)
 *                   aadhar_number:
 *                     type: string
 *                     description: Aadhaar number (for individual participants)
 *                   member_count:
 *                     type: integer
 *                     description: Number of team members (for team events)
 *                   registration_status:
 *                     type: string
 *                     description: Registration status
 *                   result:
 *                     type: object
 *                     description: Event result if available
 *                   registered_at:
 *                     type: string
 *                     format: date-time
 *                     description: Registration timestamp
 *       400:
 *         description: Invalid event ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
// Get participants for a specific event
router.get('/event-participants/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId || isNaN(parseInt(eventId))) {
      return res.status(400).json({ error: 'Valid event ID is required' });
    }

    const participants = await eventService.getEventParticipants(parseInt(eventId));
    res.json(participants);
  } catch (error) {
    console.error('Error fetching event participants:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch event participants' });
  }
});

/**
 * @swagger
 * /api/events/team-participants/{registrationId}:
 *   get:
 *     tags: [Events]
 *     summary: Get team participants for a specific registration
 *     description: Retrieve all team members for a specific team registration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team registration ID
 *     responses:
 *       200:
 *         description: Team participants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *                   aadhar_number:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *       400:
 *         description: Invalid registration ID
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Server error
 */
// Get team participants for a specific registration
router.get('/team-participants/:registrationId', authenticate, async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    if (!registrationId || isNaN(parseInt(registrationId))) {
      return res.status(400).json({ error: 'Valid registration ID is required' });
    }

    const participants = await eventService.getTeamParticipants(parseInt(registrationId));
    res.json(participants);
  } catch (error) {
    console.error('Error fetching team participants:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch team participants' });
  }
});

// Get team registration details including result
router.get('/team-registration/:registrationId', authenticate, async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    if (!registrationId || isNaN(parseInt(registrationId))) {
      return res.status(400).json({ error: 'Valid registration ID is required' });
    }

    const registration = await eventService.getTeamRegistrationDetails(parseInt(registrationId));
    res.json(registration);
  } catch (error) {
    console.error('Error fetching team registration details:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch team registration details' });
  }
});

/**
 * @swagger
 * /events/batch-team-data:
 *   post:
 *     summary: Batch fetch team registrations and participants for multiple registration IDs
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               registration_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Batch team data retrieved successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/batch-team-data', authenticate, async (req, res) => {
  try {
    const { registration_ids } = req.body;
    
    if (!registration_ids || !Array.isArray(registration_ids) || registration_ids.length === 0) {
      return res.status(400).json({ error: 'Valid registration IDs array is required' });
    }

    const batchData = await eventService.getBatchTeamData(registration_ids);
    res.json(batchData);
  } catch (error) {
    console.error('Error fetching batch team data:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch batch team data' });
  }
});

/**
 * @swagger
 * /events/all-events:
 *   get:
 *     summary: Get all events with complete details
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/all-events', authenticate, async (req, res) => {
  try {
    const events = await prisma.mst_event.findMany({
      where: { is_deleted: false },
      include: {
        event_type: true,
        age_category: true,
        schedules: {
          where: { is_deleted: false },
          orderBy: { start_time: 'asc' },
          take: 1
        },
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
        { event_type: { type: 'asc' } },
        { age_category: { from_age: 'asc' } },
        { gender: 'asc' },
        { event_type: { name: 'asc' } }
      ]
    });

    // Transform events to include registration counts and categorize
    const transformedEvents = events.map(event => {
      // Check if any individual registration has results
      const hasIndividualResults = event.registrations.some(reg => reg.event_result_id !== null);
      // Check if any team registration has results
      const hasTeamResults = event.team_registrations.some(reg => reg.event_result_id !== null);
      // Event has results if either individual or team registrations have results
      const has_results = hasIndividualResults || hasTeamResults;
      // Get the first schedule's start_time if available
      const start_time = event.schedules?.[0]?.start_time || null;

      return {
        id: event.id,
        name: event.event_type.name,
        event_type: event.event_type,
        age_category: event.age_category,
        gender: event.gender,
        is_closed: event.is_closed,
        participant_count: event.event_type.participant_count,
        registrations_count: event.registrations.length,
        team_registrations_count: event.team_registrations.length,
        total_registrations: event.registrations.length + event.team_registrations.length,
        has_results: has_results,
        start_time: start_time
      };
    });

    // Separate individual and team events
    const individualEvents = transformedEvents.filter(event => event.event_type.type === 'INDIVIDUAL');
    const teamEvents = transformedEvents.filter(event => event.event_type.type === 'TEAM');

    res.json({ 
      individual: individualEvents,
      team: teamEvents,
      total: transformedEvents.length
    });
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Debug route to check database structure
router.get('/debug-event/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId || isNaN(parseInt(eventId))) {
      return res.status(400).json({ error: 'Valid event ID is required' });
    }

    // Check the event
    const event = await prisma.mst_event.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        event_type: true,
        age_category: true
      }
    });

    // Check individual registrations
    const individualRegistrations = await prisma.ind_event_registration.findMany({
      where: { event_id: parseInt(eventId) },
      include: {
        user: true
      }
    });

    // Check team registrations
    const teamRegistrations = await prisma.team_event_registration.findMany({
      where: { event_id: parseInt(eventId) },
      include: {
        temple: true
      }
    });

    res.json({
      event,
      individualRegistrations: {
        count: individualRegistrations.length,
        data: individualRegistrations
      },
      teamRegistrations: {
        count: teamRegistrations.length,
        data: teamRegistrations
      }
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update individual event result
router.put('/update-individual-result/:registrationId', authenticate, requireRole([2, 3]), [
  body('rank').optional().isIn(['FIRST', 'SECOND', 'THIRD', 'CLEAR']).withMessage('Invalid rank')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { registrationId } = req.params;
  const { rank } = req.body;
  
  try {
    const updatedRegistration = await eventService.updateIndividualEventResult(
      parseInt(registrationId), 
      rank, 
      req.user.id
    );
    res.json(updatedRegistration);
  } catch (error) {
    console.error('Individual result update error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Individual result update failed' });
  }
});

// Update team event result
router.put('/update-team-result/:registrationId', authenticate, requireRole([2, 3]), [
  body('rank').optional().isIn(['FIRST', 'SECOND', 'THIRD', 'CLEAR']).withMessage('Invalid rank')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { registrationId } = req.params;
  const { rank } = req.body;
  
  try {
    const updatedRegistration = await eventService.updateTeamEventResult(
      parseInt(registrationId), 
      rank, 
      req.user.id
    );
    res.json(updatedRegistration);
  } catch (error) {
    console.error('Team result update error:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Team result update failed' });
  }
});

// Generate heats for running events
router.post('/generate-heats', authenticate, requireRole('ADMIN'), [
  body('event_id').isInt().withMessage('Invalid event ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { event_id } = req.body;

  // Fetch lane count from settings (create with default if not exists)
  let lane_count;
  try {
    const laneCountSetting = await systemService.ensureSystemSetting('lane_count', 8);
    lane_count = laneCountSetting.value;
  } catch (error) {
    console.error('Error fetching lane count setting:', error);
    return res.status(500).json({ error: 'Failed to fetch lane count setting' });
  }

  try {
    // Check if event is a running event (100m or 200m)
    const event = await prisma.mst_event.findUnique({
      where: { id: event_id },
      include: {
        event_type: true,
        registrations: {
          where: { status: 'ACCEPTED' },
          include: {
            user: {
              include: { temple: true }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventName = event.event_type.name.toLowerCase();
    if (!eventName.includes('running - 100 mts') && !eventName.includes('running - 200 mts')) {
      return res.status(400).json({ error: 'Heat generation is only available for Running 100m and 200m events' });
    }

    // Check if heats already exist
    const existingHeats = await prisma.event_performance.findMany({
      where: { event_id },
      select: { heat_number: true }
    });

    if (existingHeats.length > 0) {
      return res.status(400).json({ error: 'Heats already generated for this event' });
    }

    const participants = event.registrations.map(reg => ({
      id: reg.id,
      participant_name: reg.user.first_name + ' ' + (reg.user.last_name || ''),
      temple_name: reg.user.temple.name,
      temple_id: reg.user.temple_id,
      aadhar_number: reg.user.aadhar_number
    }));

    // Group participants by temple (required for separation logic)
    const templeGroups = {};
    participants.forEach(p => {
      const temple = p.temple_name;
      if (!templeGroups[temple]) {
        templeGroups[temple] = [];
      }
      templeGroups[temple].push(p);
    });

    const totalParticipants = participants.length;
    let heatSizes = []; // This will store the *target* size of each heat

    // =========================================================================
    // 1. HEAT SIZE CALCULATION (Using lane_count from settings)
    // =========================================================================
    
    if (totalParticipants <= lane_count) {
      // Single heat
      heatSizes.push(totalParticipants);
    } else if (totalParticipants < 16) {
      // Case 1: less than 2 complete heats
      let half = Math.floor(totalParticipants / 2);
      let remaining = totalParticipants - half;
      heatSizes.push(Math.max(half, remaining));
      heatSizes.push(Math.min(half, remaining));
    } else {
      // Case 2: more than 3 full heats possible
      let remaining = totalParticipants;

      // Add all full heats except the last few
      while (remaining > lane_count * 3) {
        heatSizes.push(lane_count);
        remaining -= lane_count;
      }

      // Distribute remaining participants equally
      let numHeatsLeft = Math.ceil(remaining / lane_count);
      let baseSize = Math.floor(remaining / numHeatsLeft);
      let extra = remaining % numHeatsLeft;

      for (let i = 0; i < numHeatsLeft; i++) {
        heatSizes.push(baseSize + (i < extra ? 1 : 0));
      }
    }

    // Initialize heat containers
    const heats = heatSizes.map((size, index) => ({
      id: index + 1,
      participants: [],
      laneCount: size // laneCount now reflects the *target* heat size
    }));

    // =========================================================================
    // 2. PARTICIPANT DISTRIBUTION (Temple Separation Logic)
    // =========================================================================

    // Check if we need temple separation (only if more than 1 heat)
    if (heats.length === 1) {
      // No temple separation needed - place all participants in single heat
      heats[0].participants = [...participants];
    } else {
      // Apply temple separation logic to ALL participants
      // Track how many participants from each temple are in each heat (globally)
      const templeCountsPerHeat = {};
      
      // Initialize temple counts for all temples
      Object.keys(templeGroups).forEach(temple => {
        templeCountsPerHeat[temple] = new Array(heats.length).fill(0);
      });
      
      // Sort participants by temple size (largest temples first for better distribution)
      const sortedParticipants = [...participants].sort((a, b) => {
        return templeGroups[b.temple_name].length - templeGroups[a.temple_name].length;
      });
      
      // Distribute each participant with temple separation
      sortedParticipants.forEach(participant => {
        const temple = participant.temple_name;
        const templeCounts = templeCountsPerHeat[temple];
        
        // Find the best heat for this participant
        let targetHeatIndex = -1;
        let minTempleCount = Infinity;
        let minTotalCount = Infinity;
        
        for (let i = 0; i < heats.length; i++) {
          // Check if heat has capacity
          if (heats[i].participants.length < heatSizes[i]) {
            const templeCount = templeCounts[i];
            const totalCount = heats[i].participants.length;
            
            // Priority 1: Prefer heats with fewer participants from same temple (separation)
            // Priority 2: If same temple count, prefer heats with fewer total participants (balance)
            if (templeCount < minTempleCount || 
                (templeCount === minTempleCount && totalCount < minTotalCount)) {
              minTempleCount = templeCount;
              minTotalCount = totalCount;
              targetHeatIndex = i;
            }
          }
        }
        
        // Place participant in the best available heat
        if (targetHeatIndex >= 0) {
          heats[targetHeatIndex].participants.push(participant);
          templeCounts[targetHeatIndex]++;
        }
      });
    }

    // Set final laneCount based on actual participants
    heats.forEach(heat => {
        heat.laneCount = heat.participants.length;
    });

    // Save heats to database
    const heatRecords = [];
    heats.forEach(heat => {
      heat.participants.forEach(participant => {
        heatRecords.push({
          year: new Date().getFullYear(),
          registration_id: participant.id,
          event_id: event_id,
          heat_number: heat.id,
          performance_1: null,
          performance_2: null,
          performance_3: null
        });
      });
    });

    await prisma.event_performance.createMany({
      data: heatRecords
    });

    res.json({
      message: 'Heats generated successfully with temple separation',
      heats: heats.map(heat => ({
        id: heat.id,
        participants: heat.participants.length,
        laneCount: heat.laneCount
      })),
      totalHeats: heats.length
    });

  } catch (error) {
    console.error('Error generating heats:', error);
    res.status(500).json({ error: error.message || 'Failed to generate heats' });
  }
});

// Initialize trial performances for trial events (no heats)
router.post('/init-trials', authenticate, requireRole('ADMIN'), [
  body('event_id').isInt().withMessage('Invalid event ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { event_id } = req.body;

  try {
    // Ensure records exist for all accepted participants
    await ensureTrialPerformanceRecords(event_id);

    // Count how many performance rows now exist for this event
    const count = await prisma.event_performance.count({ where: { event_id: event_id } });

    return res.json({ message: 'Trial performances initialized', event_id, count });
  } catch (error) {
    console.error('Error initializing trials:', error);
    return res.status(500).json({ error: error.message || 'Failed to initialize trial performances' });
  }
});

// Regenerate heats for running events (delete existing and allow regeneration)
router.delete('/regenerate-heats/:eventId', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if event exists and is a running event
    const event = await prisma.mst_event.findUnique({
      where: { id: parseInt(eventId) },
      include: { event_type: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventName = event.event_type.name.toLowerCase();
    if (!eventName.includes('running - 100 mts') && !eventName.includes('running - 200 mts')) {
      return res.status(400).json({ error: 'Heat regeneration is only available for Running 100m and 200m events' });
    }

    // Delete existing heats for this event
    await prisma.event_performance.deleteMany({
      where: { 
        event_id: parseInt(eventId),
        year: new Date().getFullYear()
      }
    });

    res.json({ message: 'Heats deleted successfully. You can now generate new heats.' });

  } catch (error) {
    console.error('Error regenerating heats:', error);
    res.status(500).json({ error: error.message || 'Failed to regenerate heats' });
  }
});

// Get heats for an event
router.get('/heats/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const currentYear = new Date().getFullYear();
    
    // Use raw query to handle schema differences
    let heats = [];
    try {
      // Try with new schema first
      heats = await prisma.$queryRawUnsafe(`
        SELECT ep.id, ep.registration_id, ep.event_id, ep.heat_number,
               ep.performance_1, ep.performance_2, ep.performance_3,
               ir.id as reg_id,
               u.first_name, u.last_name, u.aadhar_number, u.dob,
               t.name as temple_name,
               er.rank, er.points
        FROM event_performance ep
        INNER JOIN Ind_event_registration ir ON ep.registration_id = ir.id
        INNER JOIN Profile u ON ir.user_id = u.id
        INNER JOIN Mst_temple t ON u.temple_id = t.id
        LEFT JOIN Mst_event_result er ON ir.event_result_id = er.id
        WHERE ep.event_id = ? AND ep.year = ?
        ORDER BY ep.heat_number ASC, ep.id ASC
      `, parseInt(eventId), currentYear);
    } catch (error1) {
      // If that fails, try with old schema
      try {
        heats = await prisma.$queryRawUnsafe(`
          SELECT ep.id, ep.registration_id, ep.event_id, ep.heat_number,
                 ep.heat_time as performance_1,
                 NULL as performance_2,
                 NULL as performance_3,
                 ir.id as reg_id,
                 u.first_name, u.last_name, u.aadhar_number, u.dob,
                 t.name as temple_name,
                 er.rank, er.points
          FROM event_performance ep
          INNER JOIN Ind_event_registration ir ON ep.registration_id = ir.id
          INNER JOIN Profile u ON ir.user_id = u.id
          INNER JOIN Mst_temple t ON u.temple_id = t.id
          LEFT JOIN Mst_event_result er ON ir.event_result_id = er.id
          WHERE ep.event_id = ? AND ep.year = ?
          ORDER BY ep.heat_number ASC, ep.id ASC
        `, parseInt(eventId), currentYear);
      } catch (error2) {
        console.error('Error fetching heats with both schemas:', error2.message);
        return res.status(500).json({ error: 'Failed to fetch heats: ' + error2.message });
      }
    }

    // Group by heat number
    const groupedHeats = {};
    heats.forEach(heat => {
      const heatNumber = heat.heat_number;
      if (!groupedHeats[heatNumber]) {
        groupedHeats[heatNumber] = [];
      }
      
      groupedHeats[heatNumber].push({
        id: heat.reg_id,
        participant_name: (heat.first_name || '') + ' ' + (heat.last_name || ''),
        temple_name: heat.temple_name,
        aadhar_number: heat.aadhar_number,
        date_of_birth: heat.dob,
        performance_1: heat.performance_1,
        performance_2: heat.performance_2,
        performance_3: heat.performance_3,
        result: heat.rank ? {
          rank: heat.rank,
          points: heat.points
        } : null
      });
    });

    res.json(groupedHeats);

  } catch (error) {
    console.error('Error fetching heats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch heats' });
  }
});

// Update heat timings
router.put('/update-timings', authenticate, requireRole('STAFF'), [
  body('event_id').isInt().withMessage('Invalid event ID'),
  body('heat_number').isInt().withMessage('Invalid heat number'),
  body('timings').isArray().withMessage('Timings must be an array'),
  body('timings.*.registration_id').isInt().withMessage('Invalid registration ID'),
  body('timings.*.performance_1').optional().isString().withMessage('Performance 1 must be a string'),
  body('timings.*.performance_2').optional().isString().withMessage('Performance 2 must be a string'),
  body('timings.*.performance_3').optional().isString().withMessage('Performance 3 must be a string')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { event_id, heat_number, timings } = req.body;

  try {
    // Detect which schema is available
    const schema = await detectPerformanceSchema();
    console.log('Schema detection result for update-timings:', schema);
    
    if (schema === 'none') {
      return res.status(500).json({ 
        error: 'Database schema error: Performance columns are missing. Please run database migrations.' 
      });
    }
    
    // Safety check: if schema is 'new', treat it as 'new_raw' to always use raw SQL
    const effectiveSchema = schema === 'new' ? 'new_raw' : schema;

    // Helper function to parse timing values
    const parseTiming = (timingValue) => {
      // Handle null, undefined, or empty values
      if (timingValue === null || timingValue === undefined || timingValue === '') {
        return null;
      }
      
      // Convert to string and trim
      const stringValue = String(timingValue).trim();
      if (stringValue === '' || stringValue === 'null' || stringValue === 'undefined') {
        return null;
      }
      
      // Parse as float
      const parsedTime = parseFloat(stringValue);
      if (!isNaN(parsedTime) && parsedTime > 0) {
        return parsedTime;
      }
      
      // Return null for invalid values
      return null;
    };

    // Update timings for each participant - only update if timing has a valid value
    const updatePromises = timings.map(async (timing) => {
      // Parse all three performance values
      const performance1 = parseTiming(timing.performance_1);
      const performance2 = parseTiming(timing.performance_2);
      const performance3 = parseTiming(timing.performance_3);

      // Only update if we have at least one valid timing value
      if (performance1 !== null || performance2 !== null || performance3 !== null) {
        if (effectiveSchema === 'new' || effectiveSchema === 'new_raw') {
          // Use raw SQL for new schema (always use raw SQL to avoid Prisma client mismatch)
          // Database has new schema, but Prisma doesn't support it - use raw SQL
          const updates = [];
          const params = [];
          if (performance1 !== null) {
            updates.push('performance_1 = ?');
            params.push(performance1);
          }
          if (performance2 !== null) {
            updates.push('performance_2 = ?');
            params.push(performance2);
          }
          if (performance3 !== null) {
            updates.push('performance_3 = ?');
            params.push(performance3);
          }
          
          if (updates.length > 0) {
            params.push(event_id, heat_number, timing.registration_id);
            return await prisma.$executeRawUnsafe(`
              UPDATE event_performance
              SET ${updates.join(', ')}
              WHERE event_id = ? AND heat_number = ? AND registration_id = ?
            `, ...params);
          }
        } else if (effectiveSchema === 'old') {
          // Use old schema (heat_time) - only performance_1 maps to heat_time
          if (performance1 !== null) {
            return await prisma.$executeRawUnsafe(`
              UPDATE event_performance
              SET heat_time = ?
              WHERE event_id = ? AND heat_number = ? AND registration_id = ?
            `, performance1, event_id, heat_number, timing.registration_id);
          }
        }
      } else {
        // Return a resolved promise for invalid timings (don't update)
        return Promise.resolve();
      }
    });

    await Promise.all(updatePromises);

    res.json({ message: 'Timings updated successfully' });

  } catch (error) {
    console.error('Error saving timings:', error);
    res.status(500).json({ error: error.message || 'Failed to save timings' });
  }
});

// Update final heat timings (no heat_number required)
router.put('/update-final-timings', authenticate, requireRole('STAFF'), [
  body('event_id').isInt().withMessage('Invalid event ID'),
  body('timings').isArray().withMessage('Timings must be an array'),
  body('timings.*.registration_id').isInt().withMessage('Invalid registration ID'),
  body('timings.*.performance_1').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return typeof value === 'string' || typeof value === 'number';
  }).withMessage('Performance 1 must be a string or number'),
  body('timings.*.performance_2').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return typeof value === 'string' || typeof value === 'number';
  }).withMessage('Performance 2 must be a string or number'),
  body('timings.*.performance_3').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return typeof value === 'string' || typeof value === 'number';
  }).withMessage('Performance 3 must be a string or number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { event_id, timings } = req.body;

  try {
    // Detect which schema is available
    const schema = await detectPerformanceSchema();
    console.log('Schema detection result for update-final-timings:', schema);
    
    if (schema === 'none') {
      return res.status(500).json({ 
        error: 'Database schema error: Performance columns are missing. Please run database migrations.' 
      });
    }
    
    // Safety check: if schema is 'new', treat it as 'new_raw' to always use raw SQL
    const effectiveSchema = schema === 'new' ? 'new_raw' : schema;

    // Helper function to parse timing values
    const parseTiming = (timingValue) => {
      // Handle null, undefined, or empty values
      if (timingValue === null || timingValue === undefined || timingValue === '') {
        return null;
      }
      
      // Convert to string and trim
      const stringValue = String(timingValue).trim();
      if (stringValue === '' || stringValue === 'null' || stringValue === 'undefined') {
        return null;
      }
      
      // Parse as float
      const parsedTime = parseFloat(stringValue);
      if (!isNaN(parsedTime) && parsedTime > 0) {
        return parsedTime;
      }
      
      // Return null for invalid values
      return null;
    };

    // Update timings for each participant - only update if timing has a valid value
    const updatePromises = timings.map(async (timing) => {
      // Parse all three performance values
      const performance1 = parseTiming(timing.performance_1);
      const performance2 = parseTiming(timing.performance_2);
      const performance3 = parseTiming(timing.performance_3);

      // Only update if we have at least one valid timing value
      if (performance1 !== null || performance2 !== null || performance3 !== null) {
        if (effectiveSchema === 'new' || effectiveSchema === 'new_raw') {
          // Use raw SQL for new schema (always use raw SQL to avoid Prisma client mismatch)
          // Database has new schema, but Prisma doesn't support it - use raw SQL
          const updates = [];
          const params = [];
          if (performance1 !== null) {
            updates.push('performance_1 = ?');
            params.push(performance1);
          }
          if (performance2 !== null) {
            updates.push('performance_2 = ?');
            params.push(performance2);
          }
          if (performance3 !== null) {
            updates.push('performance_3 = ?');
            params.push(performance3);
          }
          
          if (updates.length > 0) {
            params.push(event_id, timing.registration_id);
            return await prisma.$executeRawUnsafe(`
              UPDATE event_performance
              SET ${updates.join(', ')}
              WHERE event_id = ? AND registration_id = ?
            `, ...params);
          }
        } else if (effectiveSchema === 'old') {
          // Use old schema (heat_time) - only performance_1 maps to heat_time
          if (performance1 !== null) {
            return await prisma.$executeRawUnsafe(`
              UPDATE event_performance
              SET heat_time = ?
              WHERE event_id = ? AND registration_id = ?
            `, performance1, event_id, timing.registration_id);
          }
        }
      } else {
        // Return a resolved promise for invalid timings (don't update)
        return Promise.resolve();
      }
    });

    await Promise.all(updatePromises);

    res.json({ message: 'Final heat timings updated successfully' });

  } catch (error) {
    console.error('Error saving final heat timings:', error);
    res.status(500).json({ error: error.message || 'Failed to save final heat timings' });
  }
});

// Helper function to detect which schema columns are available
// This checks both what Prisma client supports AND what the database has
async function detectPerformanceSchema() {
  try {
    // First, check what the database actually has using PRAGMA
    const tableInfo = await prisma.$queryRawUnsafe(`
      PRAGMA table_info(event_performance)
    `);
    
    const columnNames = tableInfo.map(col => col.name.toLowerCase());
    const dbHasNewSchema = columnNames.includes('performance_1') && 
                           columnNames.includes('performance_2') && 
                           columnNames.includes('performance_3');
    const dbHasOldSchema = columnNames.includes('heat_time');
    
    // Decision logic:
    // Since Prisma client might not be regenerated even if database has new columns,
    // we'll always use raw SQL when database has new schema columns to be safe.
    // This avoids issues where Prisma client doesn't match the actual database schema.
    // 1. If database has new schema -> always use raw SQL (new_raw) to be safe
    // 2. If database has old schema -> use old (with raw SQL)
    // 3. If neither exists -> return 'none'
    
    if (dbHasNewSchema) {
      // Always use raw SQL for new schema to avoid Prisma client mismatch issues
      console.log('Detected new schema (performance_1/2/3) - using raw SQL');
      return 'new_raw';
    } else if (dbHasOldSchema) {
      console.log('Detected old schema (heat_time) - using raw SQL');
      return 'old'; // Use old schema with raw SQL
    } else {
      console.error('Database schema error: Neither performance_1/2/3 nor heat_time columns exist');
      console.error('Available columns:', columnNames);
      return 'none';
    }
  } catch (error) {
    console.error('Error detecting schema:', error);
    // Fallback: try raw SQL queries
    try {
      await prisma.$queryRawUnsafe(`SELECT performance_1 FROM event_performance LIMIT 1`);
      return 'new_raw'; // Database has it, but use raw SQL
    } catch (newError) {
      if (newError.message && newError.message.includes('performance') || 
          newError.message && newError.message.includes('no such column')) {
        try {
          await prisma.$queryRawUnsafe(`SELECT heat_time FROM event_performance LIMIT 1`);
          return 'old';
        } catch (oldError) {
          if (oldError.message && (oldError.message.includes('heat_time') || 
              oldError.message.includes('no such column'))) {
            return 'none';
          }
          throw oldError;
        }
      }
      throw newError;
    }
  }
}

// Helper function to ensure trial performance records exist for all accepted participants
async function ensureTrialPerformanceRecords(eventId) {
  // Get all accepted participants for this event
  const acceptedParticipants = await prisma.ind_event_registration.findMany({
    where: {
      event_id: parseInt(eventId),
      is_deleted: false,
      status: 'ACCEPTED',
      year: new Date().getFullYear()
    },
    select: {
      id: true
    }
  });

  if (acceptedParticipants.length === 0) {
    console.log('No accepted participants found for event:', eventId);
    return;
  }

  // Check which participants already have performance records
  const existingRecords = await prisma.event_performance.findMany({
    where: {
      event_id: parseInt(eventId),
      registration_id: {
        in: acceptedParticipants.map(p => p.id)
      }
    },
    select: {
      registration_id: true
    }
  });

  const existingRegistrationIds = new Set(existingRecords.map(r => r.registration_id));
  
  // Create performance records for participants that don't have them
  const participantsToCreate = acceptedParticipants.filter(p => !existingRegistrationIds.has(p.id));

  if (participantsToCreate.length > 0) {
    console.log(`Creating ${participantsToCreate.length} trial performance records for event ${eventId}`);
    
    // Detect schema to use appropriate method
    const schema = await detectPerformanceSchema();
    const currentYear = new Date().getFullYear();
    
    if (schema === 'new' || schema === 'new_raw') {
      // Use raw SQL for new schema (always use raw SQL to avoid Prisma client mismatch)
      for (const participant of participantsToCreate) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO event_performance (year, registration_id, event_id, heat_number, performance_1, performance_2, performance_3, created_at, updated_at)
          VALUES (?, ?, ?, NULL, NULL, NULL, NULL, datetime('now'), datetime('now'))
        `, currentYear, participant.id, parseInt(eventId));
      }
    } else if (schema === 'old') {
      // Use raw SQL for old schema
      for (const participant of participantsToCreate) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO event_performance (year, registration_id, event_id, heat_number, heat_time, created_at, updated_at)
          VALUES (?, ?, ?, NULL, NULL, datetime('now'), datetime('now'))
        `, currentYear, participant.id, parseInt(eventId));
      }
    } else {
      throw new Error('Cannot create performance records: Database schema is inconsistent');
    }
  }
}

// Get trial measurements for trial events
router.get('/trials/:eventId', authenticate, requireRole('STAFF'), async (req, res) => {
  const { eventId } = req.params;

  try {
    // First ensure all accepted participants have performance records
    await ensureTrialPerformanceRecords(eventId);

    // Fetch trial performance data using raw query to handle schema differences
    let trialData = [];
    try {
      // Try with new schema first
      trialData = await prisma.$queryRawUnsafe(`
        SELECT registration_id, performance_1, performance_2, performance_3
        FROM event_performance
        WHERE event_id = ?
      `, parseInt(eventId));
    } catch (error1) {
      // If that fails, try with old schema
      try {
        trialData = await prisma.$queryRawUnsafe(`
          SELECT registration_id, 
                 heat_time as performance_1,
                 NULL as performance_2,
                 NULL as performance_3
          FROM event_performance
          WHERE event_id = ?
        `, parseInt(eventId));
      } catch (error2) {
        console.error('Error fetching trials with both schemas:', error2.message);
        return res.status(500).json({ error: 'Failed to fetch trials: ' + error2.message });
      }
    }

    // Convert to a more usable format
    const trialsMap = {};
    trialData.forEach(trial => {
      trialsMap[trial.registration_id] = {
        performance_1: trial.performance_1,
        performance_2: trial.performance_2,
        performance_3: trial.performance_3
      };
    });

    res.json(trialsMap);

  } catch (error) {
    console.error('Error fetching trials:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch trial measurements' });
  }
});

// Update trial measurements for trial events
router.put('/update-trials', authenticate, requireRole('STAFF'), [
  body('event_id').isInt().withMessage('Invalid event ID'),
  body('trials').isArray().withMessage('Trials must be an array'),
  body('trials.*.registration_id').isInt().withMessage('Invalid registration ID'),
  body('trials.*.performance_1').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return typeof value === 'string' || typeof value === 'number';
  }).withMessage('Performance 1 must be a string or number'),
  body('trials.*.performance_2').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return typeof value === 'string' || typeof value === 'number';
  }).withMessage('Performance 2 must be a string or number'),
  body('trials.*.performance_3').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return typeof value === 'string' || typeof value === 'number';
  }).withMessage('Performance 3 must be a string or number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { event_id, trials } = req.body;

  try {
    // Detect which schema is available
    const schema = await detectPerformanceSchema();
    console.log('Schema detection result for update-trials:', schema);
    
    if (schema === 'none') {
      return res.status(500).json({ 
        error: 'Database schema error: Performance columns are missing. Please run database migrations.' 
      });
    }
    
    // Safety check: if schema is 'new', treat it as 'new_raw' to always use raw SQL
    const effectiveSchema = schema === 'new' ? 'new_raw' : schema;

    // First ensure all accepted participants have performance records
    await ensureTrialPerformanceRecords(event_id);

    // Helper function to parse trial values
    const parseTrial = (trialValue) => {
      // Handle null, undefined, or empty values
      if (trialValue === null || trialValue === undefined || trialValue === '') {
        return null;
      }
      
      // Convert to string and trim
      const stringValue = String(trialValue).trim();
      if (stringValue === '' || stringValue === 'null' || stringValue === 'undefined') {
        return null;
      }
      
      // Parse as float
      const parsedTrial = parseFloat(stringValue);
      if (!isNaN(parsedTrial) && parsedTrial >= 0) {
        return parsedTrial;
      }
      
      // Return null for invalid values
      return null;
    };

    // Update trial measurements for each participant - only update if trial has a valid value
    const updatePromises = trials.map(async (trial) => {
      // Parse all three performance values
      const performance1 = parseTrial(trial.performance_1);
      const performance2 = parseTrial(trial.performance_2);
      const performance3 = parseTrial(trial.performance_3);

      // Only update if we have at least one valid trial value
      if (performance1 !== null || performance2 !== null || performance3 !== null) {
        if (effectiveSchema === 'new' || effectiveSchema === 'new_raw') {
          // Use raw SQL for new schema (always use raw SQL to avoid Prisma client mismatch)
          // Database has new schema, but Prisma doesn't support it - use raw SQL
          const updates = [];
          const params = [];
          if (performance1 !== null) {
            updates.push('performance_1 = ?');
            params.push(performance1);
          }
          if (performance2 !== null) {
            updates.push('performance_2 = ?');
            params.push(performance2);
          }
          if (performance3 !== null) {
            updates.push('performance_3 = ?');
            params.push(performance3);
          }
          
          if (updates.length > 0) {
            params.push(event_id, trial.registration_id);
            return await prisma.$executeRawUnsafe(`
              UPDATE event_performance
              SET ${updates.join(', ')}
              WHERE event_id = ? AND registration_id = ?
            `, ...params);
          }
        } else if (effectiveSchema === 'old') {
          // Use old schema (heat_time) - only performance_1 maps to heat_time
          // Note: Trials typically only use performance_1 in old schema
          if (performance1 !== null) {
            return await prisma.$executeRawUnsafe(`
              UPDATE event_performance
              SET heat_time = ?
              WHERE event_id = ? AND registration_id = ?
            `, performance1, event_id, trial.registration_id);
          }
        }
      } else {
        // Return a resolved promise for invalid trials (don't update)
        return Promise.resolve();
      }
    });

    await Promise.all(updatePromises);

    res.json({ message: 'Trial measurements updated successfully' });

  } catch (error) {
    console.error('Error saving trials:', error);
    res.status(500).json({ error: error.message || 'Failed to save trial measurements' });
  }
});

// Search users by Aadhar with age category and gender filtering for staff
router.get('/search-users-for-event/:eventId', authenticate, requireRole('STAFF'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { aadharNumber } = req.query;

    if (!aadharNumber || aadharNumber.length < 3) {
      return res.status(400).json({ error: 'Please enter at least 3 digits of Aadhar number' });
    }

    // Get the event details to determine age category and gender
    const event = await prisma.mst_event.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        age_category: true
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get age cutoff date from settings
    const ageCutoffSetting = await prisma.settings.findUnique({
      where: { name: 'AGE_CUTOFF_DATE' }
    });
    
    const cutoffDate = ageCutoffSetting?.value 
      ? new Date(ageCutoffSetting.value) 
      : new Date();

    // Search for users by Aadhar number (partial match)
    const users = await prisma.profile.findMany({
      where: {
        aadhar_number: {
          contains: aadharNumber
        },
        gender: event.gender,
        is_deleted: false
      },
      include: {
        temple: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 10
    });

    // Filter users by age category
    const { calculateAge, getAgeCategory } = await import('../utils/ageUtils.js');
    
    const filteredUsers = users.filter(user => {
      if (!user.dob) return false;
      const age = calculateAge(user.dob, cutoffDate);
      const userAgeCategory = getAgeCategory(age);
      return userAgeCategory === event.age_category.name;
    }).map(user => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name || ''}`.trim(),
      aadhar_number: user.aadhar_number,
      temple_id: user.temple_id,
      temple_name: user.temple?.name || 'Unknown',
      gender: user.gender,
      dob: user.dob
    }));

    res.json(filteredUsers);
  } catch (error) {
    console.error('Error searching users for event:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user's individual registration count
router.get('/user-registration-count/:userId', authenticate, requireRole('STAFF'), async (req, res) => {
  try {
    const { userId } = req.params;
    const currentYear = new Date().getFullYear();

    // Get all individual event registrations for the user
    const registrations = await prisma.ind_event_registration.findMany({
      where: {
        user_id: parseInt(userId),
        is_deleted: false,
        year: currentYear,
        status: {
          in: ['PENDING', 'ACCEPTED']
        }
      },
      include: {
        event: {
          include: {
            event_type: true,
            age_category: true
          }
        }
      }
    });

    res.json({
      count: registrations.length,
      maxAllowed: 3,
      registrations: registrations.map(reg => ({
        id: reg.id,
        event_id: reg.event_id,
        event_name: reg.event?.event_type?.name || 'Unknown',
        age_category: reg.event?.age_category?.name || 'Unknown',
        status: reg.status
      }))
    });
  } catch (error) {
    console.error('Error getting user registration count:', error);
    res.status(500).json({ error: 'Failed to get registration count' });
  }
});

// Get temple participants count for an event
router.get('/temple-participants-count/:eventId/:templeId', authenticate, requireRole('STAFF'), async (req, res) => {
  try {
    const { eventId, templeId } = req.params;
    const currentYear = new Date().getFullYear();

    // Get event details to check age category
    const event = await prisma.mst_event.findUnique({
      where: { id: parseInt(eventId) },
      include: { age_category: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if this age category has unlimited participants (0-5, 6-10, 61+)
    const isUnlimitedAgeCategory = ['0-5', '6-10', '61+'].includes(event.age_category.name);

    // Count accepted participants from this temple for this event
    const count = await prisma.ind_event_registration.count({
      where: {
        event_id: parseInt(eventId),
        is_deleted: false,
        year: currentYear,
        status: 'ACCEPTED',
        user: {
          temple_id: parseInt(templeId)
        }
      }
    });

    res.json({
      count,
      maxAllowed: isUnlimitedAgeCategory ? null : 3,
      canAdd: isUnlimitedAgeCategory ? true : count < 3,
      isUnlimited: isUnlimitedAgeCategory
    });
  } catch (error) {
    console.error('Error getting temple participants count:', error);
    res.status(500).json({ error: 'Failed to get temple participants count' });
  }
});

// Check if user is already registered for event
router.get('/check-user-event-registration/:eventId/:userId', authenticate, requireRole('STAFF'), async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const currentYear = new Date().getFullYear();

    const existingRegistration = await prisma.ind_event_registration.findFirst({
      where: {
        event_id: parseInt(eventId),
        user_id: parseInt(userId),
        is_deleted: false,
        year: currentYear
      }
    });

    res.json({
      isRegistered: !!existingRegistration,
      status: existingRegistration?.status || null
    });
  } catch (error) {
    console.error('Error checking user event registration:', error);
    res.status(500).json({ error: 'Failed to check registration' });
  }
});

// Staff register participant for event (on behalf of user)
router.post('/staff-register-participant', authenticate, requireRole('STAFF'), [
  body('event_id').isInt().withMessage('Invalid event ID'),
  body('user_id').isInt().withMessage('Invalid user ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { event_id, user_id } = req.body;

  try {
    const currentYear = new Date().getFullYear();

    // Get user details
    const user = await prisma.profile.findUnique({
      where: { id: user_id },
      select: { id: true, temple_id: true, first_name: true, last_name: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already registered for this event
    const existingRegistration = await prisma.ind_event_registration.findFirst({
      where: {
        event_id,
        user_id,
        is_deleted: false,
        year: currentYear
      }
    });

    if (existingRegistration) {
      return res.status(409).json({ error: 'User is already registered for this event' });
    }

    // Get event details first to check age category
    const event = await prisma.mst_event.findUnique({
      where: { id: event_id },
      include: { age_category: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if this age category has unlimited participants (0-5, 6-10, 61+)
    const isUnlimitedAgeCategory = ['0-5', '6-10', '61+'].includes(event.age_category.name);

    // Check user's total individual event registrations (applies to all age categories)
    const userRegistrations = await prisma.ind_event_registration.count({
      where: {
        user_id,
        is_deleted: false,
        year: currentYear,
        status: { in: ['PENDING', 'ACCEPTED'] }
      }
    });

    if (userRegistrations >= 3) {
      return res.status(403).json({ 
        error: 'User has already registered for 3 individual events (maximum allowed)' 
      });
    }

    // Check temple's participant count for this event (only for limited age categories)
    let templeParticipantCount = 0;
    if (!isUnlimitedAgeCategory) {
      templeParticipantCount = await prisma.ind_event_registration.count({
        where: {
          event_id,
          is_deleted: false,
          year: currentYear,
          status: 'ACCEPTED',
          user: { temple_id: user.temple_id }
        }
      });

      if (templeParticipantCount >= 3) {
        return res.status(403).json({ 
          error: 'This temple already has 3 participants registered for this event (maximum allowed)' 
        });
      }
    }

    // Create the registration
    let registration;
    if (isUnlimitedAgeCategory) {
      // For unlimited age categories, create as ACCEPTED directly
      registration = await prisma.ind_event_registration.create({
        data: {
          year: currentYear,
          user_id,
          event_id,
          status: 'ACCEPTED',
          is_deleted: false
        }
      });
    } else {
      // For limited age categories, create as ACCEPTED if temple has room
      registration = await prisma.ind_event_registration.create({
        data: {
          year: currentYear,
          user_id,
          event_id,
          status: templeParticipantCount < 3 ? 'ACCEPTED' : 'PENDING',
          is_deleted: false
        }
      });
    }

    // Create audit log
    await prisma.audit_log.create({
      data: {
        user_id: req.user.id, // Staff user who performed the action
        action: 'STAFF_REGISTER_PARTICIPANT',
        table_name: 'Ind_event_registration',
        record_id: registration.id,
        new_value: JSON.stringify({
          ...registration,
          registered_for_user: user_id,
          registered_by_staff: req.user.id
        })
      }
    });

    res.status(201).json({
      success: true,
      message: `Successfully registered ${user.first_name} ${user.last_name || ''} for the event`,
      registration
    });

  } catch (error) {
    console.error('Staff registration error:', error);
    res.status(500).json({ error: error.message || 'Failed to register participant' });
  }
});

export default router; 
