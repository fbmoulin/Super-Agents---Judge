// scripts/invalidate_cache.js
// Run this when knowledge_base files are updated

const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.REDIS_TOKEN;

async function invalidateCache() {
  console.log('Invalidating precedent cache...');

  // Get all precedent keys
  const response = await fetch(`${REDIS_URL}/keys/prec:*`, {
    headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
  });
  const data = await response.json();
  const keys = data.result || [];

  console.log(`Found ${keys.length} cached precedents`);

  // Delete each key
  for (const key of keys) {
    await fetch(`${REDIS_URL}/del/${key}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
    });
  }

  console.log(`Invalidated ${keys.length} cache entries`);
}

invalidateCache().catch(console.error);
