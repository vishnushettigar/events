// Test configuration
export const testConfig = {
  database: {
    url: process.env.DATABASE_URL || 'file:./test.db'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only'
  },
  server: {
    port: process.env.PORT || 4001
  }
};

export default testConfig;
