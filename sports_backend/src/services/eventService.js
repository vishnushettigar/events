import { PrismaClient } from '@prisma/client';
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
  try {
    console.log('registerTeamEvent called with:', { temple_id, event_id, member_user_ids });

  // Verify all members belong to the same temple
  const members = await prisma.profile.findMany({
    where: {
      id: { in: member_user_ids }
    },
      select: { temple_id: true, id: true }
  });

    console.log('Found members:', members);

    // Check if all requested members were found
    if (members.length !== member_user_ids.length) {
      const foundIds = members.map(m => m.id);
      const missingIds = member_user_ids.filter(id => !foundIds.includes(id));
      throw new Error(`Some member IDs not found: ${missingIds.join(', ')}`);
    }

  const invalidMembers = members.filter(member => member.temple_id !== temple_id);
  if (invalidMembers.length > 0) {
      throw new Error(`All team members must belong to the same temple. Invalid members: ${invalidMembers.map(m => m.id).join(', ')}`);
  }

    // Verify the event exists
  const event = await prisma.mst_event.findUnique({
      where: { id: event_id }
  });

    console.log('Found event:', event);

  if (!event) {
      throw new Error(`Event with ID ${event_id} not found`);
  }

    // Check if team is already registered for this event
    const existingRegistration = await prisma.team_event_registration.findFirst({
      where: {
        temple_id: temple_id,
        event_id: event_id,
        is_deleted: false
      }
    });

    if (existingRegistration) {
      throw new Error('Team already registered for this event');
    }

    console.log('Creating team registration...');

  const registration = await prisma.team_event_registration.create({
    data: {
      temple_id,
      event_id,
        member_user_ids: member_user_ids.join(','),
        status: 'ACCEPTED' // Temple admins can directly register teams as accepted
    }
  });

    console.log('Team registration created:', registration);

  // Log the action
  await prisma.audit_log.create({
    data: {
      user_id: member_user_ids[0], // Log with first member's ID
      action: 'REGISTER_TEAM',
        table_name: 'Team_event_registration',
        record_id: registration.id,
        new_value: JSON.stringify(registration)
    }
  });

    console.log('Audit log created successfully');

  return registration;
  } catch (error) {
    console.error('Error in registerTeamEvent:', error);
    throw error;
  }
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
          },
          age_category: {
            select: {
              name: true
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
  try {
    console.log('getTempleTeams called with:', { temple_id, filters });

  const where = {
    temple_id: temple_id,
    is_deleted: false
  };

  if (filters.event_id) {
    where.event_id = filters.event_id;
  }

    console.log('Using where clause:', where);

  const teams = await prisma.team_event_registration.findMany({
    where,
    include: {
      event: {
          include: {
            event_type: true,
            age_category: {
        select: {
                name: true
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

    console.log('Found teams:', teams);

  // Get member details for each team
  const teamsWithMembers = await Promise.all(teams.map(async (team) => {
      try {
        const memberIds = team.member_user_ids ? team.member_user_ids.split(',').map(id => parseInt(id)) : [];
        console.log('Member IDs for team', team.id, ':', memberIds);
        
    const members = await prisma.profile.findMany({
      where: { id: { in: memberIds } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        gender: true,
            dob: true,
            aadhar_number: true
      }
    });
        
        console.log('Found members for team', team.id, ':', members);
        
        return { 
          ...team, 
          members,
          event: {
            ...team.event,
            name: team.event?.event_type?.name || 'Unknown Event'
          }
        };
      } catch (error) {
        console.error('Error processing team', team.id, ':', error);
        return { 
          ...team, 
          members: [],
          event: {
            ...team.event,
            name: team.event?.event_type?.name || 'Unknown Event'
          }
        };
      }
  }));

    console.log('Teams with members:', teamsWithMembers);
  return teamsWithMembers;
  } catch (error) {
    console.error('Error in getTempleTeams:', error);
    throw error;
  }
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

async function getTeamEvents() {
  try {
    console.log('Fetching team events...');

    // Get team events with proper joins
    const events = await prisma.mst_event.findMany({
      where: {
        is_deleted: false,
        event_type: {
          type: 'TEAM'
        }
      },
      include: {
        event_type: true,
        age_category: true
      }
    });

    console.log('Found team events:', events);

    // Transform the data to include event type details and registered temples
    const transformedEvents = await Promise.all(events.map(async (event) => {
      // Get registered temples for this event
      const teamRegistrations = await prisma.team_event_registration.findMany({
        where: {
          event_id: event.id,
          is_deleted: false
        },
        include: {
          temple: true,
          event_result: true
        }
      });

      // Group registrations by temple and count teams/members
      const templeStats = {};
      teamRegistrations.forEach(registration => {
        const templeId = registration.temple_id;
        const templeName = registration.temple.name;
        
        if (!templeStats[templeId]) {
                  templeStats[templeId] = {
          temple_name: templeName,
          team_count: 0,
          member_count: 0,
          result: null,
          registration_ids: []
        };
        }
        
        templeStats[templeId].team_count += 1;
        templeStats[templeId].registration_ids.push(registration.id);
        if (registration.member_user_ids) {
          templeStats[templeId].member_count += registration.member_user_ids.split(',').length;
        }
        // Store the result from the first registration (assuming all registrations for a temple have the same result)
        if (registration.event_result && !templeStats[templeId].result) {
          templeStats[templeId].result = {
            rank: registration.event_result.rank,
            points: registration.event_result.points
          };
        }
      });

      const registeredTemples = Object.values(templeStats);

      return {
        id: event.id,
        event_type: {
          name: event.event_type.name,
          type: event.event_type.type,
          participant_count: event.event_type.participant_count
        },
        gender: event.gender,
        age_category_id: event.age_category_id,
        age_category: event.age_category.name,
        registered_temples: registeredTemples
      };
    }));

    // Sort events by name
    transformedEvents.sort((a, b) => a.event_type.name.localeCompare(b.event_type.name));

    console.log('Transformed team events with registered temples:', transformedEvents);
    return transformedEvents;
  } catch (error) {
    console.error('Error in getTeamEvents:', error);
    throw error;
  }
}

// Get participants for a specific event
async function getEventParticipants(eventId) {
  try {
    console.log('Fetching participants for event:', eventId);

    // First, get the event details to determine if it's individual or team
    const event = await prisma.mst_event.findFirst({
      where: { 
        id: eventId,
        is_deleted: false
      },
      include: {
        event_type: true,
        age_category: true
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    console.log('Event found:', event);
    console.log('Event type:', event.event_type.type);

    let participants = [];

    if (event.event_type.type === 'INDIVIDUAL') {
      console.log('Fetching individual registrations for event:', eventId);
      
      // First, let's check if there are any registrations at all
      const registrationCount = await prisma.ind_event_registration.count({
        where: {
          event_id: eventId,
          is_deleted: false,
          status: 'ACCEPTED'
        }
      });
      console.log('Total approved individual registrations found:', registrationCount);

      // Get individual registrations for this event
      const individualRegistrations = await prisma.ind_event_registration.findMany({
        where: {
          event_id: eventId,
          is_deleted: false,
          status: 'ACCEPTED'
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              aadhar_number: true,
              gender: true,
              dob: true,
              temple: {
                select: {
                  name: true
                }
              }
            }
          },
          event_result: true
        }
      });

      console.log('Individual registrations found:', individualRegistrations.length);
      console.log('First registration sample:', individualRegistrations[0] || 'None');

      participants = individualRegistrations.map(reg => ({
        id: reg.id,
        registration_type: 'INDIVIDUAL',
        participant_name: `${reg.user.first_name} ${reg.user.last_name || ''}`.trim(),
        temple_name: reg.user.temple.name,
        age_category: event.age_category.name,
        gender: reg.user.gender,
        phone: reg.user.phone,
        aadhar_number: reg.user.aadhar_number,
        registration_status: reg.status,
        result: reg.event_result ? {
          rank: reg.event_result.rank,
          points: reg.event_result.points
        } : null,
        registered_at: reg.created_at
      }));

    } else if (event.event_type.type === 'TEAM') {
      console.log('Fetching team registrations for event:', eventId);
      
      // First, let's check if there are any team registrations
      const teamRegistrationCount = await prisma.team_event_registration.count({
        where: {
          event_id: eventId,
          is_deleted: false,
          status: 'ACCEPTED'
        }
      });
      console.log('Total approved team registrations found:', teamRegistrationCount);

      // Get team registrations for this event
      const teamRegistrations = await prisma.team_event_registration.findMany({
        where: {
          event_id: eventId,
          is_deleted: false,
          status: 'ACCEPTED'
        },
        include: {
          temple: true,
          event_result: true
        }
      });

      console.log('Team registrations found:', teamRegistrations.length);
      console.log('First team registration sample:', teamRegistrations[0] || 'None');

      participants = teamRegistrations.map(reg => ({
        id: reg.id,
        registration_type: 'TEAM',
        team_name: `${reg.temple.name} Team`,
        temple_name: reg.temple.name,
        age_category: event.age_category.name,
        gender: event.gender,
        member_count: reg.member_user_ids ? reg.member_user_ids.split(',').length : 0,
        registration_status: reg.status,
        result: reg.event_result ? {
          rank: reg.event_result.rank,
          points: reg.event_result.points
        } : null,
        registered_at: reg.created_at
      }));
    }

    console.log('Final participants array length:', participants.length);
    console.log('First participant sample:', participants[0] || 'None');
    return participants;

  } catch (error) {
    console.error('Error in getEventParticipants:', error);
    throw error;
  }
}

async function updateTeamRegistration(registrationId, member_user_ids, temple_admin_id) {
  try {
    console.log('updateTeamRegistration called with:', { registrationId, member_user_ids, temple_admin_id });

    // Get the existing registration
    const existingRegistration = await prisma.team_event_registration.findUnique({
      where: { id: registrationId },
      include: {
        temple: true,
        event: {
          include: {
            event_type: true
          }
        }
      }
    });

    if (!existingRegistration) {
      throw new Error('Team registration not found');
    }

    // Verify the temple admin exists and has the correct role
    const admin = await prisma.profile.findUnique({
      where: { id: temple_admin_id },
      select: { role_id: true, temple_id: true }
    });

    if (!admin || admin.role_id !== 2) { // Assuming 2 is TEMPLE_ADMIN role_id
      throw new Error('Unauthorized: Only temple admins can update team registrations');
    }

    // Verify the temple admin belongs to the same temple as the team
    if (admin.temple_id !== existingRegistration.temple_id) {
      throw new Error('Unauthorized: Cannot update teams from other temples');
    }

    // Verify all new members belong to the same temple
    const members = await prisma.profile.findMany({
      where: {
        id: { in: member_user_ids }
      },
      select: { temple_id: true, id: true }
    });

    console.log('Found members:', members);

    // Check if all requested members were found
    if (members.length !== member_user_ids.length) {
      const foundIds = members.map(m => m.id);
      const missingIds = member_user_ids.filter(id => !foundIds.includes(id));
      throw new Error(`Some member IDs not found: ${missingIds.join(', ')}`);
    }

    const invalidMembers = members.filter(member => member.temple_id !== existingRegistration.temple_id);
    if (invalidMembers.length > 0) {
      throw new Error(`All team members must belong to the same temple. Invalid members: ${invalidMembers.map(m => m.id).join(', ')}`);
    }

    console.log('Updating team registration...');

    const updatedRegistration = await prisma.team_event_registration.update({
      where: { id: registrationId },
      data: {
        member_user_ids: member_user_ids.join(','),
        modified_at: new Date()
      },
      include: {
        temple: true,
        event: {
          include: {
            event_type: true
          }
        }
      }
    });

    console.log('Team registration updated:', updatedRegistration);

    // Log the action
    await prisma.audit_log.create({
      data: {
        user_id: temple_admin_id,
        action: 'UPDATE_TEAM',
        table_name: 'Team_event_registration',
        record_id: registrationId,
        old_value: JSON.stringify(existingRegistration),
        new_value: JSON.stringify(updatedRegistration)
      }
    });

    console.log('Audit log created successfully');

    return updatedRegistration;
  } catch (error) {
    console.error('Error in updateTeamRegistration:', error);
    throw error;
  }
}

// Get event result ID by rank and event type
async function getEventResultId(eventTypeId, rank) {
  try {
    const result = await prisma.mst_event_result.findFirst({
      where: {
        event_type_id: eventTypeId,
        rank: rank
      }
    });
    return result?.id;
  } catch (error) {
    console.error('Error getting event result ID:', error);
    throw error;
  }
}

// Update individual event result
async function updateIndividualEventResult(registrationId, rank, staffUserId) {
  try {
    console.log('Updating individual event result:', { registrationId, rank, staffUserId });

    // Get the registration with event details
    const registration = await prisma.ind_event_registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          include: {
            event_type: true
          }
        }
      }
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    let resultId = null;
    let rankValue = null;

    if (rank === 'CLEAR') {
      // Clear the result by setting event_result_id to null
      resultId = null;
      rankValue = 'CLEARED';
    } else {
      // Get the event result ID for the specified rank
      resultId = await getEventResultId(registration.event.event_type_id, rank);
      if (!resultId) {
        throw new Error(`Result not found for rank: ${rank}`);
      }
      rankValue = rank;
    }

    // Update the registration with the result
    const updatedRegistration = await prisma.ind_event_registration.update({
      where: { id: registrationId },
      data: { 
        event_result_id: resultId,
        modified_at: new Date()
      },
      include: {
        event_result: true,
        user: true
      }
    });

    // Log the action
    await prisma.audit_log.create({
      data: {
        user_id: staffUserId,
        action: 'UPDATE_INDIVIDUAL_RESULT',
        table_name: 'Ind_event_registration',
        record_id: registrationId,
        old_value: JSON.stringify({ event_result_id: registration.event_result_id }),
        new_value: JSON.stringify({ event_result_id: resultId, rank: rankValue })
      }
    });

    console.log('Individual event result updated successfully');
    return updatedRegistration;
  } catch (error) {
    console.error('Error updating individual event result:', error);
    throw error;
  }
}

// Update team event result
async function updateTeamEventResult(registrationId, rank, staffUserId) {
  try {
    console.log('Updating team event result:', { registrationId, rank, staffUserId });

    // Get the registration with event details
    const registration = await prisma.team_event_registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          include: {
            event_type: true
          }
        }
      }
    });

    if (!registration) {
      throw new Error('Team registration not found');
    }

    let resultId = null;
    let rankValue = null;

    if (rank === 'CLEAR') {
      // Clear the result by setting event_result_id to null
      resultId = null;
      rankValue = 'CLEARED';
    } else {
      // Get the event result ID for the specified rank
      resultId = await getEventResultId(registration.event.event_type_id, rank);
      if (!resultId) {
        throw new Error(`Result not found for rank: ${rank}`);
      }
      rankValue = rank;
    }

    // Update the registration with the result
    const updatedRegistration = await prisma.team_event_registration.update({
      where: { id: registrationId },
      data: { 
        event_result_id: resultId,
        modified_at: new Date()
      },
      include: {
        event_result: true,
        temple: true
      }
    });

    // Log the action
    await prisma.audit_log.create({
      data: {
        user_id: staffUserId,
        action: 'UPDATE_TEAM_RESULT',
        table_name: 'Team_event_registration',
        record_id: registrationId,
        old_value: JSON.stringify({ event_result_id: registration.event_result_id }),
        new_value: JSON.stringify({ event_result_id: resultId, rank: rankValue })
      }
    });

    console.log('Team event result updated successfully');
    return updatedRegistration;
  } catch (error) {
    console.error('Error updating team event result:', error);
    throw error;
  }
}

export {
  registerParticipant,
  registerTeamEvent,
  updateTeamRegistration,
  updateEventResult,
  updateRegistrationStatus,
  getTempleParticipants,
  getTempleTeams,
  generateTempleReport,
  getAgeCategories,
  getEventsByAgeCategory,
  getTeamEvents,
  getEventParticipants,
  updateIndividualEventResult,
  updateTeamEventResult,
  getEventResultId
}; 