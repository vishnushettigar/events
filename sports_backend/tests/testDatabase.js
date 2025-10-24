import { PrismaClient } from '@prisma/client';

// Test database client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db'
    }
  }
});

// Test data factories
export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    username: 'testuser',
    password: 'testpassword123',
    email: 'test@example.com',
    ...userData
  };

  return await prisma.user.create({
    data: defaultUser
  });
};

export const createTestProfile = async (profileData = {}) => {
  // First create a temple if it doesn't exist
  let temple = await prisma.mst_temple.findFirst({
    where: { code: 'TEST' }
  });

  if (!temple) {
    temple = await prisma.mst_temple.create({
      data: {
        code: 'TEST',
        name: 'Test Temple',
        address: 'Test Address'
      }
    });
  }

  // Create a role if it doesn't exist
  let role = await prisma.mst_role.findFirst({
    where: { name: 'PARTICIPANT' }
  });

  if (!role) {
    role = await prisma.mst_role.create({
      data: {
        name: 'PARTICIPANT'
      }
    });
  }

  const defaultProfile = {
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    phone: '1234567890',
    aadhar_number: '123456789012',
    dob: new Date('1990-01-01'),
    gender: 'MALE',
    temple_id: temple.id,
    role_id: role.id,
    ...profileData
  };

  return await prisma.profile.create({
    data: defaultProfile
  });
};

export const createTestEvent = async (eventData = {}) => {
  // Create event type if it doesn't exist
  let eventType = await prisma.mst_event_type.findFirst({
    where: { name: 'Test Event' }
  });

  if (!eventType) {
    eventType = await prisma.mst_event_type.create({
      data: {
        name: 'Test Event',
        type: 'INDIVIDUAL',
        participant_count: 1
      }
    });
  }

  // Create age category if it doesn't exist
  let ageCategory = await prisma.mst_age_category.findFirst({
    where: { name: 'Test Category' }
  });

  if (!ageCategory) {
    ageCategory = await prisma.mst_age_category.create({
      data: {
        name: 'Test Category',
        from_age: 18,
        to_age: 25
      }
    });
  }

  const defaultEvent = {
    event_type_id: eventType.id,
    age_category_id: ageCategory.id,
    gender: 'MALE',
    is_deleted: false,
    is_closed: false,
    ...eventData
  };

  return await prisma.mst_event.create({
    data: defaultEvent
  });
};

export const createTestTemple = async (templeData = {}) => {
  const defaultTemple = {
    code: 'TEMPLE1',
    name: 'Test Temple 1',
    address: 'Test Address 1',
    ...templeData
  };

  return await prisma.mst_temple.create({
    data: defaultTemple
  });
};

export const createTestRole = async (roleData = {}) => {
  const defaultRole = {
    name: 'TEST_ROLE',
    ...roleData
  };

  return await prisma.mst_role.create({
    data: defaultRole
  });
};

export { prisma };
