const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function registerParticipant(user_id, event_id) {
  try {
    // First check if user has already registered for 3 events
    const existingRegistrations = await prisma.ind_event_registration.findMany({
      where: {
        user_id: user_id,
        is_deleted: false,
        status: {
          in: ['PENDING', 'ACCEPTED']
        }
      }
    });

    if (existingRegistrations.length >= 3) {
      throw new Error('You can only register for a maximum of 3 events. Please cancel one of your existing registrations to register for a new event.');
    }

    // Check if user exists and get temple_id
  const user = await prisma.profile.findUnique({
    where: { id: user_id },
    select: { temple_id: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

    // Check if event exists
  const event = await prisma.mst_event.findUnique({
      where: { id: event_id }
  });

  if (!event) {
    throw new Error('Event not found');
  }

    // Check if already registered
    const existingRegistration = await prisma.ind_event_registration.findFirst({
      where: {
        user_id: user_id,
        event_id: event_id,
        is_deleted: false
      }
    });

    if (existingRegistration) {
      throw new Error('Already registered for this event');
    }

    // Count temple registrations for this event
    const templeRegistrations = await prisma.ind_event_registration.findMany({
      where: {
        event_id: event_id,
        is_deleted: false,
        status: {
          in: ['PENDING', 'ACCEPTED']
        },
        user: {
          temple_id: user.temple_id
        }
      }
    });

    // Determine registration status based on temple registration count
    const status = templeRegistrations.length < 3 ? 'ACCEPTED' : 'PENDING';

    // Create registration
  const registration = await prisma.ind_event_registration.create({
    data: {
        user_id: user_id,
        event_id: event_id,
        status: status,
        is_deleted: false
    }
  });

    // Create audit log
  await prisma.audit_log.create({
    data: {
        user_id: user_id,
        action: 'REGISTER_EVENT',
        table_name: 'Ind_event_registration',
        record_id: registration.id,
        new_value: JSON.stringify(registration)
    }
  });

  return registration;
  } catch (error) {
    console.error('Error in registerParticipant:', error);
    throw error;
  }
}

async function registerTeamEvent(temple_id, event_id, member_user_ids) {
  // Verify all members belong to the same temple
  const members = await prisma.profile.findMany({
    where: {
      id: { in: member_user_ids }
    },
    select: { temple_id: true }
  });

  const invalidMembers = members.filter(member => member.temple_id !== temple_id);
  if (invalidMembers.length > 0) {
    throw new Error('All team members must belong to the same temple');
  }

  // Get event details to check temple
  const event = await prisma.mst_event.findUnique({
    where: { id: event_id },
    select: { temple_id: true }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // Check if temple matches event's temple
  if (temple_id !== event.temple_id) {
    throw new Error('Cannot register for events from other temples');
  }

  const registration = await prisma.team_event_registration.create({
    data: {
      temple_id,
      event_id,
      member_user_ids: member_user_ids.join(',')
    }
  });

  // Log the action
  await prisma.audit_log.create({
    data: {
      user_id: member_user_ids[0], // Log with first member's ID
      action: 'REGISTER_TEAM',
      details: `Registered team for event ${event_id}`
    }
  });

  return registration;
}

async function updateEventResult(event_id, result_id, staff_user_id) {
  // Get event details
  const event = await prisma.mst_event.findUnique({
    where: { id: event_id },
    select: { temple_id: true }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // Verify the staff member exists
  const staffMember = await prisma.profile.findUnique({
    where: { id: staff_user_id },
    select: { role_id: true }
  });

  if (!staffMember) {
    throw new Error('Staff member not found');
  }

  // Staff can update results for any temple
  const updatedEvent = await prisma.ind_event_registration.update({
    where: { id: event_id },
    data: { event_result_id: result_id }
  });

  // Log the action
  await prisma.audit_log.create({
    data: {
      user_id: staff_user_id,
      action: 'UPDATE_RESULT',
      details: `Updated result for event ${event_id}`
    }
  });

  return updatedEvent;
}

async function updateRegistrationStatus(registration_id, status, temple_admin_id) {
  // Verify the temple admin exists and has the correct role
  const admin = await prisma.profile.findUnique({
    where: { id: temple_admin_id },
    select: { role_id: true, temple_id: true }
  });

  if (!admin || admin.role_id !== 2) { // Assuming 2 is TEMPLE_ADMIN role_id
    throw new Error('Unauthorized: Only temple admins can update registration status');
  }

  // Get the registration details
  const registration = await prisma.ind_event_registration.findUnique({
    where: { id: registration_id },
    include: {
      user: {
        select: { temple_id: true }
      }
    }
  });

  if (!registration) {
    throw new Error('Registration not found');
  }

  // Verify the temple admin belongs to the same temple as the user
  if (admin.temple_id !== registration.user.temple_id) {
    throw new Error('Unauthorized: Cannot manage registrations from other temples');
  }

  // Map the status to the correct enum value
  let mappedStatus;
  switch (status.toUpperCase()) {
    case 'APPROVED':
      mappedStatus = 'ACCEPTED';
      break;
    case 'REJECTED':
      mappedStatus = 'DECLINED';
      break;
    case 'PENDING':
      mappedStatus = 'PENDING';
      break;
    default:
      throw new Error('Invalid status. Must be one of: PENDING, APPROVED, REJECTED');
  }

  const updatedRegistration = await prisma.ind_event_registration.update({
    where: { id: registration_id },
    data: { status: mappedStatus }
  });

  // Log the action
  await prisma.audit_log.create({
    data: {
      user_id: temple_admin_id,
      action: 'UPDATE_REGISTRATION_STATUS',
      table_name: 'Ind_event_registration',
      record_id: registration_id,
      old_value: JSON.stringify({ status: registration.status }),
      new_value: JSON.stringify({ status: mappedStatus })
    }
  });

  return updatedRegistration;
}

async function getTempleParticipants(temple_id, filters = {}) {
  try {
    console.log('getTempleParticipants called with:', { temple_id, filters });

    // First verify the temple exists
    const temple = await prisma.mst_temple.findUnique({
      where: { id: temple_id }
    });

    if (!temple) {
      console.error('Temple not found:', temple_id);
      throw new Error(`Temple with ID ${temple_id} not found`);
    }

    console.log('Found temple:', temple);

    // First check if there are any users from this temple
    const templeUsers = await prisma.profile.count({
      where: {
        temple_id: temple_id,
        is_deleted: false
      }
    });
    console.log('Number of users in temple:', templeUsers);

    const where = {
      user: {
        temple_id: temple_id
      },
      is_deleted: false
    };

    // Add optional filters
    if (filters.event_ids && filters.event_ids.length > 0) {
      where.event_id = {
        in: filters.event_ids
      };
    } else if (filters.event_id) {
      where.event_id = filters.event_id;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    console.log('Query where clause:', JSON.stringify(where, null, 2));

    // First try a count query to verify we can find records
    const count = await prisma.ind_event_registration.count({
      where
    });
    console.log('Found registration count:', count);

    if (count === 0) {
      console.log('No registrations found for temple:', temple_id);
      return []; // Return empty array instead of throwing error
    }

    const participants = await prisma.ind_event_registration.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            gender: true,
            dob: true,
            user: {
              select: {
                email: true
              }
            }
          }
        },
        event: {
          include: {
            event_type: {
              select: {
                name: true,
                type: true
              }
            }
          }
        },
        event_result: {
          select: {
            rank: true,
            points: true
          }
        }
      }
    });

    // Transform the data to include event name from event_type and ensure email is available
    const transformedParticipants = participants.map(participant => ({
      ...participant,
      user: {
        ...participant.user,
        email: participant.user.email || participant.user.user?.email || null
      },
      event: {
        ...participant.event,
        name: participant.event.event_type.name
      }
    }));

    console.log('Query result:', {
      participantCount: transformedParticipants.length,
      firstParticipant: transformedParticipants[0] || null
    });

    return transformedParticipants;
  } catch (error) {
    console.error('Error in getTempleParticipants:', {
      error: error.message,
      stack: error.stack,
      temple_id,
      filters
    });
    throw error;
  }
}

async function getTempleTeams(temple_id, filters = {}) {
  const where = {
    temple_id: temple_id,
    is_deleted: false
  };

  if (filters.event_id) {
    where.event_id = filters.event_id;
  }

  const teams = await prisma.team_event_registration.findMany({
    where,
    include: {
      event: {
        select: {
          name: true,
          event_type: {
            select: {
              name: true,
              type: true
            }
          }
        }
      },
      event_result: {
        select: {
          rank: true,
          points: true
        }
      }
    }
  });

  // Get member details for each team
  const teamsWithMembers = await Promise.all(teams.map(async (team) => {
    const memberIds = team.member_user_ids.split(',').map(id => parseInt(id));
    const members = await prisma.profile.findMany({
      where: { id: { in: memberIds } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        gender: true,
        dob: true
      }
    });
    return { ...team, members };
  }));

  return teamsWithMembers;
}

async function generateTempleReport(temple_id) {
  // Get all participants and their results
  const participants = await getTempleParticipants(temple_id);
  
  // Get all teams and their results
  const teams = await getTempleTeams(temple_id);

  // Calculate statistics
  const stats = {
    total_participants: participants.length,
    total_teams: teams.length,
    individual_events: {},
    team_events: {},
    medals: {
      gold: 0,
      silver: 0,
      bronze: 0
    },
    total_points: 0
  };

  // Process individual event results
  participants.forEach(participant => {
    const eventName = participant.event.name;
    if (!stats.individual_events[eventName]) {
      stats.individual_events[eventName] = {
        participants: 0,
        medals: { gold: 0, silver: 0, bronze: 0 }
      };
    }
    stats.individual_events[eventName].participants++;

    if (participant.event_result) {
      if (participant.event_result.rank === 'FIRST') {
        stats.medals.gold++;
        stats.individual_events[eventName].medals.gold++;
      } else if (participant.event_result.rank === 'SECOND') {
        stats.medals.silver++;
        stats.individual_events[eventName].medals.silver++;
      } else if (participant.event_result.rank === 'THIRD') {
        stats.medals.bronze++;
        stats.individual_events[eventName].medals.bronze++;
      }
      stats.total_points += participant.event_result.points;
    }
  });

  // Process team event results
  teams.forEach(team => {
    const eventName = team.event.name;
    if (!stats.team_events[eventName]) {
      stats.team_events[eventName] = {
        teams: 0,
        medals: { gold: 0, silver: 0, bronze: 0 }
      };
    }
    stats.team_events[eventName].teams++;

    if (team.event_result) {
      if (team.event_result.rank === 'FIRST') {
        stats.medals.gold++;
        stats.team_events[eventName].medals.gold++;
      } else if (team.event_result.rank === 'SECOND') {
        stats.medals.silver++;
        stats.team_events[eventName].medals.silver++;
      } else if (team.event_result.rank === 'THIRD') {
        stats.medals.bronze++;
        stats.team_events[eventName].medals.bronze++;
      }
      stats.total_points += team.event_result.points;
    }
  });

  return {
    temple_id,
    stats,
    participants,
    teams
  };
}


//get age categories

async function getAgeCategories() {
  try {
    console.log('Fetching age categories...');
    const ageCategories = await prisma.mst_age_category.findMany({
      where: {
        is_deleted: false
      },
      select: {
        id: true,
        name: true,
        from_age: true,
        to_age: true
      },
      orderBy: {
        from_age: 'asc'
      }
    });
    console.log('Found age categories:', ageCategories);
    return ageCategories;
  } catch (error) {
    console.error('Error in getAgeCategories:', error);
    throw error;
  }
}

async function getEventsByAgeCategory(ageCategory, gender) {
  try {
    console.log('Fetching events for age category:', ageCategory, 'and gender:', gender);

    // Build the where clause
    const whereClause = {
      is_deleted: false,
      event_type: {
        type: 'INDIVIDUAL'
      }
    };

    // If age category is not "All", add age category filter
    if (ageCategory !== 'All') {
      // First get the age category details
      const ageGroup = await prisma.mst_age_category.findFirst({
        where: {
          name: ageCategory,
          is_deleted: false
        }
      });

      if (!ageGroup) {
        console.log('Age category not found:', ageCategory);
        throw new Error('Age category not found');
      }

      console.log('Found age group:', ageGroup);
      whereClause.age_category_id = ageGroup.id;
    }

    // Add gender filter if specified
    if (gender) {
      whereClause.gender = gender;
    }

    console.log('Using where clause:', whereClause);

    // Get individual events with proper joins
    const events = await prisma.mst_event.findMany({
      where: whereClause,
      include: {
        event_type: true,
        age_category: true
      }
    });

    console.log('Found events:', events);

    // Transform the data to include event type details directly
    const transformedEvents = events.map(event => ({
      id: event.id,
      name: event.event_type.name,
      type: event.event_type.type,
      gender: event.gender,
      age_category_id: event.age_category_id,
      age_category: event.age_category.name,
      participant_count: event.event_type.participant_count
    }));

    // Sort events by name
    transformedEvents.sort((a, b) => a.name.localeCompare(b.name));

    console.log('Transformed events:', transformedEvents);
    return transformedEvents;
  } catch (error) {
    console.error('Error in getEventsByAgeCategory:', error);
    throw error;
  }
}

module.exports = {
  registerParticipant,
  registerTeamEvent,
  updateEventResult,
  updateRegistrationStatus,
  getTempleParticipants,
  getTempleTeams,
  generateTempleReport,
  getAgeCategories,
  getEventsByAgeCategory
}; 