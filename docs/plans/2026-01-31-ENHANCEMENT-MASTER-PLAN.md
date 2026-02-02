# Lex Intelligentia Judiciário - Enhancement Master Plan

**Date:** 2026-01-31
**Version:** 3.0
**Status:** Strategic Planning Document
**Scope:** Q1-Q2 2026 Optimization & Enhancement Roadmap

---

## Executive Summary

This document consolidates findings from a comprehensive multi-agent analysis including:
- Deep codebase exploration (21 agents, 60+ docs, 104 test cases)
- LLM optimization research (2025-2026 best practices)
- Workflow architecture analysis (v2.1.1 Cloud vs Codebase)
- Security and compliance audit (CNJ 615/2025, LGPD)

**Key Metrics:**
- Current Quality Score: 95/100
- Agents Validated: 19/21 (90%)
- Estimated Cost/Request: $0.020-0.035
- Estimated Latency: 3-7 seconds (95th percentile)

**Target Improvements:**
- 40-50% cost reduction through caching and model routing
- 30-40% latency reduction through parallelization
- 100% CNJ 615/2025 compliance
- 100% agent coverage (21/21 validated)

---

## Part 1: Critical Security Fixes (Immediate)

### SEC-CRIT-001: Rotate Exposed Supabase Credentials
**Severity:** CRITICAL
**File:** `agent-ui/.env.local`
**Issue:** Live Supabase API keys committed to repository
**Action:**
1. Rotate Supabase keys immediately in dashboard
2. Remove file from git history: `git filter-branch`
3. Add to `.gitignore`: `**/**.env.local`
4. Use environment variables in deployment

### SEC-HIGH-001: Implement Webhook Authentication
**Severity:** HIGH
**Issue:** n8n webhook accepts unauthenticated requests
**Action:**
```javascript
// Add to webhook node or pre-processor
const AUTH_TOKEN = process.env.WEBHOOK_AUTH_TOKEN;
const providedToken = $input.first().headers['x-auth-token'];
if (providedToken !== AUTH_TOKEN) {
  throw new Error('Unauthorized');
}
```

### SEC-HIGH-002: Add Prompt Injection Protection
**Severity:** HIGH
**Issue:** User input directly interpolated into prompts
**Action:**
```javascript
// Add to security.js
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/i,
  /disregard\s+(previous|above|all)/i,
  /you\s+are\s+now\s+/i,
  /pretend\s+you\s+are/i,
  /act\s+as\s+if/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<\|im_start\|>/i
];

function detectPromptInjection(text) {
  return INJECTION_PATTERNS.some(pattern => pattern.test(text));
}
```

### SEC-HIGH-003: Remove PII from Test Cases
**Severity:** HIGH
**Issue:** Real judicial data in `test_cases/processos_reais/`
**Action:**
1. Add to `.gitignore`: `test_cases/processos_reais/`
2. Create anonymized versions for CI/CD
3. Store originals in secure location (not git)

---

## Part 2: CNJ 615/2025 Compliance Completion

### COMP-001: Complete Audit Schema
**Gap:** Missing required fields in audit log
**Current Fields:** 15 fields
**Required Additions:**
```sql
ALTER TABLE audit_logs ADD COLUMN (
  usuario_autenticado_id VARCHAR(255),      -- User authentication ID
  modelo_versao VARCHAR(50),                 -- Model version (claude-sonnet-4-20250514)
  knowledge_base_version VARCHAR(50),        -- RAG index version
  prompt_template_hash VARCHAR(64),          -- Hash of system prompt used
  tempo_geracao_ms INTEGER,                  -- Generation time
  tokens_entrada INTEGER,                    -- Input tokens
  tokens_saida INTEGER,                      -- Output tokens
  custo_estimado DECIMAL(10,6)              -- Estimated cost USD
);
```

### COMP-002: Add Human-in-the-Loop Markers
**Requirement:** All AI outputs must be marked as requiring human review
**Implementation:**
```javascript
// Add to Build Response node
const response = {
  ...data,
  compliance: {
    cnj_615_2025: true,
    requires_human_review: true,
    ai_generated: true,
    disclaimer: "Esta minuta foi gerada por IA e DEVE ser revisada por um magistrado antes de qualquer uso oficial."
  }
};
```

### COMP-003: Implement Risk Classification API
**Requirement:** Expose risk classification for integration
**Endpoint:** `GET /api/risk-classification/:audit_id`
**Response:**
```json
{
  "audit_id": "LEX-1234567890",
  "risk_level": "BAIXO|MEDIO|ALTO",
  "confidence": 0.85,
  "factors": {
    "qa_score": 92,
    "router_confidence": 0.88,
    "revision_markers": 1
  },
  "recommendation": "Revisão simplificada recomendada"
}
```

