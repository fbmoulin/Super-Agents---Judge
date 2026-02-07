# Sprint 4: Performance & RAG Integration - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Redis caching layer (40-50% cost reduction), RAG query module for Qdrant integration, validate the 2 remaining agents (MANDADO_SEGURANCA, SAUDE_MEDICAMENTOS), and reach 23 agents / v2.7.0.

**Architecture:** Redis cache sits before the LLM generation pipeline — if a similar case was recently processed with high QA score, the cached result is returned. The RAG module wraps Qdrant queries with embedding generation and context formatting, building on the existing `lib/hybrid_search.js`. Agent validation adds prompts to `system_prompts.json` and runs the existing validator against test cases that already exist.

**Tech Stack:** Node.js 18+, Jest 30, Redis 7 Alpine (Docker), Qdrant 1.7.4 (Docker), ioredis, @qdrant/js-client-rest, OpenAI embeddings API (text-embedding-3-small)

---

## Pre-flight Checklist

Before starting, verify the baseline:

```bash
cd /mnt/c/projetos-2026/superagents-judge
npm test                    # Expect: 266 passed, 0 failed
docker compose -f docker/docker-compose.yml config --quiet  # Expect: no errors
```

---

## Task 1: Redis Cache Module (TDD)

**Files:**
- Create: `lib/cache.js`
- Create: `tests/unit/cache.test.js`

### Step 1: Write the failing test for cache key generation

```javascript
// tests/unit/cache.test.js
const { generateCacheKey, getTTL, CACHE_PREFIX } = require('../../lib/cache');

describe('Cache Module', () => {
  describe('generateCacheKey', () => {
    test('generates deterministic key from input', () => {
      const input = {
        fatos: 'O autor celebrou contrato de empréstimo',
        questoes: 'Existência de vício de consentimento',
        pedidos: 'Declaração de nulidade',
        classe: 'Procedimento Comum Cível',
        assunto: 'Empréstimo consignado'
      };
      const key1 = generateCacheKey(input);
      const key2 = generateCacheKey(input);
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^lex:v2\.7:[a-f0-9]{16}$/);
    });

    test('generates different keys for different inputs', () => {
      const input1 = { fatos: 'caso A', questoes: '', pedidos: '', classe: '', assunto: '' };
      const input2 = { fatos: 'caso B', questoes: '', pedidos: '', classe: '', assunto: '' };
      expect(generateCacheKey(input1)).not.toBe(generateCacheKey(input2));
    });

    test('normalizes whitespace in inputs', () => {
      const input1 = { fatos: 'caso  com   espaços', questoes: '', pedidos: '', classe: '', assunto: '' };
      const input2 = { fatos: 'caso com espaços', questoes: '', pedidos: '', classe: '', assunto: '' };
      expect(generateCacheKey(input1)).toBe(generateCacheKey(input2));
    });
  });

  describe('getTTL', () => {
    test('returns 7 days for high confidence (>=0.90)', () => {
      expect(getTTL(0.95)).toBe(604800);
      expect(getTTL(0.90)).toBe(604800);
    });

    test('returns 1 day for medium confidence (>=0.70)', () => {
      expect(getTTL(0.85)).toBe(86400);
      expect(getTTL(0.70)).toBe(86400);
    });

    test('returns 0 for low confidence (<0.70)', () => {
      expect(getTTL(0.5)).toBe(0);
      expect(getTTL(0)).toBe(0);
    });
  });

  describe('CACHE_PREFIX', () => {
    test('exports correct prefix', () => {
      expect(CACHE_PREFIX).toBe('lex:v2.7:');
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/cache.test.js --verbose`
Expected: FAIL with "Cannot find module '../../lib/cache'"

### Step 3: Write minimal implementation

```javascript
// lib/cache.js
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
```

