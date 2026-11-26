/**
 * Which events does a participant see for registration, per age category?
 *
 * Runs the real /api/users/available-events and /api/users/profile handlers
 * against an in-memory fake of Prisma, using age categories and events shaped
 * like production (including the "All" team-events category, id 10, which sits
 * BEFORE the newer "61-70" category, id 11).
 *
 * Run (no database, skips tests/setup.js):
 *   npm run test:unit
 */
import { jest } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET = 'unit-test-secret';

// ---- fixture data, shaped like production -------------------------------
// Rows are in id order, which is what an un-ordered findMany returns.
const AGE_CATEGORIES = [
  { id: 1, name: '0-5', from_age: 0, to_age: 5, is_deleted: false },
  { id: 2, name: '6-10', from_age: 6, to_age: 10, is_deleted: false },
  { id: 3, name: '11-14', from_age: 11, to_age: 14, is_deleted: false },
  { id: 4, name: '15-18', from_age: 15, to_age: 18, is_deleted: false },
  { id: 5, name: '19-24', from_age: 19, to_age: 24, is_deleted: false },
  { id: 6, name: '25-35', from_age: 25, to_age: 35, is_deleted: false },
  { id: 7, name: '36-49', from_age: 36, to_age: 49, is_deleted: false },
  { id: 8, name: '50-60', from_age: 50, to_age: 60, is_deleted: false },
  { id: 9, name: '71+', from_age: 71, to_age: 99, is_deleted: false },
  { id: 10, name: 'All', from_age: 0, to_age: 99, is_deleted: false },
  { id: 11, name: '61-70', from_age: 61, to_age: 70, is_deleted: false }
];

const EVENT_TYPES = {
  run50: { id: 4, name: 'Running - 50 mts', type: 'INDIVIDUAL', participant_count: 1 },
  run100: { id: 5, name: 'Running - 100 mts', type: 'INDIVIDUAL', participant_count: 1 },
  shot: { id: 10, name: 'Shot put', type: 'INDIVIDUAL', participant_count: 1 },
  lucky: { id: 11, name: 'Lucky Circle', type: 'INDIVIDUAL', participant_count: 1 },
  couple: { id: 12, name: 'Couple Relay - 50 x 2', type: 'TEAM', participant_count: 2 },
  relay: { id: 13, name: 'Relay - 100 X 4', type: 'TEAM', participant_count: 4 },
  volley: { id: 14, name: 'Volleyball', type: 'TEAM', participant_count: 9 },
  throwball: { id: 15, name: 'Throwball', type: 'TEAM', participant_count: 10 },
  tug: { id: 16, name: 'Tug of War', type: 'TEAM', participant_count: 9 }
};

let nextEventId = 1;
const ev = (typeKey, categoryId, gender) => ({
  id: nextEventId++,
  event_type_id: EVENT_TYPES[typeKey].id,
  event_type: EVENT_TYPES[typeKey],
  age_category_id: categoryId,
  gender,
  is_deleted: false,
  is_closed: false,
  registrations: []
});

const both = (typeKey, categoryId) => [ev(typeKey, categoryId, 'MALE'), ev(typeKey, categoryId, 'FEMALE')];

const EVENTS = [
  ...both('run50', 8), ...both('run100', 8), ...both('shot', 8), // 50-60
  ...both('lucky', 9),                                           // 71+
  ev('couple', 10, 'MIXED'), ...both('relay', 10),               // All (team games)
  ev('volley', 10, 'MALE'), ev('throwball', 10, 'FEMALE'), ...both('tug', 10),
  ...both('run50', 11), ...both('shot', 11)                      // 61-70
];

// ---- in-memory fake Prisma ----------------------------------------------
let currentProfile;

