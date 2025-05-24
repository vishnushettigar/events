const express = require('express');
const { body, validationResult } = require('express-validator');
const eventManagementService = require('../services/eventManagementService');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /api/event-management/event-types:
 *   post:
 *     tags: [Event Management]
 *     summary: Create a new event type
 *     description: Create a new event type with name, type, and participant count
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - participant_count
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the event type
 *               type:
 *                 type: string
 *                 enum: [TEAM, INDIVIDUAL]
 *                 description: Type of the event
 *               participant_count:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of participants allowed
 *     responses:
 *       201:
 *         description: Event type created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/event-types', authenticate, requireRole('SUPER_USER'), [
  body('name').notEmpty().withMessage('Event type name is required'),
  body('type').isIn(['TEAM', 'INDIVIDUAL']).withMessage('Invalid event type'),
  body('participant_count').isInt({ min: 1 }).withMessage('Participant count must be at least 1')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const eventType = await eventManagementService.createEventType(
      req.body.name,
      req.body.type,
      req.body.participant_count
    );
    res.status(201).json(eventType);
  } catch (error) {
    console.error('Error creating event type:', error);
    res.status(500).json({ error: 'Failed to create event type' });
  }
});

router.put('/event-types/:id', authenticate, requireRole('SUPER_USER'), [
  body('name').optional().notEmpty().withMessage('Event type name cannot be empty'),
  body('type').optional().isIn(['TEAM', 'INDIVIDUAL']).withMessage('Invalid event type'),
  body('participant_count').optional().isInt({ min: 1 }).withMessage('Participant count must be at least 1')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const eventType = await eventManagementService.updateEventType(parseInt(req.params.id), req.body);
    res.json(eventType);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event type' });
  }
});

router.delete('/event-types/:id', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const eventType = await eventManagementService.deleteEventType(parseInt(req.params.id));
    res.json(eventType);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete event type' });
  }
});

