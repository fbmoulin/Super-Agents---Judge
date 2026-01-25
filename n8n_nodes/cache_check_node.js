// n8n_nodes/cache_check_node.js
// Place this Code node BEFORE the RAG search in the workflow

const REDIS_URL = $env.REDIS_URL;
const REDIS_TOKEN = $env.REDIS_TOKEN;

const query = $input.first().json.query || $input.first().json.body?.query || '';

// Generate cache key
const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
let hash = 0;
for (let i = 0; i < normalized.length; i++) {
  hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
  hash = hash & hash;
}
const cacheKey = `rag:${Math.abs(hash).toString(16)}`;

// Check cache
let cached = null;
try {
  const response = await fetch(`${REDIS_URL}/get/${cacheKey}`, {
    headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
  });
  const data = await response.json();
  if (data.result) {
    cached = JSON.parse(data.result);
  }
} catch (e) {
  // Cache miss, continue to RAG
}

return [{
  json: {
    ...$input.first().json,
    cache_key: cacheKey,
    cache_hit: cached !== null,
    cached_result: cached
  }
}];
