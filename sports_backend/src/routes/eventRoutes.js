import express from 'express';
import { body, validationResult } from 'express-validator';
import * as eventService from '../services/eventService.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Test route to verify middleware is working
router.get('/test-auth', authenticate, requireRole('TEMPLE_ADMIN'), (req, res) => {
  console.log('Test route accessed successfully');
  res.json({ message: 'Authentication and authorization working', user: req.user });
});

router.post('/register-participant', authenticate, [
  body('user_id').isInt().withMessage('Invalid user ID'),
  body('event_id').isInt().withMessage('Invalid event ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { user_id, event_id } = req.body;
  console.log('Registration attempt:', { user_id, event_id, auth_user: req.user });

  try {
    const registration = await eventService.registerParticipant(user_id, event_id);
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
    const { ageCategory = 'All', gender = 'MIXED' } = req.query;
    
    console.log('Participant data request:', { ageCategory, gender });

    // Get age categories
    const ageCategories = await eventService.getAgeCategories();

    // Hardcoded gender options
    const genderOptions = [
      { id: 1, name: 'Male', value: 'MALE' },
      { id: 2, name: 'Female', value: 'FEMALE' },
      { id: 3, name: 'ALL', value: 'MIXED' }
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
        registrations: {
          where: { is_deleted: false }
        },
        team_registrations: {
          where: { is_deleted: false }
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
    const transformedEvents = events.map(event => ({
      id: event.id,
      name: event.event_type.name,
      event_type: event.event_type,
      age_category: event.age_category,
      gender: event.gender,
      is_closed: event.is_closed,
      participant_count: event.event_type.participant_count,
      registrations_count: event.registrations.length,
      team_registrations_count: event.team_registrations.length,
      total_registrations: event.registrations.length + event.team_registrations.length
    }));

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
  body('event_id').isInt().withMessage('Invalid event ID'),
  body('lane_count').isInt({ min: 6, max: 8 }).withMessage('Lane count must be 6 or 8')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { event_id, lane_count } = req.body;

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

    // Group participants by temple
    const templeGroups = {};
    participants.forEach(participant => {
      const temple = participant.temple_name;
      if (!templeGroups[temple]) {
        templeGroups[temple] = [];
      }
      templeGroups[temple].push(participant);
    });

    // Generate heats with temple separation logic
    const heats = [];
    const temples = Object.keys(templeGroups);
    let currentHeat = { id: 1, participants: [], laneCount: 0 };
    let templeIndex = 0;

    // Distribute participants ensuring no same temple in same heat
    while (templeIndex < temples.length) {
      const temple = temples[templeIndex];
      const templeParticipants = templeGroups[temple];
      
      // If adding this temple would exceed lane capacity, start new heat
      if (currentHeat.participants.length + templeParticipants.length > lane_count) {
        if (currentHeat.participants.length > 0) {
          heats.push({ ...currentHeat, laneCount: currentHeat.participants.length });
          currentHeat = { id: heats.length + 1, participants: [], laneCount: 0 };
        }
      }

      // Add temple participants to current heat
      templeParticipants.forEach(participant => {
        if (currentHeat.participants.length < lane_count) {
          currentHeat.participants.push(participant);
          currentHeat.laneCount++;
        } else {
          // If current heat is full, start new heat
          heats.push({ ...currentHeat, laneCount: currentHeat.participants.length });
          currentHeat = { id: heats.length + 1, participants: [participant], laneCount: 1 };
        }
      });

      templeIndex++;
    }

    // Add the last heat if it has participants
    if (currentHeat.participants.length > 0) {
      heats.push({ ...currentHeat, laneCount: currentHeat.participants.length });
    }

    // Save heats to database
    const heatRecords = [];
    heats.forEach(heat => {
      heat.participants.forEach(participant => {
        heatRecords.push({
          year: new Date().getFullYear(),
          registration_id: participant.id,
          event_id: event_id,
          heat_number: heat.id,
          heat_time: null
        });
      });
    });

    await prisma.event_performance.createMany({
      data: heatRecords
    });

    res.json({
      message: 'Heats generated successfully',
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

// Get heats for an event
router.get('/heats/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const heats = await prisma.event_performance.findMany({
      where: { 
        event_id: parseInt(eventId),
        year: new Date().getFullYear()  // Only show current year heats
      },
      include: {
        registration: {
          include: {
            user: {
              include: { temple: true }
            }
          }
        }
      },
      orderBy: [
        { heat_number: 'asc' },
        { id: 'asc' }
      ]
    });

    // Group by heat number
    const groupedHeats = {};
    heats.forEach(heat => {
      const heatNumber = heat.heat_number;
      if (!groupedHeats[heatNumber]) {
        groupedHeats[heatNumber] = [];
      }
      groupedHeats[heatNumber].push({
        id: heat.registration.id,
        participant_name: heat.registration.user.first_name + ' ' + (heat.registration.user.last_name || ''),
        temple_name: heat.registration.user.temple.name,
        aadhar_number: heat.registration.user.aadhar_number,
        heat_time: heat.heat_time
      });
    });

    res.json(groupedHeats);

  } catch (error) {
    console.error('Error fetching heats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch heats' });
  }
});

// Save heat timings
router.post('/save-timings', authenticate, requireRole('STAFF'), [
  body('event_id').isInt().withMessage('Invalid event ID'),
  body('heat_number').isInt().withMessage('Invalid heat number'),
  body('timings').isArray().withMessage('Timings must be an array'),
  body('timings.*.registration_id').isInt().withMessage('Invalid registration ID'),
  body('timings.*.heat_time').isString().withMessage('Heat time must be a string')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { event_id, heat_number, timings } = req.body;

  try {
    // Update timings for each participant
    const updatePromises = timings.map(timing => 
      prisma.event_performance.updateMany({
        where: {
          event_id: event_id,
          heat_number: heat_number,
          registration_id: timing.registration_id
        },
        data: {
          heat_time: timing.heat_time
        }
      })
    );

    await Promise.all(updatePromises);

    res.json({ message: 'Timings saved successfully' });

  } catch (error) {
    console.error('Error saving timings:', error);
    res.status(500).json({ error: error.message || 'Failed to save timings' });
  }
});

export default router; 
