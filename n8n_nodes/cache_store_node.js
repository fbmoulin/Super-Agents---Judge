// n8n_nodes/cache_store_node.js
// Place this Code node AFTER the RAG search (if not a cache hit)

const REDIS_URL = $env.REDIS_URL;
const REDIS_TOKEN = $env.REDIS_TOKEN;

const input = $input.first().json;
const cacheKey = input.cache_key;
const ragResult = input.rag_context || input.result;

// Only store if we have results and this wasn't a cache hit
if (!input.cache_hit && ragResult && cacheKey) {
  const TTL_SECONDS = 3600; // 1 hour for RAG results

  try {
    await fetch(`${REDIS_URL}/set/${cacheKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: JSON.stringify(ragResult),
        ex: TTL_SECONDS
      })
    });
    console.log('Cached RAG result:', cacheKey);
  } catch (e) {
    console.log('Cache store failed:', cacheKey);
  }
}

return [{
  json: {
    ...input,
    cache_stored: !input.cache_hit
  }
}];
