// tests/unit/parallel-qa.test.js
const { mergeQAScores, runParallelQA, WEIGHTS } = require('../../lib/parallel-qa');

describe('Parallel QA Module', () => {
  describe('WEIGHTS', () => {
    test('exports correct weights', () => {
      expect(WEIGHTS).toEqual({ estrutural: 0.4, semantico: 0.6 });
    });
  });

  describe('mergeQAScores', () => {
    test('merges structural (90) and semantic (94) scores with weights 0.4/0.6', () => {
      const result = mergeQAScores(
        { score: 90 },
        { score: 94 }
      );
      // 90 * 0.4 + 94 * 0.6 = 36 + 56.4 = 92.4 -> round = 92
      expect(result.score_final).toBe(92);
    });

    test('calculates confidence as score_final / 100', () => {
      const result = mergeQAScores(
        { score: 90 },
        { score: 94 }
      );
      expect(result.confidence).toBe(0.92);
    });

    test('handles missing semantic score (structural only fallback)', () => {
      const result = mergeQAScores({ score: 80 }, null);
      expect(result.score_final).toBe(80);
      expect(result.confidence).toBe(0.80);
    });

    test('handles missing structural score (semantic only fallback)', () => {
      const result = mergeQAScores(null, { score: 95 });
      expect(result.score_final).toBe(95);
      expect(result.confidence).toBe(0.95);
    });
  });

  describe('runParallelQA', () => {
    const minuta = 'I - RELATORIO\nTrata-se de acao de cobranca...';

    test('runs both validators in parallel (total < 90ms for 50ms each)', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const estrutural = async (m) => {
        await delay(50);
        return { score: 88, details: 'structure ok' };
      };
      const semantico = async (m) => {
        await delay(50);
        return { score: 92, details: 'semantics ok' };
      };

      const start = Date.now();
      const result = await runParallelQA(minuta, { estrutural, semantico });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(90);
      expect(result.timing.parallel).toBe(true);
      expect(result.timing.totalMs).toBeDefined();
      // 88 * 0.4 + 92 * 0.6 = 35.2 + 55.2 = 90.4 -> round = 90
      expect(result.score_final).toBe(90);
      expect(result.confidence).toBe(0.90);
      expect(result.qa_estrutural).toEqual({ score: 88, details: 'structure ok' });
      expect(result.qa_semantico).toEqual({ score: 92, details: 'semantics ok' });
      expect(result.errors).toBeUndefined();
    });

    test('handles estrutural failure gracefully (returns semantic score only)', async () => {
      const estrutural = async () => { throw new Error('Structural validator crashed'); };
      const semantico = async () => ({ score: 85, details: 'ok' });

      const result = await runParallelQA(minuta, { estrutural, semantico });

      expect(result.score_final).toBe(85);
      expect(result.confidence).toBe(0.85);
      expect(result.qa_estrutural).toBeNull();
      expect(result.qa_semantico).toEqual({ score: 85, details: 'ok' });
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('estrutural');
    });

    test('handles semantico failure gracefully (returns structural score only)', async () => {
      const estrutural = async () => ({ score: 78, details: 'ok' });
      const semantico = async () => { throw new Error('Semantic validator crashed'); };

      const result = await runParallelQA(minuta, { estrutural, semantico });

      expect(result.score_final).toBe(78);
      expect(result.confidence).toBe(0.78);
      expect(result.qa_estrutural).toEqual({ score: 78, details: 'ok' });
      expect(result.qa_semantico).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('semantico');
    });

    test('handles both failures (score=0, confidence=0, errors has 2 items)', async () => {
      const estrutural = async () => { throw new Error('fail 1'); };
      const semantico = async () => { throw new Error('fail 2'); };

      const result = await runParallelQA(minuta, { estrutural, semantico });

      expect(result.score_final).toBe(0);
      expect(result.confidence).toBe(0);
      expect(result.qa_estrutural).toBeNull();
      expect(result.qa_semantico).toBeNull();
      expect(result.errors).toHaveLength(2);
    });
  });
});
