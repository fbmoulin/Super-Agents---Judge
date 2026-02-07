# Sprint 5: Hallucination Detection, Pipeline Orchestration & Parallel QA

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a hallucination detector that cross-references LLM output against the knowledge base, create a unified pipeline orchestrator wiring cache + RAG + generation, add a parallel QA runner, fix CI/CD for 23 agents, and add integration tests — reaching v2.8.0.

**Architecture:** The hallucination detector validates generated minutas by checking every cited súmula, artigo, tema and lei against `knowledge_base/sumulas.json` and `knowledge_base/temas_repetitivos.json`. The pipeline orchestrator is a middleware that wires `lib/cache.js` (cache lookup) → `lib/rag.js` (context building) → LLM generation → QA validation → cache write into a single callable function. The parallel QA runner uses `Promise.all` to execute structural and semantic QA concurrently, reducing latency by 0.5-1s.

**Tech Stack:** Node.js 18+, Jest 30, existing lib/ modules (cache.js, rag.js, hybrid_search.js, graph.js, logger.js), knowledge_base/*.json

---

## Pre-flight Checklist

Before starting, verify the baseline:

```bash
cd /mnt/c/projetos-2026/superagents-judge
npm test                    # Expect: 286 passed, 0 failed
node -e "const c = require('./config'); console.log('Agents:', c.getAgentNames().length)"  # Expect: 23
```

---

## Task 1: Hallucination Detector — Súmula Validation (TDD)

**Files:**
- Create: `lib/hallucination-detector.js`
- Create: `tests/unit/hallucination-detector.test.js`

### Step 1: Write the failing tests for súmula cross-referencing

```javascript
// tests/unit/hallucination-detector.test.js
const {
  detectHallucinations,
  validateSumulaCitation,
  validateTemaCitation,
  extractCitations
} = require('../../lib/hallucination-detector');

describe('Hallucination Detector', () => {
  describe('extractCitations', () => {
    test('extracts súmula citations from text', () => {
      const text = 'Conforme a Súmula 297 do STJ, o CDC é aplicável.';
      const citations = extractCitations(text);
      expect(citations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'sumula', numero: '297', tribunal: 'STJ' })
        ])
      );
    });

    test('extracts tema citations from text', () => {
      const text = 'O Tema Repetitivo 952 do STJ define...';
      const citations = extractCitations(text);
      expect(citations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'tema', numero: '952' })
        ])
      );
    });

    test('extracts artigo/lei citations from text', () => {
      const text = 'Nos termos do art. 927 do Código Civil e art. 784 do CPC';
      const citations = extractCitations(text);
      expect(citations.length).toBeGreaterThanOrEqual(2);
      expect(citations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'artigo', numero: '927' }),
          expect.objectContaining({ type: 'artigo', numero: '784' })
        ])
      );
    });

    test('returns empty array for text without citations', () => {
      expect(extractCitations('Texto sem referências jurídicas')).toEqual([]);
    });

    test('handles null/empty input', () => {
      expect(extractCitations(null)).toEqual([]);
      expect(extractCitations('')).toEqual([]);
    });
  });

  describe('validateSumulaCitation', () => {
    test('returns valid for known súmula (STJ 297)', () => {
      const result = validateSumulaCitation('297', 'STJ');
      expect(result.valid).toBe(true);
      expect(result.texto).toBeTruthy();
    });

    test('returns invalid for non-existent súmula number', () => {
      const result = validateSumulaCitation('99999', 'STJ');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('não encontrada');
    });

    test('returns invalid for wrong tribunal attribution', () => {
      // Súmula 297 is STJ, not STF
      const result = validateSumulaCitation('297', 'STF');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTemaCitation', () => {
    test('returns valid for known tema repetitivo', () => {
      // Check temas_repetitivos.json for a known tema number
      const result = validateTemaCitation('952');
      expect(result.valid).toBe(true);
    });

    test('returns invalid for non-existent tema', () => {
      const result = validateTemaCitation('99999');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('não encontrado');
    });
  });

  describe('detectHallucinations', () => {
    test('returns no issues for text with valid citations only', () => {
      const text = 'Conforme a Súmula 297 do STJ, o CDC é aplicável às instituições financeiras.';
      const result = detectHallucinations(text);
      expect(result.issues).toEqual([]);
      expect(result.hallucinated).toBe(false);
      expect(result.citationsChecked).toBeGreaterThan(0);
    });

    test('flags hallucinated súmula', () => {
      const text = 'A Súmula 99999 do STJ estabelece que...';
      const result = detectHallucinations(text);
      expect(result.hallucinated).toBe(true);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'SUMULA_NAO_ENCONTRADA',
            severity: 'HIGH'
          })
        ])
      );
    });

    test('flags wrong tribunal attribution', () => {
      // Súmula 297 is STJ. Citing it as STF is wrong.
      const text = 'Conforme a Súmula 297 do STF...';
      const result = detectHallucinations(text);
      expect(result.hallucinated).toBe(true);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'TRIBUNAL_INCORRETO',
            severity: 'MEDIUM'
          })
        ])
      );
    });

    test('returns summary with counts', () => {
      const text = 'Súmula 297/STJ e Súmula 99999/STJ...';
      const result = detectHallucinations(text);
      expect(result).toHaveProperty('citationsChecked');
      expect(result).toHaveProperty('issuesCount');
      expect(result.citationsChecked).toBe(2);
      expect(result.issuesCount).toBe(1);
    });

    test('handles text with no citations gracefully', () => {
      const result = detectHallucinations('Texto sem qualquer referência.');
      expect(result.hallucinated).toBe(false);
      expect(result.citationsChecked).toBe(0);
      expect(result.issues).toEqual([]);
    });
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/hallucination-detector.test.js --verbose`
Expected: FAIL with "Cannot find module '../../lib/hallucination-detector'"

### Step 3: Write minimal implementation

```javascript
// lib/hallucination-detector.js
/**
 * Hallucination Detector for Lex Intelligentia
 * Cross-references LLM-generated citations against the knowledge base
 * to detect fabricated súmulas, temas, and artigos.
 *
 * @module lib/hallucination-detector
 * @version 1.0.0
 */

