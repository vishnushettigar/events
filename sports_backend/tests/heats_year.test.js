import assert from 'assert';
import { getBibNumber } from '../src/constants.js';

console.log('--- Testing Heat Generation Multi-Year Isolation & BIB No Logic ---');

// 1. Year parsing helper simulation
function parseTargetYear(body = {}, query = {}) {
  return body.year ? parseInt(body.year) : (query.year ? parseInt(query.year) : new Date().getFullYear());
}

assert.strictEqual(parseTargetYear({}, {}), new Date().getFullYear(), 'Defaults to current year');
assert.strictEqual(parseTargetYear({ year: 2025 }, {}), 2025, 'Parses from body number');
assert.strictEqual(parseTargetYear({ year: '2025' }, {}), 2025, 'Parses from body string');
assert.strictEqual(parseTargetYear({}, { year: '2026' }), 2026, 'Parses from query string');
assert.strictEqual(parseTargetYear({ year: 2027 }, { year: '2026' }), 2027, 'Body takes precedence over query');
console.log('✅ Target year parsing tests passed.');

// 2. Simulate database store for event_performance and ind_event_registration
const mockDatabase = {
  registrations: [
    { id: 1, event_id: 10, user_id: 101, year: 2025, status: 'ACCEPTED', is_deleted: false, name: 'Runner 2025 A', temple: 'Temple A' },
    { id: 2, event_id: 10, user_id: 102, year: 2025, status: 'ACCEPTED', is_deleted: false, name: 'Runner 2025 B', temple: 'Temple B' },
    { id: 3, event_id: 10, user_id: 103, year: 2026, status: 'ACCEPTED', is_deleted: false, name: 'Runner 2026 A', temple: 'Temple A' },
    { id: 4, event_id: 10, user_id: 104, year: 2026, status: 'ACCEPTED', is_deleted: false, name: 'Runner 2026 B', temple: 'Temple B' },
    { id: 5, event_id: 10, user_id: 105, year: 2026, status: 'PENDING', is_deleted: false, name: 'Runner 2026 C', temple: 'Temple C' },
    { id: 6, event_id: 10, user_id: 106, year: 2026, status: 'ACCEPTED', is_deleted: true, name: 'Runner 2026 D', temple: 'Temple D' },
  ],
  performances: [
    // Pre-existing heats from 2025
    { id: 1, event_id: 10, registration_id: 1, heat_number: 1, year: 2025, performance_1: 12.5 },
    { id: 2, event_id: 10, registration_id: 2, heat_number: 1, year: 2025, performance_1: 13.0 },
  ]
};

// 3. Test Heat Generation Scoping for 2026 when 2025 heats already exist
function generateHeatsSim(eventId, targetYear) {
  // Query existing heats scoped by eventId AND targetYear
  const existingHeats = mockDatabase.performances.filter(
    p => p.event_id === eventId && p.year === targetYear
  );

  if (existingHeats.length > 0) {
    throw new Error(`Heats already generated for this event for year ${targetYear}`);
  }

  // Query registrations scoped by eventId, targetYear, ACCEPTED, and not deleted
  const registrations = mockDatabase.registrations.filter(
    r => r.event_id === eventId && r.year === targetYear && r.status === 'ACCEPTED' && !r.is_deleted
  );

  if (registrations.length === 0) {
    throw new Error(`No accepted participants found for this event in year ${targetYear}`);
  }

  // Create heat records
  const newRecords = registrations.map((r, idx) => ({
    id: mockDatabase.performances.length + idx + 1,
    event_id: eventId,
    registration_id: r.id,
    heat_number: 1,
    year: targetYear,
    performance_1: null,
    performance_2: null,
    performance_3: null
  }));

  mockDatabase.performances.push(...newRecords);
  return { message: 'Heats generated successfully', totalHeats: 1, count: newRecords.length };
}

// Generating for 2026 should succeed even though 2025 heats exist!
const result2026 = generateHeatsSim(10, 2026);
assert.strictEqual(result2026.count, 2, 'Should generate heats for 2 accepted 2026 participants');
assert.strictEqual(
  mockDatabase.performances.filter(p => p.event_id === 10 && p.year === 2026).length,
  2,
  '2026 performance records must be created'
);
assert.strictEqual(
  mockDatabase.performances.filter(p => p.event_id === 10 && p.year === 2025).length,
  2,
  '2025 performance records must remain intact'
);
console.log('✅ Generation for 2026 succeeded while preserving 2025 heats.');

// Attempting to generate again for 2026 should fail
assert.throws(() => {
  generateHeatsSim(10, 2026);
}, /Heats already generated for this event for year 2026/);
console.log('✅ Duplicate generation for 2026 correctly blocked.');

// 4. Test Heat Regeneration (Deletion) Scoping
function regenerateHeatsSim(eventId, targetYear) {
  // Only delete performances for targetYear
  const initialCount = mockDatabase.performances.length;
  mockDatabase.performances = mockDatabase.performances.filter(
    p => !(p.event_id === eventId && p.year === targetYear)
  );
  return { deleted: initialCount - mockDatabase.performances.length };
}

// Regenerate 2026 heats
const regenResult = regenerateHeatsSim(10, 2026);
assert.strictEqual(regenResult.deleted, 2, 'Should only delete the 2 records for 2026');
assert.strictEqual(
  mockDatabase.performances.filter(p => p.event_id === 10 && p.year === 2025).length,
  2,
  '2025 records must still be untouched after 2026 regeneration'
);
assert.strictEqual(
  mockDatabase.performances.filter(p => p.event_id === 10 && p.year === 2026).length,
  0,
  '2026 records must be deleted'
);
console.log('✅ Regeneration for 2026 successfully cleared 2026 without affecting 2025.');

// Now generating for 2026 again works!
const reGenerateResult = generateHeatsSim(10, 2026);
assert.strictEqual(reGenerateResult.count, 2);
console.log('✅ Re-generation for 2026 succeeded after regeneration.');

// 5. Test BIB NO generation for heat participants
const participantA = { user_id: 45, temple_id: 1, temple_name: 'Mangalore' };
const participantB = { user_id: 1024, temple_id: 2, temple_name: 'Barkur' };
const bibA = getBibNumber(participantA.temple_id, participantA.user_id);
const bibB = getBibNumber(participantB.temple_id, participantB.user_id);
assert.ok(bibA && bibA.includes('0045'), `Expected BIB to contain padded user ID: ${bibA}`);
assert.ok(bibB && bibB.includes('1024'), `Expected BIB to contain padded user ID: ${bibB}`);
console.log(`✅ BIB generation verified: ${bibA}, ${bibB}`);

console.log('--- All Heat Generation Year & BIB Tests Passed! ---');

