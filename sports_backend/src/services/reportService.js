const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Overall Championship Report
async function getOverallChampionshipReport() {
  const report = await prisma.champion.findMany({
    include: {
      temple: true,
      host_temple: true
    },
    orderBy: {
      year: 'desc'
    }
  });

  return report;
}

// Event-wise Performance Report
async function getEventWisePerformanceReport() {
  const report = await prisma.mst_event.findMany({
    where: {
      is_deleted: false
    },
    include: {
      event_type: true,
      age_category: true,
      registrations: {
        include: {
          event_result: true,
          user: {
            include: {
              profile: true
            }
          }
        }
      },
      team_registrations: {
        include: {
          event_result: true,
          temple: true
        }
      }
    }
  });

  return report;
}

// Age Category-wise Report
async function getAgeCategoryWiseReport() {
  const report = await prisma.mst_age_category.findMany({
    where: {
      is_deleted: false
    },
    include: {
      events: {
        include: {
          registrations: {
            include: {
              event_result: true,
              user: {
                include: {
                  profile: true
                }
              }
            }
          },
          team_registrations: {
            include: {
              event_result: true,
              temple: true
            }
          }
        }
      }
    }
  });

  return report;
}

// Gender-wise Report
async function getGenderWiseReport() {
  const report = await prisma.mst_event.findMany({
    where: {
      is_deleted: false
    },
    include: {
      registrations: {
        include: {
          event_result: true,
          user: {
            include: {
              profile: true
            }
          }
        }
      },
      team_registrations: {
        include: {
          event_result: true,
          temple: true
        }
      }
    }
  });

  return report;
}

module.exports = {
  getOverallChampionshipReport,
  getEventWisePerformanceReport,
  getAgeCategoryWiseReport,
  getGenderWiseReport
}; 