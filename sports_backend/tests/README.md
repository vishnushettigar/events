# API Testing Suite

This directory contains comprehensive API tests for the Sports Events Backend using Node.js testing tools.

## Testing Stack

- **Jest**: Main testing framework
- **Supertest**: HTTP assertion library for API testing
- **Prisma**: Database testing utilities
- **SQLite**: Test database

## Test Structure

```
tests/
├── setup.js              # Global test setup and teardown
├── config.js             # Test configuration
├── testDatabase.js       # Database utilities and factories
├── testUtils.js          # Common testing utilities
├── auth.test.js          # Authentication API tests
├── events.test.js        # Event management API tests
├── admin.test.js         # Admin functionality API tests
└── README.md             # This file
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests for CI/CD
```bash
npm run test:ci
```

## Test Categories

### 1. Authentication Tests (`auth.test.js`)
- User registration
- User login
- Aadhaar number validation
- Email validation
- Profile retrieval
- JWT token validation

### 2. Event Management Tests (`events.test.js`)
- Individual event registration
- Team event registration
- Event unregistration
- Participant data retrieval
- Event listing
- Role-based access control

### 3. Admin Functionality Tests (`admin.test.js`)
- Admin access verification
- Dashboard statistics
- User management
- Role management
- Temple management
- Event management
- Participant management
- Team management

## Test Database

- Uses SQLite test database (`test.db`)
- Automatically resets between test runs
- Isolated test data per test suite
- Cleanup after each test

## Test Utilities

### Database Factories
- `createTestUser()` - Create test users
- `createTestProfile()` - Create test profiles
- `createTestEvent()` - Create test events
- `createTestTemple()` - Create test temples
- `createTestRole()` - Create test roles

### Authentication Helpers
- `generateTestToken()` - Generate JWT tokens for testing
- `createAuthenticatedUser()` - Create user with authentication
- `createAdminUser()` - Create admin user
- `createTempleAdminUser()` - Create temple admin user

### Data Setup
- `setupTestData()` - Create complete test data setup
- `cleanupTestData()` - Clean up all test data

## Test Configuration

Tests are configured in `jest.config.js`:
- ES6 module support
- Test environment: Node.js
- Coverage reporting
- Test timeout: 10 seconds
- Setup files configuration

## Environment Variables

Test environment uses:
- `NODE_ENV=test`
- `DATABASE_URL=file:./test.db`
- `JWT_SECRET=test-jwt-secret-key-for-testing-only`

## Best Practices

1. **Isolation**: Each test is isolated and doesn't depend on others
2. **Cleanup**: Database is cleaned after each test
3. **Mocking**: External dependencies are mocked when necessary
4. **Coverage**: Aim for high test coverage
5. **Realistic Data**: Use realistic test data that matches production
6. **Error Testing**: Test both success and error scenarios
7. **Authentication**: Test both authenticated and unauthenticated requests
8. **Authorization**: Test role-based access control

## Adding New Tests

1. Create new test file following naming convention: `*.test.js`
2. Import necessary utilities from `testUtils.js`
3. Set up test data using factories
4. Write test cases covering success and error scenarios
5. Clean up test data after each test
6. Update this README if adding new test categories

## Troubleshooting

### Common Issues

1. **Database Connection Errors**: Ensure test database is properly configured
2. **JWT Token Issues**: Check JWT secret configuration
3. **Test Timeouts**: Increase timeout in jest.config.js if needed
4. **Memory Issues**: Ensure proper cleanup in afterEach/afterAll hooks

### Debug Mode

Run tests with debug output:
```bash
DEBUG=* npm test
```

## CI/CD Integration

Tests are designed to run in CI/CD environments:
- No interactive prompts
- Proper exit codes
- Coverage reporting
- Parallel execution support
