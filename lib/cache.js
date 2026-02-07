/**
 * Redis Cache Module for Lex Intelligentia
 * Caches high-quality generated drafts to reduce LLM API costs.
 *
 * @module lib/cache
 * @version 1.0.0
 */

const crypto = require('crypto');
const logger = require('./logger');

const CACHE_PREFIX = 'lex:v2.7:';

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

module.exports = {
  CACHE_PREFIX,
  normalizeText,
  generateCacheKey,
  getTTL
};
