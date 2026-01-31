/**
 * HTTP Client Utility Module
 * Centralized HTTP request handling for API calls
 */

const https = require('https');

const DEFAULT_TIMEOUT = 120000; // 120 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Make a request to the Anthropic Claude API
 * @param {Object} options - Request options
 * @param {string} options.systemPrompt - System prompt for the model
 * @param {string} options.userMessage - User message content
 * @param {string} [options.model] - Model to use (default: claude-sonnet-4-20250514)
 * @param {number} [options.maxTokens] - Maximum tokens in response (default: 4096)
 * @param {number} [options.temperature] - Temperature for generation (default: 0.3)
 * @param {number} [options.timeout] - Request timeout in ms (default: 120000)
 * @returns {Promise<Object>} API response object
 */
async function anthropicRequest({
  systemPrompt,
  userMessage,
  model = 'claude-sonnet-4-20250514',
  maxTokens = 4096,
  temperature = 0.3,
  timeout = DEFAULT_TIMEOUT
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set');
  }

  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }]
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (response.error) {
            const error = new Error(response.error.message || 'API error');
            error.type = response.error.type;
            error.status = res.statusCode;
            reject(error);
          } else {
            resolve(response);
          }
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Extract text content from Anthropic API response
 * @param {Object} response - Anthropic API response
 * @returns {string} Text content from response
 */
function extractText(response) {
  if (response?.content?.[0]?.text) {
    return response.content[0].text;
  }
  throw new Error('No text content in response');
}

/**
 * Make a request with automatic retry on failure
 * @param {Function} requestFn - Async function to execute
 * @param {number} [retries] - Number of retries (default: MAX_RETRIES)
 * @param {number} [delay] - Delay between retries in ms (default: RETRY_DELAY)
 * @returns {Promise<any>} Result from requestFn
 */
async function withRetry(requestFn, retries = MAX_RETRIES, delay = RETRY_DELAY) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (error.status === 401 || error.status === 403) {
        throw error; // Auth errors - don't retry
      }

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}

module.exports = {
  anthropicRequest,
  extractText,
  withRetry,
  DEFAULT_TIMEOUT,
  MAX_RETRIES,
  RETRY_DELAY
};
