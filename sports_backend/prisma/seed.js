const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Seed temples
  const temples = [
    { code: 'BARKUR', name: 'BARKUR' },
    { code: 'HALEYANGADI', name: 'HALEYANGADI' },
    { code: 'HOSADURGA', name: 'HOSADURGA' },
    { code: 'KALYANPURA', name: 'KALYANPURA' },
    { code: 'KAPU', name: 'KAPU' },
    { code: 'KARKALA', name: 'KARKALA' },
    { code: 'KINNIMULKI', name: 'KINNIMULKI' },
    { code: 'MANGALORE', name: 'MANGALORE' },
    { code: 'MANJESHWARA', name: 'MANJESHWARA' },
    { code: 'MULKI', name: 'MULKI' },
    { code: 'PADUBIDRI', name: 'PADUBIDRI' },
    { code: 'SALIKERI', name: 'SALIKERI' },
    { code: 'SIDDAKATTE', name: 'SIDDAKATTE' },
    { code: 'SURATHKAL', name: 'SURATHKAL' },
    { code: 'ULLALA', name: 'ULLALA' },
    { code: 'YERMAL', name: 'YERMAL' }
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

  // Seed event types
  const eventTypes = [
    { name: '100m Race', type: 'INDIVIDUAL', participant_count: 1 },
    { name: '200m Race', type: 'INDIVIDUAL', participant_count: 1 },
    { name: '400m Race', type: 'INDIVIDUAL', participant_count: 1 },
    { name: '800m Race', type: 'INDIVIDUAL', participant_count: 1 },
    { name: '1500m Race', type: 'INDIVIDUAL', participant_count: 1 },
    { name: '4x100m Relay', type: 'TEAM', participant_count: 4 },
    { name: '4x400m Relay', type: 'TEAM', participant_count: 4 },
    { name: 'Long Jump', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'High Jump', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Shot Put', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Discus Throw', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Javelin Throw', type: 'INDIVIDUAL', participant_count: 1 },
    { name: 'Tug of War', type: 'TEAM', participant_count: 8 },
    { name: 'Kabaddi', type: 'TEAM', participant_count: 7 },
    { name: 'Kho-Kho', type: 'TEAM', participant_count: 9 }
  ];

  for (const eventType of eventTypes) {
    await prisma.mst_event_type.upsert({
      where: { name: eventType.name },
      update: {},
      create: eventType
    });
  }

  // Seed age categories
  const ageCategories = [
    { name: 'Under 12', from_age: 0, to_age: 12 },
    { name: 'Under 15', from_age: 13, to_age: 15 },
    { name: 'Under 18', from_age: 16, to_age: 18 },
    { name: 'Under 21', from_age: 19, to_age: 21 },
    { name: 'Open', from_age: 22, to_age: 35 },
    { name: 'Senior', from_age: 36, to_age: 50 },
    { name: 'Veteran', from_age: 51, to_age: 100 }
  ];

  for (const ageCategory of ageCategories) {
    await prisma.mst_age_category.upsert({
      where: { name: ageCategory.name },
      update: {},
      create: ageCategory
    });
  }

  // Seed event results
  const eventResults = [
    { event_type_id: 1, rank: 'FIRST', points: 10 },  // 100m Race
    { event_type_id: 1, rank: 'SECOND', points: 8 },
    { event_type_id: 1, rank: 'THIRD', points: 6 },
    { event_type_id: 6, rank: 'FIRST', points: 15 },  // 4x100m Relay
    { event_type_id: 6, rank: 'SECOND', points: 12 },
    { event_type_id: 6, rank: 'THIRD', points: 9 },
    { event_type_id: 13, rank: 'FIRST', points: 20 }, // Tug of War
    { event_type_id: 13, rank: 'SECOND', points: 15 },
    { event_type_id: 13, rank: 'THIRD', points: 10 },
    { event_type_id: 14, rank: 'FIRST', points: 25 }, // Kabaddi
    { event_type_id: 14, rank: 'SECOND', points: 20 },
    { event_type_id: 14, rank: 'THIRD', points: 15 }
  ];

  for (const result of eventResults) {
    await prisma.mst_event_result.upsert({
      where: {
        event_type_id_rank: {
          event_type_id: result.event_type_id,
          rank: result.rank
        }
      },
      update: {},
      create: result
    });
  }

  // Create a super user
  const superUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123', // In production, this should be hashed
      email: 'admin@example.com',
      profile: {
        create: {
          first_name: 'Super',
          last_name: 'Admin',
          email: 'admin@example.com',
          phone: '1234567890',
          dob: new Date('1990-01-01'),
          gender: 'MALE',
          role_id: 3, // SUPER_USER role
          temple_id: 1 // BARKUR temple
        }
      }
    }
  });

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