const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Load knowledge base at module init
const KB_PATH = path.join(__dirname, '..', 'knowledge_base');

let sumulasDB = { STJ: {}, STF: {} };
let temasDB = {};

try {
  const sumulasRaw = JSON.parse(fs.readFileSync(path.join(KB_PATH, 'sumulas.json'), 'utf-8'));
  sumulasDB = sumulasRaw.sumulas || sumulasRaw;
} catch (e) {
  logger.warn('Could not load sumulas.json:', e.message);
}

try {
  const temasRaw = JSON.parse(fs.readFileSync(path.join(KB_PATH, 'temas_repetitivos.json'), 'utf-8'));
  // Build lookup by numero
  const temasList = temasRaw.temas || temasRaw;
  if (Array.isArray(temasList)) {
    for (const tema of temasList) {
      temasDB[String(tema.numero)] = tema;
    }
  } else if (typeof temasList === 'object') {
    Object.assign(temasDB, temasList);
  }
} catch (e) {
  logger.warn('Could not load temas_repetitivos.json:', e.message);
}

// Citation extraction patterns
const CITATION_PATTERNS = {
  sumula: /[Ss][úu]mula\s+(?:n[.ºo°]\s*)?(\d+)\s*(?:\/|do\s+|,?\s+d[oe]\s+)(STJ|STF)/gi,
  tema: /[Tt]ema\s+(?:[Rr]epetitivo\s+)?(?:n[.ºo°]\s*)?(\d+)/gi,
  artigo: /[Aa]rt(?:igo)?\.?\s*(\d+)\s+(?:do\s+|da\s+)?(\w[\w\s]*?)(?=[,;.\n]|\s+e\s+|\s+c\/c)/gi
};

/**
 * Extract all legal citations from text.
 * @param {string} text - Generated minuta text
 * @returns {Array<{type: string, numero: string, tribunal?: string, lei?: string}>}
 */
function extractCitations(text) {
  if (!text) return [];

  const citations = [];

  // Extract súmula citations
  let match;
  CITATION_PATTERNS.sumula.lastIndex = 0;
  while ((match = CITATION_PATTERNS.sumula.exec(text)) !== null) {
    citations.push({
      type: 'sumula',
      numero: match[1],
      tribunal: match[2].toUpperCase(),
      raw: match[0]
    });
  }

  // Extract tema citations
  CITATION_PATTERNS.tema.lastIndex = 0;
  while ((match = CITATION_PATTERNS.tema.exec(text)) !== null) {
    citations.push({
      type: 'tema',
      numero: match[1],
      raw: match[0]
    });
  }

  // Extract artigo citations
  CITATION_PATTERNS.artigo.lastIndex = 0;
  while ((match = CITATION_PATTERNS.artigo.exec(text)) !== null) {
    citations.push({
      type: 'artigo',
      numero: match[1],
      lei: match[2].trim(),
      raw: match[0]
    });
  }

  return citations;
}

/**
 * Validate a súmula citation against knowledge base.
 * @param {string} numero - Súmula number
 * @param {string} tribunal - Tribunal (STJ or STF)
 * @returns {{ valid: boolean, texto?: string, reason?: string }}
 */
function validateSumulaCitation(numero, tribunal) {
  const tribunalDB = sumulasDB[tribunal];

  if (!tribunalDB) {
    return { valid: false, reason: `Tribunal ${tribunal} não encontrado na base` };
  }

  const sumula = tribunalDB[String(numero)];

  if (!sumula) {
    // Check if it exists in the OTHER tribunal
    const otherTribunal = tribunal === 'STJ' ? 'STF' : 'STJ';
    const otherDB = sumulasDB[otherTribunal];
    if (otherDB && otherDB[String(numero)]) {
      return {
        valid: false,
        reason: `Súmula ${numero} não encontrada no ${tribunal}, mas existe no ${otherTribunal}`,
        suggestion: otherTribunal
      };
    }
    return { valid: false, reason: `Súmula ${numero}/${tribunal} não encontrada na base de conhecimento` };
  }

  return { valid: true, texto: sumula.texto };
}

/**
 * Validate a tema repetitivo citation against knowledge base.
 * @param {string} numero - Tema number
 * @returns {{ valid: boolean, tese?: string, reason?: string }}
 */
function validateTemaCitation(numero) {
  const tema = temasDB[String(numero)];

  if (!tema) {
    return { valid: false, reason: `Tema Repetitivo ${numero} não encontrado na base de conhecimento` };
  }

  return { valid: true, tese: tema.tese || tema.texto };
}

