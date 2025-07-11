import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('Checking database data...\n');

    // Check age categories
    const ageCategories = await prisma.mst_age_category.findMany();
    console.log('Age Categories:', ageCategories.length);
    console.log(ageCategories.map(ac => `${ac.name} (${ac.from_age}-${ac.to_age})`));

    // Check event types
    const eventTypes = await prisma.mst_event_type.findMany();
    console.log('\nEvent Types:', eventTypes.length);
    console.log(eventTypes.map(et => `${et.name} (${et.type})`));

    // Check events
    const events = await prisma.mst_event.findMany({
      include: {
        event_type: true,
        age_category: true
      }
    });
    console.log('\nEvents:', events.length);
    console.log(events.map(e => `${e.event_type.name} - ${e.age_category.name} - ${e.gender}`));

    // Check temples
    const temples = await prisma.mst_temple.findMany();
    console.log('\nTemples:', temples.length);
    console.log(temples.map(t => t.name));

    // Check users
    const users = await prisma.user.findMany({
      include: {
        profile: true
      }
    });
    console.log('\nUsers:', users.length);
    console.log(users.map(u => `${u.username} - ${u.profile?.first_name} ${u.profile?.last_name}`));

    // Check registrations
    const registrations = await prisma.ind_event_registration.findMany({
      include: {
        user: {
          include: {
            temple: true
          }
        },
        event: {
          include: {
            event_type: true
          }
        }
      }
    });
    console.log('\nRegistrations:', registrations.length);
    console.log(registrations.map(r => `${r.user.first_name} ${r.user.last_name} - ${r.event.event_type.name} - ${r.status}`));

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 