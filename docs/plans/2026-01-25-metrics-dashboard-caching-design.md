# Metrics Dashboard & Redis Caching Design

**Date:** 2026-01-25
**Phases:** 3.1 (Metrics Dashboard) + 4.0 (Redis Caching)
**Status:** Approved

---

## Overview

This design covers two sequential features for the Lex Intelligentia judicial AI system:

1. **Phase 3.1 - Metrics Dashboard:** Operational monitoring and quality assurance tracking
2. **Phase 4.0 - Redis Caching:** Multi-layer caching for performance optimization

The approach: measure first (establish baselines), then optimize (add caching and track improvements).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        n8n Cloud                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ AI Agent    │───▶│ Quality     │───▶│ Metrics     │         │
│  │ (decision)  │    │ Validator   │    │ Logger      │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                            │                  │                 │
└────────────────────────────│──────────────────│─────────────────┘
                             │                  │
                             ▼                  ▼
                      ┌─────────────┐    ┌─────────────┐
                      │ Redis Cloud │    │  Supabase   │
                      │  (managed)  │    │ (metrics)   │
                      └─────────────┘    └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Dashboard  │
                                        │  (Next.js)  │
                                        └─────────────┘
```

### Data Flow

1. AI Agent generates decision draft
2. Quality Validator checks structure, citations, reasoning (Code node)
3. Metrics Logger sends execution data + quality scores to Supabase
4. Redis caches RAG results and validated outputs (Phase 4.0)
5. Dashboard displays real-time metrics via Supabase subscriptions

---

## Phase 3.1: Metrics Dashboard

### Focus Areas

- **Operational Monitoring:** System health, response times, error rates, throughput
- **Quality Assurance:** Decision quality, citation accuracy, legal reasoning scores

### Supabase Data Model

```sql
-- Execution metrics (ops monitoring)
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  domain TEXT NOT NULL,           -- bancario, consumidor, etc.
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  status TEXT,                    -- success, error, timeout
  error_message TEXT,
  tokens_used INT,
  rag_results_count INT,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality scores (QA monitoring)
CREATE TABLE quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES executions(id),
  structure_score DECIMAL(3,2),   -- 0.00 to 1.00
  citation_score DECIMAL(3,2),
  reasoning_score DECIMAL(3,2),
  overall_score DECIMAL(3,2),
  issues JSONB,                   -- detailed validation issues
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dashboard queries
CREATE INDEX idx_executions_agent ON executions(agent_name);
CREATE INDEX idx_executions_domain ON executions(domain);
CREATE INDEX idx_executions_created ON executions(created_at DESC);

