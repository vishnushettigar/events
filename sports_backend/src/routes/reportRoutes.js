import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as reportService from '../services/reportService.js';

const router = express.Router();

/**
 * @swagger
 * /api/reports/championship:
 *   get:
 *     tags: [Reports]
 *     summary: Get overall championship report
 *     description: Retrieve a comprehensive report of all championships
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Championship report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Championship ID
 *                   year:
 *                     type: integer
 *                     description: Year of the championship
 *                   temple:
 *                     type: object
 *                     description: Winning temple details
 *                   host_temple:
 *                     type: object
 *                     description: Host temple details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/championship', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const report = await reportService.getOverallChampionshipReport();
    res.json(report);
  } catch (error) {
    console.error('Error fetching championship report:', error);
    res.status(500).json({ error: 'Failed to fetch championship report' });
  }
});

/**
 * @swagger
 * /api/reports/event-performance:
 *   get:
 *     tags: [Reports]
 *     summary: Get event-wise performance report
 *     description: Retrieve performance data for all events
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event performance report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Event ID
 *                   name:
 *                     type: string
 *                     description: Event name
 *                   event_type:
 *                     type: object
 *                     description: Event type details
 *                   age_category:
 *                     type: object
 *                     description: Age category details
 *                   registrations:
 *                     type: array
 *                     description: Individual registrations
 *                   team_registrations:
 *                     type: array
 *                     description: Team registrations
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/event-performance', authenticate, async (req, res) => {
  try {
    const report = await reportService.getEventWisePerformanceReport();
    res.json(report);
  } catch (error) {
    console.error('Error fetching event performance report:', error);
    res.status(500).json({ error: 'Failed to fetch event performance report' });
  }
});

/**
 * @swagger
 * /api/reports/age-category:
 *   get:
 *     tags: [Reports]
 *     summary: Get age category-wise report
 *     description: Retrieve performance data grouped by age categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Age category report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Age category ID
 *                   name:
 *                     type: string
 *                     description: Age category name
 *                   from_age:
 *                     type: integer
 *                     description: Minimum age
 *                   to_age:
 *                     type: integer
 *                     description: Maximum age
 *                   events:
 *                     type: array
 *                     description: Events in this age category
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/age-category', authenticate, async (req, res) => {
  try {
    const report = await reportService.getAgeCategoryWiseReport();
    res.json(report);
  } catch (error) {
    console.error('Error fetching age category report:', error);
    res.status(500).json({ error: 'Failed to fetch age category report' });
  }
});

/**
 * @swagger
 * /api/reports/gender:
 *   get:
 *     tags: [Reports]
 *     summary: Get gender-wise report
 *     description: Retrieve performance data grouped by gender
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gender report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Event ID
 *                   name:
 *                     type: string
 *                     description: Event name
 *                   gender:
 *                     type: string
 *                     enum: [MALE, FEMALE, ALL]
 *                     description: Gender category
 *                   registrations:
 *                     type: array
 *                     description: Individual registrations
 *                   team_registrations:
 *                     type: array
 *                     description: Team registrations
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/gender', authenticate, async (req, res) => {
  try {
    const report = await reportService.getGenderWiseReport();
    res.json(report);
  } catch (error) {
    console.error('Error fetching gender report:', error);
    res.status(500).json({ error: 'Failed to fetch gender report' });
  }
});

export default router; 