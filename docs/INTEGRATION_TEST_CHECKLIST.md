# Integration Test Checklist

## Prerequisites

1. Supabase project configured with:
   - Tables created from `migrations/001_metrics_schema.sql`
   - RPC function from `migrations/002_log_execution_function.sql`
   - Realtime enabled on executions and quality_scores tables

2. Redis Cloud instance with credentials

3. n8n Cloud workflow with environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `REDIS_URL`
   - `REDIS_TOKEN`

4. Dashboard running with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Test 1: Metrics Flow

### Steps:
1. Run a test case through n8n workflow
2. Check Supabase `executions` table for new row
3. Check Supabase `quality_scores` table for quality data
4. Verify dashboard shows the execution in real-time

### Expected Results:
- [ ] Execution appears in Supabase within 5 seconds
- [ ] Quality scores calculated and stored
- [ ] Dashboard updates within 2 seconds (realtime subscription)

---

## Test 2: Quality Validation

### Steps:
1. Run a decision with all required sections (RELATÓRIO, FUNDAMENTAÇÃO, DISPOSITIVO)
2. Check quality_scores table

### Expected Results:
- [ ] structure_score = 1.0 when all sections present
- [ ] citation_score calculated based on valid súmulas/temas
- [ ] reasoning_score considers paragraphs, specific facts, legal references

---

## Test 3: Caching Flow

### Steps:
1. Run same RAG query twice
2. Check cache_hit values in Supabase

### Expected Results:
- [ ] First query: cache_hit = false
- [ ] Second query: cache_hit = true
- [ ] Latency reduced on second query

---

## Test 4: Cache Invalidation

### Steps:
1. Run `REDIS_URL=... REDIS_TOKEN=... node scripts/invalidate_cache.js`
2. Check Redis for deleted keys

### Expected Results:
- [ ] Script reports number of invalidated entries
- [ ] Subsequent queries return cache_hit = false

---

## Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| Dashboard real-time updates | < 2 seconds | [ ] |
| Quality scores average | ≥ 0.85 | [ ] |
| Cache hit rate (after warmup) | ≥ 40% | [ ] |
| Latency reduction on cache hits | ≥ 30% | [ ] |
