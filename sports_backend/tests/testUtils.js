import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from './testDatabase.js';

// Generate JWT token for testing
export const generateTestToken = (userData = {}) => {
  const defaultUser = {
    id: 1,
    role: 1, // PARTICIPANT role
    temple_id: 1,
    ...userData
  };

  return jwt.sign(defaultUser, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Hash password for testing
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Create authenticated user for testing
export const createAuthenticatedUser = async (userData = {}) => {
  const hashedPassword = await hashPassword('testpassword123');
  
  const user = await prisma.user.create({
    data: {
      username: 'testuser',
      password: hashedPassword,
      email: 'test@example.com',
      ...userData
    }
  });

  const profile = await prisma.profile.create({
    data: {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone: '1234567890',
      aadhar_number: '123456789012',
      dob: new Date('1990-01-01'),
      gender: 'MALE',
      temple_id: 1,
      role_id: 1,
      user_id: user.id,
      ...userData
    }
  });

  return { user, profile };
};

// Create admin user for testing
export const createAdminUser = async (userData = {}) => {
  const hashedPassword = await hashPassword('adminpassword123');
  
  const user = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      ...userData
    }
  });

  const profile = await prisma.profile.create({
    data: {
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@example.com',
      phone: '1234567890',
      aadhar_number: '987654321098',
      dob: new Date('1985-01-01'),
      gender: 'MALE',
      temple_id: 1,
      role_id: 5, // ADMIN role
      user_id: user.id,
      ...userData
    }
  });

  return { user, profile };
};

// Create temple admin user for testing
export const createTempleAdminUser = async (templeId = 1, userData = {}) => {
  const hashedPassword = await hashPassword('templeadmin123');
  
  const user = await prisma.user.create({
    data: {
      username: 'templeadmin',
      password: hashedPassword,
      email: 'templeadmin@example.com',
      ...userData
    }
  });

  const profile = await prisma.profile.create({
    data: {
      first_name: 'Temple',
      last_name: 'Admin',
      email: 'templeadmin@example.com',
      phone: '1234567890',
      aadhar_number: '112233445566',
      dob: new Date('1980-01-01'),
      gender: 'MALE',
      temple_id: templeId,
      role_id: 2, // TEMPLE_ADMIN role
      user_id: user.id,
      ...userData
    }
  });

  return { user, profile };
};

// Helper to create complete test data setup
export const setupTestData = async () => {
  // Create temples
  const temple1 = await prisma.mst_temple.create({
    data: {
      code: 'TEMPLE1',
      name: 'Test Temple 1',
      address: 'Test Address 1'
    }
  });

  const temple2 = await prisma.mst_temple.create({
    data: {
      code: 'TEMPLE2',
      name: 'Test Temple 2',
      address: 'Test Address 2'
    }
  });

  // Create roles
  const participantRole = await prisma.mst_role.create({
    data: { name: 'PARTICIPANT' }
  });

  const templeAdminRole = await prisma.mst_role.create({
    data: { name: 'TEMPLE_ADMIN' }
  });

  const adminRole = await prisma.mst_role.create({
    data: { name: 'ADMIN' }
  });

  // Create age categories
  const ageCategory1 = await prisma.mst_age_category.create({
    data: {
      name: '18-25',
      from_age: 18,
      to_age: 25
    }
  });

  const ageCategory2 = await prisma.mst_age_category.create({
    data: {
      name: '26-35',
      from_age: 26,
      to_age: 35
    }
  });

  // Create event types
  const individualEventType = await prisma.mst_event_type.create({
    data: {
      name: 'Running - 100m',
      type: 'INDIVIDUAL',
      participant_count: 1
    }
  });

  const teamEventType = await prisma.mst_event_type.create({
    data: {
      name: 'Relay - 4x100m',
      type: 'TEAM',
      participant_count: 4
    }
  });

  // Create events
  const individualEvent = await prisma.mst_event.create({
    data: {
      event_type_id: individualEventType.id,
      age_category_id: ageCategory1.id,
      gender: 'MALE',
      is_deleted: false,
      is_closed: false
    }
  });

  const teamEvent = await prisma.mst_event.create({
    data: {
      event_type_id: teamEventType.id,
      age_category_id: ageCategory1.id,
      gender: 'MALE',
      is_deleted: false,
      is_closed: false
    }
  });

  return {
    temples: { temple1, temple2 },
    roles: { participantRole, templeAdminRole, adminRole },
    ageCategories: { ageCategory1, ageCategory2 },
    eventTypes: { individualEventType, teamEventType },
    events: { individualEvent, teamEvent }
  };
};

// Helper to clean up test data
export const cleanupTestData = async () => {
  await prisma.audit_log.deleteMany();
  await prisma.event_performance.deleteMany();
  await prisma.ind_event_registration.deleteMany();
  await prisma.team_event_registration.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.mst_event.deleteMany();
  await prisma.mst_event_type.deleteMany();
  await prisma.mst_age_category.deleteMany();
  await prisma.mst_role.deleteMany();
  await prisma.mst_temple.deleteMany();
};
