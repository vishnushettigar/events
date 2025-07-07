import { PrismaClient } from '@prisma/client';

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
  const report = await prisma.ind_event_registration.findMany({
    where: {
      is_deleted: false,
      event_result: {
        isNot: null
      }
    },
    include: {
      event: {
        include: {
          event_type: true,
          age_category: true
        }
      },
      user: {
        include: {
          temple: true
        }
      },
      event_result: true
    },
    orderBy: {
      event: {
        event_type: {
          name: 'asc'
        }
      }
    }
  });

  return report;
}

// Age Category-wise Report
async function getAgeCategoryWiseReport() {
  const report = await prisma.ind_event_registration.findMany({
    where: {
      is_deleted: false,
      event_result: {
        isNot: null
      }
    },
    include: {
      event: {
        include: {
          age_category: true,
          event_type: true
        }
      },
      user: {
        include: {
          temple: true
        }
      },
      event_result: true
    },
    orderBy: {
      event: {
        age_category: {
          from_age: 'asc'
        }
      }
    }
  });

  return report;
}

// Gender-wise Report
async function getGenderWiseReport() {
  const report = await prisma.ind_event_registration.findMany({
    where: {
      is_deleted: false,
      event_result: {
        isNot: null
      }
    },
    include: {
      event: {
        include: {
          event_type: true
        }
      },
      user: {
        include: {
          temple: true
        }
      },
      event_result: true
    },
    orderBy: {
      user: {
        gender: 'asc'
      }
    }
  });

  return report;
}

export {
  getOverallChampionshipReport,
  getEventWisePerformanceReport,
  getAgeCategoryWiseReport,
  getGenderWiseReport
}; 