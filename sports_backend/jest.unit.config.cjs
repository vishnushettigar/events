// Pure unit tests: no database, no tests/setup.js (which resets/cleans a DB).
module.exports = {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/availableEvents.test.js', '**/tests/registrationLimit.test.js'],
  verbose: true
};
