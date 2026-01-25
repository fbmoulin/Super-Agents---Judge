# Workflow v4.0 Caching Integration

## Node Changes

### Before RAG Search (each agent)
1. Add "Cache Check" Code node
   - Source: `n8n_nodes/cache_check_node.js`
   - Outputs: cache_key, cache_hit, cached_result

### Conditional Branch
2. Add IF node after Cache Check
   - Condition: `{{ $json.cache_hit }} === true`
   - True: Skip to Format Results (use cached_result)
   - False: Continue to RAG Search

### After RAG Search
3. Add "Cache Store" Code node
   - Source: `n8n_nodes/cache_store_node.js`
   - Only runs on cache miss

### Environment Variables
```
REDIS_URL=https://your-redis-cloud-url
REDIS_TOKEN=your-redis-token
```

## Flow Diagram

```
Input → Cache Check → [Cache Hit?]
                          ↓ Yes → Use Cached → Format Results
                          ↓ No  → RAG Search → Cache Store → Format Results
```

## TTL Configuration

| Cache Layer | Key Pattern | TTL | Notes |
|-------------|-------------|-----|-------|
| RAG Results | `rag:{hash}` | 1 hour | Short TTL for fresh results |
| Embeddings | `emb:{hash}` | 7 days | Longer TTL for stable embeddings |
| Precedents | `prec:{id}` | 30 days | Event-based invalidation |

## Cache Invalidation

Run `scripts/invalidate_cache.js` when updating knowledge_base files:

```bash
REDIS_URL=... REDIS_TOKEN=... node scripts/invalidate_cache.js
```

## Metrics Integration

The `cache_hit` field is tracked in the metrics logger:
- Dashboard shows cache hit rate
- Useful for monitoring cache effectiveness