-- Enable realtime for dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE executions;
ALTER PUBLICATION supabase_realtime ADD TABLE quality_scores;
```

### Quality Validator (n8n Code Node)

Runs after each agent generates a decision, before metrics logging.

#### Structure Validation

```javascript
// Check required sections exist
const requiredSections = [
  { name: 'RELATÓRIO', pattern: /^##?\s*REL[AÁ]T[OÓ]RIO/mi },
  { name: 'FUNDAMENTAÇÃO', pattern: /^##?\s*FUNDAMENTA[CÇ][AÃ]O/mi },
  { name: 'DISPOSITIVO', pattern: /^##?\s*DISPOSITIVO/mi }
];

const structureIssues = [];
let structureScore = 1.0;

for (const section of requiredSections) {
  if (!section.pattern.test(decisionText)) {
    structureIssues.push(`Missing: ${section.name}`);
    structureScore -= 0.33;
  }
}
```

#### Citation Validation

```javascript
// Extract cited súmulas/temas and verify against knowledge base
const citedSumulas = decisionText.match(/S[úu]mula\s+(\d+)/gi) || [];
const citedTemas = decisionText.match(/Tema\s+(\d+)/gi) || [];

// Lookup in knowledge_base/sumulas.json
const validSumulas = knowledgeBase.sumulas.map(s => s.numero);
const citationIssues = [];

for (const cited of citedSumulas) {
  const num = cited.match(/\d+/)[0];
  if (!validSumulas.includes(num)) {
    citationIssues.push(`Súmula ${num} not found in KB`);
  }
}
```

#### Reasoning Validation

- Checks minimum paragraph count per section (3+ per issue)
- Verifies precedent application pattern: abstract law → citation → concrete application
- Flags generic language without case-specific facts

### Metrics Logger (n8n HTTP Node)

**Configuration:**
```
Method: POST
URL: https://[PROJECT].supabase.co/rest/v1/rpc/log_execution
Headers:
  - apikey: {{ $env.SUPABASE_ANON_KEY }}
  - Authorization: Bearer {{ $env.SUPABASE_ANON_KEY }}
  - Content-Type: application/json
```

**Payload:**
```javascript
{
  "p_workflow_id": "{{ $workflow.id }}",
  "p_agent_name": "{{ $json.agent_name }}",
  "p_domain": "{{ $json.domain }}",
  "p_started_at": "{{ $json.started_at }}",
  "p_finished_at": "{{ $now.toISOString() }}",
  "p_duration_ms": {{ $now - $json.started_at }},
  "p_status": "{{ $json.error ? 'error' : 'success' }}",
  "p_tokens_used": {{ $json.tokens_used || 0 }},
  "p_rag_results_count": {{ $json.rag_context?.results_count || 0 }},
  "p_quality": {
    "structure_score": {{ $json.quality.structure }},
    "citation_score": {{ $json.quality.citations }},
    "reasoning_score": {{ $json.quality.reasoning }},
    "issues": {{ JSON.stringify($json.quality.issues) }}
  }
}
```

**Supabase Function:**
```sql
CREATE FUNCTION log_execution(
  p_workflow_id TEXT,
  p_agent_name TEXT,
  p_domain TEXT,
  p_started_at TIMESTAMPTZ,
  p_finished_at TIMESTAMPTZ,
  p_duration_ms INT,
  p_status TEXT,
  p_tokens_used INT,
  p_rag_results_count INT,
  p_quality JSONB
) RETURNS UUID AS $$
DECLARE
  exec_id UUID;
BEGIN
  INSERT INTO executions (
    workflow_id, agent_name, domain, started_at, finished_at,
    duration_ms, status, tokens_used, rag_results_count
  ) VALUES (
    p_workflow_id, p_agent_name, p_domain, p_started_at, p_finished_at,
    p_duration_ms, p_status, p_tokens_used, p_rag_results_count
  ) RETURNING id INTO exec_id;

  INSERT INTO quality_scores (
    execution_id, structure_score, citation_score, reasoning_score,
    overall_score, issues
  ) VALUES (
    exec_id,
    (p_quality->>'structure_score')::DECIMAL,
    (p_quality->>'citation_score')::DECIMAL,
    (p_quality->>'reasoning_score')::DECIMAL,
    (
      (p_quality->>'structure_score')::DECIMAL +
      (p_quality->>'citation_score')::DECIMAL +
      (p_quality->>'reasoning_score')::DECIMAL
    ) / 3,
    p_quality->'issues'
  );

  RETURN exec_id;
END;
$$ LANGUAGE plpgsql;
```

### Dashboard UI

**Tech Stack:**
- Next.js App Router
- Supabase JS client with realtime subscriptions
- shadcn/ui components
- Recharts for visualizations

**Key Views:**
```
┌────────────────────────────────────────────────────────────┐
│  LEX INTELLIGENTIA - METRICS DASHBOARD                     │
├────────────────────────────────────────────────────────────┤
│  📊 TODAY        │  ⚡ AVG LATENCY  │  ✅ SUCCESS RATE     │
│     47 cases     │     12.3s       │     97.8%            │
├────────────────────────────────────────────────────────────┤
│  QUALITY SCORES (7-day trend)                              │
│  ████████████░░ Structure: 0.94                            │
│  ██████████░░░░ Citations: 0.87                            │
│  █████████████░ Reasoning: 0.91                            │
├────────────────────────────────────────────────────────────┤
│  BY AGENT                    │  RECENT EXECUTIONS          │
│  Bancário      ████ 12       │  10:42 Bancário ✅ 0.92    │
│  Consumidor    ██ 8          │  10:38 Execução ✅ 0.88    │
│  Fazenda Púb.  ███ 9         │  10:35 Consumidor ⚠️ 0.71  │
│  Família       ████ 11       │  10:31 Saúde ✅ 0.95       │
└────────────────────────────────────────────────────────────┘
```

**Real-time Updates:**
```typescript
supabase
  .channel('executions')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'executions' },
    (payload) => addExecution(payload.new)
  )
  .subscribe()
```

---

## Phase 4.0: Redis Caching

### Cache Layers

| Layer | Key Pattern | TTL | Invalidation |
|-------|-------------|-----|--------------|
| RAG Results | `rag:{query_hash}` | 1 hour | Short TTL only |
| Embeddings | `emb:{text_hash}` | 7 days | On KB update |
| Stable Precedents | `prec:{sumula_num}` | 30 days | Event-based |

### Cache Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Check Cache │────▶│ Cache Hit?  │─YES─▶│ Return      │
│ (HTTP GET)  │     └─────────────┘      │ Cached      │
└─────────────┘            │             └─────────────┘
                          NO
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ Execute     │────▶│ Store Cache │
                    │ (Qdrant/LLM)│     │ (HTTP SET)  │
                    └─────────────┘     └─────────────┘
```

### Redis Cloud Integration

**n8n HTTP Requests:**
```
GET  https://[redis-url]/get/{key}
POST https://[redis-url]/set/{key} + body + EX {ttl}
```

### Cache Key Generation

```javascript
// Normalize query for consistent cache hits
const normalizedQuery = query.toLowerCase().trim()
  .replace(/\s+/g, ' ')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const queryHash = crypto.createHash('sha256')
  .update(normalizedQuery).digest('hex').slice(0, 16);
```

### Event-based Invalidation

When `knowledge_base/*.json` updates, trigger workflow to delete `prec:*` keys.

---

## Implementation Plan

### Phase 3.1 — Metrics Dashboard (Week 1-2)

| Step | Task | Deliverable |
|------|------|-------------|
| 1 | Create Supabase tables + function | `migrations/001_metrics.sql` |
| 2 | Add Quality Validator node | Update `n8n_workflow_v3.0_rag.json` |
| 3 | Add Metrics Logger node | HTTP node after each agent |
| 4 | Build Dashboard UI | `agent-ui/app/dashboard/` |
| 5 | Deploy + verify | Live metrics flowing |

### Phase 4.0 — Redis Caching (Week 3-4)

| Step | Task | Deliverable |
|------|------|-------------|
| 1 | Configure Redis Cloud credentials | n8n environment vars |
| 2 | Add cache-check nodes before RAG | Conditional branching |
| 3 | Add cache-store nodes after RAG | SET with TTL |
| 4 | Add `cache_hit` tracking to metrics | Dashboard shows hit rate |
| 5 | Implement KB update webhook | Invalidation trigger |

---

## Success Metrics

- Dashboard shows real-time executions within 2s
- Quality scores ≥ 0.85 average across all dimensions
- Cache hit rate ≥ 40% after 1 week of operation
- Latency reduction ≥ 30% for cached queries

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `migrations/001_metrics.sql` | Create (Supabase schema) |
| `n8n_workflow_v3.1_metrics.json` | Create (workflow with validators) |
| `agent-ui/app/dashboard/` | Create (Next.js dashboard) |
| `scripts/cache_invalidator.js` | Create (KB update handler) |
| `n8n_workflow_v4.0_cached.json` | Create (workflow with caching) |

---

## Dependencies

- Supabase project with realtime enabled
- Redis Cloud instance (already running)
- n8n Cloud environment variables configured
- OpenAI API key for embeddings