/**
 * Detect hallucinations in generated text by cross-referencing citations.
 * @param {string} text - Generated minuta text
 * @returns {{ hallucinated: boolean, issues: Array, citationsChecked: number, issuesCount: number }}
 */
function detectHallucinations(text) {
  const citations = extractCitations(text);
  const issues = [];

  for (const citation of citations) {
    switch (citation.type) {
      case 'sumula': {
        const result = validateSumulaCitation(citation.numero, citation.tribunal);
        if (!result.valid) {
          if (result.suggestion) {
            issues.push({
              type: 'TRIBUNAL_INCORRETO',
              severity: 'MEDIUM',
              citation: citation.raw,
              detail: result.reason,
              suggestion: `Correto: Súmula ${citation.numero}/${result.suggestion}`
            });
          } else {
            issues.push({
              type: 'SUMULA_NAO_ENCONTRADA',
              severity: 'HIGH',
              citation: citation.raw,
              detail: result.reason
            });
          }
        }
        break;
      }
      case 'tema': {
        const result = validateTemaCitation(citation.numero);
        if (!result.valid) {
          issues.push({
            type: 'TEMA_NAO_ENCONTRADO',
            severity: 'HIGH',
            citation: citation.raw,
            detail: result.reason
          });
        }
        break;
      }
      // Artigo validation is harder (need full law databases), skip for now
    }
  }

  return {
    hallucinated: issues.length > 0,
    issues,
    citationsChecked: citations.length,
    issuesCount: issues.length
  };
}

module.exports = {
  extractCitations,
  validateSumulaCitation,
  validateTemaCitation,
  detectHallucinations,
  // Exposed for testing
  _sumulasDB: sumulasDB,
  _temasDB: temasDB
};
```

### Step 4: Run tests to verify they pass

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/hallucination-detector.test.js --verbose`
Expected: PASS (all 13 tests)

**Important:** Some tests depend on specific entries in `sumulas.json` and `temas_repetitivos.json`. The implementation loads these at module init time. Before running, verify that:
- `knowledge_base/sumulas.json` has `sumulas.STJ["297"]` (it does — confirmed during exploration)
- `knowledge_base/temas_repetitivos.json` has a tema with numero `952` — check and adjust test if needed

### Step 5: Run full test suite

Run: `cd /mnt/c/projetos-2026/superagents-judge && npm test`
Expected: 286+ passed, 0 failed (plus 13 new = 299+)

### Step 6: Commit

```bash
git add lib/hallucination-detector.js tests/unit/hallucination-detector.test.js
git commit -m "feat(hallucination): add hallucination detector with súmula/tema cross-referencing (TDD)"
```

---

## Task 2: Pipeline Orchestrator (TDD)

**Files:**
- Create: `lib/pipeline.js`
- Create: `tests/unit/pipeline.test.js`

### Step 1: Write the failing tests

