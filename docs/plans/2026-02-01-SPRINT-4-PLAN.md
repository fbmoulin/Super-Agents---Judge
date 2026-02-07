# Sprint 4 Implementation Plan - Performance & RAG Integration

**Date:** 2026-02-01
**Version:** v2.6.2 → v2.7.0
**Status:** Ready for Implementation
**Duration:** 2 weeks (February 2026)

---

## Executive Summary

Sprint 4 focuses on two major improvements:
1. **Performance Optimization** - Redis caching + parallel QA for cost/latency reduction
2. **RAG Integration** - STJ jurisprudence via Qdrant for improved precedent citation

**Expected Outcomes:**
| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Cost per request | $0.025 | $0.012 | 52% reduction |
| Latency (P95) | 5s | 3s | 40% reduction |
| Cache hit rate | 0% | 40% | New capability |
| Precedent accuracy | 85% | 95% | 10-15% improvement |
| Agents validated | 19/21 | 21/21 | 100% coverage |

---

## Infrastructure Status (Pre-validated)

| Component | Status | Location |
|-----------|--------|----------|
| Redis 7 Alpine | ✅ Configured | docker/docker-compose.yml |
| Qdrant 1.7.4 | ✅ Configured | docker/docker-compose-qdrant.yml |
| OpenAI Embeddings | ✅ Ready | text-embedding-3-small (1024d) |
| agent_MANDADO_SEGURANCA | ✅ Complete | agents/agent_MANDADO_SEGURANCA.md |
| agent_SAUDE_MEDICAMENTOS | ✅ Complete | agents/agent_SAUDE_MEDICAMENTOS.md |

---

## Task Breakdown

### Phase 1: Performance (Week 1)

#### PERF-001: Redis Caching Layer
**Priority:** HIGH | **Effort:** 3-4 days | **Impact:** 40-50% cost reduction

**Implementation Steps:**
1. Create `lib/cache.js` module:
   ```javascript
   const crypto = require('crypto');
   const Redis = require('ioredis');

   const redis = new Redis({
     host: process.env.REDIS_HOST || 'localhost',
     port: process.env.REDIS_PORT || 6379
   });

   function generateCacheKey(input) {
     const normalized = JSON.stringify({
       fatos: normalizeText(input.fatos),
       questoes: normalizeText(input.questoes),
       pedidos: normalizeText(input.pedidos),
       classe: input.classe_processual,
       assunto: input.assunto
     });
     const hash = crypto.createHash('sha256').update(normalized).digest('hex');
     return `lex:v2.7:${hash.substring(0, 16)}`;
   }

   function getTTL(confidence) {
     if (confidence >= 0.90) return 604800;  // 7 days
     if (confidence >= 0.70) return 86400;   // 1 day
     return 0;  // No cache
   }
   ```

2. Add n8n workflow nodes:
   - "Calculate Cache Key" (Code node)
   - "Redis GET" (HTTP Request)
   - "Cache Hit?" (IF node)
   - "Return Cached" (Respond node)
   - "Redis SET" (HTTP Request after Build Response)

**Verification:**
```bash
# Test cache hit
curl -X POST localhost:5678/webhook/lex-intelligentia-agentes -d @test_case.json
# Second call should be <100ms with cache_hit: true
```

#### PERF-002: Parallel QA Validation
**Priority:** HIGH | **Effort:** 1-2 days | **Impact:** 0.5-1s latency reduction
**Blocked by:** PERF-001 (cache infrastructure)

**Current Flow:**
```
[Prepare for QA] → [QA Estrutural] → [QA Semântico] → [QA Consolidado]
```

**Target Flow:**
```
[Prepare for QA] → [Split] → [QA Estrutural] ──┬──→ [Merge] → [QA Consolidado]
                          → [QA Semântico]  ──┘
```

**Implementation:**
1. Add Split node (type: "n8n-nodes-base.split")
2. Route both branches to QA nodes
3. Add Merge node (type: "n8n-nodes-base.merge", mode: "combine")
4. Update QA Consolidado to wait for both inputs

---

### Phase 2: RAG Integration (Week 1-2)

#### RAG-001: STJ Jurisprudence Integration
**Priority:** HIGH | **Effort:** 3-4 days | **Impact:** 10-15% accuracy improvement

**Data Pipeline:**
```bash
# 1. Download STJ data
npm run download:stj

# 2. Start Qdrant
docker compose -f docker/docker-compose-qdrant.yml up -d

# 3. Ingest to vector store
python scripts/data/qdrant_ingest.py --create-collection --collection stj_precedentes
python scripts/data/qdrant_ingest.py --ingest --input data/stj_chunks/ --collection stj_precedentes

# 4. Verify
python scripts/data/qdrant_ingest.py --stats --collection stj_precedentes
```

