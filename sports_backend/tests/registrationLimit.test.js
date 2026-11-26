/**
 * A participant may hold at most 3 individual-event registrations per year.
 *
 * Runs the real eventService.registerParticipant() against an in-memory fake of
 * Prisma (no database). Run with: npm run test:unit
 */
import { jest } from '@jest/globals';

const YEAR = new Date().getFullYear();
const LIMIT_MESSAGE = /maximum of 3 events/;

// ---- in-memory store -------------------------------------------------------
let registrations;
let nextRegId;

const AGE_CATEGORIES = {
  adults: { id: 8, name: '50-60' },
  seniors: { id: 11, name: '61-70' }
};

// Events 1..6 are limited-category individual events; 7 is in an unlimited category.
const EVENTS = {
  1: { id: 1, age_category: AGE_CATEGORIES.adults },
  2: { id: 2, age_category: AGE_CATEGORIES.adults },
  3: { id: 3, age_category: AGE_CATEGORIES.adults },
  4: { id: 4, age_category: AGE_CATEGORIES.adults },
  5: { id: 5, age_category: AGE_CATEGORIES.seniors },
  6: { id: 6, age_category: AGE_CATEGORIES.seniors },
  7: { id: 7, age_category: { id: 9, name: '71+' } }
};

const matches = (row, where = {}) =>
  Object.entries(where).every(([key, cond]) => {
    if (cond && typeof cond === 'object' && Array.isArray(cond.in)) return cond.in.includes(row[key]);
    return row[key] === cond;
  });

const tx = {
  ind_event_registration: {
    findMany: async ({ where }) => registrations.filter(r => matches(r, where)),
    findFirst: async ({ where }) => registrations.find(r => matches(r, where)) || null,
    create: async ({ data }) => {
      const row = { id: nextRegId++, ...data };
      registrations.push(row);
      return row;
    }
  },
  profile: { findUnique: async ({ where }) => ({ id: where.id }) },
  mst_event: { findUnique: async ({ where }) => EVENTS[where.id] || null },
  audit_log: { create: async () => ({}) },
  // Promotion of PENDING -> ACCEPTED for limited categories (per-event temple quota). Always succeeds here.
  $executeRaw: async () => 1
};

const fakePrisma = {
  settings: { findUnique: async () => null }, // no registration deadline configured
  $transaction: async cb => cb(tx)
};

jest.unstable_mockModule('../src/utils/prismaClient.js', () => ({ default: fakePrisma }));
const { registerParticipant } = await import('../src/services/eventService.js');

// ---- helpers ---------------------------------------------------------------
const seed = (userId, count, overrides = {}) => {
  for (let i = 0; i < count; i++) {
    registrations.push({
      id: nextRegId++,
      user_id: userId,
      event_id: 1 + i,
      year: YEAR,
      status: 'ACCEPTED',
      is_deleted: false,
      ...overrides
    });
  }
};

const activeCount = userId =>
  registrations.filter(r => r.user_id === userId && r.year === YEAR && !r.is_deleted &&
    ['PENDING', 'ACCEPTED'].includes(r.status)).length;

beforeEach(() => {
  registrations = [];
  nextRegId = 1;
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

// ---- tests -----------------------------------------------------------------
describe('maximum of 3 individual-event registrations per year', () => {
  test.each([0, 1, 2])('allows a registration when the user has %i current registrations', async existing => {
    seed(10, existing);
    const reg = await registerParticipant(10, 4, 1);
    expect(reg.event_id).toBe(4);
    expect(activeCount(10)).toBe(existing + 1);
  });

  test('allows exactly three, then rejects the fourth and creates no row', async () => {
    await registerParticipant(10, 1, 1);
    await registerParticipant(10, 2, 1);
    await registerParticipant(10, 3, 1);
    expect(activeCount(10)).toBe(3);

    await expect(registerParticipant(10, 4, 1)).rejects.toThrow(LIMIT_MESSAGE);
    expect(activeCount(10)).toBe(3);
    expect(registrations.some(r => r.event_id === 4)).toBe(false);
  });

  test('PENDING and ACCEPTED registrations both count', async () => {
    seed(10, 1, { status: 'PENDING' });
    registrations.push({ id: nextRegId++, user_id: 10, event_id: 2, year: YEAR, status: 'ACCEPTED', is_deleted: false });
    registrations.push({ id: nextRegId++, user_id: 10, event_id: 3, year: YEAR, status: 'PENDING', is_deleted: false });

    await expect(registerParticipant(10, 4, 1)).rejects.toThrow(LIMIT_MESSAGE);
  });

  test('the limit applies to the 61-70 category as well', async () => {
    seed(10, 3);
    await expect(registerParticipant(10, 5, 1)).rejects.toThrow(LIMIT_MESSAGE);
  });

  describe('what does not count toward the limit', () => {
    test('registrations from a previous year (the limit resets every year)', async () => {
      seed(10, 3, { year: YEAR - 1 });
      const reg = await registerParticipant(10, 4, 1);
      expect(reg.year).toBe(YEAR);
      expect(activeCount(10)).toBe(1);
    });

    test('cancelled (is_deleted) registrations free up a slot', async () => {
      seed(10, 3);
      registrations[0].is_deleted = true;
      const reg = await registerParticipant(10, 4, 1);
      expect(reg.event_id).toBe(4);
      expect(activeCount(10)).toBe(3);
    });

    test('DECLINED registrations (current behaviour: they do not count)', async () => {
      seed(10, 3, { status: 'DECLINED' });
      const reg = await registerParticipant(10, 4, 1);
      expect(reg.event_id).toBe(4);
    });

    test("another participant's registrations", async () => {
      seed(11, 3);
      const reg = await registerParticipant(10, 1, 1);
      expect(reg.user_id).toBe(10);
    });
  });

  test('registering for the same event twice is rejected', async () => {
    await registerParticipant(10, 1, 1);
    await expect(registerParticipant(10, 1, 1)).rejects.toThrow('Already registered for this event');
    expect(activeCount(10)).toBe(1);
  });

  test('the limit is checked before anything else, even for unlimited categories (71+)', async () => {
    seed(10, 3);
    await expect(registerParticipant(10, 7, 1)).rejects.toThrow(LIMIT_MESSAGE);
  });
});
