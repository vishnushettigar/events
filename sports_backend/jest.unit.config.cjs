// Pure unit tests: no database, no tests/setup.js (which resets/cleans a DB).
module.exports = {
  testEnvironment: 'node',
  transform: {},
  testMatch: [
    '**/tests/availableEvents.test.js',
    '**/tests/age_limit_year_rules.test.js',
    '**/tests/temple_participants_route.test.js'
  ],
  verbose: true
};
