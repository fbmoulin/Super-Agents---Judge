// n8n_nodes/redis_cache.js
// Helper functions for Redis Cloud caching in n8n

const REDIS_URL = $env.REDIS_URL;
const REDIS_TOKEN = $env.REDIS_TOKEN;

/**
 * Generate cache key from query
 */
function generateCacheKey(prefix, text) {
  const normalized = text.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${prefix}:${Math.abs(hash).toString(16)}`;
}

/**
 * Check cache - returns cached value or null
 */
async function checkCache(key) {
  try {
    const response = await fetch(`${REDIS_URL}/get/${key}`, {
      headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
    });
    const data = await response.json();
    return data.result || null;
  } catch (e) {
    console.log('Cache miss:', key);
    return null;
  }
}

/**
 * Store in cache with TTL
 */
async function setCache(key, value, ttlSeconds) {
  try {
    await fetch(`${REDIS_URL}/set/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: typeof value === 'string' ? value : JSON.stringify(value),
        ex: ttlSeconds
      })
    });
    return true;
  } catch (e) {
    console.log('Cache set failed:', key);
    return false;
  }
}

/**
 * Invalidate cache keys by pattern
 */
async function invalidatePattern(pattern) {
  try {
    const response = await fetch(`${REDIS_URL}/keys/${pattern}`, {
      headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
    });
    const data = await response.json();
    const keys = data.result || [];

    for (const key of keys) {
      await fetch(`${REDIS_URL}/del/${key}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
      });
    }
    return keys.length;
  } catch (e) {
    console.log('Invalidation failed:', pattern);
    return 0;
  }
}

// Export for use in n8n Code nodes
return { generateCacheKey, checkCache, setCache, invalidatePattern };
