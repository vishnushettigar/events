const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function registerParticipant(user_id, event_id) {
  // Get user's temple_id
  const user = await prisma.profile.findUnique({
    where: { id: user_id },
    select: { temple_id: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get event details to check temple
  const event = await prisma.mst_event.findUnique({
    where: { id: event_id },
    select: { temple_id: true }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // Check if user's temple matches event's temple
  if (user.temple_id !== event.temple_id) {
    throw new Error('Cannot register for events from other temples');
  }

  const registration = await prisma.ind_event_registration.create({
    data: {
      user_id,
      event_id
    }
  });

  // Log the action
  await prisma.audit_log.create({
    data: {
      user_id,
      action: 'REGISTER_PARTICIPANT',
      details: `Registered for event ${event_id}`
    }
  });

  return registration;
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
      event: {
        select: { temple_id: true }
      }
    }
  });

  if (!registration) {
    throw new Error('Registration not found');
  }

  // Verify the temple admin belongs to the same temple as the event
  if (admin.temple_id !== registration.event.temple_id) {
    throw new Error('Unauthorized: Cannot manage registrations from other temples');
  }

  const updatedRegistration = await prisma.ind_event_registration.update({
    where: { id: registration_id },
    data: { status }
  });

  // Log the action
  await prisma.audit_log.create({
    data: {
      user_id: temple_admin_id,
      action: 'UPDATE_REGISTRATION_STATUS',
      details: `Updated registration ${registration_id} status to ${status}`
    }
  });

  return updatedRegistration;
}

async function getTempleParticipants(temple_id, filters = {}) {
  const where = {
    event: {
      temple_id: temple_id
    },
    is_deleted: false
  };

  // Add optional filters
  if (filters.event_id) {
    where.event_id = filters.event_id;
  }
  if (filters.status) {
    where.status = filters.status;
  }

  const participants = await prisma.ind_event_registration.findMany({
    where,
    include: {
      user: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          gender: true,
          dob: true
        }
      },
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

  return participants;
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

module.exports = {
  registerParticipant,
  registerTeamEvent,
  updateEventResult,
  updateRegistrationStatus,
  getTempleParticipants,
  getTempleTeams,
  generateTempleReport
}; 