import assert from 'assert';
import { requireRole } from '../src/middleware/auth.js';

console.log('--- Testing GROUND_STAFF Role & Permission Logic ---');

// 1. Test requireRole middleware with role 6 (GROUND_STAFF)
const reqGroundStaff = {
  user: { id: 99, role: 6 }
};
const reqStaff = {
  user: { id: 98, role: 3 }
};
const reqParticipant = {
  user: { id: 1, role: 1 }
};

let nextCalled = false;
const next = () => { nextCalled = true; };
let resStatus = null;
let resJson = null;
const res = {
  status: (code) => {
    resStatus = code;
    return {
      json: (data) => { resJson = data; }
    };
  }
};

// Test requireRole('GROUND_STAFF')
nextCalled = false;
resStatus = null;
requireRole('GROUND_STAFF')(reqGroundStaff, res, next);
assert.strictEqual(nextCalled, true, 'GROUND_STAFF user should pass requireRole("GROUND_STAFF")');

nextCalled = false;
resStatus = null;
requireRole('GROUND_STAFF')(reqParticipant, res, next);
assert.strictEqual(nextCalled, false, 'Participant should NOT pass requireRole("GROUND_STAFF")');
assert.strictEqual(resStatus, 403, 'Participant should get 403');

// Test requireRole(['STAFF', 'GROUND_STAFF'])
nextCalled = false;
requireRole(['STAFF', 'GROUND_STAFF'])(reqGroundStaff, res, next);
assert.strictEqual(nextCalled, true, 'GROUND_STAFF should pass requireRole(["STAFF", "GROUND_STAFF"])');

nextCalled = false;
requireRole(['STAFF', 'GROUND_STAFF'])(reqStaff, res, next);
assert.strictEqual(nextCalled, true, 'STAFF should pass requireRole(["STAFF", "GROUND_STAFF"])');

nextCalled = false;
resStatus = null;
requireRole(['STAFF', 'GROUND_STAFF'])(reqParticipant, res, next);
assert.strictEqual(nextCalled, false, 'Participant should NOT pass requireRole(["STAFF", "GROUND_STAFF"])');
assert.strictEqual(resStatus, 403);

console.log('✅ requireRole middleware tests passed.');

// 2. Test event permission filter
function isEventAllowedForGroundStaff(eventName) {
  if (!eventName) return false;
  const n = eventName.toLowerCase().trim();
  return (
    n.includes('running - 100') ||
    n.includes('running - 200') ||
    n.includes('long jump') ||
    n.includes('long-jump') ||
    n.includes('shot put')
  );
}

const allowedEvents = [
  'Running - 200 mts',
  'Running - 100 mts',
  'Long jump',
  'Long Jump',
  'Shot put',
  'Shot Put'
];

for (const eventName of allowedEvents) {
  assert.strictEqual(
    isEventAllowedForGroundStaff(eventName),
    true,
    `Event "${eventName}" should be allowed for GROUND_STAFF`
  );
}

const disallowedEvents = [
  'Running - 25 mts',
  'Running - 50 mts',
  'Running - 400 mts',
  'Running - 800 mts',
  'Frog Jump - 15 mts',
  'Frog Jump - 25 mts',
  'Lucky Circle',
  'Couple Relay - 50 x 2',
  'Relay - 100 X 4',
  'Volleyball',
  'Throwball',
  'Tug of War'
];

for (const eventName of disallowedEvents) {
  assert.strictEqual(
    isEventAllowedForGroundStaff(eventName),
    false,
    `Event "${eventName}" should NOT be allowed for GROUND_STAFF`
  );
}

console.log('✅ Event permission filtering tests passed.');

console.log('🎉 All GROUND_STAFF tests passed successfully!');