```javascript
// tests/unit/pipeline.test.js
const { createPipeline, PipelineResult } = require('../../lib/pipeline');
const { createCacheClient } = require('../../lib/cache');

describe('Pipeline Orchestrator', () => {
  let mockCache;

  beforeEach(() => {
    mockCache = createCacheClient({ mock: true });
  });

  afterEach(async () => {
    await mockCache.quit();
  });

  describe('createPipeline', () => {
    test('returns object with execute method', () => {
      const pipeline = createPipeline({ cache: mockCache });
      expect(pipeline).toHaveProperty('execute');
      expect(typeof pipeline.execute).toBe('function');
    });
  });

  describe('pipeline.execute', () => {
    test('returns PipelineResult with all required fields', async () => {
      const mockGenerator = async (input, context) => ({
        minuta: 'I - RELATÓRIO...',
        tokens: { input: 1000, output: 2000 }
      });
      const mockQA = async (minuta) => ({
        score_final: 92,
        confidence: 0.92,
        qa_estrutural: { score: 90 },
        qa_semantico: { score: 94 }
      });

      const pipeline = createPipeline({
        cache: mockCache,
        generator: mockGenerator,
        qaValidator: mockQA
      });

      const result = await pipeline.execute({
        fatos: 'Contrato bancário',
        questoes: 'Juros abusivos',
        pedidos: 'Revisão contratual',
        classe: 'Procedimento Comum Cível',
        assunto: 'Bancário',
        domain: 'bancario'
      });

      expect(result).toHaveProperty('minuta');
      expect(result).toHaveProperty('qa');
      expect(result).toHaveProperty('cached', false);
      expect(result).toHaveProperty('timing');
      expect(result.qa.score_final).toBe(92);
    });

    test('returns cached result on cache hit', async () => {
      const cachedData = {
        minuta: 'Cached minuta...',
        qa: { score_final: 95, confidence: 0.95 }
      };

      // Pre-populate cache
      const { generateCacheKey } = require('../../lib/cache');
      const input = {
        fatos: 'Caso cached',
        questoes: '',
        pedidos: '',
        classe: '',
        assunto: ''
      };
      const key = generateCacheKey(input);
      await mockCache.set(key, cachedData, 86400);

      const mockGenerator = jest.fn();  // Should NOT be called
      const pipeline = createPipeline({
        cache: mockCache,
        generator: mockGenerator
      });

      const result = await pipeline.execute(input);
      expect(result.cached).toBe(true);
      expect(result.minuta).toBe('Cached minuta...');
      expect(mockGenerator).not.toHaveBeenCalled();
    });

    test('caches result when QA score is high enough', async () => {
      const mockGenerator = async () => ({
        minuta: 'Generated minuta...',
        tokens: { input: 500, output: 1000 }
      });
      const mockQA = async () => ({
        score_final: 95,
        confidence: 0.95
      });

      const pipeline = createPipeline({
        cache: mockCache,
        generator: mockGenerator,
        qaValidator: mockQA
      });

      const input = {
        fatos: 'New case',
        questoes: '',
        pedidos: '',
        classe: '',
        assunto: ''
      };

      await pipeline.execute(input);

      // Verify it was cached
      const { generateCacheKey } = require('../../lib/cache');
      const key = generateCacheKey(input);
      const cached = await mockCache.get(key);
      expect(cached).toBeTruthy();
      expect(cached.minuta).toBe('Generated minuta...');
    });

    test('does NOT cache result when QA score is too low', async () => {
      const mockGenerator = async () => ({
        minuta: 'Low quality minuta...',
        tokens: { input: 500, output: 1000 }
      });
      const mockQA = async () => ({
        score_final: 50,
        confidence: 0.50
      });

      const pipeline = createPipeline({
        cache: mockCache,
        generator: mockGenerator,
        qaValidator: mockQA
      });

      const input = {
        fatos: 'Bad case',
        questoes: '',
        pedidos: '',
        classe: '',
        assunto: ''
      };

      const result = await pipeline.execute(input);
      expect(result.qa.score_final).toBe(50);

      const { generateCacheKey } = require('../../lib/cache');
      const key = generateCacheKey(input);
      const cached = await mockCache.get(key);
      expect(cached).toBeNull();
    });

    test('includes RAG context when ragProvider is supplied', async () => {
      const mockRAG = async (query) => ([
        { type: 'Sumula', numero: 297, tribunal: 'STJ', texto: 'CDC aplicável' }
      ]);
      const mockGenerator = jest.fn(async (input, context) => {
        expect(context.ragContext).toBeTruthy();
        return { minuta: 'Minuta with RAG', tokens: { input: 800, output: 1500 } };
      });
      const mockQA = async () => ({ score_final: 90, confidence: 0.90 });

      const pipeline = createPipeline({
        cache: mockCache,
        generator: mockGenerator,
        qaValidator: mockQA,
        ragProvider: mockRAG
      });

      const result = await pipeline.execute({
        fatos: 'Caso bancário com CDC',
        questoes: '',
        pedidos: '',
        classe: '',
        assunto: '',
        domain: 'bancario'
      });

      expect(mockGenerator).toHaveBeenCalled();
      expect(result.minuta).toBe('Minuta with RAG');
    });

    test('includes hallucination check results', async () => {
      const mockGenerator = async () => ({
        minuta: 'A Súmula 99999 do STJ estabelece...',
        tokens: { input: 500, output: 1000 }
      });
      const mockQA = async () => ({ score_final: 85, confidence: 0.85 });

      const pipeline = createPipeline({
        cache: mockCache,
        generator: mockGenerator,
        qaValidator: mockQA,
        checkHallucinations: true
      });

      const result = await pipeline.execute({
        fatos: 'Caso',
        questoes: '',
        pedidos: '',
        classe: '',
        assunto: ''
      });

      expect(result).toHaveProperty('hallucinations');
      expect(result.hallucinations.hallucinated).toBe(true);
    });

    test('records timing for each phase', async () => {
      const mockGenerator = async () => ({
        minuta: 'Test',
        tokens: { input: 100, output: 200 }
      });
      const mockQA = async () => ({ score_final: 80, confidence: 0.80 });

      const pipeline = createPipeline({
        cache: mockCache,
        generator: mockGenerator,
        qaValidator: mockQA
      });

      const result = await pipeline.execute({
        fatos: 'Timing test',
        questoes: '',
        pedidos: '',
        classe: '',
        assunto: ''
      });

      expect(result.timing).toHaveProperty('total');
      expect(result.timing).toHaveProperty('cacheCheck');
      expect(result.timing).toHaveProperty('generation');
      expect(result.timing).toHaveProperty('qa');
      expect(typeof result.timing.total).toBe('number');
    });
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/pipeline.test.js --verbose`
Expected: FAIL with "Cannot find module '../../lib/pipeline'"

### Step 3: Write minimal implementation

