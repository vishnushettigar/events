import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as systemService from '../services/systemService.js';

const router = express.Router();

/**
 * @swagger
 * /api/system/settings:
 *   get:
 *     tags: [System]
 *     summary: Get system settings
 *     description: Retrieve all system settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Setting ID
 *                   name:
 *                     type: string
 *                     description: Setting name
 *                   value:
 *                     type: integer
 *                     description: Setting value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/settings', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const settings = await systemService.getSystemSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

/**
 * @swagger
 * /api/system/settings/{name}:
 *   put:
 *     tags: [System]
 *     summary: Update system setting
 *     description: Update a specific system setting
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the setting
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: integer
 *                 description: New value for the setting
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.put('/settings/:name', authenticate, requireRole('SUPER_USER'), [
  body('value').isInt().withMessage('Value must be an integer')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const setting = await systemService.updateSystemSetting(
      req.params.name,
      parseInt(req.body.value)
    );
    res.json(setting);
  } catch (error) {
    console.error('Error updating system setting:', error);
    res.status(500).json({ error: 'Failed to update system setting' });
  }
});

/**
 * @swagger
 * /api/system/backup:
 *   post:
 *     tags: [System]
 *     summary: Create system backup
 *     description: Create a backup of the system database
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Backup created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 path:
 *                   type: string
 *                   description: Path to the backup file
 *                 timestamp:
 *                   type: string
 *                   description: Backup creation timestamp
 *                 size:
 *                   type: integer
 *                   description: Size of the backup file in bytes
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/backup', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const backup = await systemService.createBackup();
    res.status(201).json(backup);
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

/**
 * @swagger
 * /api/system/backups:
 *   get:
 *     tags: [System]
 *     summary: List system backups
 *     description: Retrieve a list of all system backups
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backups listed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Backup file name
 *                   path:
 *                     type: string
 *                     description: Path to the backup file
 *                   size:
 *                     type: integer
 *                     description: Size of the backup file in bytes
 *                   created:
 *                     type: string
 *                     format: date-time
 *                     description: Backup creation timestamp
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/backups', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const backups = await systemService.listBackups();
    res.json(backups);
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

/**
 * @swagger
 * /api/system/restore:
 *   post:
 *     tags: [System]
 *     summary: Restore system backup
 *     description: Restore the system from a backup file
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - backupPath
 *             properties:
 *               backupPath:
 *                 type: string
 *                 description: Path to the backup file to restore
 *     responses:
 *       200:
 *         description: Backup restored successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/restore', authenticate, requireRole('SUPER_USER'), [
  body('backupPath').notEmpty().withMessage('Backup path is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const result = await systemService.restoreBackup(req.body.backupPath);
    res.json(result);
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

/**
 * @swagger
 * /api/system/backups/{path}:
 *   delete:
 *     tags: [System]
 *     summary: Delete system backup
 *     description: Delete a specific system backup
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Path to the backup file to delete
 *     responses:
 *       200:
 *         description: Backup deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.delete('/backups/:path', authenticate, requireRole('SUPER_USER'), async (req, res) => {
  try {
    const result = await systemService.deleteBackup(req.params.path);
    res.json(result);
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

export default router; 