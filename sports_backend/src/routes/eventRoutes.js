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
    const { ageCategory = 'All', gender = 'MALE' } = req.query;
    
    console.log('Participant data request:', { ageCategory, gender });

    // Get age categories
    const ageCategories = await eventService.getAgeCategories();

    // Hardcoded gender options
    const genderOptions = [
      { id: 1, name: 'Male', value: 'MALE' },
      { id: 2, name: 'Female', value: 'FEMALE' }
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

export default router; 