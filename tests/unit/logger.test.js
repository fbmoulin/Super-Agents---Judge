/**
 * Unit Tests for Logger Module
 */

describe('Logger Module', () => {
  let logger;
  let consoleSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    // Clear module cache to reset LOG_LEVEL
    jest.resetModules();

    // Spy on console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Reset environment
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_FORMAT;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Default logging (info level)', () => {
    beforeEach(() => {
      logger = require('../../lib/logger');
    });

    test('info() logs to console', () => {
      logger.info('test message');
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('test message');
    });

    test('warn() logs to console.warn', () => {
      logger.warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('warning message');
    });

    test('error() logs to console.error', () => {
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('error message');
    });

    test('debug() is suppressed at info level', () => {
      logger.debug('debug message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Debug level logging', () => {
    beforeEach(() => {
      process.env.LOG_LEVEL = 'debug';
      logger = require('../../lib/logger');
    });

    test('debug() logs when LOG_LEVEL=debug', () => {
      logger.debug('debug message');
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('debug message');
    });

    test('info() still logs at debug level', () => {
      logger.info('info message');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Error level logging', () => {
    beforeEach(() => {
      process.env.LOG_LEVEL = 'error';
      logger = require('../../lib/logger');
    });

    test('info() is suppressed at error level', () => {
      logger.info('info message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    test('warn() is suppressed at error level', () => {
      logger.warn('warning message');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    test('error() still logs at error level', () => {
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('JSON format', () => {
    beforeEach(() => {
      process.env.LOG_FORMAT = 'json';
      logger = require('../../lib/logger');
    });

    test('outputs valid JSON', () => {
      logger.info('test message');
      const output = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);

      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('test message');
      expect(parsed.timestamp).toBeDefined();
    });

    test('includes metadata in JSON', () => {
      logger.info('test message', { user: 'test', count: 42 });
      const output = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(output);

      expect(parsed.user).toBe('test');
      expect(parsed.count).toBe(42);
    });
  });

  describe('Metadata handling', () => {
    beforeEach(() => {
      logger = require('../../lib/logger');
    });

    test('includes metadata in log output', () => {
      logger.info('test', { key: 'value' });
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('key=value');
    });

    test('handles object metadata', () => {
      logger.info('test', { nested: { a: 1 } });
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('nested=');
    });
  });

  describe('timing()', () => {
    beforeEach(() => {
      logger = require('../../lib/logger');
    });

    test('logs with durationMs', () => {
      logger.timing('Operation', 1234);
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('Operation completed');
      expect(output).toContain('durationMs=1234');
    });

    test('rounds milliseconds', () => {
      logger.timing('Fast op', 1.567);
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('durationMs=2');
    });
  });

  describe('success()', () => {
    beforeEach(() => {
      logger = require('../../lib/logger');
    });

    test('logs success message', () => {
      logger.success('Task done');
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('Task done');
    });
  });

  describe('section()', () => {
    beforeEach(() => {
      logger = require('../../lib/logger');
    });

    test('outputs section header', () => {
      logger.section('Test Section');
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[1][0]).toContain('Test Section');
    });
  });

  describe('testResult()', () => {
    beforeEach(() => {
      logger = require('../../lib/logger');
    });

    test('outputs passing test', () => {
      logger.testResult('Test name', true);
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('Test name');
    });

    test('outputs failing test', () => {
      logger.testResult('Test name', false);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('includes details when provided', () => {
      logger.testResult('Test', true, '100ms');
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('100ms');
    });
  });

  describe('createLogger()', () => {
    beforeEach(() => {
      logger = require('../../lib/logger');
    });

    test('creates child logger with base metadata', () => {
      const childLogger = logger.createLogger({ service: 'test' });
      childLogger.info('message');

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('service=test');
    });

    test('merges additional metadata', () => {
      const childLogger = logger.createLogger({ service: 'test' });
      childLogger.info('message', { extra: 'data' });

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('service=test');
      expect(output).toContain('extra=data');
    });
  });
});
