/**
 * Unit tests for:
 *  - the shared unlimited / limited age category rule
 *  - updateRegistrationStatus (3-per-temple limit, current-year-only edits)
 *
 * Prisma is fully mocked, so no database is needed.
 * Run with:
 *   NODE_OPTIONS=--experimental-vm-modules npx jest --config jest.config.cjs tests/age_limit_year_rules.test.js
 */
import { jest } from '@jest/globals';

// ---- Prisma mock (must be registered before importing the service) ----
const tx = {
  profile: { findUnique: jest.fn() },
  ind_event_registration: { findUnique: jest.fn(), count: jest.fn(), update: jest.fn() },
  mst_event: { findUnique: jest.fn() },
  audit_log: { create: jest.fn() }
};

const prismaMock = {
  settings: { findUnique: jest.fn() },
  $transaction: jest.fn((fn) => fn(tx))
};

jest.unstable_mockModule('../src/utils/prismaClient.js', () => ({ default: prismaMock }));

const { isUnlimitedAgeCategory, UNLIMITED_AGE_CATEGORIES } = await import('../src/utils/ageUtils.js');
const { updateRegistrationStatus } = await import('../src/services/eventService.js');

const CURRENT_YEAR = new Date().getFullYear();
const TEMPLE_ID = 1;
const ADMIN_ID = 99;
const REG_ID = 500;

const UNLIMITED = ['0-5', '6-10', '71+'];
const LIMITED = ['11-14', '15-18', '19-24', '25-35', '36-49', '50-60', '61-70'];

/**
 * Configure the mocked database for one status-update scenario.
 */
function arrange({
  adminRole = 2,
  adminTemple = TEMPLE_ID,
  userTemple = TEMPLE_ID,
  regYear = CURRENT_YEAR,
  regStatus = 'PENDING',
  category = '11-14',
  acceptedCount = 0
} = {}) {
  prismaMock.settings.findUnique.mockResolvedValue(null); // no status-update deadline
  tx.profile.findUnique.mockResolvedValue({ role_id: adminRole, temple_id: adminTemple });
  tx.ind_event_registration.findUnique.mockResolvedValue({
    id: REG_ID,
    year: regYear,
    status: regStatus,
    user: { temple_id: userTemple },
    event: { id: 10 }
  });
  tx.mst_event.findUnique.mockResolvedValue({ id: 10, age_category: { name: category } });
  tx.ind_event_registration.count.mockResolvedValue(acceptedCount);
  tx.ind_event_registration.update.mockImplementation(async ({ data }) => ({ id: REG_ID, ...data }));
  tx.audit_log.create.mockResolvedValue({});
}

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.$transaction.mockImplementation((fn) => fn(tx));
});

describe('isUnlimitedAgeCategory', () => {
  test.each(UNLIMITED)('%s is unlimited', (name) => {
    expect(isUnlimitedAgeCategory(name)).toBe(true);
  });

  test.each(LIMITED)('%s is limited to 3 per temple', (name) => {
    expect(isUnlimitedAgeCategory(name)).toBe(false);
  });

  test.each(['61+', '61-90', '', undefined, null, 'All'])('legacy/unknown name %p is not unlimited', (name) => {
    expect(isUnlimitedAgeCategory(name)).toBe(false);
  });

  test('exposes exactly the three unlimited categories', () => {
    expect([...UNLIMITED_AGE_CATEGORIES].sort()).toEqual([...UNLIMITED].sort());
  });
});

