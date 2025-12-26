import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.OPENAI_MODEL = 'gpt-4o-mini';

// Mock uuid to avoid ES module issues
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Date.now() + '-' + Math.random(),
}));
