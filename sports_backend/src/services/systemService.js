import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import prisma from '../utils/prismaClient.js';

const execPromise = promisify(exec);

// System Settings Management
async function getSystemSettings() {
  const settings = await prisma.settings.findMany();
  return settings;
}

async function updateSystemSetting(name, value, userId = null) {
  const setting = await prisma.settings.update({
    where: { name },
    data: { value }
  });

  await prisma.audit_log.create({
    data: {
      user_id: userId,
      action: 'UPDATE_SYSTEM_SETTING',
      table_name: 'Settings',
      record_id: setting.id,
      new_value: JSON.stringify({ name: setting.name, value: value })
    }
  });

  return setting;
}

async function getSystemSetting(name) {
  const setting = await prisma.settings.findUnique({
    where: { name }
  });
  return setting;
}

async function ensureSystemSetting(name, defaultValue) {
  let setting = await prisma.settings.findUnique({
    where: { name }
  });
  
  if (!setting) {
    setting = await prisma.settings.create({
      data: { name, value: defaultValue }
    });
  }
  
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
      table_name: 'System',
      new_value: JSON.stringify({ backupPath })
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
        table_name: 'System',
        new_value: JSON.stringify({ backupPath })
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
        table_name: 'System',
        new_value: JSON.stringify({ backupPath })
      }
    });

    return { message: 'Backup deleted successfully' };
  } catch (error) {
    throw new Error('Failed to delete backup file');
  }
}

export {
  getSystemSettings,
  getSystemSetting,
  ensureSystemSetting,
  updateSystemSetting,
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup
}; 