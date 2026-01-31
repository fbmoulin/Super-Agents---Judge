/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'lib/**/*.js',
    'config/**/*.js',
    'scripts/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    './lib/': {
      lines: 80,
      branches: 60,
      functions: 70,
      statements: 80
    },
    './config/': {
      lines: 70,
      branches: 50,
      functions: 60,
      statements: 70
    }
  },
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['./tests/setup.js'],
  modulePathIgnorePatterns: [
    '<rootDir>/archive/',
    '<rootDir>/agent-ui/',
    '<rootDir>/agent-os/'
  ]
};
