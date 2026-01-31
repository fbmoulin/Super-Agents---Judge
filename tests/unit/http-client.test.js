/**
 * Unit Tests for HTTP Client Module
 */

const {
  anthropicRequest,
  extractText,
  withRetry,
  DEFAULT_TIMEOUT,
  MAX_RETRIES
} = require('../../lib/http-client');

// Mock https module
jest.mock('https', () => ({
  request: jest.fn()
}));

const https = require('https');

describe('HTTP Client Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe('Constants', () => {
    test('DEFAULT_TIMEOUT should be 120 seconds', () => {
      expect(DEFAULT_TIMEOUT).toBe(120000);
    });

    test('MAX_RETRIES should be 3', () => {
      expect(MAX_RETRIES).toBe(3);
    });
  });

  describe('anthropicRequest', () => {
    test('should reject without API key', async () => {
      delete process.env.ANTHROPIC_API_KEY;

      await expect(anthropicRequest({
        systemPrompt: 'test',
        userMessage: 'test'
      })).rejects.toThrow('ANTHROPIC_API_KEY environment variable not set');
    });

    test('should make request with correct options', async () => {
      const mockReq = {
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        setTimeout: jest.fn()
      };

      const mockRes = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({
              content: [{ text: 'response text' }]
            }));
          }
          if (event === 'end') {
            callback();
          }
        })
      };

      https.request.mockImplementation((options, callback) => {
        // Verify request options
        expect(options.hostname).toBe('api.anthropic.com');
        expect(options.path).toBe('/v1/messages');
        expect(options.method).toBe('POST');
        expect(options.headers['x-api-key']).toBe('test-api-key');
        expect(options.headers['anthropic-version']).toBe('2023-06-01');

        callback(mockRes);
        return mockReq;
      });

      const response = await anthropicRequest({
        systemPrompt: 'You are helpful',
        userMessage: 'Hello'
      });

      expect(response.content[0].text).toBe('response text');
      expect(mockReq.write).toHaveBeenCalled();
      expect(mockReq.end).toHaveBeenCalled();
    });

    test('should use custom model and temperature', async () => {
      const mockReq = {
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        setTimeout: jest.fn()
      };

      const mockRes = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({ content: [{ text: 'ok' }] }));
          }
          if (event === 'end') {
            callback();
          }
        })
      };

      https.request.mockImplementation((options, callback) => {
        callback(mockRes);
        return mockReq;
      });

      await anthropicRequest({
        systemPrompt: 'test',
        userMessage: 'test',
        model: 'claude-3-opus',
        temperature: 0.7,
        maxTokens: 1000
      });

      // Check the body was written with correct params
      const writeCall = mockReq.write.mock.calls[0][0];
      const body = JSON.parse(writeCall);
      expect(body.model).toBe('claude-3-opus');
      expect(body.temperature).toBe(0.7);
      expect(body.max_tokens).toBe(1000);
    });

    test('should handle API errors', async () => {
      const mockReq = {
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        setTimeout: jest.fn()
      };

      const mockRes = {
        statusCode: 400,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({
              error: { message: 'Bad request', type: 'invalid_request_error' }
            }));
          }
          if (event === 'end') {
            callback();
          }
        })
      };

      https.request.mockImplementation((options, callback) => {
        callback(mockRes);
        return mockReq;
      });

      await expect(anthropicRequest({
        systemPrompt: 'test',
        userMessage: 'test'
      })).rejects.toThrow('Bad request');
    });

    test('should handle network errors', async () => {
      const mockReq = {
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Connection refused'));
          }
        }),
        setTimeout: jest.fn()
      };

      https.request.mockImplementation(() => mockReq);

      await expect(anthropicRequest({
        systemPrompt: 'test',
        userMessage: 'test'
      })).rejects.toThrow('Network error: Connection refused');
    });

    test('should handle malformed JSON response', async () => {
      const mockReq = {
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        setTimeout: jest.fn()
      };

      const mockRes = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback('not valid json');
          }
          if (event === 'end') {
            callback();
          }
        })
      };

      https.request.mockImplementation((options, callback) => {
        callback(mockRes);
        return mockReq;
      });

      await expect(anthropicRequest({
        systemPrompt: 'test',
        userMessage: 'test'
      })).rejects.toThrow('Failed to parse API response');
    });
  });

  describe('extractText', () => {
    test('should extract text from valid response', () => {
      const response = {
        content: [{ text: 'Hello world' }]
      };
      expect(extractText(response)).toBe('Hello world');
    });

    test('should throw on missing content', () => {
      expect(() => extractText({})).toThrow('No text content in response');
      expect(() => extractText({ content: [] })).toThrow('No text content in response');
      expect(() => extractText({ content: [{}] })).toThrow('No text content in response');
    });

    test('should handle null/undefined', () => {
      expect(() => extractText(null)).toThrow();
      expect(() => extractText(undefined)).toThrow();
    });
  });

  describe('withRetry', () => {
    test('should return on first success', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(fn, 3, 10);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const result = await withRetry(fn, 3, 10);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('always fails'));

      await expect(withRetry(fn, 3, 10)).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('should not retry on auth errors (401)', async () => {
      const error = new Error('Unauthorized');
      error.status = 401;
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn, 3, 10)).rejects.toThrow('Unauthorized');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('should not retry on forbidden errors (403)', async () => {
      const error = new Error('Forbidden');
      error.status = 403;
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn, 3, 10)).rejects.toThrow('Forbidden');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