const fakePrisma = {
  profile: {
    findUnique: async () => currentProfile,
    findMany: async () => []
  },
  user: {
    // /profile loads the user together with their profile
    findUnique: async () => ({ id: 1, profile: currentProfile })
  },
  settings: {
    findUnique: async () => ({ name: 'AGE_CALC_CUTOFF_DATE', value: '2025-12-01' })
  },
  mst_age_category: {
    findMany: async ({ where } = {}) =>
      AGE_CATEGORIES.filter(c => !where || where.is_deleted === undefined || c.is_deleted === where.is_deleted)
  },
  mst_event: {
    findMany: async ({ where }) =>
      EVENTS.filter(e =>
        e.age_category_id === where.age_category_id &&
        where.gender.in.includes(e.gender) &&
        e.is_deleted === where.is_deleted &&
        e.is_closed === where.is_closed
      ).map(e => ({
        ...e,
        age_category: AGE_CATEGORIES.find(c => c.id === e.age_category_id)
      }))
  }
};

jest.unstable_mockModule('../src/utils/prismaClient.js', () => ({ default: fakePrisma }));

const { default: userRoutes } = await import('../src/routes/userRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

// ---- helpers --------------------------------------------------------------
const token = jwt.sign({ id: 1, role: 1, temple_id: 1 }, process.env.JWT_SECRET);

// Cutoff in the fake settings is 2025-12-01, so born (2025 - age)-06-15 => exactly `age`.
const profileOfAge = (age, gender) => {
  currentProfile = {
    id: 100,
    user_id: 1,
    first_name: 'Test',
    last_name: 'User',
    gender,
    dob: new Date(`${2025 - age}-06-15`),
    temple_id: 1,
    role_id: 1,
    temple: { id: 1, name: 'Test Temple' },
    role: { id: 1, name: 'PARTICIPANT' }
  };
};

const availableEvents = async (age, gender) => {
  profileOfAge(age, gender);
  const res = await request(app)
    .get('/api/users/available-events')
    .set('Authorization', `Bearer ${token}`);
  return res;
};

const names = res => res.body.events.map(e => e.name).sort();

// ---- tests ----------------------------------------------------------------
describe('available events by age category', () => {
  describe('61-70 category', () => {
    const AGES = [61, 65, 70];

    test.each(AGES)('male aged %i sees exactly Running - 50 mts and Shot put (male)', async age => {
      const res = await availableEvents(age, 'MALE');
      expect(res.status).toBe(200);
      expect(names(res)).toEqual(['Running - 50 mts', 'Shot put']);
      res.body.events.forEach(e => {
        expect(e.age_category.name).toBe('61-70');
        expect(e.gender).toBe('MALE');
      });
    });

    test.each(AGES)('female aged %i sees exactly Running - 50 mts and Shot put (female)', async age => {
      const res = await availableEvents(age, 'FEMALE');
      expect(res.status).toBe(200);
      expect(names(res)).toEqual(['Running - 50 mts', 'Shot put']);
      res.body.events.forEach(e => {
        expect(e.age_category.name).toBe('61-70');
        expect(e.gender).toBe('FEMALE');
      });
    });

    test.each(AGES)('aged %i is not shown team games from the "All" category', async age => {
      const res = await availableEvents(age, 'MALE');
      const teamEvents = res.body.events.filter(e => e.type === 'TEAM');
      expect(teamEvents).toEqual([]);
    });

    test('does not see Lucky Circle (71+ only)', async () => {
      const res = await availableEvents(65, 'MALE');
      expect(names(res)).not.toContain('Lucky Circle');
    });

    test('the profile endpoint reports the 61-70 age category', async () => {
      profileOfAge(65, 'MALE');
      const res = await request(app).get('/api/users/profile').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.age_category).toBe('61-70');
    });
  });

  describe('neighbouring categories are unaffected', () => {
    test('aged 60 sees 50-60 individual events', async () => {
      const res = await availableEvents(60, 'MALE');
      expect(names(res)).toEqual(['Running - 100 mts', 'Running - 50 mts', 'Shot put']);
      res.body.events.forEach(e => expect(e.age_category.name).toBe('50-60'));
    });

    test.each([71, 80])('aged %i sees only Lucky Circle in 71+', async age => {
      const res = await availableEvents(age, 'FEMALE');
      expect(names(res)).toEqual(['Lucky Circle']);
      expect(res.body.events[0].age_category.name).toBe('71+');
    });
  });
});
