const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const prisma = new PrismaClient();

// System Settings Management
async function getSystemSettings() {
  const settings = await prisma.settings.findMany();
  return settings;
}

async function updateSystemSetting(name, value) {
  const setting = await prisma.settings.upsert({
    where: { name },
    update: { value },
    create: { name, value }
  });

  await prisma.audit_log.create({
    data: {
      action: 'UPDATE_SYSTEM_SETTING',
      table_name: 'Settings',
      record_id: setting.id,
      new_value: JSON.stringify({ name, value })
    }
  });

  return setting;
}

// Backup and Restore
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../../backups');
  const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

  // Create backups directory if it doesn't exist
  await fs.mkdir(backupDir, { recursive: true });

  // Copy the database file
  await fs.copyFile(
    path.join(__dirname, '../../prisma/dev.db'),
    backupPath
  );

  // Log the backup creation
  await prisma.audit_log.create({
    data: {
      action: 'CREATE_BACKUP',
      table_name: 'System',
      new_value: JSON.stringify({ backupPath })
    }
  });

  return {
    path: backupPath,
    timestamp,
    size: (await fs.stat(backupPath)).size
  };
}

async function listBackups() {
  const backupDir = path.join(__dirname, '../../backups');
  
  try {
    await fs.mkdir(backupDir, { recursive: true });
    const files = await fs.readdir(backupDir);
    
    const backups = await Promise.all(
      files
        .filter(file => file.endsWith('.db'))
        .map(async file => {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime
          };
        })
    );

    return backups.sort((a, b) => b.created - a.created);
  } catch (error) {
    console.error('Error listing backups:', error);
    throw new Error('Failed to list backups');
  }
}

async function restoreBackup(backupPath) {
  try {
    // Verify backup file exists
    await fs.access(backupPath);

    // Stop the current database connection
    await prisma.$disconnect();

    // Copy backup to database location
    await fs.copyFile(
      backupPath,
      path.join(__dirname, '../../prisma/dev.db')
    );

    // Log the restore action
    await prisma.audit_log.create({
      data: {
        action: 'RESTORE_BACKUP',
        table_name: 'System',
        new_value: JSON.stringify({ backupPath })
      }
    });

    // Reconnect to the database
    await prisma.$connect();

    return { message: 'Backup restored successfully' };
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw new Error('Failed to restore backup');
  }
}

async function deleteBackup(backupPath) {
  try {
    await fs.unlink(backupPath);
    
    await prisma.audit_log.create({
      data: {
        action: 'DELETE_BACKUP',
        table_name: 'System',
        new_value: JSON.stringify({ backupPath })
      }
    });

    return { message: 'Backup deleted successfully' };
  } catch (error) {
    console.error('Error deleting backup:', error);
    throw new Error('Failed to delete backup');
  }
}

module.exports = {
  getSystemSettings,
  updateSystemSetting,
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup
}; 