---

## Part 3: Performance Optimization

### PERF-001: Implement Redis Caching Layer
**Impact:** 40-50% reduction in API calls
**Target Latency:** 50ms for cache hits vs 3-7s for generation

**Architecture:**
```
[Input] → [Hash Generator] → [Redis Lookup]
                                    ↓
                           [Cache Hit?] ─Yes→ [Return Cached Response]
                                    ↓ No
                           [Full Pipeline] → [Cache Response] → [Return]
```

**Cache Key Strategy:**
```javascript
function generateCacheKey(input) {
  const normalized = {
    fatos: normalizeText(input.fatos),
    questoes: normalizeText(input.questoes),
    pedidos: normalizeText(input.pedidos),
    classe: input.classe_processual,
    assunto: input.assunto
  };
  return `lex:v2.6:${crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex').substring(0, 16)}`;
}
```

**Cache TTL Strategy:**
- High confidence (≥0.90): 7 days
- Medium confidence (0.70-0.89): 1 day
- Low confidence (<0.70): No cache

**Implementation Steps:**
1. Add Redis to docker-compose.yml
2. Create `lib/cache.js` module
3. Add cache lookup before Gemini Router
4. Add cache write after Build Response
5. Add cache invalidation webhook

### PERF-002: Parallel QA Validation
**Impact:** 0.5-1s latency reduction
**Current:** Sequential (Estrutural → Semântico)
**Target:** Parallel execution

**n8n Implementation:**
```
[Prepare for QA] → [Split] → [QA Estrutural] ──┬──→ [Merge] → [QA Consolidado]
                           → [QA Semântico]  ──┘
```

**Code Change (QA Consolidado):**
```javascript
// Wait for both inputs
const estruturalData = $('QA Estrutural').item.json;
const semanticoData = $('QA Semântico - Gemini').item.json;

// Merge scores (existing logic)
const scoreFinal = Math.round(
  (estruturalData.qa_estrutural.score * 0.4) +
  (semanticoData.score_geral * 0.6)
);
```

### PERF-003: Model Routing Optimization
**Impact:** 20-30% cost reduction
**Strategy:** Use cheaper models for simpler tasks

**Routing Matrix:**
| Task | Current Model | Optimized Model | Cost Change |
|------|---------------|-----------------|-------------|
| Router Stage 1 | Gemini 2.5 Flash | Gemini 2.0 Flash | -10% |
| Router Stage 2 | Gemini 2.5 Flash | Same | 0% |
| Generation (Simple) | Claude Sonnet 4 | Claude Haiku 3.5 | -70% |
| Generation (Complex) | Claude Sonnet 4 | Same | 0% |
| QA Semantic | Gemini 2.5 Flash | Gemini 2.0 Flash | -10% |

**Complexity Classification:**
- Simple: confiança ≥ 0.90, categoria in [BANCARIO, CONSUMIDOR]
- Complex: confiança < 0.90, OR categoria in [MANDADO_SEGURANCA, EXECUCAO_FISCAL]

### PERF-004: Batch Processing Support
**Impact:** 10x throughput for bulk operations
**Use Case:** End-of-day processing of accumulated cases

**API Extension:**
```
POST /webhook/lex-intelligentia-batch
Content-Type: application/json

{
  "cases": [
    { "id": "case-1", "fatos": "...", "questoes": "...", "pedidos": "..." },
    { "id": "case-2", "fatos": "...", "questoes": "...", "pedidos": "..." }
  ],
  "options": {
    "max_concurrent": 5,
    "callback_url": "https://..."
  }
}
```

**Response:**
```json
{
  "batch_id": "batch-abc123",
  "status": "processing",
  "total": 10,
  "completed": 0,
  "estimated_completion": "2026-01-31T17:30:00Z"
}
```

---

## Part 4: RAG Integration (Vector Store)

### RAG-001: STJ Jurisprudence Integration
**Impact:** 10-15% accuracy improvement for precedent citation
**Data Source:** STJ (Superior Tribunal de Justiça)

**Architecture:**
```
[User Query] → [Embedding] → [Qdrant Search] → [Top-K Results]
                                                      ↓
[Context Augmentation] ← [Re-ranking] ← [Relevance Filter]
                ↓
        [LLM Generation with Context]