**Workflow Integration:**
1. Add "RAG Query" node after Gemini Router
2. Query Qdrant with case embedding
3. Filter by tema/domain from router classification
4. Inject top-5 precedents into system prompt context

**Search Configuration:**
```python
search_params = {
    "hnsw_ef": 128,
    "exact": False
}
query_filter = {
    "must": [
        {"key": "tema", "match": {"any": [relevant_themes]}}
    ]
}
```

#### RAG-002: Hybrid Search (BM25 + Vector)
**Priority:** MEDIUM | **Effort:** 2 days | **Impact:** 15-25% precision improvement
**Blocked by:** RAG-001

**Components:**
- BM25: Exact legal term matching (súmulas, artigos)
- Vector: Semantic similarity for concepts
- Fusion: Reciprocal Rank Fusion (RRF) with k=60

---

### Phase 3: Agent Validation (Week 2)

#### AGT-001: MANDADO_SEGURANCA Validation
**Priority:** HIGH | **Effort:** 1 day

**Test Cases to Create:**
| Case ID | Scenario | Expected Outcome |
|---------|----------|------------------|
| MS-001 | Servidor público - demissão sem PAD | Liminar deferida |
| MS-002 | Concurso público - nomeação | Concessão da segurança |

**Validation Command:**
```bash
npm run validate:agent mandado_seguranca
# Target: Score ≥85%, Confidence ≥0.85
```

#### AGT-002: SAUDE_MEDICAMENTOS Validation
**Priority:** HIGH | **Effort:** 1 day

**Test Cases to Create:**
| Case ID | Scenario | Expected Outcome |
|---------|----------|------------------|
| SM-001 | Medicamento oncológico alto custo | Procedência (Tema 1234) |
| SM-002 | Medicamento off-label sem ANVISA | Improcedência |

**Tema 1234 STF Requirements (Cumulative):**
1. Laudo médico fundamentado
2. Registro ANVISA
3. Ineficácia de alternativas SUS
4. Hipossuficiência econômica

---

## Dependencies Graph

```
PERF-001 (Redis Cache)
    ↓
PERF-002 (Parallel QA)

RAG-001 (Qdrant Integration)
    ↓
RAG-002 (Hybrid Search)

AGT-001 (MANDADO_SEGURANCA) ─┐
                              ├─→ Sprint 4 Complete
AGT-002 (SAUDE_MEDICAMENTOS) ─┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/cache.js` | CREATE | Redis caching module |
| `lib/rag.js` | CREATE | RAG query utilities |
| `tests/unit/cache.test.js` | CREATE | Cache module tests |
| `tests/unit/rag.test.js` | CREATE | RAG module tests |
| `test_cases/mandado_seguranca/` | CREATE | MS test cases |
| `test_cases/saude_medicamentos/` | CREATE | SM test cases |
| `scripts/validators/agent_validator.js` | MODIFY | Add new agent mappings |
| `n8n_workflow_v2.7.json` | MODIFY | Add cache + parallel nodes |

---

## Success Criteria

- [ ] Redis cache operational with ≥40% hit rate
- [ ] QA validation running in parallel (<4s total)
- [ ] Qdrant collection populated with STJ data
- [ ] MANDADO_SEGURANCA validated (Score ≥85%)
- [ ] SAUDE_MEDICAMENTOS validated (Score ≥85%)
- [ ] All 176+ tests passing
- [ ] Version bump to v2.7.0

---

## Risk Mitigation

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Redis connection failures | Low | Graceful fallback to no-cache |
| Qdrant query latency | Medium | Cache embeddings, tune hnsw_ef |
| Agent validation failures | Low | Iterative prompt refinement |

---

## Verification Plan

```bash
# 1. Run all tests
npm test

# 2. Validate agents
npm run validate:agent mandado_seguranca
npm run validate:agent saude_medicamentos

# 3. Check cache hit rate
redis-cli INFO stats | grep keyspace_hits

# 4. Test RAG integration
python scripts/data/qdrant_ingest.py --search "súmula 297 STJ"

# 5. Full workflow test
curl -X POST localhost:5678/webhook/lex-intelligentia-agentes \
  -H "Content-Type: application/json" \
  -d @test_cases/bancario/caso_01.json
```

---

*Plan created: 2026-02-01 | Sprint 4 - Performance & RAG Integration*
