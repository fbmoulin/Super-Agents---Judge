/**
 * Pipeline Orchestrator for Lex Intelligentia
 * Wires cache + RAG + LLM generation + QA + hallucination detection
 * into a single createPipeline().execute() function.
 *
 * @module lib/pipeline
 * @version 1.0.0
 */

const { generateCacheKey, getCachedResult, setCachedResult, getTTL } = require('./cache');
const { buildRAGQuery, formatPrecedentsForPrompt } = require('./rag');
const { detectHallucinations } = require('./hallucination-detector');
const logger = require('./logger');

/**
 * Create a pipeline orchestrator with dependency injection.
 *
 * @param {Object} options
 * @param {Object} options.cache - Cache client from createCacheClient()
 * @param {Function} options.generator - Async function(input, { ragContext }) => { minuta, tokens }
 * @param {Function} options.qaValidator - Async function(minuta) => { confidence, checks }
 * @param {Function} [options.ragProvider] - Async function(query) => precedents[]
 * @param {boolean} [options.checkHallucinations=true] - Whether to run hallucination detection
 * @returns {{ execute: Function }}
 */
function createPipeline({ cache, generator, qaValidator, ragProvider, checkHallucinations = true }) {
  return {
    /**
     * Execute the full pipeline for a given case input.
     *
     * Phase 1: Cache lookup
     * Phase 2: RAG context retrieval
     * Phase 3: LLM generation
     * Phase 4: QA validation
     * Phase 5: Hallucination detection
     * Phase 6: Cache write
     *
     * @param {Object} input - Case input (fatos, questoes, pedidos, classe, assunto)
     * @returns {Promise<Object>} { minuta, qa, cached, timing, tokens, hallucinations? }
     */
    async execute(input) {
      const timing = {};
      const totalStart = Date.now();

      // Phase 1: Cache lookup
      const cacheStart = Date.now();
      const cacheKey = generateCacheKey(input);
      const cachedResult = await getCachedResult(cache, cacheKey);
      timing.cacheCheck = Date.now() - cacheStart;

      if (cachedResult) {
        logger.debug('Cache hit', { key: cacheKey });
        timing.total = Date.now() - totalStart;
        return {
          minuta: cachedResult.minuta,
          qa: cachedResult.qa,
          tokens: cachedResult.tokens,
          cached: true,
          timing
        };
      }

      // Phase 2: RAG context retrieval
      let ragContext = '';
      if (ragProvider) {
        const ragStart = Date.now();
        try {
          const ragQuery = buildRAGQuery(input);
          const precedents = await ragProvider(ragQuery);
          ragContext = formatPrecedentsForPrompt(precedents);
          timing.rag = Date.now() - ragStart;
          logger.debug('RAG context retrieved', { precedents: precedents.length, chars: ragContext.length });
        } catch (err) {
          timing.rag = Date.now() - ragStart;
          logger.warn('RAG retrieval failed, continuing without context', { error: err.message });
        }
      }

      // Phase 3: LLM Generation
      const genStart = Date.now();
      const generationResult = await generator(input, { ragContext });
      timing.generation = Date.now() - genStart;
      const { minuta, tokens } = generationResult;

      // Phase 4: QA Validation
      const qaStart = Date.now();
      const qa = await qaValidator(minuta);
      timing.qa = Date.now() - qaStart;

      // Phase 5: Hallucination detection (optional)
      let hallucinations;
      if (checkHallucinations) {
        const halStart = Date.now();
        hallucinations = detectHallucinations(minuta);
        timing.hallucination = Date.now() - halStart;
      }

      // Phase 6: Cache write (only if QA confidence >= 0.70)
      const ttl = getTTL(qa.confidence);
      if (ttl > 0) {
        await setCachedResult(cache, cacheKey, { minuta, qa, tokens }, ttl);
        logger.debug('Result cached', { key: cacheKey, ttl });
      }

      timing.total = Date.now() - totalStart;

      // Build result
      const result = {
        minuta,
        qa,
        cached: false,
        timing,
        tokens
      };

      if (hallucinations) {
        result.hallucinations = hallucinations;
      }

      return result;
    }
  };
}

module.exports = { createPipeline };
