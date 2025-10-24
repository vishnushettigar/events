import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set test database URL
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  // Reset the test database
  try {
    execSync('npx prisma migrate reset --force', { 
      cwd: __dirname + '/..',
      stdio: 'inherit' 
    });
  } catch (error) {
    console.log('Database reset failed, continuing with tests...');
  }
});

// Clean up after each test
afterEach(async () => {
  const prisma = new PrismaClient();
  try {
    // Clean up test data
    await prisma.audit_log.deleteMany();
    await prisma.event_performance.deleteMany();
    await prisma.ind_event_registration.deleteMany();
    await prisma.team_event_registration.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    console.log('Cleanup error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
});

// Global cleanup
afterAll(async () => {
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});