### Step 4: Run test to verify it passes

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/cache.test.js --verbose`
Expected: PASS (all 6 tests)

### Step 5: Commit

```bash
git add lib/cache.js tests/unit/cache.test.js
git commit -m "feat(cache): add cache key generation and TTL logic with tests"
```

---

## Task 2: Redis Client Integration (TDD)

**Files:**
- Modify: `lib/cache.js` (add Redis client wrapper)
- Modify: `tests/unit/cache.test.js` (add Redis client tests)

### Step 1: Write the failing tests for Redis client wrapper

Append to `tests/unit/cache.test.js`:

```javascript
const { createCacheClient, getCachedResult, setCachedResult } = require('../../lib/cache');

describe('Redis Client Wrapper', () => {
  describe('createCacheClient', () => {
    test('returns object with get, set, quit methods', () => {
      // Mock mode - no real Redis needed
      const client = createCacheClient({ mock: true });
      expect(client).toHaveProperty('get');
      expect(client).toHaveProperty('set');
      expect(client).toHaveProperty('quit');
    });
  });

  describe('getCachedResult (mock)', () => {
    test('returns null for cache miss', async () => {
      const client = createCacheClient({ mock: true });
      const result = await getCachedResult(client, 'lex:v2.7:nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('setCachedResult (mock)', () => {
    test('stores and retrieves cached result', async () => {
      const client = createCacheClient({ mock: true });
      const key = 'lex:v2.7:testkey1234';
      const data = { minuta: 'I - RELATÓRIO...', score: 95 };

      await setCachedResult(client, key, data, 86400);
      const result = await getCachedResult(client, key);
      expect(result).toEqual(data);
    });

    test('does not cache when TTL is 0', async () => {
      const client = createCacheClient({ mock: true });
      const key = 'lex:v2.7:nottl';
      await setCachedResult(client, key, { minuta: 'test' }, 0);
      const result = await getCachedResult(client, key);
      expect(result).toBeNull();
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/cache.test.js --verbose`
Expected: FAIL with "createCacheClient is not a function"

### Step 3: Write minimal implementation

Add to `lib/cache.js` (before `module.exports`):

```javascript
/**
 * Create a cache client. Supports mock mode for testing without Redis.
 * @param {Object} options
 * @param {boolean} options.mock - Use in-memory mock instead of real Redis
 * @param {string} options.host - Redis host (default: localhost)
 * @param {number} options.port - Redis port (default: 6379)
 * @returns {Object} Cache client with get/set/quit methods
 */
function createCacheClient(options = {}) {
  if (options.mock) {
    const store = new Map();
    return {
      get: async (key) => store.get(key) || null,
      set: async (key, value, ttl) => { store.set(key, value); },
      quit: async () => { store.clear(); },
      _store: store
    };
  }

  // Real Redis client (lazy-loaded to avoid hard dependency)
  let Redis;
  try {
    Redis = require('ioredis');
  } catch (e) {
    logger.warn('ioredis not installed, using mock cache');
    return createCacheClient({ mock: true });
  }

  const redis = new Redis({
    host: options.host || process.env.REDIS_HOST || 'localhost',
    port: options.port || parseInt(process.env.REDIS_PORT || '6379'),
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: true
  });

  return {
    get: async (key) => {
      try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
      } catch (err) {
        logger.error('Cache GET failed:', err.message);
        return null;
      }
    },
    set: async (key, value, ttl) => {
      try {
        if (ttl > 0) {
          await redis.setex(key, ttl, JSON.stringify(value));
        }
      } catch (err) {
        logger.error('Cache SET failed:', err.message);
      }
    },
    quit: async () => {
      try { await redis.quit(); } catch (e) { /* ignore */ }
    }
  };
}

/**
 * Get a cached result by key.
 * @param {Object} client - Cache client
 * @param {string} key - Cache key
 * @returns {Promise<Object|null>} Cached data or null
 */
async function getCachedResult(client, key) {
  return client.get(key);
}

/**
 * Store a result in cache with TTL.
 * @param {Object} client - Cache client
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @param {number} ttl - Time to live in seconds (0 = don't cache)
 */
async function setCachedResult(client, key, data, ttl) {
  if (ttl <= 0) return;
  await client.set(key, data, ttl);
}
```

Update `module.exports`:

```javascript
module.exports = {
  CACHE_PREFIX,
  normalizeText,
  generateCacheKey,
  getTTL,
  createCacheClient,
  getCachedResult,
  setCachedResult
};
```

### Step 4: Run test to verify it passes

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/cache.test.js --verbose`
Expected: PASS (all 10 tests)

### Step 5: Run full test suite to ensure no regressions

Run: `cd /mnt/c/projetos-2026/superagents-judge && npm test`
Expected: 276+ passed, 0 failed

### Step 6: Commit

```bash
git add lib/cache.js tests/unit/cache.test.js
git commit -m "feat(cache): add Redis client wrapper with mock mode for testing"
```

---

## Task 3: RAG Query Module (TDD)

**Files:**
- Create: `lib/rag.js`
- Create: `tests/unit/rag.test.js`

### Step 1: Write the failing tests

```javascript
// tests/unit/rag.test.js
const { buildRAGQuery, formatPrecedentsForPrompt, extractLegalTerms } = require('../../lib/rag');

describe('RAG Module', () => {
  describe('extractLegalTerms', () => {
    test('extracts súmula references', () => {
      const text = 'Conforme Súmula 297 do STJ e Súmula 382 do STJ';
      const terms = extractLegalTerms(text);
      expect(terms).toContain('súmula 297');
      expect(terms).toContain('súmula 382');
    });

    test('extracts article references', () => {
      const text = 'Art. 784 do CPC e art. 927 do CC';
      const terms = extractLegalTerms(text);
      expect(terms).toContain('art. 784 cpc');
      expect(terms).toContain('art. 927 cc');
    });

    test('extracts tema references', () => {
      const text = 'Tema Repetitivo 1368 do STJ';
      const terms = extractLegalTerms(text);
      expect(terms).toContain('tema 1368');
    });

    test('returns empty array for text without legal terms', () => {
      const terms = extractLegalTerms('texto comum sem referências legais');
      expect(terms).toEqual([]);
    });
  });

  describe('buildRAGQuery', () => {
    test('builds query object from case input', () => {
      const input = {
        fatos: 'Empréstimo consignado fraudulento',
        questoes: 'Vício de consentimento',
        pedidos: 'Declaração de nulidade',
        domain: 'bancario'
      };
      const query = buildRAGQuery(input);
      expect(query).toHaveProperty('text');
      expect(query).toHaveProperty('domain', 'bancario');
      expect(query).toHaveProperty('legalTerms');
      expect(query.text).toContain('Empréstimo');
    });
  });

  describe('formatPrecedentsForPrompt', () => {
    test('formats precedents as markdown context', () => {
      const precedents = [
        { type: 'Sumula', numero: 297, tribunal: 'STJ', texto: 'O CDC é aplicável às instituições financeiras' },
        { type: 'Tema', numero: 952, tribunal: 'STJ', texto: 'Tese sobre contratos bancários' }
      ];
      const result = formatPrecedentsForPrompt(precedents);
      expect(result).toContain('Súmula 297/STJ');
      expect(result).toContain('Tema 952/STJ');
      expect(result).toContain('CDC é aplicável');
    });

    test('returns empty string for no precedents', () => {
      expect(formatPrecedentsForPrompt([])).toBe('');
      expect(formatPrecedentsForPrompt(null)).toBe('');
    });

    test('limits output to maxTokens', () => {
      const longPrecedents = Array.from({ length: 50 }, (_, i) => ({
        type: 'Sumula',
        numero: i,
        tribunal: 'STJ',
        texto: 'A'.repeat(500)
      }));
      const result = formatPrecedentsForPrompt(longPrecedents, { maxTokens: 1000 });
      // ~4 chars per token, so 1000 tokens ≈ 4000 chars max
      expect(result.length).toBeLessThan(5000);
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/rag.test.js --verbose`
Expected: FAIL with "Cannot find module '../../lib/rag'"

### Step 3: Write minimal implementation

```javascript
// lib/rag.js
/**
 * RAG (Retrieval-Augmented Generation) Query Module
 * Prepares queries and formats results for LLM context injection.
 *
 * @module lib/rag
 * @version 1.0.0
 */

const logger = require('./logger');

// Legal term extraction patterns
const LEGAL_PATTERNS = [
  { regex: /s[úu]mula\s+(\d+)/gi, format: (m) => `súmula ${m[1]}` },
  { regex: /art(?:igo)?\.?\s*(\d+)\s+(?:do\s+)?(\w+)/gi, format: (m) => `art. ${m[1]} ${m[2].toLowerCase()}` },
  { regex: /tema(?:\s+repetitivo)?\s+(\d+)/gi, format: (m) => `tema ${m[1]}` },
  { regex: /lei\s+([\d.]+\/\d+)/gi, format: (m) => `lei ${m[1]}` }
];

/**
 * Extract legal term references from text.
 * @param {string} text - Input text
 * @returns {string[]} Extracted legal terms (normalized, deduplicated)
 */
function extractLegalTerms(text) {
  if (!text) return [];

  const terms = new Set();

  for (const pattern of LEGAL_PATTERNS) {
    let match;
    // Reset regex state
    pattern.regex.lastIndex = 0;
    while ((match = pattern.regex.exec(text)) !== null) {
      terms.add(pattern.format(match));
    }
  }

  return Array.from(terms);
}

/**
 * Build a RAG query object from case input.
 * @param {Object} input - Case input
 * @param {string} input.fatos - Case facts
 * @param {string} input.questoes - Legal questions
 * @param {string} input.pedidos - Requests
 * @param {string} input.domain - Legal domain
 * @returns {Object} Query object for hybrid search
 */
function buildRAGQuery(input) {
  const fullText = [input.fatos, input.questoes, input.pedidos].filter(Boolean).join(' ');
  const legalTerms = extractLegalTerms(fullText);

  return {
    text: fullText,
    domain: input.domain || null,
    legalTerms
  };
}

/**
 * Format precedent results as markdown for prompt injection.
 * @param {Array} precedents - Search result items
 * @param {Object} options
 * @param {number} options.maxTokens - Maximum estimated tokens (default: 2000)
 * @returns {string} Formatted markdown context
 */
function formatPrecedentsForPrompt(precedents, options = {}) {
  if (!precedents || precedents.length === 0) return '';

  const { maxTokens = 2000 } = options;
  const maxChars = maxTokens * 4; // ~4 chars per token in Portuguese
  let output = '## JURISPRUDÊNCIA RELEVANTE (RAG)\n\n';
  let currentLength = output.length;

  for (const item of precedents) {
    const typeLabel = item.type === 'Sumula' ? 'Súmula' : item.type === 'Tema' ? 'Tema' : item.type;
    const entry = `### ${typeLabel} ${item.numero || ''}/${item.tribunal || 'STJ'}\n${item.texto || ''}\n\n`;

    if (currentLength + entry.length > maxChars) break;

    output += entry;
    currentLength += entry.length;
  }

  return output;
}

module.exports = {
  extractLegalTerms,
  buildRAGQuery,
  formatPrecedentsForPrompt,
  LEGAL_PATTERNS
};
```

### Step 4: Run test to verify it passes

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/rag.test.js --verbose`
Expected: PASS (all 7 tests)

### Step 5: Commit

```bash
git add lib/rag.js tests/unit/rag.test.js
git commit -m "feat(rag): add RAG query builder and precedent formatter with tests"
```

---

## Task 4: Register MANDADO_SEGURANCA Agent

**Files:**
- Modify: `config/prompts/system_prompts.json` (add MANDADO_SEGURANCA entry)
- Read: `agents/agent_MANDADO_SEGURANCA.md` (source prompt)

### Step 1: Read the agent prompt source

Run: `cat agents/agent_MANDADO_SEGURANCA.md`

Parse the markdown into the structured JSON format used by `system_prompts.json`. The format follows the existing pattern: `{ "titulo", "funcao", "regras": [], "competencias": [], "fundamentacao": [], "estrutura": {} }`.

### Step 2: Add the agent to system_prompts.json

Add a `"MANDADO_SEGURANCA"` key to the `"agents"` object in `config/prompts/system_prompts.json`, following the same structure as existing agents (e.g., EXECUCAO_FISCAL).

### Step 3: Verify registration

Run: `cd /mnt/c/projetos-2026/superagents-judge && node -e "const c = require('./config'); console.log(c.getAgentNames().includes('MANDADO_SEGURANCA'))"`
Expected: `true`

### Step 4: Run full test suite

Run: `cd /mnt/c/projetos-2026/superagents-judge && npm test`
Expected: All tests pass (no regressions from config change)

### Step 5: Commit

```bash
git add config/prompts/system_prompts.json
git commit -m "feat(agents): register MANDADO_SEGURANCA in system prompts config"
```

---

## Task 5: Register SAUDE_MEDICAMENTOS Agent

**Files:**
- Modify: `config/prompts/system_prompts.json` (add SAUDE_MEDICAMENTOS entry)
- Read: `agents/agent_SAUDE_MEDICAMENTOS.md` (source prompt)

### Step 1: Read the agent prompt source

Run: `cat agents/agent_SAUDE_MEDICAMENTOS.md`

Parse the markdown into the structured JSON format.

### Step 2: Add the agent to system_prompts.json

Add a `"SAUDE_MEDICAMENTOS"` key to the `"agents"` object following the same structure.

### Step 3: Verify registration

Run: `cd /mnt/c/projetos-2026/superagents-judge && node -e "const c = require('./config'); console.log(c.getAgentNames().includes('SAUDE_MEDICAMENTOS'))"`
Expected: `true`

### Step 4: Run full test suite

Run: `cd /mnt/c/projetos-2026/superagents-judge && npm test`
Expected: All tests pass

### Step 5: Commit

```bash
git add config/prompts/system_prompts.json
git commit -m "feat(agents): register SAUDE_MEDICAMENTOS in system prompts config"
```

---

## Task 6: Validate MANDADO_SEGURANCA Agent

**Files:**
- Read: `test_cases/mandado_seguranca/caso_01_servidor_publico.json`
- Read: `test_cases/mandado_seguranca/caso_02_licitacao.json`

### Step 1: Verify test cases exist and are well-formed

Run: `cd /mnt/c/projetos-2026/superagents-judge && ls test_cases/mandado_seguranca/`
Expected: 4 JSON files

Run: `cd /mnt/c/projetos-2026/superagents-judge && node -e "const f = require('fs'); const d = JSON.parse(f.readFileSync('test_cases/mandado_seguranca/caso_01_servidor_publico.json')); console.log(Object.keys(d));"`
Expected: Keys include fatos, questoes, pedidos, classe, assunto

### Step 2: Run agent validation

Run: `cd /mnt/c/projetos-2026/superagents-judge && ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY node scripts/validators/agent_validator.js mandado_seguranca --verbose`
Expected: Score >= 85%, Confidence >= 0.85

**Note:** This step requires a valid ANTHROPIC_API_KEY and makes real API calls (~$0.04/case).

### Step 3: Review results

Check output in `test_cases/agent_validation_results/`. If score < 85%, analyze failures and adjust the agent prompt in `config/prompts/system_prompts.json`.

### Step 4: Commit results

```bash
git add test_cases/agent_validation_results/
git commit -m "test(agents): validate MANDADO_SEGURANCA agent (Score: XX%)"
```

---

## Task 7: Validate SAUDE_MEDICAMENTOS Agent

**Files:**
- Read: `test_cases/saude_medicamentos/caso_01_medicamento_alto_custo.json`

### Step 1: Verify test cases

Run: `cd /mnt/c/projetos-2026/superagents-judge && ls test_cases/saude_medicamentos/`
Expected: 4 JSON files

### Step 2: Run agent validation

Run: `cd /mnt/c/projetos-2026/superagents-judge && ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY node scripts/validators/agent_validator.js saude_medicamentos --verbose`
Expected: Score >= 85%, Confidence >= 0.85

### Step 3: Review and commit

Same process as Task 6.

```bash
git add test_cases/agent_validation_results/
git commit -m "test(agents): validate SAUDE_MEDICAMENTOS agent (Score: XX%)"
```

---

## Task 8: Update domain_mapping.json for New Agents

**Files:**
- Modify: `knowledge_base/domain_mapping.json`

### Step 1: Read current mapping

Run: `cd /mnt/c/projetos-2026/superagents-judge && cat knowledge_base/domain_mapping.json | head -20`

### Step 2: Add entries for new domains

Add to `domain_mapping.json`:

```json
{
  "mandado_seguranca": {
    "keywords": ["mandado de segurança", "direito líquido e certo", "autoridade coatora", "ato ilegal", "abuso de poder", "servidor público", "concurso público", "licitação"],
    "agent": "agent_MANDADO_SEGURANCA"
  },
  "saude_medicamentos": {
    "keywords": ["medicamento", "SUS", "fornecimento", "alto custo", "ANVISA", "oncológico", "off-label", "home care", "tratamento experimental"],
    "agent": "agent_SAUDE_MEDICAMENTOS"
  }
}
```

### Step 3: Run tests to verify no regressions

Run: `cd /mnt/c/projetos-2026/superagents-judge && npm test`
Expected: All tests pass

### Step 4: Commit

```bash
git add knowledge_base/domain_mapping.json
git commit -m "feat(kb): add domain mappings for MANDADO_SEGURANCA and SAUDE_MEDICAMENTOS"
```

---

## Task 9: Version Bump and CLAUDE.md Update

**Files:**
- Modify: `package.json` (version: 2.6.2 → 2.7.0)
- Modify: `CLAUDE.md` (update status, agent count, sprint status)

### Step 1: Bump version

In `package.json`, change `"version": "2.6.2"` to `"version": "2.7.0"`.

### Step 2: Update CLAUDE.md

Update the following sections:
- Version table: Add v2.7 row with description
- Status box: Update to 23 agents, update agent count
- Sprint 4 section: Mark completed items
- Add Sprint 5 placeholder

### Step 3: Run full test suite one final time

Run: `cd /mnt/c/projetos-2026/superagents-judge && npm test`
Expected: All tests pass

### Step 4: Commit

```bash
git add package.json CLAUDE.md README.md
git commit -m "chore: bump version to v2.7.0, update docs for Sprint 4 completion"
```

---

## Dependency Graph

```
Task 1 (Cache core)
    ↓
Task 2 (Cache Redis client)

Task 3 (RAG module) ← independent, can parallel with Tasks 1-2

Task 4 (Register MANDADO_SEGURANCA)
    ↓
Task 6 (Validate MANDADO_SEGURANCA)

Task 5 (Register SAUDE_MEDICAMENTOS)
    ↓
Task 7 (Validate SAUDE_MEDICAMENTOS)

Task 8 (Domain mappings) ← after Tasks 4, 5

Task 9 (Version bump) ← after all other tasks
```

**Parallelizable groups:**
- Group A: Tasks 1 → 2 (cache)
- Group B: Task 3 (RAG)
- Group C: Tasks 4 → 6, Tasks 5 → 7 (agents)

---

## Success Criteria

- [ ] `lib/cache.js` created with tests (10+ tests passing)
- [ ] `lib/rag.js` created with tests (7+ tests passing)
- [ ] MANDADO_SEGURANCA registered and validated (Score >= 85%)
- [ ] SAUDE_MEDICAMENTOS registered and validated (Score >= 85%)
- [ ] Domain mappings updated for 2 new agents
- [ ] All 280+ tests passing (266 existing + 17+ new)
- [ ] Version bumped to v2.7.0
- [ ] Zero regressions on existing tests

---

*Plan created: 2026-02-07 | Sprint 4 - Performance & RAG Integration*