```javascript
// lib/pipeline.js
/**
 * Pipeline Orchestrator for Lex Intelligentia
 * Wires cache, RAG, generation, QA, and hallucination detection
 * into a unified execution pipeline.
 *
 * @module lib/pipeline
 * @version 1.0.0
 */

const { generateCacheKey, getTTL, getCachedResult, setCachedResult } = require('./cache');
const { buildRAGQuery, formatPrecedentsForPrompt } = require('./rag');
const { detectHallucinations } = require('./hallucination-detector');
const logger = require('./logger');

/**
 * Create a pipeline instance with injected dependencies.
 *
 * @param {Object} options
 * @param {Object} options.cache - Cache client (from createCacheClient)
 * @param {Function} options.generator - async (input, context) => { minuta, tokens }
 * @param {Function} options.qaValidator - async (minuta) => { score_final, confidence, ... }
 * @param {Function} [options.ragProvider] - async (ragQuery) => precedents[]
 * @param {boolean} [options.checkHallucinations=true] - Run hallucination detection
 * @returns {{ execute: Function }}
 */
function createPipeline(options = {}) {
  const {
    cache,
    generator,
    qaValidator,
    ragProvider,
    checkHallucinations = true
  } = options;

  return {
    /**
     * Execute the full pipeline for a case input.
     *
     * @param {Object} input - Case input (fatos, questoes, pedidos, classe, assunto, domain)
     * @returns {Promise<Object>} Pipeline result
     */
    async execute(input) {
      const timing = {};
      const startTotal = Date.now();

      // Phase 1: Cache lookup
      const startCache = Date.now();
      const cacheKey = generateCacheKey(input);
      let cached = null;

      if (cache) {
        cached = await getCachedResult(cache, cacheKey);
      }
      timing.cacheCheck = Date.now() - startCache;

      if (cached) {
        timing.total = Date.now() - startTotal;
        return {
          ...cached,
          cached: true,
          timing
        };
      }

      // Phase 2: RAG context building
      let ragContext = null;
      timing.rag = 0;
      if (ragProvider) {
        const startRAG = Date.now();
        const ragQuery = buildRAGQuery(input);
        const precedents = await ragProvider(ragQuery);
        ragContext = formatPrecedentsForPrompt(precedents);
        timing.rag = Date.now() - startRAG;
      }

      // Phase 3: Generation
      const startGen = Date.now();
      const context = { ragContext };
      const genResult = await generator(input, context);
      timing.generation = Date.now() - startGen;

      // Phase 4: QA Validation
      let qa = { score_final: 0, confidence: 0 };
      timing.qa = 0;
      if (qaValidator) {
        const startQA = Date.now();
        qa = await qaValidator(genResult.minuta);
        timing.qa = Date.now() - startQA;
      }

      // Phase 5: Hallucination detection
      let hallucinations = null;
      timing.hallucination = 0;
      if (checkHallucinations && genResult.minuta) {
        const startHalluc = Date.now();
        hallucinations = detectHallucinations(genResult.minuta);
        timing.hallucination = Date.now() - startHalluc;
      }

      // Phase 6: Cache write (if quality is high enough)
      const ttl = getTTL(qa.confidence);
      if (cache && ttl > 0) {
        await setCachedResult(cache, cacheKey, {
          minuta: genResult.minuta,
          qa
        }, ttl);
      }

      timing.total = Date.now() - startTotal;

      return {
        minuta: genResult.minuta,
        qa,
        cached: false,
        timing,
        tokens: genResult.tokens,
        ...(hallucinations && { hallucinations })
      };
    }
  };
}

module.exports = {
  createPipeline
};
```

### Step 4: Run tests to verify they pass

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/pipeline.test.js --verbose`
Expected: PASS (all 7 tests)

### Step 5: Run full test suite

Run: `cd /mnt/c/projetos-2026/superagents-judge && npm test`
Expected: 299+ passed, 0 failed (plus 7 new)

### Step 6: Commit

```bash
git add lib/pipeline.js tests/unit/pipeline.test.js
git commit -m "feat(pipeline): add pipeline orchestrator wiring cache + RAG + QA + hallucination detection (TDD)"
```

---

## Task 3: Parallel QA Runner (TDD)

**Files:**
- Create: `lib/parallel-qa.js`
- Create: `tests/unit/parallel-qa.test.js`

### Step 1: Write the failing tests

```javascript
// tests/unit/parallel-qa.test.js
const { runParallelQA, mergeQAScores } = require('../../lib/parallel-qa');

