/**
 * Redis Cache Module for Lex Intelligentia
 * Caches high-quality generated drafts to reduce LLM API costs.
 *
 * @module lib/cache
 * @version 1.0.0
 */

const crypto = require('crypto');
const logger = require('./logger');

const { version } = require('../package.json');
const CACHE_PREFIX = `lex:v${version}:`;

/**
 * Normalize text for consistent cache key generation.
 * Collapses whitespace and trims.
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Generate a deterministic cache key from case input.
 * @param {Object} input - Case input with fatos, questoes, pedidos, classe, assunto
 * @returns {string} Cache key like "lex:v2.7:abc123def456"
 */
function generateCacheKey(input) {
  const normalized = JSON.stringify({
    fatos: normalizeText(input.fatos),
    questoes: normalizeText(input.questoes),
    pedidos: normalizeText(input.pedidos),
    classe: normalizeText(input.classe),
    assunto: normalizeText(input.assunto)
  });
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  return `${CACHE_PREFIX}${hash.substring(0, 16)}`;
}

/**
 * Get TTL (time-to-live) in seconds based on QA confidence score.
 * Higher confidence = longer cache duration.
 * @param {number} confidence - QA confidence score (0-1)
 * @returns {number} TTL in seconds (0 = don't cache)
 */
function getTTL(confidence) {
  if (confidence >= 0.90) return 604800;  // 7 days
  if (confidence >= 0.70) return 86400;   // 1 day
  return 0;  // Don't cache low-confidence results
}

/**
 * Create a cache client. Supports mock mode for testing without Redis.
 * @param {Object} options - Configuration options
 * @param {boolean} options.mock - Use in-memory Map instead of Redis
 * @param {string} options.host - Redis host
 * @param {number} options.port - Redis port
 * @returns {Object} Cache client with get, set, quit methods
 */
function createCacheClient(options = {}) {
  if (options.mock) {
    const store = new Map();
    return {
      get: async (key) => store.get(key) || null,
      set: async (key, value, ttl) => { store.set(key, value); },
      quit: async () => { store.clear(); },
      _store: store
    };
  }

  let Redis;
  try {
    Redis = require('ioredis');
  } catch (e) {
    logger.warn('ioredis not installed, using mock cache');
    return createCacheClient({ mock: true });
  }

  const redis = new Redis({
    host: options.host || process.env.REDIS_HOST || 'localhost',
    port: options.port || parseInt(process.env.REDIS_PORT || '6379', 10),
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: true
  });

  return {
    get: async (key) => {
      try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
      } catch (err) {
        logger.error('Cache GET failed', { error: err.message, key });
        return null;
      }
    },
    set: async (key, value, ttl) => {
      try {
        if (ttl > 0) {
          await redis.setex(key, ttl, JSON.stringify(value));
        }
      } catch (err) {
        logger.error('Cache SET failed', { error: err.message, key });
      }
    },
    quit: async () => {
      try { await redis.quit(); } catch (e) { /* ignore */ }
    }
  };
}

/**
 * Get a cached result from the cache client.
 * @param {Object} client - Cache client created by createCacheClient
 * @param {string} key - Cache key
 * @returns {Promise<Object|null>} Cached data or null
 */
async function getCachedResult(client, key) {
  return client.get(key);
}

/**
 * Store a result in the cache client.
 * @param {Object} client - Cache client created by createCacheClient
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @param {number} ttl - Time-to-live in seconds (0 = don't cache)
 */
async function setCachedResult(client, key, data, ttl) {
  if (ttl <= 0) return;
  await client.set(key, data, ttl);
}

module.exports = {
  CACHE_PREFIX,
  normalizeText,
  generateCacheKey,
  getTTL,
  createCacheClient,
  getCachedResult,
  setCachedResult
};
