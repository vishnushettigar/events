import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const prisma = new PrismaClient();

// System Settings Management
async function getSystemSettings() {
  const settings = await prisma.settings.findMany();
  return settings;
}

async function updateSystemSetting(id, value) {
  const setting = await prisma.settings.update({
    where: { id },
    data: { value }
  });

  await prisma.audit_log.create({
    data: {
      action: 'UPDATE_SYSTEM_SETTING',
      details: `Updated setting: ${setting.name} to ${value}`
    }
  });

  return setting;
}

// Backup Management
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupPath = path.join(backupDir, `backup-${timestamp}.sql`);

  // Ensure backup directory exists
  await fs.mkdir(backupDir, { recursive: true });

  // Create backup using mysqldump
  const { stdout, stderr } = await execPromise(`mysqldump -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${backupPath}`);

  if (stderr) {
    console.error('Backup stderr:', stderr);
  }

  await prisma.audit_log.create({
    data: {
      action: 'CREATE_BACKUP',
      details: `Created backup: ${backupPath}`
    }
  });

  return { backupPath, message: 'Backup created successfully' };
}

async function listBackups() {
  const backupDir = path.join(process.cwd(), 'backups');
  
  try {
    const files = await fs.readdir(backupDir);
    const backups = files
      .filter(file => file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        size: fs.stat(path.join(backupDir, file)).then(stat => stat.size)
      }));

    return backups;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function restoreBackup(backupPath) {
  // Verify backup file exists
  try {
    await fs.access(backupPath);
  } catch (error) {
    throw new Error('Backup file not found');
  }

  // Restore backup using mysql
  const { stdout, stderr } = await execPromise(`mysql -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} < ${backupPath}`);

  if (stderr) {
    console.error('Restore stderr:', stderr);
  }

  await prisma.audit_log.create({
    data: {
      action: 'RESTORE_BACKUP',
      details: `Restored backup: ${backupPath}`
    }
  });

  return { message: 'Backup restored successfully' };
}

async function deleteBackup(backupPath) {
  try {
    await fs.unlink(backupPath);
    
    await prisma.audit_log.create({
      data: {
        action: 'DELETE_BACKUP',
        details: `Deleted backup: ${backupPath}`
      }
    });

    return { message: 'Backup deleted successfully' };
  } catch (error) {
    throw new Error('Failed to delete backup file');
  }
}

export {
  getSystemSettings,
  updateSystemSetting,
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup
}; 