describe('Parallel QA Runner', () => {
  describe('mergeQAScores', () => {
    test('merges structural and semantic scores with correct weights', () => {
      const estrutural = { score: 90, details: { secoes: true, formatacao: true } };
      const semantico = { score: 94, details: { precisao_tecnica: 95, fundamentacao: 93 } };

      const merged = mergeQAScores(estrutural, semantico);

      // score_final = round(90 * 0.4 + 94 * 0.6) = round(36 + 56.4) = 92
      expect(merged.score_final).toBe(92);
      expect(merged).toHaveProperty('qa_estrutural');
      expect(merged).toHaveProperty('qa_semantico');
      expect(merged.qa_estrutural.score).toBe(90);
      expect(merged.qa_semantico.score).toBe(94);
    });

    test('calculates confidence as normalized score / 100', () => {
      const estrutural = { score: 80 };
      const semantico = { score: 90 };

      const merged = mergeQAScores(estrutural, semantico);
      // score_final = round(80 * 0.4 + 90 * 0.6) = round(32 + 54) = 86
      expect(merged.confidence).toBeCloseTo(0.86, 2);
    });

    test('handles missing semantic score (structural only)', () => {
      const estrutural = { score: 85 };
      const merged = mergeQAScores(estrutural, null);

      expect(merged.score_final).toBe(85);
      expect(merged.confidence).toBeCloseTo(0.85, 2);
      expect(merged.qa_semantico).toBeNull();
    });

    test('handles missing structural score (semantic only)', () => {
      const semantico = { score: 90 };
      const merged = mergeQAScores(null, semantico);

      expect(merged.score_final).toBe(90);
      expect(merged.qa_estrutural).toBeNull();
    });
  });

  describe('runParallelQA', () => {
    test('runs both QA validators in parallel', async () => {
      let startTime;
      const delay = 50; // ms

      const mockEstrutural = async (minuta) => {
        await new Promise(r => setTimeout(r, delay));
        return { score: 90 };
      };
      const mockSemantico = async (minuta) => {
        await new Promise(r => setTimeout(r, delay));
        return { score: 94 };
      };

      startTime = Date.now();
      const result = await runParallelQA('Test minuta...', {
        estrutural: mockEstrutural,
        semantico: mockSemantico
      });
      const elapsed = Date.now() - startTime;

      // If parallel, should take ~50ms, not ~100ms
      expect(elapsed).toBeLessThan(delay * 1.8);
      expect(result.score_final).toBe(92);
      expect(result).toHaveProperty('timing');
      expect(result.timing.parallel).toBe(true);
    });

    test('handles estrutural failure gracefully', async () => {
      const mockEstrutural = async () => { throw new Error('QA Estrutural failed'); };
      const mockSemantico = async () => ({ score: 88 });

      const result = await runParallelQA('Test', {
        estrutural: mockEstrutural,
        semantico: mockSemantico
      });

      expect(result.score_final).toBe(88);
      expect(result.qa_estrutural).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('estrutural');
    });

    test('handles semantico failure gracefully', async () => {
      const mockEstrutural = async () => ({ score: 85 });
      const mockSemantico = async () => { throw new Error('LLM timeout'); };

      const result = await runParallelQA('Test', {
        estrutural: mockEstrutural,
        semantico: mockSemantico
      });

      expect(result.score_final).toBe(85);
      expect(result.qa_semantico).toBeNull();
    });

    test('handles both failures', async () => {
      const mockEstrutural = async () => { throw new Error('fail 1'); };
      const mockSemantico = async () => { throw new Error('fail 2'); };

      const result = await runParallelQA('Test', {
        estrutural: mockEstrutural,
        semantico: mockSemantico
      });

      expect(result.score_final).toBe(0);
      expect(result.confidence).toBe(0);
      expect(result.errors).toHaveLength(2);
    });
  });
});
```

### Step 2: Run tests to verify they fail

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/parallel-qa.test.js --verbose`
Expected: FAIL with "Cannot find module '../../lib/parallel-qa'"

### Step 3: Write minimal implementation

```javascript
// lib/parallel-qa.js
/**
 * Parallel QA Runner for Lex Intelligentia
 * Runs structural and semantic QA validation concurrently using Promise.allSettled.
 * Reduces latency by 0.5-1s vs sequential execution.
 *
 * @module lib/parallel-qa
 * @version 1.0.0
 */

const logger = require('./logger');

// Weight configuration for score merging
const WEIGHTS = {
  estrutural: 0.4,
  semantico: 0.6
};

/**
 * Merge structural and semantic QA scores into a final score.
 *
 * @param {Object|null} estrutural - Structural QA result { score, details? }
 * @param {Object|null} semantico - Semantic QA result { score, details? }
 * @returns {{ score_final: number, confidence: number, qa_estrutural, qa_semantico }}
 */
function mergeQAScores(estrutural, semantico) {
  let scoreFinal;

  if (estrutural && semantico) {
    scoreFinal = Math.round(
      (estrutural.score * WEIGHTS.estrutural) +
      (semantico.score * WEIGHTS.semantico)
    );
  } else if (estrutural) {
    scoreFinal = estrutural.score;
  } else if (semantico) {
    scoreFinal = semantico.score;
  } else {
    scoreFinal = 0;
  }

  return {
    score_final: scoreFinal,
    confidence: scoreFinal / 100,
    qa_estrutural: estrutural || null,
    qa_semantico: semantico || null
  };
}

/**
 * Run structural and semantic QA validation in parallel.
 *
 * @param {string} minuta - Generated minuta text
 * @param {Object} validators
 * @param {Function} validators.estrutural - async (minuta) => { score, details? }
 * @param {Function} validators.semantico - async (minuta) => { score, details? }
 * @returns {Promise<Object>} Merged QA result with timing info
 */
async function runParallelQA(minuta, validators) {
  const startTime = Date.now();
  const errors = [];

  // Run both in parallel
  const [estruturalResult, semanticoResult] = await Promise.allSettled([
    validators.estrutural(minuta),
    validators.semantico(minuta)
  ]);

  // Extract results, handling failures
  let estrutural = null;
  let semantico = null;

  if (estruturalResult.status === 'fulfilled') {
    estrutural = estruturalResult.value;
  } else {
    errors.push(`estrutural: ${estruturalResult.reason?.message || 'Unknown error'}`);
    logger.error('QA Estrutural failed:', estruturalResult.reason);
  }

  if (semanticoResult.status === 'fulfilled') {
    semantico = semanticoResult.value;
  } else {
    errors.push(`semantico: ${semanticoResult.reason?.message || 'Unknown error'}`);
    logger.error('QA Semântico failed:', semanticoResult.reason);
  }

  const merged = mergeQAScores(estrutural, semantico);
  const elapsed = Date.now() - startTime;

  return {
    ...merged,
    timing: {
      parallel: true,
      totalMs: elapsed
    },
    ...(errors.length > 0 && { errors })
  };
}

module.exports = {
  mergeQAScores,
  runParallelQA,
  WEIGHTS
};
```

