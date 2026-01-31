/**
 * Jest Setup File
 * Runs before each test file
 */

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock API keys for tests (won't actually call APIs)
process.env.ANTHROPIC_API_KEY = 'test-key-mock';
process.env.GEMINI_API_KEY = 'test-key-mock';

// Global test timeout
jest.setTimeout(10000);

// Silence console during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
