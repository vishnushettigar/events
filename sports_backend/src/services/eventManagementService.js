const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Event Type Management
async function createEventType(name, type, participant_count) {
  const eventType = await prisma.mst_event_type.create({
    data: {
      name,
      type,
      participant_count
    }
  });

  await prisma.audit_log.create({
    data: {
      action: 'CREATE_EVENT_TYPE',
      details: `Created event type: ${name}`
    }
  });

  return eventType;
}

async function updateEventType(id, data) {
  const eventType = await prisma.mst_event_type.update({
    where: { id },
    data
  });

  await prisma.audit_log.create({
    data: {
      action: 'UPDATE_EVENT_TYPE',
      details: `Updated event type: ${eventType.name}`
    }
  });

  return eventType;
}

async function deleteEventType(id) {
  const eventType = await prisma.mst_event_type.delete({
    where: { id }
  });

  await prisma.audit_log.create({
    data: {
      action: 'DELETE_EVENT_TYPE',
      details: `Deleted event type: ${eventType.name}`
    }
  });

  return eventType;
}

// Age Category Management
async function createAgeCategory(name, from_age, to_age) {
  const ageCategory = await prisma.mst_age_category.create({
    data: {
      name,
      from_age,
      to_age
    }
  });

  await prisma.audit_log.create({
    data: {
      action: 'CREATE_AGE_CATEGORY',
      details: `Created age category: ${name}`
    }
  });

  return ageCategory;
}

async function updateAgeCategory(id, data) {
  const ageCategory = await prisma.mst_age_category.update({
    where: { id },
    data
  });

  await prisma.audit_log.create({
    data: {
      action: 'UPDATE_AGE_CATEGORY',
      details: `Updated age category: ${ageCategory.name}`
    }
  });

  return ageCategory;
}

async function deleteAgeCategory(id) {
  const ageCategory = await prisma.mst_age_category.delete({
    where: { id }
  });

  await prisma.audit_log.create({
    data: {
      action: 'DELETE_AGE_CATEGORY',
      details: `Deleted age category: ${ageCategory.name}`
    }
  });

  return ageCategory;
}

// Event Management
async function createEvent(name, event_type_id, age_category_id, gender, temple_id) {
  const event = await prisma.mst_event.create({
    data: {
      name,
      event_type_id,
      age_category_id,
      gender,
      temple_id
    }
  });

  await prisma.audit_log.create({
    data: {
      action: 'CREATE_EVENT',
      details: `Created event: ${name}`
    }
  });

  return event;
}

async function updateEvent(id, data) {
  const event = await prisma.mst_event.update({
    where: { id },
    data
  });

  await prisma.audit_log.create({
    data: {
      action: 'UPDATE_EVENT',
      details: `Updated event: ${event.name}`
    }
  });

  return event;
}

async function deleteEvent(id) {
  const event = await prisma.mst_event.delete({
    where: { id }
  });

  await prisma.audit_log.create({
    data: {
      action: 'DELETE_EVENT',
      details: `Deleted event: ${event.name}`
    }
  });

  return event;
}

// Event Schedule Management
async function createEventSchedule(event_id, start_time, end_time) {
  const schedule = await prisma.event_schedule.create({
    data: {
      event_id,
      start_time,
      end_time
    }
  });

  await prisma.audit_log.create({
    data: {
      action: 'CREATE_EVENT_SCHEDULE',
      details: `Created schedule for event ID: ${event_id}`
    }
  });

  return schedule;
}

async function updateEventSchedule(id, data) {
  const schedule = await prisma.event_schedule.update({
    where: { id },
    data
  });

  await prisma.audit_log.create({
    data: {
      action: 'UPDATE_EVENT_SCHEDULE',
      details: `Updated schedule for event ID: ${schedule.event_id}`
    }
  });

  return schedule;
}

async function deleteEventSchedule(id) {
  const schedule = await prisma.event_schedule.delete({
    where: { id }
  });

  await prisma.audit_log.create({
    data: {
      action: 'DELETE_EVENT_SCHEDULE',
      details: `Deleted schedule for event ID: ${schedule.event_id}`
    }
  });

  return schedule;
}

// List functions
async function listEventTypes() {
  return prisma.mst_event_type.findMany({
    where: { is_deleted: false }
  });
}

async function listAgeCategories() {
  return prisma.mst_age_category.findMany({
    where: { is_deleted: false }
  });
}

async function listEvents(filters = {}) {
  const where = { is_deleted: false };
  
  if (filters.temple_id) {
    where.temple_id = filters.temple_id;
  }
  if (filters.event_type_id) {
    where.event_type_id = filters.event_type_id;
  }
  if (filters.age_category_id) {
    where.age_category_id = filters.age_category_id;
  }
  if (filters.gender) {
    where.gender = filters.gender;
  }

  return prisma.mst_event.findMany({
    where,
    include: {
      event_type: true,
      age_category: true,
      schedules: true
    }
  });
}

async function listEventSchedules(event_id) {
  return prisma.event_schedule.findMany({
    where: { event_id },
    orderBy: { start_time: 'asc' }
  });
}

module.exports = {
  // Event Type Management
  createEventType,
  updateEventType,
  deleteEventType,
  listEventTypes,

  // Age Category Management
  createAgeCategory,
  updateAgeCategory,
  deleteAgeCategory,
  listAgeCategories,

  // Event Management
  createEvent,
  updateEvent,
  deleteEvent,
  listEvents,

  // Event Schedule Management
  createEventSchedule,
  updateEventSchedule,
  deleteEventSchedule,
  listEventSchedules
}; 