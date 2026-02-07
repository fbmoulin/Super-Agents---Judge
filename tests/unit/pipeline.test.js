// tests/unit/pipeline.test.js
const { createPipeline } = require('../../lib/pipeline');
const { createCacheClient, generateCacheKey, getTTL } = require('../../lib/cache');

describe('Pipeline Orchestrator', () => {
  // Shared test fixtures
  const sampleInput = {
    fatos: 'O autor celebrou contrato de empréstimo consignado',
    questoes: 'Existência de cláusulas abusivas no contrato',
    pedidos: 'Revisão das cláusulas contratuais',
    classe: 'Procedimento Comum Cível',
    assunto: 'Contratos bancários'
  };

  const sampleMinuta = 'I - RELATÓRIO\nTrata-se de ação revisional de contrato.\n\nII - FUNDAMENTAÇÃO\nAnalisando os autos...\n\nIII - DISPOSITIVO\nAnte o exposto, julgo procedente.';

  // Mock generator function
  function createMockGenerator(minuta, tokens = 1200) {
    return jest.fn().mockResolvedValue({
      minuta,
      tokens
    });
  }

  // Mock QA validator
  function createMockQAValidator(confidence = 0.85) {
    return jest.fn().mockResolvedValue({
      confidence,
      checks: {
        structure: { score: confidence },
        legal: { score: confidence },
        completeness: { score: confidence }
      }
    });
  }

  describe('createPipeline', () => {
    test('returns object with execute method', () => {
      const cache = createCacheClient({ mock: true });
      const pipeline = createPipeline({
        cache,
        generator: createMockGenerator(sampleMinuta),
        qaValidator: createMockQAValidator()
      });

      expect(pipeline).toBeDefined();
      expect(typeof pipeline.execute).toBe('function');
    });
  });

  describe('pipeline.execute', () => {
    let mockCache;

    beforeEach(() => {
      mockCache = createCacheClient({ mock: true });
    });

    afterEach(async () => {
      await mockCache.quit();
    });

    test('returns result with all required fields (minuta, qa, cached:false, timing)', async () => {
      const generator = createMockGenerator(sampleMinuta);
      const qaValidator = createMockQAValidator(0.85);

      const pipeline = createPipeline({
        cache: mockCache,
        generator,
        qaValidator,
        checkHallucinations: false
      });

      const result = await pipeline.execute(sampleInput);

      expect(result).toHaveProperty('minuta', sampleMinuta);
      expect(result).toHaveProperty('qa');
      expect(result.qa).toHaveProperty('confidence', 0.85);
      expect(result).toHaveProperty('cached', false);
      expect(result).toHaveProperty('timing');
      expect(result.timing).toHaveProperty('total');
      expect(result).toHaveProperty('tokens');
    });

    test('returns cached result on cache hit (generator should NOT be called)', async () => {
      const cachedData = {
        minuta: sampleMinuta,
        qa: { confidence: 0.92 },
        tokens: 1000
      };

      // Pre-populate cache directly
      const cacheKey = generateCacheKey(sampleInput);
      await mockCache.set(cacheKey, cachedData, 604800);

      const generator = createMockGenerator('this should not be generated');
      const qaValidator = createMockQAValidator();

      const pipeline = createPipeline({
        cache: mockCache,
        generator,
        qaValidator
      });

      const result = await pipeline.execute(sampleInput);

      expect(result).toHaveProperty('cached', true);
      expect(result.minuta).toBe(sampleMinuta);
      expect(result.qa).toEqual({ confidence: 0.92 });
      expect(generator).not.toHaveBeenCalled();
      expect(qaValidator).not.toHaveBeenCalled();
    });

    test('caches result when QA confidence >= 0.70', async () => {
      const generator = createMockGenerator(sampleMinuta);
      const qaValidator = createMockQAValidator(0.85);

      const pipeline = createPipeline({
        cache: mockCache,
        generator,
        qaValidator,
        checkHallucinations: false
      });

      await pipeline.execute(sampleInput);

      // Verify cache was populated
      const cacheKey = generateCacheKey(sampleInput);
      const cached = await mockCache.get(cacheKey);
      expect(cached).not.toBeNull();
      expect(cached).toHaveProperty('minuta', sampleMinuta);
    });

    test('does NOT cache when QA confidence < 0.70', async () => {
      const generator = createMockGenerator(sampleMinuta);
      const qaValidator = createMockQAValidator(0.50);

      const pipeline = createPipeline({
        cache: mockCache,
        generator,
        qaValidator,
        checkHallucinations: false
      });

      await pipeline.execute(sampleInput);

      // Verify cache was NOT populated (TTL=0 means no cache)
      const cacheKey = generateCacheKey(sampleInput);
      const cached = await mockCache.get(cacheKey);
      expect(cached).toBeNull();
    });

    test('includes RAG context when ragProvider is supplied', async () => {
      const generator = createMockGenerator(sampleMinuta);
      const qaValidator = createMockQAValidator(0.85);

      const ragProvider = jest.fn().mockResolvedValue([
        { type: 'Sumula', numero: '297', tribunal: 'STJ', texto: 'O Código de Defesa do Consumidor é aplicável às instituições financeiras.' }
      ]);

      const pipeline = createPipeline({
        cache: mockCache,
        generator,
        qaValidator,
        ragProvider,
        checkHallucinations: false
      });

      await pipeline.execute(sampleInput);

      // Verify ragProvider was called
      expect(ragProvider).toHaveBeenCalled();

      // Verify generator received ragContext
      expect(generator).toHaveBeenCalledTimes(1);
      const generatorCall = generator.mock.calls[0];
      expect(generatorCall[0]).toEqual(sampleInput);
      expect(generatorCall[1]).toHaveProperty('ragContext');
      expect(generatorCall[1].ragContext).toContain('JURISPRUD');
    });

    test('includes hallucination check results', async () => {
      // Generator returns minuta with a fabricated sumula reference
      const minutaWithHallucination = 'I - RELATÓRIO\nTrata-se de ação revisional.\n\nII - FUNDAMENTAÇÃO\nConforme Súmula 99999 do STJ, o contrato deve ser revisado.\n\nIII - DISPOSITIVO\nJulgo procedente.';

      const generator = createMockGenerator(minutaWithHallucination);
      const qaValidator = createMockQAValidator(0.80);

      const pipeline = createPipeline({
        cache: mockCache,
        generator,
        qaValidator,
        checkHallucinations: true
      });

      const result = await pipeline.execute(sampleInput);

      expect(result).toHaveProperty('hallucinations');
      expect(result.hallucinations).toHaveProperty('hallucinated', true);
      expect(result.hallucinations.issues.length).toBeGreaterThan(0);
      expect(result.hallucinations.issues[0]).toHaveProperty('type', 'SUMULA_NAO_ENCONTRADA');
    });

    test('records timing for each phase (total, cacheCheck, generation, qa)', async () => {
      const generator = createMockGenerator(sampleMinuta);
      const qaValidator = createMockQAValidator(0.85);

      const pipeline = createPipeline({
        cache: mockCache,
        generator,
        qaValidator,
        checkHallucinations: false
      });

      const result = await pipeline.execute(sampleInput);

      expect(result.timing).toHaveProperty('total');
      expect(result.timing).toHaveProperty('cacheCheck');
      expect(result.timing).toHaveProperty('generation');
      expect(result.timing).toHaveProperty('qa');
      expect(typeof result.timing.total).toBe('number');
      expect(typeof result.timing.cacheCheck).toBe('number');
      expect(typeof result.timing.generation).toBe('number');
      expect(typeof result.timing.qa).toBe('number');
      expect(result.timing.total).toBeGreaterThanOrEqual(0);
    });
  });
});
