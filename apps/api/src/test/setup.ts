// Set env required by config/env.ts BEFORE it's imported anywhere.
// Jest evaluates this file before each test file's imports.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-16-chars-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-16-chars-long';
process.env.ANTHROPIC_API_KEY = '';
