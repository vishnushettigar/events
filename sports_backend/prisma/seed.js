import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import dotenv from 'dotenv';

dotenv.config();

console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DATABASE_AUTH_TOKEN:', process.env.DATABASE_AUTH_TOKEN ? 'Present' : 'Missing');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DATABASE_AUTH_TOKEN:', process.env.DATABASE_AUTH_TOKEN) ;
console.log('DATABASE_URL:', process.env.DATABASE_URL);
// Create Prisma client based on URL type
let prisma;

if (process.env.DATABASE_URL?.startsWith('libsql://')) {
  console.log('Using libsql adapter for Turso...');
  console.log('Creating libsql adapter with:');
  console.log('URL:', process.env.DATABASE_URL);
  console.log('AuthToken length:', process.env.DATABASE_AUTH_TOKEN?.length || 0);

  const adapter = new PrismaLibSQL({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  
  prisma = new PrismaClient({ adapter });
  console.log('Prisma client with libsql adapter created successfully');
} else {
  console.log('Using standard PrismaClient for local database...');
  prisma = new PrismaClient();
}

async function main() {
  // Seed temples with specific IDs to match frontend constants
  const temples = [
    { id: 1, code: 'SALIKERI', name: 'SALIKERI' },
    { id: 2, code: 'BARKUR', name: 'BARKUR' },
    { id: 3, code: 'HOSADURGA', name: 'HOSADURGA' },
    { id: 4, code: 'MANJESHWARA', name: 'MANJESHWARA' },
    { id: 5, code: 'ULLALA', name: 'ULLALA' },
    { id: 6, code: 'SURATHKAL', name: 'SURATHKAL' },
    { id: 7, code: 'HALEYANGADI', name: 'HALEYANGADI' },
    { id: 8, code: 'MULKI', name: 'MULKI' },
    { id: 9, code: 'PADUBIDRI', name: 'PADUBIDRI' },
    { id: 10, code: 'YERMAL', name: 'YERMAL' },
    { id: 11, code: 'KAPU', name: 'KAPU' },
    { id: 12, code: 'KINNIMULKI', name: 'KINNIMULKI' },
    { id: 13, code: 'KALYANPURA', name: 'KALYANPURA' },
    { id: 14, code: 'KARKALA', name: 'KARKALA' },
    { id: 15, code: 'SIDDAKATTE', name: 'SIDDAKATTE' },
    { id: 16, code: 'MANGALORE', name: 'MANGALORE' }
  ];

  for (const temple of temples) {
    await prisma.mst_temple.upsert({
      where: { id: temple.id },
      update: temple,
      create: temple
    });
  }

  // Seed roles
  const roles = [
    { name: 'PARTICIPANT' },
    { name: 'TEMPLE_ADMIN' },
    { name: 'STAFF' },
    { name: 'VIEWER' },
    { name: 'ADMIN' }
  ];

  for (const role of roles) {
    await prisma.mst_role.upsert({
      where: { name: role.name },
      update: {},
      create: role
    });
  }

  // Seed age categories
  const ageCategories = [
    { name: '0-5', from_age: 0, to_age: 5 },
    { name: '6-10', from_age: 6, to_age: 10 },
    { name: '11-14', from_age: 11, to_age: 14 },
    { name: '15-18', from_age: 15, to_age: 18 },
    { name: '19-24', from_age: 19, to_age: 24 },
    { name: '25-35', from_age: 25, to_age: 35 },
    { name: '36-49', from_age: 36, to_age: 49 },
    { name: '50-60', from_age: 50, to_age: 60 },
    { name: '61+', from_age: 61, to_age: 99 },
    { name: 'All', from_age: 0, to_age: 99 }
  ];

  for (const ageCategory of ageCategories) {
    const existing = await prisma.mst_age_category.findFirst({
      where: { name: ageCategory.name }
    });
    
    if (!existing) {
      await prisma.mst_age_category.create({
        data: ageCategory
      });
    }
  }

  // Seed event types
  const eventTypes = [
    { name: 'Frog Jump - 15 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Frog Jump - 25 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Running - 25 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Running - 50 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Running - 100 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Running - 200 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Running - 400 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Running - 800 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Long jump', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Shot put', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Lucky Circle', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Couple Relay - 50 x 2', type: 'TEAM', participant_count: 2 },
    { name: 'Relay - 100 X 4', type: 'TEAM', participant_count: 4 },
    { name: 'Volleyball', type: 'TEAM', participant_count: 9 },
    { name: 'Throwball', type: 'TEAM', participant_count: 10 },
    { name: 'Tug of War', type: 'TEAM', participant_count: 9 },     
  ];

  for (const eventType of eventTypes) {
    const existing = await prisma.mst_event_type.findFirst({
      where: { name: eventType.name }
    });
    
    if (!existing) {
      await prisma.mst_event_type.create({
        data: eventType
      });
    }
  }

  // Seed events
  const events = [
    // 0-5 years
    { event_type_id: 1, age_category_id: 1, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 1, age_category_id: 1, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 3, age_category_id: 1, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 3, age_category_id: 1, gender: 'FEMALE', is_deleted: false, is_closed: false },
  
    // 6-10 years
    { event_type_id: 2, age_category_id: 2, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 2, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 4, age_category_id: 2, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 4, age_category_id: 2, gender: 'FEMALE', is_deleted: false, is_closed: false },
  
    // 11-14 years
    { event_type_id: 6, age_category_id: 3, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 6, age_category_id: 3, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 5, age_category_id: 3, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 5, age_category_id: 3, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 9, age_category_id: 3, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 9, age_category_id: 3, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 3, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 3, gender: 'FEMALE', is_deleted: false, is_closed: false },
  
    // 15-18 years
    { event_type_id: 5, age_category_id: 4, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 5, age_category_id: 4, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 6, age_category_id: 4, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 6, age_category_id: 4, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 7, age_category_id: 4, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 7, age_category_id: 4, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 9, age_category_id: 4, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 9, age_category_id: 4, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 4, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 4, gender: 'FEMALE', is_deleted: false, is_closed: false },
  
    // 19-24 years
    { event_type_id: 5, age_category_id: 5, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 5, age_category_id: 5, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 6, age_category_id: 5, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 6, age_category_id: 5, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 7, age_category_id: 5, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 7, age_category_id: 5, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 8, age_category_id: 5, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 8, age_category_id: 5, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 9, age_category_id: 5, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 9, age_category_id: 5, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 5, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 5, gender: 'FEMALE', is_deleted: false, is_closed: false },
  
    // 25-35 years
    { event_type_id: 5, age_category_id: 6, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 5, age_category_id: 6, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 6, age_category_id: 6, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 6, age_category_id: 6, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 7, age_category_id: 6, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 7, age_category_id: 6, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 8, age_category_id: 6, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 8, age_category_id: 6, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 9, age_category_id: 6, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 9, age_category_id: 6, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 6, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 6, gender: 'FEMALE', is_deleted: false, is_closed: false },
  
    // 36-49 years
    { event_type_id: 5, age_category_id: 7, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 5, age_category_id: 7, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 6, age_category_id: 7, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 6, age_category_id: 7, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 9, age_category_id: 7, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 9, age_category_id: 7, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 7, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 7, gender: 'FEMALE', is_deleted: false, is_closed: false },
  
    // 50-60 years
    { event_type_id: 4, age_category_id: 8, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 4, age_category_id: 8, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 5, age_category_id: 8, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 5, age_category_id: 8, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 8, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 8, gender: 'FEMALE', is_deleted: false, is_closed: false },
  
    // 61+ years MALE
    { event_type_id: 11, age_category_id: 9, gender: 'MALE', is_deleted: false, is_closed: false },
  
    // Team games category
    // Couple Relay mixed includes both MALE and FEMALE to participate together .
    { event_type_id: 12, age_category_id: 10, gender: 'MIXED', is_deleted: false, is_closed: false }, 
    // Relay for both MALE and FEMALE.
    { event_type_id: 13, age_category_id: 10, gender: 'MALE', is_deleted: false, is_closed: false },  
    { event_type_id: 13, age_category_id: 10, gender: 'FEMALE', is_deleted: false, is_closed: false },
    // Volleyball for MALE only
    { event_type_id: 14, age_category_id: 10, gender: 'MALE', is_deleted: false, is_closed: false },  
     // Throwball for FEMALE only
    { event_type_id: 15, age_category_id: 10, gender: 'FEMALE', is_deleted: false, is_closed: false },
    // Tug of War for both MALE and FEMALE.
    { event_type_id: 16, age_category_id: 10, gender: 'MALE', is_deleted: false, is_closed: false },  
    { event_type_id: 16, age_category_id: 10, gender: 'FEMALE', is_deleted: false, is_closed: false },
    // 61+ years FEMALE
    { event_type_id: 11, age_category_id: 9, gender: 'FEMALE', is_deleted: false, is_closed: false },
  ];
  


  for (const event of events) {
    await prisma.mst_event.create({
      data: event
    });
  }

  // Seed event results
  const eventResults = [
    // Frog Jump - 15 mts (no points, only ranks)
    { event_type_id: 1, rank: 'FIRST', points: 0 },
    { event_type_id: 1, rank: 'SECOND', points: 0 },
    { event_type_id: 1, rank: 'THIRD', points: 0 },
  
    // Frog Jump - 25 mts (no points, only ranks)
    { event_type_id: 2, rank: 'FIRST', points: 0 },
    { event_type_id: 2, rank: 'SECOND', points: 0 },
    { event_type_id: 2, rank: 'THIRD', points: 0 },
  
    // Running - 25 mts (no points, only ranks)
    { event_type_id: 3, rank: 'FIRST', points: 0 },
    { event_type_id: 3, rank: 'SECOND', points: 0 },
    { event_type_id: 3, rank: 'THIRD', points: 0 },
  
    // Running - 50 mts 
    { event_type_id: 4, rank: 'FIRST', points: 5 },
    { event_type_id: 4, rank: 'SECOND', points: 3 },
    { event_type_id: 4, rank: 'THIRD', points: 1 },
  
    // Running - 100 mts
    { event_type_id: 5, rank: 'FIRST', points: 5 },
    { event_type_id: 5, rank: 'SECOND', points: 3 },
    { event_type_id: 5, rank: 'THIRD', points: 1 },
  
    // Running - 200 mts
    { event_type_id: 6, rank: 'FIRST', points: 5 },
    { event_type_id: 6, rank: 'SECOND', points: 3 },
    { event_type_id: 6, rank: 'THIRD', points: 1 },
  
    // Running - 400 mts
    { event_type_id: 7, rank: 'FIRST', points: 5 },
    { event_type_id: 7, rank: 'SECOND', points: 3 },
    { event_type_id: 7, rank: 'THIRD', points: 1 },
  
    // Running - 800 mts
    { event_type_id: 8, rank: 'FIRST', points: 5 },
    { event_type_id: 8, rank: 'SECOND', points: 3 },
    { event_type_id: 8, rank: 'THIRD', points: 1 },
  
    // Long Jump
    { event_type_id: 9, rank: 'FIRST', points: 5 },
    { event_type_id: 9, rank: 'SECOND', points: 3 },
    { event_type_id: 9, rank: 'THIRD', points: 1 },
  
    // Shot Put
    { event_type_id: 10, rank: 'FIRST', points: 5 },
    { event_type_id: 10, rank: 'SECOND', points: 3 },
    { event_type_id: 10, rank: 'THIRD', points: 1 },
  
    // Lucky Circle (no points, only ranks)
    { event_type_id: 11, rank: 'FIRST', points: 0 },
    { event_type_id: 11, rank: 'SECOND', points: 0 },
    { event_type_id: 11, rank: 'THIRD', points: 0 },
  
    // Couple Relay - 50 x 2
    { event_type_id: 12, rank: 'FIRST', points: 5 },
    { event_type_id: 12, rank: 'SECOND', points: 3 },
    { event_type_id: 12, rank: 'THIRD', points: 1 },
  
    // Relay - 100 x 4
    { event_type_id: 13, rank: 'FIRST', points: 10 },
    { event_type_id: 13, rank: 'SECOND', points: 6 },
    { event_type_id: 13, rank: 'THIRD', points: 3 },
  
    // Volleyball
    { event_type_id: 14, rank: 'FIRST', points: 10 },
    { event_type_id: 14, rank: 'SECOND', points: 5 },
  
    // Throwball
    { event_type_id: 15, rank: 'FIRST', points: 10 },
    { event_type_id: 15, rank: 'SECOND', points: 5 },
  
    // Tug of War
    { event_type_id: 16, rank: 'FIRST', points: 10 },
    { event_type_id: 16, rank: 'SECOND', points: 5 },
  ];
  

  for (const result of eventResults) {
      await prisma.mst_event_result.create({
        data: result
      });
    }

  // Seed system settings
  // Note: Dates are stored as ISO strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
  // Integers are stored as strings since the database column is TEXT
  const settings = [
    { name: 'lane_count', value: '8' },
    { name: 'AGE_CALC_CUTOFF_DATE', value: '2025-12-01'},
    { name: 'HOST_TEMPLE', value: 'MULKI'},
    { name: 'SEASON', value: '33'},
    { name: 'EVENT_DATE', value: '2025-12-21'},
    { name: 'REG_LAST_DATE_TEAM', value: '2025-12-13'},
    { name: 'REG_LAST_DATE_INDIVIDUAL', value: '2025-12-18'},
    { name: 'LAST_DATE_STATUS_UPDATE', value: '2025-12-18'},
    // { name: 'REG_LAST_DATE_TEAM', value: '2025-12-18T23:59:59+05:30'},
    // { name: 'REG_LAST_DATE_INDIVIDUAL', value: '2025-12-13T23:59:59+05:30'},
  ];

  for (const setting of settings) {
    await prisma.settings.upsert({
      where: { name: setting.name },
      update: { value: setting.value },
      create: setting
    });
  }

  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 