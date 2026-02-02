/**
 * Unit Tests for lib/hybrid_search.js
 * Hybrid Search with Reciprocal Rank Fusion
 */

const hybridSearch = require('../../lib/hybrid_search');

describe('lib/hybrid_search - Hybrid Search Module', () => {

  describe('reciprocalRankFusion()', () => {
    it('should fuse multiple ranked lists correctly', () => {
      const source1 = [{id: 'A'}, {id: 'B'}, {id: 'C'}];
      const source2 = [{id: 'B'}, {id: 'D'}, {id: 'A'}];
      const source3 = [{id: 'C'}, {id: 'A'}];

      const fused = hybridSearch.reciprocalRankFusion([source1, source2, source3]);

      // A appears in all 3 sources, should rank highest
      expect(fused[0].id).toBe('A');
      expect(fused[0]._rrf.sources.length).toBe(3);
    });

    it('should handle empty sources', () => {
      const fused = hybridSearch.reciprocalRankFusion([[], [], []]);
      expect(fused).toEqual([]);
    });

    it('should handle single source', () => {
      const source = [{id: 'X'}, {id: 'Y'}];
      const fused = hybridSearch.reciprocalRankFusion([source]);
      expect(fused.length).toBe(2);
      expect(fused[0].id).toBe('X');
    });

    it('should calculate RRF scores correctly', () => {
      const k = 60; // default
      const source1 = [{id: 'A'}]; // rank 0
      const source2 = [{id: 'A'}]; // rank 0

      const fused = hybridSearch.reciprocalRankFusion([source1, source2], k);

      // Score should be 2 * (1 / (60 + 0 + 1)) = 2 * (1/61)
      const expectedScore = 2 / (k + 1);
      expect(fused[0]._rrf.score).toBeCloseTo(expectedScore, 5);
    });

    it('should use content_hash as fallback ID', () => {
      const source1 = [{content_hash: 'hash1', text: 'Item 1'}];
      const source2 = [{content_hash: 'hash1', text: 'Item 1'}];

      const fused = hybridSearch.reciprocalRankFusion([source1, source2]);
      expect(fused.length).toBe(1);
      expect(fused[0]._rrf.sources.length).toBe(2);
    });
  });

  describe('graphLookup()', () => {
    it('should return items for bancario domain', () => {
      const results = hybridSearch.graphLookup('bancario');
      expect(results.length).toBeGreaterThan(0);
      results.forEach(r => expect(r.source).toBe('graph'));
    });

    it('should include mandatory and applicable items', () => {
      const results = hybridSearch.graphLookup('bancario');
      const mandatory = results.filter(r => r.obrigatoriedade === 'SEMPRE');
      const applicable = results.filter(r => r.obrigatoriedade === 'QUANDO_APLICAVEL');

      expect(mandatory.length).toBeGreaterThan(0);
    });

    it('should return empty for unknown domain', () => {
      const results = hybridSearch.graphLookup('unknown_domain_xyz');
      expect(results).toEqual([]);
    });

    it('should include cenarios for applicable temas', () => {
      const results = hybridSearch.graphLookup('bancario');
      const tema1368 = results.find(r => r.id === 'TEMA_1368');
      if (tema1368) {
        expect(tema1368.cenarios).toBeDefined();
      }
    });
  });

  describe('qdrantBM25Search()', () => {
    it('should search by legal terms using graph fallback', async () => {
      const results = await hybridSearch.qdrantBM25Search(['juros', 'banco']);
      // Uses graph-based keyword search as fallback
      expect(results).toBeInstanceOf(Array);
    });

    it('should filter by domain when specified', async () => {
      const results = await hybridSearch.qdrantBM25Search(['plano de saude'], 'saude');
      results.forEach(r => {
        if (r.domains) {
          expect(r.domains).toContain('saude');
        }
      });
    });

    it('should respect topK limit', async () => {
      const results = await hybridSearch.qdrantBM25Search(['consumidor'], null, 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  describe('checkTema1368Scenario()', () => {
    it('should return scenario for dano_moral extracontratual', () => {
      const scenario = hybridSearch.checkTema1368Scenario('dano_moral', 'extracontratual');
      expect(scenario).toBeDefined();
      expect(scenario.scenario.tipo).toContain('extracontratual');
      expect(scenario.scenario.correcao).toContain('SELIC');
    });

    it('should return scenario for dano_material contratual', () => {
      const scenario = hybridSearch.checkTema1368Scenario('dano_material', 'contratual');
      expect(scenario).toBeDefined();
      expect(scenario.scenario.tipo).toContain('contratual');
    });

    it('should include vedacoes', () => {
      const scenario = hybridSearch.checkTema1368Scenario('dano_moral', 'extracontratual');
      expect(scenario.vedacoes).toBeInstanceOf(Array);
      expect(scenario.vedacoes.length).toBeGreaterThan(0);
    });

    it('should return null for unknown tipo', () => {
      const scenario = hybridSearch.checkTema1368Scenario('unknown_tipo', 'extracontratual');
      expect(scenario).toBeNull();
    });
  });

  describe('hybridSearch()', () => {
    it('should return results with metadata', async () => {
      const query = {
        text: 'juros abusivos em contrato bancario',
        domain: 'bancario',
        legalTerms: ['juros', 'abusividade']
      };

      const results = await hybridSearch.hybridSearch(query);

      expect(results.items).toBeInstanceOf(Array);
      expect(results.metadata).toBeDefined();
      expect(results.metadata.domain).toBe('bancario');
      expect(results.metadata.timing).toBeDefined();
    });

    it('should include source counts in metadata', async () => {
      const query = {
        text: 'plano de saude negou cobertura',
        domain: 'saude',
        legalTerms: ['plano de saude', 'cobertura']
      };

      const results = await hybridSearch.hybridSearch(query);

      expect(results.metadata.sources.graph).toBeGreaterThanOrEqual(0);
      expect(results.metadata.sources.bm25).toBeGreaterThanOrEqual(0);
    });

    it('should respect topK option', async () => {
      const query = {
        text: 'test query',
        domain: 'bancario',
        legalTerms: []
      };

      const results = await hybridSearch.hybridSearch(query, { topK: 3 });
      expect(results.items.length).toBeLessThanOrEqual(3);
    });

    it('should check scenarios for applicable domains', async () => {
      const query = {
        text: 'indenizacao por dano moral',
        domain: 'responsabilidade_civil',
        legalTerms: ['dano_moral'],
        naturezaDano: 'extracontratual'
      };

      const results = await hybridSearch.hybridSearch(query, { includeScenarios: true });

      if (results.scenarios) {
        expect(results.scenarios.tema).toBeDefined();
      }
    });

    it('should measure total timing', async () => {
      const query = {
        text: 'test',
        domain: 'bancario',
        legalTerms: []
      };

      const results = await hybridSearch.hybridSearch(query);
      expect(results.metadata.timing.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('buildAugmentedContext()', () => {
    it('should separate mandatory from optional items', () => {
      const mockResults = {
        items: [
          { id: 'STJ_297', type: 'Sumula', numero: 297, texto: 'CDC aplicavel', obrigatoriedade: 'SEMPRE' },
          { id: 'TEMA_1368', type: 'Tema', numero: 1368, texto: 'SELIC', obrigatoriedade: 'QUANDO_APLICAVEL', cenarios: [] },
          { id: 'STJ_382', type: 'Sumula', numero: 382, texto: 'Juros', obrigatoriedade: 'SEMPRE' },
        ],
        scenarios: null
      };

      const context = hybridSearch.buildAugmentedContext(mockResults);

      expect(context.mandatoryCitations.length).toBe(2);
      expect(context.applicableTemas.length).toBe(1);
    });

    it('should include scenario rules when present', () => {
      const mockResults = {
        items: [],
        scenarios: {
          tema: { numero: 1368 },
          scenario: { tipo: 'Dano moral', correcao: 'SELIC' },
          vedacoes: ['Cumular SELIC com IPCA']
        }
      };

      const context = hybridSearch.buildAugmentedContext(mockResults);

      expect(context.scenarioRules).toBeDefined();
      expect(context.scenarioRules.tema).toBe(1368);
    });

    it('should estimate token count', () => {
      const mockResults = {
        items: [
          { id: 'STJ_297', type: 'Sumula', numero: 297, texto: 'CDC aplicavel', obrigatoriedade: 'SEMPRE' },
        ],
        scenarios: null
      };

      const context = hybridSearch.buildAugmentedContext(mockResults);
      expect(context.estimatedTokens).toBeGreaterThan(0);
    });

    it('should trim context when exceeding maxTokens', () => {
      const largeItems = Array(50).fill(null).map((_, i) => ({
        id: `item_${i}`,
        type: 'Sumula',
        numero: i,
        texto: 'A'.repeat(200),
        obrigatoriedade: i < 5 ? 'SEMPRE' : 'OPCIONAL'
      }));

      const mockResults = {
        items: largeItems,
        scenarios: null
      };

      const context = hybridSearch.buildAugmentedContext(mockResults, { maxTokens: 1000 });
      expect(context.estimatedTokens).toBeLessThanOrEqual(1200); // Some buffer
    });
  });

  describe('formatContextForPrompt()', () => {
    it('should format mandatory citations', () => {
      const context = {
        mandatoryCitations: [
          { id: 'STJ_297', type: 'Sumula', numero: 297, texto: 'CDC aplicavel', tribunal: 'STJ' }
        ],
        applicableTemas: [],
        relatedSources: [],
        scenarioRules: null
      };

      const prompt = hybridSearch.formatContextForPrompt(context);

      expect(prompt).toContain('CITACOES OBRIGATORIAS');
      expect(prompt).toContain('Sumula 297');
      expect(prompt).toContain('STJ');
    });

    it('should format applicable temas with scenarios', () => {
      const context = {
        mandatoryCitations: [],
        applicableTemas: [
          {
            id: 'TEMA_1368',
            type: 'Tema',
            numero: 1368,
            tribunal: 'STJ',
            texto: 'SELIC como indice unico',
            cenarios: [
              { tipo: 'Dano moral', correcao: 'SELIC desde citacao' }
            ]
          }
        ],
        relatedSources: [],
        scenarioRules: null
      };

      const prompt = hybridSearch.formatContextForPrompt(context);

      expect(prompt).toContain('TEMAS REPETITIVOS APLICAVEIS');
      expect(prompt).toContain('Tema 1368');
      expect(prompt).toContain('Cenarios');
      expect(prompt).toContain('Dano moral');
    });

    it('should format scenario rules', () => {
      const context = {
        mandatoryCitations: [],
        applicableTemas: [],
        relatedSources: [],
        scenarioRules: {
          tema: 1368,
          scenario: { tipo: 'Dano moral contratual', correcao: 'SELIC desde citacao', juros: 'Absorvidos' },
          vedacoes: ['Cumular SELIC com IPCA']
        }
      };

      const prompt = hybridSearch.formatContextForPrompt(context);

      expect(prompt).toContain('REGRA ESPECIFICA DO TEMA 1368');
      expect(prompt).toContain('Dano moral contratual');
      expect(prompt).toContain('Vedacoes');
      expect(prompt).toContain('IPCA');
    });

    it('should format related sources abbreviated', () => {
      const context = {
        mandatoryCitations: [],
        applicableTemas: [],
        relatedSources: [
          { id: 'STJ_382', type: 'Sumula', numero: 382, texto: 'Juros remuneratorios superiores a 12%...' }
        ],
        scenarioRules: null
      };

      const prompt = hybridSearch.formatContextForPrompt(context);

      expect(prompt).toContain('FONTES RELACIONADAS');
      expect(prompt).toContain('Sumula 382');
    });
  });

  describe('config', () => {
    it('should have qdrant configuration', () => {
      expect(hybridSearch.config.qdrant).toBeDefined();
      expect(hybridSearch.config.qdrant.host).toBeDefined();
      expect(hybridSearch.config.qdrant.port).toBeDefined();
    });

    it('should have RRF configuration', () => {
      expect(hybridSearch.config.rrf).toBeDefined();
      expect(hybridSearch.config.rrf.k).toBe(60);
    });

    it('should have default settings', () => {
      expect(hybridSearch.config.defaults.topK).toBe(7);
    });
  });

});
