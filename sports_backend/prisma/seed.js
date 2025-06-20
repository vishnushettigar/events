const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Seed temples
  const temples = [
    { code: 'SALIKERI', name: 'SALIKERI' },
    { code: 'BARKUR', name: 'BARKUR' },
    { code: 'HOSADURGA', name: 'HOSADURGA' },
    { code: 'MANJESHWARA', name: 'MANJESHWARA' },
    { code: 'ULLALA', name: 'ULLALA' },
    { code: 'SURATHKAL', name: 'SURATHKAL' },
    { code: 'HALEYANGADI', name: 'HALEYANGADI' },
    { code: 'MULKI', name: 'MULKI' },
    { code: 'PADUBIDRI', name: 'PADUBIDRI' },
    { code: 'YERMAL', name: 'YERMAL' },
    { code: 'KAPU', name: 'KAPU' },
    { code: 'KINNIMULKI', name: 'KINNIMULKI' },
    { code: 'KALYANPURA', name: 'KALYANPURA' },
    { code: 'KARKALA', name: 'KARKALA' },
    { code: 'SIDDAKATTE', name: 'SIDDAKATTE' },
    { code: 'MANGALORE', name: 'MANGALORE' }
  ];

  for (const temple of temples) {
    await prisma.mst_temple.upsert({
      where: { code: temple.code },
      update: {},
      create: temple
    });
  }

  // Seed roles
  const roles = [
    { name: 'PARTICIPANT' },
    { name: 'TEMPLE_ADMIN' },
    { name: 'SUPER_USER' },
    { name: 'STAFF' }
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
    { name: '6-10', from_age: 6, to_age: 10 },
    { name: '11-14', from_age: 11, to_age: 14 },
    { name: '15-18', from_age: 15, to_age: 18 },
    { name: '19-24', from_age: 19, to_age: 24 },
    { name: '25-35', from_age: 25, to_age: 35 },
    { name: '36-48', from_age: 36, to_age: 48 },
    { name: '49-60', from_age: 49, to_age: 60 },
    { name: 'All', from_age: 0, to_age: 99 },
    { name: '61 - 90', from_age: 61, to_age: 90 },
    { name: '0-5', from_age: 0, to_age: 5 }
  ];

  for (const ageCategory of ageCategories) {
    await prisma.mst_age_category.upsert({
      where: { name: ageCategory.name },
      update: {},
      create: ageCategory
    });
  }

  // Seed event types
  const eventTypes = [
    { name: 'Running - 50 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Running - 100 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Running - 200 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Running - 400 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Running - 800 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Running - 25 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Relay - 100 X 4', type: 'TEAM', participant_count: 4 },
    { name: 'Lucky Circle', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Ball Passing', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Volleyball', type: 'TEAM', participant_count: 9 },
    { name: 'Throwball', type: 'TEAM', participant_count: 10 },
    { name: 'Tug of War', type: 'TEAM', participant_count: 9 },
    { name: 'Couple Relay - 50 x 2', type: 'TEAM', participant_count: 2 },
    { name: 'Frog Jump - 25 mts', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Long jump', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'SHOT PUT', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Frog Jump - 15 mts', type: 'INDIVIDUAL', participant_count: 1 }
  ];

  for (const eventType of eventTypes) {
    await prisma.mst_event_type.upsert({
      where: { name: eventType.name },
      update: {},
      create: eventType
    });
  }

  // Seed events
  const events = [
    { event_type_id: 14, age_category_id: 1, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 1, age_category_id: 1, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 14, age_category_id: 1, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 1, age_category_id: 1, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 1, age_category_id: 2, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 2, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 15, age_category_id: 2, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 2, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 1, age_category_id: 2, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 2, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 15, age_category_id: 2, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 2, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 3, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 3, age_category_id: 3, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 4, age_category_id: 3, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 5, age_category_id: 3, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 15, age_category_id: 3, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 3, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 3, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 3, age_category_id: 3, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 4, age_category_id: 3, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 5, age_category_id: 3, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 15, age_category_id: 3, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 3, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 4, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 3, age_category_id: 4, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 4, age_category_id: 4, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 5, age_category_id: 4, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 15, age_category_id: 4, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 4, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 4, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 3, age_category_id: 4, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 4, age_category_id: 4, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 5, age_category_id: 4, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 15, age_category_id: 4, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 4, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 5, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 3, age_category_id: 5, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 4, age_category_id: 5, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 15, age_category_id: 5, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 5, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 5, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 3, age_category_id: 5, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 4, age_category_id: 5, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 15, age_category_id: 5, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 5, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 6, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 3, age_category_id: 6, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 6, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 6, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 3, age_category_id: 6, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 6, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 1, age_category_id: 7, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 7, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 7, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 1, age_category_id: 7, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 7, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 2, age_category_id: 7, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 10, age_category_id: 8, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 11, age_category_id: 8, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 12, age_category_id: 8, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 12, age_category_id: 8, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 7, age_category_id: 8, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 7, age_category_id: 8, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 13, age_category_id: 8, gender: 'ALL', is_deleted: false, is_closed: false },
    { event_type_id: 9, age_category_id: 9, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 8, age_category_id: 9, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 13, age_category_id: 10, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 13, age_category_id: 10, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 6, age_category_id: 10, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 6, age_category_id: 10, gender: 'FEMALE', is_deleted: false, is_closed: false },
    { event_type_id: 8, age_category_id: 9, gender: 'MALE', is_deleted: false, is_closed: false },
    { event_type_id: 9, age_category_id: 9, gender: 'FEMALE', is_deleted: false, is_closed: false }
  ];

  for (const event of events) {
    await prisma.mst_event.create({
      data: event
    });
  }

  // Seed event results
  const eventResults = [
    { event_type_id: 1, rank: 'FIRST', points: 5 },
    { event_type_id: 1, rank: 'SECOND', points: 3 },
    { event_type_id: 1, rank: 'THIRD', points: 1 },
    { event_type_id: 2, rank: 'FIRST', points: 5 },
    { event_type_id: 2, rank: 'SECOND', points: 3 },
    { event_type_id: 2, rank: 'THIRD', points: 1 },
    { event_type_id: 3, rank: 'FIRST', points: 5 },
    { event_type_id: 3, rank: 'SECOND', points: 3 },
    { event_type_id: 3, rank: 'THIRD', points: 1 },
    { event_type_id: 4, rank: 'FIRST', points: 5 },
    { event_type_id: 4, rank: 'SECOND', points: 3 },
    { event_type_id: 4, rank: 'THIRD', points: 1 },
    { event_type_id: 5, rank: 'FIRST', points: 5 },
    { event_type_id: 5, rank: 'SECOND', points: 3 },
    { event_type_id: 5, rank: 'THIRD', points: 1 },
    { event_type_id: 6, rank: 'FIRST', points: 5 },
    { event_type_id: 6, rank: 'SECOND', points: 3 },
    { event_type_id: 6, rank: 'THIRD', points: 1 },
    { event_type_id: 7, rank: 'FIRST', points: 10 },
    { event_type_id: 7, rank: 'SECOND', points: 5 },
    { event_type_id: 7, rank: 'THIRD', points: 3 },
    { event_type_id: 8, rank: 'FIRST', points: 5 },
    { event_type_id: 8, rank: 'SECOND', points: 3 },
    { event_type_id: 8, rank: 'THIRD', points: 1 },
    { event_type_id: 9, rank: 'FIRST', points: 5 },
    { event_type_id: 9, rank: 'SECOND', points: 3 },
    { event_type_id: 9, rank: 'THIRD', points: 1 },
    { event_type_id: 10, rank: 'FIRST', points: 10 },
    { event_type_id: 10, rank: 'SECOND', points: 5 },
    { event_type_id: 11, rank: 'FIRST', points: 10 },
    { event_type_id: 11, rank: 'SECOND', points: 5 },
    { event_type_id: 12, rank: 'FIRST', points: 10 },
    { event_type_id: 12, rank: 'SECOND', points: 5 },
    { event_type_id: 13, rank: 'FIRST', points: 5 },
    { event_type_id: 13, rank: 'SECOND', points: 3 },
    { event_type_id: 13, rank: 'THIRD', points: 1 },
    { event_type_id: 14, rank: 'FIRST', points: 5 },
    { event_type_id: 14, rank: 'SECOND', points: 3 },
    { event_type_id: 14, rank: 'THIRD', points: 1 },
    { event_type_id: 15, rank: 'FIRST', points: 5 },
    { event_type_id: 15, rank: 'SECOND', points: 3 },
    { event_type_id: 15, rank: 'THIRD', points: 1 }
  ];

  for (const result of eventResults) {
      await prisma.mst_event_result.create({
        data: result
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