router.get('/event-types', authenticate, async (req, res) => {
  try {
    const eventTypes = await eventManagementService.listEventTypes();
    res.json(eventTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
});

/**
 * @swagger
 * /api/event-management/age-categories:
 *   post:
 *     tags: [Event Management]
 *     summary: Create a new age category
 *     description: Create a new age category with name and age range
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - from_age
 *               - to_age
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the age category
 *               from_age:
 *                 type: integer
 *                 minimum: 0
 *                 description: Minimum age for the category
 *               to_age:
 *                 type: integer
 *                 minimum: 0
 *                 description: Maximum age for the category
 *     responses:
 *       201:
 *         description: Age category created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/age-categories', authenticate, requireRole('SUPER_USER'), [
  body('name').notEmpty().withMessage('Age category name is required'),
  body('from_age').isInt({ min: 0 }).withMessage('From age must be a positive number'),
  body('to_age').isInt({ min: 0 }).withMessage('To age must be a positive number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const ageCategory = await eventManagementService.createAgeCategory(
      req.body.name,
      req.body.from_age,
      req.body.to_age
    );
    res.status(201).json(ageCategory);
  } catch (error) {
    console.error('Error creating age category:', error);
    res.status(500).json({ error: 'Failed to create age category' });
  }
});

router.put('/age-categories/:id', authenticate, requireRole('SUPER_USER'), [
  body('name').optional().notEmpty().withMessage('Age category name cannot be empty'),
  body('from_age').optional().isInt({ min: 0 }).withMessage('From age must be a positive number'),
  body('to_age').optional().isInt({ min: 0 }).withMessage('To age must be a positive number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const ageCategory = await eventManagementService.updateAgeCategory(parseInt(req.params.id), req.body);
    res.json(ageCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update age category' });
  }
});

router.delete('/age-categories/:id', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const ageCategory = await eventManagementService.deleteAgeCategory(parseInt(req.params.id));
    res.json(ageCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete age category' });
  }
});

router.get('/age-categories', authenticate, async (req, res) => {
  try {
    const ageCategories = await eventManagementService.listAgeCategories();
    res.json(ageCategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch age categories' });
  }
});

/**
 * @swagger
 * /api/event-management/events:
 *   post:
 *     tags: [Event Management]
 *     summary: Create a new event
 *     description: Create a new event with name, type, age category, gender, and temple
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - event_type_id
 *               - age_category_id
 *               - gender
 *               - temple_id
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the event
 *               event_type_id:
 *                 type: integer
 *                 description: ID of the event type
 *               age_category_id:
 *                 type: integer
 *                 description: ID of the age category
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, ALL]
 *                 description: Gender category for the event
 *               temple_id:
 *                 type: integer
 *                 description: ID of the temple hosting the event
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/events', authenticate, requireRole('SUPER_USER'), [
  body('name').notEmpty().withMessage('Event name is required'),
  body('event_type_id').isInt().withMessage('Invalid event type ID'),
  body('age_category_id').isInt().withMessage('Invalid age category ID'),
  body('gender').isIn(['MALE', 'FEMALE', 'ALL']).withMessage('Invalid gender'),
  body('temple_id').isInt().withMessage('Invalid temple ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const event = await eventManagementService.createEvent(
      req.body.name,
      req.body.event_type_id,
      req.body.age_category_id,
      req.body.gender,
      req.body.temple_id
    );
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.put('/events/:id', authenticate, requireRole('SUPER_USER'), [
  body('name').optional().notEmpty().withMessage('Event name cannot be empty'),
  body('event_type_id').optional().isInt().withMessage('Invalid event type ID'),
  body('age_category_id').optional().isInt().withMessage('Invalid age category ID'),
  body('gender').optional().isIn(['MALE', 'FEMALE', 'ALL']).withMessage('Invalid gender'),
  body('temple_id').optional().isInt().withMessage('Invalid temple ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const event = await eventManagementService.updateEvent(parseInt(req.params.id), req.body);
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/events/:id', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const event = await eventManagementService.deleteEvent(parseInt(req.params.id));
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

router.get('/events', authenticate, async (req, res) => {
  try {
    const filters = {
      temple_id: req.query.temple_id ? parseInt(req.query.temple_id) : undefined,
      event_type_id: req.query.event_type_id ? parseInt(req.query.event_type_id) : undefined,
      age_category_id: req.query.age_category_id ? parseInt(req.query.age_category_id) : undefined,
      gender: req.query.gender
    };
    const events = await eventManagementService.listEvents(filters);
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * @swagger
 * /api/event-management/events/{event_id}/schedules:
 *   post:
 *     tags: [Event Management]
 *     summary: Create a new event schedule
 *     description: Create a new schedule for an event with start and end times
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start_time
 *               - end_time
 *             properties:
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: Start time of the event
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: End time of the event
 *     responses:
 *       201:
 *         description: Event schedule created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/events/:event_id/schedules', authenticate, requireRole('SUPER_USER'), [
  body('start_time').isISO8601().withMessage('Invalid start time'),
  body('end_time').isISO8601().withMessage('Invalid end time')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const schedule = await eventManagementService.createEventSchedule(
      parseInt(req.params.event_id),
      new Date(req.body.start_time),
      new Date(req.body.end_time)
    );
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating event schedule:', error);
    res.status(500).json({ error: 'Failed to create event schedule' });
  }
});

router.put('/schedules/:id', authenticate, requireRole('SUPER_USER'), [
  body('start_time').optional().isISO8601().withMessage('Invalid start time'),
  body('end_time').optional().isISO8601().withMessage('Invalid end time')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const schedule = await eventManagementService.updateEventSchedule(parseInt(req.params.id), {
      start_time: req.body.start_time ? new Date(req.body.start_time) : undefined,
      end_time: req.body.end_time ? new Date(req.body.end_time) : undefined
    });
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event schedule' });
  }
});

router.delete('/schedules/:id', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const schedule = await eventManagementService.deleteEventSchedule(parseInt(req.params.id));
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete event schedule' });
  }
});

router.get('/events/:event_id/schedules', authenticate, async (req, res) => {
  try {
    const schedules = await eventManagementService.listEventSchedules(parseInt(req.params.event_id));
    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch event schedules' });
  }
});

module.exports = router; 