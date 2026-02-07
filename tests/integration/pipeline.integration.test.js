/**
 * Integration Tests for Full Pipeline
 * Uses REAL modules (cache, RAG, hallucination detector, parallel QA, pipeline)
 * with mock LLM functions — no actual API calls.
 *
 * @module tests/integration/pipeline.integration.test
 */

const { createPipeline } = require('../../lib/pipeline');
const { createCacheClient, generateCacheKey, CACHE_PREFIX } = require('../../lib/cache');
const { runParallelQA, mergeQAScores } = require('../../lib/parallel-qa');

describe('Integration: Full Pipeline', () => {
  let cache;

  beforeEach(() => {
    cache = createCacheClient({ mock: true });
  });

  afterEach(async () => {
    await cache.quit();
  });

  // ── Test 1: End-to-end generate + validate + cache ──────────────────────

  test('end-to-end generate + validate + cache (second call is cached)', async () => {
    const mockGenerator = jest.fn().mockResolvedValue({
      minuta: 'SENTENÇA\nConforme a Súmula 297 do STJ, o CDC aplica-se às instituições financeiras.\nJulgo procedente o pedido.',
      tokens: 120
    });

    const mockQAValidator = jest.fn().mockResolvedValue({
      score: 92,
      confidence: 0.92,
      checks: ['estrutura', 'fundamentacao', 'dispositivo']
    });

    const pipeline = createPipeline({
      cache,
      generator: mockGenerator,
      qaValidator: mockQAValidator,
      checkHallucinations: true
    });

    const input = {
      fatos: 'Cliente bancário contesta cláusulas abusivas em contrato de financiamento.',
      questoes: 'Aplicabilidade do CDC às instituições financeiras.',
      pedidos: 'Revisão contratual e devolução de valores.',
      classe: 'Ação Revisional',
      assunto: 'Contratos Bancários'
    };

    // First execution — should NOT be cached
    const result1 = await pipeline.execute(input);

    expect(result1.cached).toBe(false);
    expect(result1.minuta).toContain('Súmula 297');
    expect(result1.qa.score).toBe(92);
    expect(result1.hallucinations).toBeDefined();
    expect(result1.hallucinations.hallucinated).toBe(false);
    expect(result1.tokens).toBe(120);
    expect(mockGenerator).toHaveBeenCalledTimes(1);

    // Second execution — should be cached (same input)
    const result2 = await pipeline.execute(input);

    expect(result2.cached).toBe(true);
    expect(result2.minuta).toContain('Súmula 297');
    expect(result2.qa.score).toBe(92);
    // Generator should NOT be called again
    expect(mockGenerator).toHaveBeenCalledTimes(1);
  });

  // ── Test 2: Hallucination detection catches fabricated súmula ────────────

  test('hallucination detection catches fabricated Súmula 99999', async () => {
    const minutaWithFabricatedCitation =
      'SENTENÇA\n' +
      'Conforme a Súmula 99999 do STJ, blá blá blá.\n' +
      'Além disso, a Súmula 297 do STJ reforça o entendimento.\n' +
      'Julgo procedente o pedido.';

    const mockGenerator = jest.fn().mockResolvedValue({
      minuta: minutaWithFabricatedCitation,
      tokens: 150
    });

    const mockQAValidator = jest.fn().mockResolvedValue({
      score: 80,
      confidence: 0.80,
      checks: ['estrutura']
    });

    const pipeline = createPipeline({
      cache,
      generator: mockGenerator,
      qaValidator: mockQAValidator,
      checkHallucinations: true
    });

    const input = {
      fatos: 'Contrato bancário com cláusulas abusivas.',
      questoes: 'Revisão de contrato.',
      pedidos: 'Devolução em dobro.',
      classe: 'Ação Revisional',
      assunto: 'Bancário'
    };

    const result = await pipeline.execute(input);

    expect(result.hallucinations).toBeDefined();
    expect(result.hallucinations.hallucinated).toBe(true);
    expect(result.hallucinations.citationsChecked).toBe(2);
    expect(result.hallucinations.issuesCount).toBe(1);
    // The valid one (297) should not be in issues, only 99999
    expect(result.hallucinations.issues[0].numero).toBe('99999');
  });

  // ── Test 3: RAG context is passed to generator ──────────────────────────

  test('RAG context is passed to generator via ragProvider', async () => {
    const mockPrecedents = [
      {
        type: 'Sumula',
        numero: '297',
        tribunal: 'STJ',
        texto: 'O Código de Defesa do Consumidor é aplicável às instituições financeiras'
      },
      {
        type: 'Tema',
        numero: '952',
        tribunal: 'STJ',
        texto: 'Tese sobre contratos bancários'
      }
    ];

    const mockRagProvider = jest.fn().mockResolvedValue(mockPrecedents);

    const mockGenerator = jest.fn().mockResolvedValue({
      minuta: 'SENTENÇA com base na Súmula 297 do STJ.',
      tokens: 80
    });

    const mockQAValidator = jest.fn().mockResolvedValue({
      score: 85,
      confidence: 0.85,
      checks: []
    });

    const pipeline = createPipeline({
      cache,
      generator: mockGenerator,
      qaValidator: mockQAValidator,
      ragProvider: mockRagProvider,
      checkHallucinations: false
    });

    const input = {
      fatos: 'Contrato bancário com Súmula 297.',
      questoes: 'Aplicabilidade do CDC.',
      pedidos: 'Revisão contratual.',
      classe: 'Ação Revisional',
      assunto: 'Bancário'
    };

    await pipeline.execute(input);

    // ragProvider should have been called
    expect(mockRagProvider).toHaveBeenCalledTimes(1);

    // generator should have received ragContext
    expect(mockGenerator).toHaveBeenCalledTimes(1);
    const [generatorInput, generatorOptions] = mockGenerator.mock.calls[0];
    expect(generatorInput).toEqual(input);
    expect(generatorOptions).toBeDefined();
    expect(generatorOptions.ragContext).toBeDefined();
    // ragContext should contain formatted precedent text
    expect(generatorOptions.ragContext).toContain('Súmula 297');
    expect(generatorOptions.ragContext).toContain('JURISPRUDÊNCIA RELEVANTE');
  });

  // ── Test 4: Cache key determinism across calls ──────────────────────────

  test('cache key determinism: same content different whitespace = same key', () => {
    const input1 = {
      fatos: 'Cliente  contesta   cláusulas.',
      questoes: 'Aplicabilidade  do CDC.',
      pedidos: 'Revisão contratual.',
      classe: 'Ação Revisional',
      assunto: 'Bancário'
    };

    const input2 = {
      fatos: 'Cliente contesta cláusulas.',
      questoes: 'Aplicabilidade do CDC.',
      pedidos: 'Revisão contratual.',
      classe: 'Ação Revisional',
      assunto: 'Bancário'
    };

    const key1 = generateCacheKey(input1);
    const key2 = generateCacheKey(input2);

    // Same content with different whitespace should produce same key
    expect(key1).toBe(key2);

    // Different content should produce different key
    const input3 = {
      fatos: 'Caso completamente diferente sobre direito de família.',
      questoes: 'Guarda compartilhada.',
      pedidos: 'Regulamentação de visitas.',
      classe: 'Ação de Guarda',
      assunto: 'Família'
    };

    const key3 = generateCacheKey(input3);
    expect(key3).not.toBe(key1);

    // Keys should have the expected prefix
    expect(key1.startsWith(CACHE_PREFIX)).toBe(true);
    expect(key3.startsWith(CACHE_PREFIX)).toBe(true);
  });

  // ── Test 5: Parallel QA is faster than sequential ───────────────────────

  test('parallel QA is faster than sequential execution', async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const mockEstrutural = jest.fn(async (minuta) => {
      await delay(30);
      return { score: 85, details: { completude: true } };
    });

    const mockSemantico = jest.fn(async (minuta) => {
      await delay(30);
      return { score: 90, details: { coerencia: true } };
    });

    const start = Date.now();
    const result = await runParallelQA('minuta de teste para QA', {
      estrutural: mockEstrutural,
      semantico: mockSemantico
    });
    const elapsed = Date.now() - start;

    // Parallel: should be ~30ms, NOT ~60ms (sequential)
    expect(elapsed).toBeLessThan(55);

    // Score formula: round(85 * 0.4 + 90 * 0.6) = round(34 + 54) = round(88) = 88
    expect(result.score_final).toBe(88);
    expect(result.confidence).toBe(0.88);
    expect(result.qa_estrutural).toBeDefined();
    expect(result.qa_semantico).toBeDefined();
    expect(result.timing.parallel).toBe(true);
    expect(result.timing.totalMs).toBeLessThan(55);
  });
});
