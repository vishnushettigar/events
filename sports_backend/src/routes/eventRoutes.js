const express = require('express');
const { body, validationResult } = require('express-validator');
const eventService = require('../services/eventService');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

router.post('/register-participant', authenticate, [
  body('user_id').isInt().withMessage('Invalid user ID'),
  body('event_id').isInt().withMessage('Invalid event ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { user_id, event_id } = req.body;
  try {
    const registration = await eventService.registerParticipant(user_id, event_id);
    res.status(201).json(registration);
  } catch (error) {
    console.error(error);
    if (error.message.includes('other temples')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Registration failed' });
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
    console.error(error);
    if (error.message.includes('other temples') || error.message.includes('same temple')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Team registration failed' });
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { registration_id, status } = req.body;
  try {
    const updatedRegistration = await eventService.updateRegistrationStatus(registration_id, status, req.user.id);
    res.json(updatedRegistration);
  } catch (error) {
    console.error(error);
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update registration status' });
  }
});

// List temple participants
router.get('/temple-participants', authenticate, requireRole('TEMPLE_ADMIN'), async (req, res) => {
  try {
    const filters = {
      event_id: req.query.event_id ? parseInt(req.query.event_id) : undefined,
      status: req.query.status
    };
    const participants = await eventService.getTempleParticipants(req.user.temple_id, filters);
    res.json(participants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// List temple teams
router.get('/temple-teams', authenticate, requireRole('TEMPLE_ADMIN'), async (req, res) => {
  try {
    const filters = {
      event_id: req.query.event_id ? parseInt(req.query.event_id) : undefined
    };
    const teams = await eventService.getTempleTeams(req.user.temple_id, filters);
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch teams' });
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

module.exports = router; 