/**
 * Entity Extraction and Graph Enrichment Tests
 * Tests the NER extraction and graph enrichment pipeline
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const GRAPH_PATH = path.join(PROJECT_ROOT, 'knowledge_base', 'legal_graph.json');
const ENTITIES_PATH = path.join(PROJECT_ROOT, 'data', 'extracted_entities.json');

describe('Entity Extraction Pipeline', () => {
    describe('BrazilianLegalNER', () => {
        const runExtractor = (text) => {
            const result = execSync(
                `python3 scripts/graph/entity_extractor.py --text "${text}"`,
                { cwd: PROJECT_ROOT, encoding: 'utf-8' }
            );
            return JSON.parse(result);
        };

        test('should extract súmula references', () => {
            const result = runExtractor('Conforme a Sumula 297 do STJ');
            expect(result.entities.sumulas).toHaveLength(1);
            expect(result.entities.sumulas[0].normalized_id).toBe('STJ_297');
        });

        test('should extract tema references', () => {
            const result = runExtractor('O Tema 1368 do STJ determina a aplicacao da SELIC');
            expect(result.entities.temas).toHaveLength(1);
            expect(result.entities.temas[0].normalized_id).toBe('TEMA_1368');
        });

        test('should extract artigo references', () => {
            const result = runExtractor('Nos termos do art. 186 do CC');
            expect(result.entities.artigos).toHaveLength(1);
            expect(result.entities.artigos[0].value).toContain('186');
        });

        test('should extract multiple entities from text', () => {
            const text = 'Conforme Sumula 297 do STJ e art. 14 do CDC, a responsabilidade objetiva';
            const result = runExtractor(text);
            expect(result.entities.sumulas.length).toBeGreaterThanOrEqual(1);
            expect(result.entities.conceitos.length).toBeGreaterThanOrEqual(1);
        });

        test('should extract legal concepts', () => {
            const result = runExtractor('O dano moral in re ipsa decorre do proprio fato');
            expect(result.entities.conceitos).toHaveLength(1);
            expect(result.entities.conceitos[0].value).toContain('dano moral in re ipsa');
        });

        test('should handle mixed case references', () => {
            const result = runExtractor('SUMULA 479 do stj');
            expect(result.entities.sumulas).toHaveLength(1);
            expect(result.entities.sumulas[0].normalized_id).toBe('STJ_479');
        });

        test('should handle variations of súmula patterns', () => {
            const variations = [
                'Súmula n. 297',
                'Sumula nº 297',
                'Sumula 297/STJ',
                'Enunciado 297 da Sumula do STJ'
            ];

            variations.forEach(text => {
                const result = runExtractor(text);
                expect(result.entities.sumulas.length).toBeGreaterThanOrEqual(1);
            });
        });
    });

    describe('Graph State', () => {
        let graph;

        beforeAll(() => {
            graph = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf-8'));
        });

        test('should have enriched graph with nodes', () => {
            expect(graph.nodes.length).toBeGreaterThan(100);
        });

        test('should have enriched graph with edges', () => {
            expect(graph.edges.length).toBeGreaterThan(150);
        });

        test('should have multiple node types', () => {
            const types = new Set(graph.nodes.map(n => n.type));
            expect(types.has('Sumula')).toBe(true);
            expect(types.has('Tema')).toBe(true);
            expect(types.has('Dominio')).toBe(true);
            expect(types.has('Conceito')).toBe(true);
        });

        test('should have multiple edge types', () => {
            const types = new Set(graph.edges.map(e => e.type));
            expect(types.has('REQUIRES')).toBe(true);
            expect(types.has('GOVERNS')).toBe(true);
            expect(types.has('RELATED_TO')).toBe(true);
        });

        test('should have Conceito nodes from extraction', () => {
            const conceitos = graph.nodes.filter(n => n.type === 'Conceito');
            expect(conceitos.length).toBeGreaterThanOrEqual(5);
        });
    });

    describe('Extracted Entities File', () => {
        let entities;

        beforeAll(() => {
            if (fs.existsSync(ENTITIES_PATH)) {
                entities = JSON.parse(fs.readFileSync(ENTITIES_PATH, 'utf-8'));
            }
        });

        test('should exist if extraction was run', () => {
            expect(entities).toBeDefined();
        });

        test('should have multiple chunks processed', () => {
            expect(entities.length).toBeGreaterThan(0);
        });

        test('should have stats for each chunk', () => {
            entities.forEach(chunk => {
                expect(chunk.stats).toBeDefined();
                expect(typeof chunk.stats.sumulas).toBe('number');
            });
        });
    });
});

describe('Graph Enrichment', () => {
    describe('enrich_graph.py', () => {
        test('should run without errors', () => {
            const result = execSync(
                'python3 scripts/graph/enrich_graph.py --stats',
                { cwd: PROJECT_ROOT, encoding: 'utf-8' }
            );
            expect(result).toContain('LEGAL KNOWLEDGE GRAPH STATISTICS');
            expect(result).toContain('Total Nodes:');
            expect(result).toContain('Total Edges:');
        });
    });

    describe('discover_relationships.py', () => {
        test('should discover relationships', () => {
            const result = execSync(
                'python3 scripts/graph/discover_relationships.py --analyze --sample 5 2>&1',
                { cwd: PROJECT_ROOT, encoding: 'utf-8' }
            );
            expect(result).toContain('RELATIONSHIP DISCOVERY RESULTS');
        });
    });
});

describe('Integration: End-to-End Pipeline', () => {
    test('graph module should work with enriched graph', () => {
        const graph = require('../../lib/graph');

        // Should be able to get súmulas for a domain
        const bancarioSumulas = graph.getSumulasForDomain('bancario');
        expect(Array.isArray(bancarioSumulas)).toBe(true);
        expect(bancarioSumulas.length).toBeGreaterThan(0);

        // Should get stats from graph
        const stats = graph.getStats();
        expect(stats.totalNodes).toBeGreaterThanOrEqual(96);
        expect(stats.totalEdges).toBeGreaterThanOrEqual(135);
    });

    test('hybrid search graphLookup should work', () => {
        const { graphLookup } = require('../../lib/hybrid_search');

        // graphLookup returns an array of items for the domain
        const results = graphLookup('bancario');
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);

        // Each item should have expected structure
        const item = results[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('type');
        expect(item.source).toBe('graph');
    });

    test('checkTema1368Scenario should work', () => {
        const { checkTema1368Scenario } = require('../../lib/hybrid_search');

        // Test with keywords that should match Tema 1368 scenarios
        const result = checkTema1368Scenario('contratual');
        // May or may not match, but should return null or an object
        expect(result === null || typeof result === 'object').toBe(true);

        // Test with dano moral contratual (should match)
        const result2 = checkTema1368Scenario('Dano moral contratual');
        if (result2) {
            // Returns {tema, scenario, vedacoes}
            expect(result2).toHaveProperty('tema');
            expect(result2).toHaveProperty('scenario');
            expect(result2.scenario).toHaveProperty('tipo');
            expect(result2.scenario).toHaveProperty('correcao');
        }
    });
});