```

**Collection Schema:**
```json
{
  "collection_name": "stj_jurisprudencia",
  "vectors": {
    "size": 1536,
    "distance": "Cosine"
  },
  "payload_schema": {
    "numero_processo": "string",
    "relator": "string",
    "orgao_julgador": "string",
    "data_julgamento": "datetime",
    "ementa": "text",
    "tema": "integer[]",
    "sumula_relacionada": "integer[]",
    "texto_completo": "text"
  }
}
```

**Chunking Strategy:**
- Chunk size: 512 tokens with 10% overlap
- Semantic chunking by legal sections
- Summary augmentation for long documents

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
results = client.search(
    collection_name="stj_jurisprudencia",
    query_vector=embedding,
    query_filter=query_filter,
    limit=5,
    with_payload=True,
    search_params=search_params
)
```

### RAG-002: Hybrid Search Implementation
**Impact:** 15-25% precision improvement

**Components:**
1. **BM25 (Keyword):** Traditional term matching
2. **Vector (Semantic):** Embedding similarity
3. **Fusion:** Reciprocal Rank Fusion (RRF)

**Formula:**
```
RRF_score(d) = Σ 1 / (k + rank_i(d))
where k = 60 (standard constant)
```

### RAG-003: Dynamic Context Window
**Strategy:** Adjust context based on case complexity

| Complexity | Context Tokens | Jurisprudence Chunks |
|------------|----------------|----------------------|
| Simple | 2000 | 2 |
| Medium | 4000 | 4 |
| Complex | 8000 | 8 |

---

## Part 5: Agent Completion

### AGT-001: Complete MANDADO_SEGURANCA Agent
**Status:** Structure exists, prompt incomplete
**Priority:** HIGH (public law coverage)

**Required Additions:**
```json
{
  "titulo": "MANDADO_SEGURANCA",
  "funcao": "Gerar minutas de decisões em mandados de segurança",
  "baseLegal": [
    "Lei 12.016/2009",
    "CF/88 art. 5º, LXIX e LXX",
    "CPC arts. 1-2, 489, 1.027"
  ],
  "sumulas": [
    "STF: 266, 267, 268, 269, 270, 271, 304, 392, 429, 430, 474, 510, 512, 625, 626, 627, 628, 629, 630, 631, 632",
    "STJ: 41, 105, 169, 177, 202, 206, 213, 267, 333, 460, 628, 629"
  ],
  "regras": [
    "Prazo decadencial: 120 dias do ato coator",
    "Legitimidade passiva: autoridade coatora (não pessoa jurídica)",
    "Direito líquido e certo: prova pré-constituída",
    "Não cabe MS: contra ato de gestão comercial, lei em tese, ato intra corporis"
  ]
}
```

### AGT-002: Complete SAUDE_MEDICAMENTOS Agent
**Status:** Pending validation
**Priority:** HIGH (high-volume case type)

**Required Jurisprudence:**
- **Tema 6 STF:** Responsabilidade solidária dos entes federativos
- **Tema 500 STF:** Medicamentos não incorporados ao SUS
- **Tema 793 STF:** Legitimidade passiva
- **Tema 1234 STF:** Medicamentos de alto custo

### AGT-003: Complete EXECUCAO_FISCAL Agent
**Status:** Partial implementation
**Priority:** MEDIUM

**Required Additions:**
- LEF 6.830/80 complete mapping
- CTN arts. 173-174 (prescrição/decadência)
- Súmulas 392, 393, 409, 414, 435, 436/STJ

---

## Part 6: Testing & Quality

### TEST-001: Expand Unit Test Coverage
**Current:** 5 unit tests
**Target:** 25+ unit tests covering all lib/ and config/ modules

**Priority Tests:**
1. `security.test.js` - Add prompt injection detection tests
2. `cache.test.js` - New file for caching module
3. `rag.test.js` - New file for RAG integration
4. `workflow-validation.test.js` - n8n JSON validation

### TEST-002: Implement Integration Tests
**Current:** Empty `/tests/integration/`
**Target:** End-to-end workflow testing

**Test Scenarios:**
```javascript
describe('Full Workflow Integration', () => {
  test('BANCARIO case generates valid minuta', async () => {
    const input = fixtures.bancario.consignado;
    const response = await callWorkflow(input);
    expect(response.qa_result.score_final).toBeGreaterThan(85);
    expect(response.compliance.cnj_615_2025).toBe(true);
  });

  test('Cache hit returns identical response', async () => {
    const input = fixtures.consumidor.negativacao;
    const response1 = await callWorkflow(input);
    const response2 = await callWorkflow(input);
    expect(response2.cache_hit).toBe(true);
    expect(response2.minuta).toEqual(response1.minuta);
  });
});
```

### TEST-003: Add CI/CD Agent Validation
**Current:** Manual via `npm run validate:agent`
**Target:** Automated in GitHub Actions

