/**
 * Parallel QA Runner for Lex Intelligentia
 * Runs structural and semantic QA validation concurrently using Promise.allSettled,
 * reducing latency by 0.5-1s vs sequential execution.
 *
 * Scoring formula: score_final = round(estrutural.score * 0.4 + semantico.score * 0.6)
 * Confidence = score_final / 100
 *
 * @module lib/parallel-qa
 * @version 1.0.0
 */

const logger = require('./logger');

/**
 * Weights for QA score merging.
 * @type {{ estrutural: number, semantico: number }}
 */
const WEIGHTS = {
  estrutural: 0.4,
  semantico: 0.6
};

/**
 * Merge structural and semantic QA scores using weighted formula.
 * Handles null/missing inputs gracefully by falling back to the available score.
 *
 * @param {Object|null} estrutural - Structural QA result with { score } or null
 * @param {Object|null} semantico  - Semantic QA result with { score } or null
 * @returns {{ score_final: number, confidence: number }}
 */
function mergeQAScores(estrutural, semantico) {
  const hasEstrutural = estrutural != null && typeof estrutural.score === 'number';
  const hasSemantico = semantico != null && typeof semantico.score === 'number';

  let score_final;

  if (hasEstrutural && hasSemantico) {
    score_final = Math.round(
      estrutural.score * WEIGHTS.estrutural +
      semantico.score * WEIGHTS.semantico
    );
  } else if (hasEstrutural) {
    score_final = estrutural.score;
  } else if (hasSemantico) {
    score_final = semantico.score;
  } else {
    score_final = 0;
  }

  const confidence = Math.round(score_final) / 100;

  return { score_final, confidence };
}

/**
 * Run structural and semantic QA validators in parallel using Promise.allSettled.
 * Never throws -- failures are captured in the errors array.
 *
 * @param {string} minuta - The judicial draft text to validate
 * @param {Object} validators - Validator functions
 * @param {Function} validators.estrutural - Async structural validator (minuta) => { score, details }
 * @param {Function} validators.semantico  - Async semantic validator (minuta) => { score, details }
 * @returns {Promise<{
 *   score_final: number,
 *   confidence: number,
 *   qa_estrutural: Object|null,
 *   qa_semantico: Object|null,
 *   timing: { parallel: boolean, totalMs: number },
 *   errors?: string[]
 * }>}
 */
async function runParallelQA(minuta, { estrutural, semantico }) {
  const start = Date.now();
  const errors = [];

  const [estruturalResult, semanticoResult] = await Promise.allSettled([
    estrutural(minuta),
    semantico(minuta)
  ]);

  let qa_estrutural = null;
  let qa_semantico = null;

  if (estruturalResult.status === 'fulfilled') {
    qa_estrutural = estruturalResult.value;
  } else {
    const msg = `estrutural: ${estruturalResult.reason?.message || 'unknown error'}`;
    errors.push(msg);
    logger.error('QA estrutural failed', { error: estruturalResult.reason?.message });
  }

  if (semanticoResult.status === 'fulfilled') {
    qa_semantico = semanticoResult.value;
  } else {
    const msg = `semantico: ${semanticoResult.reason?.message || 'unknown error'}`;
    errors.push(msg);
    logger.error('QA semantico failed', { error: semanticoResult.reason?.message });
  }

  const { score_final, confidence } = mergeQAScores(qa_estrutural, qa_semantico);
  const totalMs = Date.now() - start;

  const result = {
    score_final,
    confidence,
    qa_estrutural,
    qa_semantico,
    timing: {
      parallel: true,
      totalMs
    }
  };

  if (errors.length > 0) {
    result.errors = errors;
  }

  return result;
}

module.exports = {
  WEIGHTS,
  mergeQAScores,
  runParallelQA
};