### Step 4: Run tests to verify they pass

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/parallel-qa.test.js --verbose`
Expected: PASS (all 7 tests)

### Step 5: Commit

```bash
git add lib/parallel-qa.js tests/unit/parallel-qa.test.js
git commit -m "feat(qa): add parallel QA runner with Promise.allSettled and graceful error handling (TDD)"
```

---

## Task 4: Fix CI/CD Pipeline for 23 Agents

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `tests/unit/config.test.js` (verify agent count assertion is already 23)

### Step 1: Read current CI config

Run: `cat .github/workflows/ci.yml`

### Step 2: Fix agent count check in CI

In `.github/workflows/ci.yml`, the `lint-config` job has a hardcoded check:
```javascript
if (agents.length !== 21) {
```

Change this to:
```javascript
if (agents.length < 23) {
```

This uses `<` instead of `!==` so it won't break if we add more agents later.

### Step 3: Add agent validation job to CI

Add a new job `validate-agents` to `.github/workflows/ci.yml`:

```yaml
  validate-agents:
    name: Agent Validation
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/master'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Validate all agents
        run: npm run validate:all
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        continue-on-error: true

      - name: Upload validation results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: agent-validation-results
          path: test_cases/agent_validation_results/
          retention-days: 30
```

Also update the `all-checks` job to include `validate-agents` in the needs list (but only as optional):

```yaml
  all-checks:
    name: All Checks Passed
    needs: [test, validate-workflows, lint-config, security-check]
```

(Keep `validate-agents` out of the required `needs` since it depends on secrets and is costly.)

### Step 4: Verify config test already checks 23

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/unit/config.test.js --verbose`
Expected: PASS

### Step 5: Run full test suite

Run: `cd /mnt/c/projetos-2026/superagents-judge && npm test`
Expected: All pass

### Step 6: Commit

```bash
git add .github/workflows/ci.yml
git commit -m "ci: fix agent count check (21→23), add agent validation job on push to master"
```

---

## Task 5: Integration Tests (TDD)

**Files:**
- Create: `tests/integration/pipeline.integration.test.js`

### Step 1: Write integration tests

```javascript
// tests/integration/pipeline.integration.test.js
/**
 * Integration tests for the full pipeline.
 * Uses mock LLM but real cache, RAG, and hallucination detection modules.
 */
const { createPipeline } = require('../../lib/pipeline');
const { createCacheClient, generateCacheKey } = require('../../lib/cache');
const { buildRAGQuery, formatPrecedentsForPrompt } = require('../../lib/rag');
const { detectHallucinations } = require('../../lib/hallucination-detector');
const { runParallelQA, mergeQAScores } = require('../../lib/parallel-qa');

describe('Integration: Full Pipeline', () => {
  let cache;

  beforeEach(() => {
    cache = createCacheClient({ mock: true });
  });

  afterEach(async () => {
    await cache.quit();
  });

  test('end-to-end: generate, validate, cache, and detect hallucinations', async () => {
    // Mock generator returns a minuta with a valid súmula
    const generator = async (input, context) => ({
      minuta: `I - RELATÓRIO\nTrata-se de ação revisional de contrato bancário.\n\nII - FUNDAMENTAÇÃO\nConforme a Súmula 297 do STJ, o CDC é aplicável.\n\nIII - DISPOSITIVO\nProcedente.`,
      tokens: { input: 500, output: 800 }
    });

    // Parallel QA with mock validators
    const qaValidator = async (minuta) => {
      return runParallelQA(minuta, {
        estrutural: async () => ({ score: 90 }),
        semantico: async () => ({ score: 94 })
      });
    };

    const pipeline = createPipeline({
      cache,
      generator,
      qaValidator,
      checkHallucinations: true
    });

    const input = {
      fatos: 'Empréstimo consignado com juros abusivos',
      questoes: 'Abusividade contratual',
      pedidos: 'Revisão e repetição de indébito',
      classe: 'Procedimento Comum Cível',
      assunto: 'Contratos Bancários',
      domain: 'bancario'
    };

    // First call: cache miss, full pipeline
    const result1 = await pipeline.execute(input);
    expect(result1.cached).toBe(false);
    expect(result1.minuta).toContain('Súmula 297');
    expect(result1.qa.score_final).toBe(92);
    expect(result1.hallucinations.hallucinated).toBe(false);
    expect(result1.timing.total).toBeGreaterThan(0);

    // Second call: cache hit
    const result2 = await pipeline.execute(input);
    expect(result2.cached).toBe(true);
    expect(result2.minuta).toContain('Súmula 297');
  });

  test('end-to-end: hallucination detection catches fabricated súmula', async () => {
    const generator = async () => ({
      minuta: 'A Súmula 99999 do STJ é clara. Também a Súmula 297 do STJ.',
      tokens: { input: 100, output: 200 }
    });
    const qaValidator = async () => ({ score_final: 80, confidence: 0.80 });

    const pipeline = createPipeline({
      cache,
      generator,
      qaValidator,
      checkHallucinations: true
    });

    const result = await pipeline.execute({
      fatos: 'Caso teste',
      questoes: '',
      pedidos: '',
      classe: '',
      assunto: ''
    });

    expect(result.hallucinations.hallucinated).toBe(true);
    expect(result.hallucinations.citationsChecked).toBe(2);
    expect(result.hallucinations.issuesCount).toBe(1);
  });

  test('end-to-end: RAG context is passed to generator', async () => {
    let receivedContext;

    const generator = async (input, context) => {
      receivedContext = context;
      return { minuta: 'Minuta com RAG', tokens: { input: 100, output: 200 } };
    };

    const ragProvider = async (query) => {
      expect(query).toHaveProperty('text');
      expect(query).toHaveProperty('domain', 'bancario');
      return [
        { type: 'Sumula', numero: 297, tribunal: 'STJ', texto: 'CDC aplicável' }
      ];
    };

    const qaValidator = async () => ({ score_final: 90, confidence: 0.90 });

    const pipeline = createPipeline({
      cache,
      generator,
      qaValidator,
      ragProvider,
      checkHallucinations: false
    });

    await pipeline.execute({
      fatos: 'Empréstimo',
      questoes: '',
      pedidos: '',
      classe: '',
      assunto: '',
      domain: 'bancario'
    });

    expect(receivedContext.ragContext).toContain('Súmula 297/STJ');
  });

  test('cache module: key determinism across calls', () => {
    const input = {
      fatos: '  Empréstimo  consignado  ',
      questoes: '',
      pedidos: '',
      classe: '',
      assunto: ''
    };

    const key1 = generateCacheKey(input);
    const key2 = generateCacheKey(input);
    const key3 = generateCacheKey({ ...input, fatos: 'Empréstimo consignado' });

    expect(key1).toBe(key2);
    expect(key1).toBe(key3); // Whitespace normalization
  });

  test('parallel QA: faster than sequential', async () => {
    const delay = 30;
    const estrutural = async () => {
      await new Promise(r => setTimeout(r, delay));
      return { score: 85 };
    };
    const semantico = async () => {
      await new Promise(r => setTimeout(r, delay));
      return { score: 90 };
    };

    const start = Date.now();
    const result = await runParallelQA('Test', { estrutural, semantico });
    const elapsed = Date.now() - start;

    // Parallel: ~30ms. Sequential would be ~60ms.
    expect(elapsed).toBeLessThan(delay * 1.8);
    expect(result.score_final).toBe(88);
    expect(result.timing.parallel).toBe(true);
  });
});
```

### Step 2: Run integration tests

Run: `cd /mnt/c/projetos-2026/superagents-judge && npx jest tests/integration/pipeline.integration.test.js --verbose`
Expected: PASS (all 5 tests)

### Step 3: Run full test suite

Run: `cd /mnt/c/projetos-2026/superagents-judge && npm test`
Expected: All tests pass

### Step 4: Commit

```bash
git add tests/integration/pipeline.integration.test.js
git commit -m "test(integration): add end-to-end pipeline integration tests with mock LLM"
```

---

## Task 6: Version Bump to v2.8.0 & Documentation Update

**Files:**
- Modify: `package.json` (version: 2.7.0 → 2.8.0)
- Modify: `CLAUDE.md` (update status, add Sprint 5 results)

### Step 1: Bump version

In `package.json`, change `"version": "2.7.0"` to `"version": "2.8.0"`.

### Step 2: Update CLAUDE.md

Update the following sections:
1. Status box: Update Unit Tests count to reflect new total
2. Add Sprint 5 section with completed items and metrics
3. Add new files to the file table (lib/hallucination-detector.js, lib/pipeline.js, lib/parallel-qa.js)
4. Fix CI agent count note if referenced
5. Update Sprint 5 "Pendente" section to reflect remaining items for Sprint 6

### Step 3: Run full test suite one final time

Run: `cd /mnt/c/projetos-2026/superagents-judge && npm test`
Expected: All tests pass (286 existing + ~25 new = 311+ total)

### Step 4: Commit

```bash
git add package.json CLAUDE.md
git commit -m "chore: bump version to v2.8.0, update docs for Sprint 5 completion"
```

---

## Dependency Graph

```
Task 1 (Hallucination Detector)
    ↓
Task 2 (Pipeline Orchestrator) ← depends on Task 1 for import
    ↓
Task 5 (Integration Tests) ← depends on Tasks 1, 2, 3

Task 3 (Parallel QA Runner) ← independent, can parallel with Task 1

Task 4 (CI/CD Fix) ← fully independent

Task 6 (Version bump) ← after all other tasks
```

**Parallelizable groups:**
- Group A: Task 1 (hallucination detector)
- Group B: Task 3 (parallel QA) — can run in parallel with Task 1
- Group C: Task 4 (CI/CD) — can run in parallel with Tasks 1, 3
- Then sequential: Task 2 → Task 5 → Task 6

---

## Success Criteria

- [ ] `lib/hallucination-detector.js` created with tests (13+ tests passing)
- [ ] `lib/pipeline.js` created with tests (7+ tests passing)
- [ ] `lib/parallel-qa.js` created with tests (7+ tests passing)
- [ ] Integration tests passing (5+ tests)
- [ ] CI/CD updated for 23 agents with validation job
- [ ] All 311+ tests passing (286 existing + 25+ new)
- [ ] Version bumped to v2.8.0
- [ ] Zero regressions on existing tests

---

*Plan created: 2026-02-07 | Sprint 5 — Hallucination Detection, Pipeline Orchestration & Parallel QA*