**Workflow Addition:**
```yaml
validate-agents:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    - name: Install dependencies
      run: npm ci
    - name: Run agent validation
      run: npm run validate:agent -- --all --ci
      env:
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

### TEST-004: Implement Hallucination Detection
**Research Finding:** 17-33% hallucination rate in legal AI tools
**Implementation:**

```javascript
// lib/hallucination-detector.js
const KNOWN_SUMULAS_STJ = require('./data/sumulas-stj.json');
const KNOWN_SUMULAS_STF = require('./data/sumulas-stf.json');

function detectHallucinations(minuta) {
  const issues = [];

  // Check cited súmulas exist
  const citedSumulas = minuta.match(/Súmula\s+(\d+)\s*(STJ|STF)/gi) || [];
  for (const citation of citedSumulas) {
    const [_, number, court] = citation.match(/(\d+)\s*(STJ|STF)/i);
    const db = court === 'STJ' ? KNOWN_SUMULAS_STJ : KNOWN_SUMULAS_STF;
    if (!db[number]) {
      issues.push({
        type: 'SUMULA_NAO_EXISTE',
        citation,
        severity: 'HIGH'
      });
    }
  }

  // Check cited articles exist in mentioned laws
  // ... additional checks

  return issues;
}
```

---

## Part 7: Documentation Consolidation

### DOC-001: Single Source of Truth for Agent Specs
**Problem:** Agent info scattered across:
- `config/prompts/system_prompts.json`
- `agents/*.md` (12 files)
- `CLAUDE.md`
- `AGENTS.md`

**Solution:** Consolidate to:
1. `config/prompts/system_prompts.json` - Machine-readable specs
2. `docs/agents/` - Human-readable documentation (auto-generated)

**Generator Script:**
```javascript
// scripts/generate-agent-docs.js
const prompts = require('../config/prompts/system_prompts.json');

for (const [name, spec] of Object.entries(prompts)) {
  const markdown = generateMarkdown(name, spec);
  fs.writeFileSync(`docs/agents/${name}.md`, markdown);
}
```

### DOC-002: Deprecate Redundant Files
**Files to Archive:**
- `ROADMAP.md` → merge into `docs/plans/`
- `AGENTS.md` → replace with auto-generated index
- `docs/validation/` old reports → archive to `docs/archive/`

### DOC-003: Create API Documentation
**Format:** OpenAPI 3.0 Specification

```yaml
openapi: 3.0.3
info:
  title: Lex Intelligentia API
  version: 2.6.0
paths:
  /webhook/lex-intelligentia-agentes:
    post:
      summary: Generate judicial decision draft
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FIRACInput'
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MinutaResponse'
```

---

## Part 8: Infrastructure & DevOps

### INFRA-001: Docker Compose Full Stack
**Current:** Partial (Qdrant only)
**Target:** Complete development environment

```yaml
# docker/docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  qdrant:
    image: qdrant/qdrant:v1.7.4
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      QDRANT__SERVICE__GRPC_PORT: 6334

  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
    volumes:
      - n8n_data:/home/node/.n8n

  monitoring:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

volumes:
  redis_data:
  qdrant_data:
  n8n_data:
```

### INFRA-002: Prometheus Metrics
**Metrics to Track:**
```
lex_requests_total{agent, status}
lex_request_duration_seconds{agent, percentile}
lex_cache_hits_total
lex_cache_misses_total
lex_qa_score{agent}
lex_tokens_used{model, direction}
lex_cost_usd{model}
lex_hallucinations_detected{type}
```

### INFRA-003: Health Check Endpoint
```javascript
// /webhook/health
return {
  status: 'healthy',
  version: '2.6.0',
  uptime: process.uptime(),
  dependencies: {
    anthropic: await checkAnthropic(),
    gemini: await checkGemini(),
    redis: await checkRedis(),
    qdrant: await checkQdrant(),
    sheets: await checkSheets()
  }
};
```

---

## Part 9: Cost Analysis

### Current Cost Structure (per request)
| Component | Cost (USD) | % Total |
|-----------|------------|---------|
| Claude Sonnet (generation) | $0.018 | 72% |
| Gemini Flash (router) | $0.0001 | 0.4% |
| Gemini Flash (QA) | $0.0001 | 0.4% |
| Google Sheets API | $0.000 | 0% |
| Infrastructure | $0.007 | 28% |
| **Total** | **$0.025** | 100% |

### Optimized Cost Structure
| Component | Current | Optimized | Savings |
|-----------|---------|-----------|---------|
| Generation (cached) | $0.018 | $0.000 | 100% |
| Generation (simple→Haiku) | $0.018 | $0.005 | 72% |
| Generation (complex) | $0.018 | $0.018 | 0% |
| Router | $0.0001 | $0.00005 | 50% |
| QA | $0.0001 | $0.00005 | 50% |
| **Blended Average** | **$0.025** | **$0.012** | **52%** |

### Monthly Cost Projections
| Volume | Current | Optimized | Savings |
|--------|---------|-----------|---------|
| 100/day | $75 | $36 | $39 |
| 500/day | $375 | $180 | $195 |
| 1000/day | $750 | $360 | $390 |
| 5000/day | $3,750 | $1,800 | $1,950 |

---

## Part 10: Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
- [ ] SEC-CRIT-001: Rotate Supabase credentials
- [ ] SEC-HIGH-001: Implement webhook authentication
- [ ] SEC-HIGH-002: Add prompt injection protection
- [ ] SEC-HIGH-003: Remove PII from test cases

### Phase 2: Compliance (Week 2)
- [ ] COMP-001: Complete audit schema
- [ ] COMP-002: Add human-in-the-loop markers
- [ ] COMP-003: Implement risk classification API
- [ ] AGT-001: Complete MANDADO_SEGURANCA

### Phase 3: Performance (Weeks 3-4)
- [ ] PERF-001: Implement Redis caching
- [ ] PERF-002: Parallel QA validation
- [ ] PERF-003: Model routing optimization
- [ ] AGT-002: Complete SAUDE_MEDICAMENTOS

### Phase 4: RAG Integration (Weeks 5-6)
- [ ] RAG-001: STJ jurisprudence integration
- [ ] RAG-002: Hybrid search implementation
- [ ] RAG-003: Dynamic context window
- [ ] AGT-003: Complete EXECUCAO_FISCAL

### Phase 5: Testing & Quality (Weeks 7-8)
- [ ] TEST-001: Expand unit test coverage
- [ ] TEST-002: Implement integration tests
- [ ] TEST-003: Add CI/CD agent validation
- [ ] TEST-004: Implement hallucination detection

### Phase 6: Documentation & Finalization (Weeks 9-10)
- [ ] DOC-001: Consolidate agent specifications
- [ ] DOC-002: Deprecate redundant files
- [ ] DOC-003: Create API documentation
- [ ] INFRA-001: Docker Compose full stack
- [ ] PERF-004: Batch processing support

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Cost per request | $0.025 | $0.012 | API billing |
| Average latency | 5s | 3s | P95 response time |
| Cache hit rate | 0% | 40% | Redis stats |
| QA score average | 95% | 97% | Automated validation |
| Agents validated | 19/21 | 21/21 | CI/CD pipeline |
| Test coverage | 15% | 60% | Jest coverage |
| CNJ 615 compliance | Partial | 100% | Audit checklist |
| Hallucination rate | Unknown | <5% | Detection system |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API rate limits | Medium | High | Implement backoff, caching |
| Model deprecation | Low | High | Version pinning, abstraction layer |
| Cost overrun | Medium | Medium | Budget alerts, model routing |
| Security breach | Low | Critical | Security audit, penetration testing |
| Compliance violation | Low | Critical | Regular audits, legal review |

---

## Appendix A: Research Sources

1. **Prompt Engineering:** Singapore Academy of Law Guide 2025, Nature Scientific Reports
2. **Multi-Model Architecture:** AWS Bedrock, Harvey AI case study
3. **Quality Assurance:** LegalEval-Q benchmark, HalluGraph framework
4. **RAG Optimization:** Firecrawl 2025, Weaviate chunking guide
5. **Cost Optimization:** Thomson Reuters Labs, FutureAGI guide
6. **Compliance:** CNJ Resolution 615/2025, EU AI Act

---

## Appendix B: File Changes Summary

| File | Action | Priority |
|------|--------|----------|
| `agent-ui/.env.local` | DELETE from git | CRITICAL |
| `.gitignore` | ADD patterns | HIGH |
| `config/security.js` | ADD injection detection | HIGH |
| `lib/cache.js` | CREATE | HIGH |
| `lib/hallucination-detector.js` | CREATE | MEDIUM |
| `docker/docker-compose.yml` | UPDATE | MEDIUM |
| `config/prompts/system_prompts.json` | ADD 2 agents | MEDIUM |
| `.github/workflows/ci.yml` | ADD agent validation | MEDIUM |
| `docs/api/openapi.yaml` | CREATE | LOW |

---

*Document generated: 2026-01-31*
*Next review: 2026-02-15*
*Author: Lex Intelligentia Enhancement Analysis*