describe('updateRegistrationStatus - 3 participants per temple limit', () => {
  test.each(LIMITED)('%s: blocks the 4th accepted participant', async (category) => {
    arrange({ category, acceptedCount: 3 });

    await expect(updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID)).rejects.toThrow(
      /already has 3 approved participants/
    );
    expect(tx.ind_event_registration.update).not.toHaveBeenCalled();
  });

  test.each(LIMITED)('%s: allows accepting while under the limit (2 accepted)', async (category) => {
    arrange({ category, acceptedCount: 2 });

    const result = await updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID);

    expect(result.status).toBe('ACCEPTED');
    expect(tx.ind_event_registration.update).toHaveBeenCalledWith({
      where: { id: REG_ID },
      data: { status: 'ACCEPTED' }
    });
  });

  test.each(UNLIMITED)('%s: has no limit even with many accepted participants', async (category) => {
    arrange({ category, acceptedCount: 50 });

    const result = await updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID);

    expect(result.status).toBe('ACCEPTED');
    // the limit query is not even needed for unlimited categories
    expect(tx.ind_event_registration.count).not.toHaveBeenCalled();
  });

  test('legacy "61+" is no longer treated as unlimited', async () => {
    arrange({ category: '61+', acceptedCount: 3 });

    await expect(updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID)).rejects.toThrow(
      /already has 3 approved participants/
    );
  });

  test('an already accepted registration can be re-approved when the temple is at the limit', async () => {
    arrange({ category: '25-35', acceptedCount: 3, regStatus: 'ACCEPTED' });

    const result = await updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID);

    expect(result.status).toBe('ACCEPTED');
  });

  test('the limit is counted per temple, per event and per current year', async () => {
    arrange({ category: '36-49', acceptedCount: 0 });

    await updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID);

    expect(tx.ind_event_registration.count).toHaveBeenCalledWith({
      where: {
        event_id: 10,
        is_deleted: false,
        status: 'ACCEPTED',
        year: CURRENT_YEAR,
        user: { temple_id: TEMPLE_ID }
      }
    });
  });

  test('rejecting (DECLINED) is allowed even when the temple is at the limit', async () => {
    arrange({ category: '19-24', acceptedCount: 3, regStatus: 'ACCEPTED' });

    const result = await updateRegistrationStatus(REG_ID, 'REJECTED', ADMIN_ID);

    expect(result.status).toBe('DECLINED');
    expect(tx.ind_event_registration.count).not.toHaveBeenCalled();
  });

  test('moving back to PENDING is allowed', async () => {
    arrange({ category: '15-18', acceptedCount: 3, regStatus: 'ACCEPTED' });

    const result = await updateRegistrationStatus(REG_ID, 'PENDING', ADMIN_ID);

    expect(result.status).toBe('PENDING');
  });

  test('writes an audit log entry on success', async () => {
    arrange({ category: '11-14', acceptedCount: 0 });

    await updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID);

    expect(tx.audit_log.create).toHaveBeenCalledTimes(1);
    expect(tx.audit_log.create.mock.calls[0][0].data).toMatchObject({
      user_id: ADMIN_ID,
      action: 'UPDATE_REGISTRATION_STATUS',
      record_id: REG_ID
    });
  });
});

describe('updateRegistrationStatus - only current year registrations can be changed', () => {
  test.each(['APPROVED', 'REJECTED', 'PENDING'])(
    'blocks %s on a previous-year registration',
    async (status) => {
      arrange({ regYear: CURRENT_YEAR - 1 });

      await expect(updateRegistrationStatus(REG_ID, status, ADMIN_ID)).rejects.toThrow(
        /non-current year/
      );
      expect(tx.ind_event_registration.update).not.toHaveBeenCalled();
      expect(tx.audit_log.create).not.toHaveBeenCalled();
    }
  );

  test('blocks a future-year registration too', async () => {
    arrange({ regYear: CURRENT_YEAR + 1 });

    await expect(updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID)).rejects.toThrow(
      /non-current year/
    );
    expect(tx.ind_event_registration.update).not.toHaveBeenCalled();
  });

  test('the error is reported as Unauthorized so the route returns 403', async () => {
    arrange({ regYear: CURRENT_YEAR - 1 });

    await expect(updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID)).rejects.toThrow(/^Unauthorized/);
  });

  test('allows changes to a current-year registration', async () => {
    arrange({ regYear: CURRENT_YEAR });

    await expect(updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID)).resolves.toMatchObject({
      status: 'ACCEPTED'
    });
  });
});

describe('updateRegistrationStatus - authorization', () => {
  test('rejects a user who is not a temple admin (role_id != 2)', async () => {
    arrange({ adminRole: 3 });

    await expect(updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID)).rejects.toThrow(
      /Only temple admins/
    );
  });

  test('rejects an admin managing another temple\'s registration', async () => {
    arrange({ adminTemple: 1, userTemple: 2 });

    await expect(updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID)).rejects.toThrow(
      /other temples/
    );
    expect(tx.ind_event_registration.update).not.toHaveBeenCalled();
  });

  test('rejects an unknown registration', async () => {
    arrange();
    tx.ind_event_registration.findUnique.mockResolvedValue(null);

    await expect(updateRegistrationStatus(REG_ID, 'APPROVED', ADMIN_ID)).rejects.toThrow(/not found/);
  });

  test('rejects an invalid status value', async () => {
    arrange();

    await expect(updateRegistrationStatus(REG_ID, 'BOGUS', ADMIN_ID)).rejects.toThrow(/Invalid status/);
  });
});
