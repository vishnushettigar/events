/**
 * Route test: GET /api/events/temple-participants must only ever return the
 * CURRENT year's registrations, even if a ?year= query parameter is supplied.
 *
 * The service, auth middleware and Prisma are mocked, so no database is needed.
 * Run with:
 *   NODE_OPTIONS=--experimental-vm-modules npx jest --config jest.config.cjs tests/temple_participants_route.test.js
 */
import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const getTempleParticipants = jest.fn();

jest.unstable_mockModule('../src/services/eventService.js', () => ({ getTempleParticipants }));
jest.unstable_mockModule('../src/services/systemService.js', () => ({}));
jest.unstable_mockModule('../src/utils/prismaClient.js', () => ({ default: {} }));
jest.unstable_mockModule('../src/middleware/auth.js', () => ({
  // Test user is a temple admin; send header x-no-temple to simulate a user without a temple.
  authenticate: (req, res, next) => {
    req.user = { id: 1, role_id: 2, temple_id: req.headers['x-no-temple'] ? null : 7 };
    next();
  },
  requireRole: () => (req, res, next) => next()
}));

const { default: eventRoutes } = await import('../src/routes/eventRoutes.js');

const CURRENT_YEAR = new Date().getFullYear();

const app = express();
app.use(express.json());
app.use('/api/events', eventRoutes);

beforeEach(() => {
  getTempleParticipants.mockReset();
  getTempleParticipants.mockResolvedValue([{ id: 1, year: CURRENT_YEAR }]);
});

describe('GET /api/events/temple-participants', () => {
  test('uses the current year when no year is supplied', async () => {
    const res = await request(app).get('/api/events/temple-participants');

    expect(res.status).toBe(200);
    expect(getTempleParticipants).toHaveBeenCalledTimes(1);
    expect(getTempleParticipants).toHaveBeenCalledWith(7, {
      event_ids: [],
      status: undefined,
      year: CURRENT_YEAR
    });
  });

  test.each([CURRENT_YEAR - 1, CURRENT_YEAR - 5, CURRENT_YEAR + 1, 'abc'])(
    'ignores ?year=%s and still queries the current year',
    async (year) => {
      const res = await request(app).get(`/api/events/temple-participants?year=${year}`);

      expect(res.status).toBe(200);
      expect(getTempleParticipants.mock.calls[0][1].year).toBe(CURRENT_YEAR);
    }
  );

  test('scopes the query to the admin\'s own temple and passes through event_ids and status', async () => {
    const res = await request(app).get('/api/events/temple-participants?event_ids=3,4,5&status=PENDING&year=2019');

    expect(res.status).toBe(200);
    expect(getTempleParticipants).toHaveBeenCalledWith(7, {
      event_ids: [3, 4, 5],
      status: 'PENDING',
      year: CURRENT_YEAR
    });
  });

  test('returns 400 when the admin is not associated with a temple', async () => {
    const res = await request(app).get('/api/events/temple-participants').set('x-no-temple', '1');

    expect(res.status).toBe(400);
    expect(getTempleParticipants).not.toHaveBeenCalled();
  });

  test('returns 500 with the error message when the service fails', async () => {
    getTempleParticipants.mockRejectedValue(new Error('boom'));

    const res = await request(app).get('/api/events/temple-participants');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });
});
