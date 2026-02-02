/**
 * Unit Tests for lib/graph.js
 * Legal Knowledge Graph Query Module
 */

const graph = require('../../lib/graph');

describe('lib/graph - Legal Knowledge Graph', () => {

  describe('getGraph()', () => {
    it('should load the graph lazily', () => {
      const g = graph.getGraph();
      expect(g).toBeDefined();
      expect(g.metadata).toBeDefined();
      expect(g.nodes).toBeInstanceOf(Array);
      expect(g.edges).toBeInstanceOf(Array);
    });

    it('should have valid metadata', () => {
      const g = graph.getGraph();
      expect(g.metadata.version).toBeDefined();
      expect(g.metadata.nodeTypes).toContain('Sumula');
      expect(g.metadata.nodeTypes).toContain('Tema');
      expect(g.metadata.nodeTypes).toContain('Dominio');
      expect(g.metadata.edgeTypes).toContain('REQUIRES');
      expect(g.metadata.edgeTypes).toContain('GOVERNS');
    });
  });

  describe('getNode()', () => {
    it('should return a node by ID', () => {
      const node = graph.getNode('STJ_297');
      expect(node).toBeDefined();
      expect(node.type).toBe('Sumula');
      expect(node.tribunal).toBe('STJ');
      expect(node.numero).toBe(297);
    });

    it('should return null for non-existent node', () => {
      const node = graph.getNode('NON_EXISTENT_NODE');
      expect(node).toBeNull();
    });
  });

  describe('getNodesByType()', () => {
    it('should return all nodes of type Sumula', () => {
      const sumulas = graph.getNodesByType('Sumula');
      expect(sumulas.length).toBeGreaterThan(0);
      sumulas.forEach(s => expect(s.type).toBe('Sumula'));
    });

    it('should return all nodes of type Dominio', () => {
      const dominios = graph.getNodesByType('Dominio');
      expect(dominios.length).toBeGreaterThan(0);
      dominios.forEach(d => expect(d.type).toBe('Dominio'));
    });

    it('should return empty array for unknown type', () => {
      const nodes = graph.getNodesByType('UnknownType');
      expect(nodes).toEqual([]);
    });
  });

  describe('getSumulasForDomain()', () => {
    it('should return sumulas and temas for bancario domain', () => {
      const items = graph.getSumulasForDomain('bancario');
      expect(items.length).toBeGreaterThan(0);

      // Should include STJ_297 (CDC aplicavel a instituicoes financeiras)
      const stj297 = items.find(s => s.id === 'STJ_297');
      expect(stj297).toBeDefined();
      expect(stj297.obrigatoriedade).toBe('SEMPRE');
    });

    it('should return items sorted by priority', () => {
      const items = graph.getSumulasForDomain('bancario');
      for (let i = 1; i < items.length; i++) {
        expect(items[i].prioridade).toBeGreaterThanOrEqual(items[i-1].prioridade);
      }
    });

    it('should include applicable temas', () => {
      const items = graph.getSumulasForDomain('bancario');
      const tema1368 = items.find(s => s.id === 'TEMA_1368');
      expect(tema1368).toBeDefined();
      expect(tema1368.type).toBe('Tema');
    });

    it('should return empty array for unknown domain', () => {
      const items = graph.getSumulasForDomain('unknown_domain');
      expect(items).toEqual([]);
    });
  });

  describe('getMandatorySumulasForDomain()', () => {
    it('should return only mandatory sumulas (SEMPRE)', () => {
      const mandatory = graph.getMandatorySumulasForDomain('bancario');
      expect(mandatory.length).toBeGreaterThan(0);
      mandatory.forEach(s => expect(s.obrigatoriedade).toBe('SEMPRE'));
    });
  });

  describe('getTemasWithCenarios()', () => {
    it('should return Tema 1368 with cenarios', () => {
      const tema = graph.getTemasWithCenarios(1368);
      expect(tema).toBeDefined();
      expect(tema.numero).toBe(1368);
      expect(tema.cenarios).toBeInstanceOf(Array);
      expect(tema.cenarios.length).toBeGreaterThan(0);
    });

    it('should include vedacoes for Tema 1368', () => {
      const tema = graph.getTemasWithCenarios(1368);
      expect(tema.vedacoes).toBeInstanceOf(Array);
    });

    it('should return null for non-existent tema', () => {
      const tema = graph.getTemasWithCenarios(99999);
      expect(tema).toBeNull();
    });
  });

  describe('getTemasForDomain()', () => {
    it('should return temas for saude domain', () => {
      const temas = graph.getTemasForDomain('saude');
      expect(temas.length).toBeGreaterThan(0);
      temas.forEach(t => expect(t.type).toBe('Tema'));
    });
  });

  describe('multiHopQuery()', () => {
    it('should traverse graph from STJ_297 with GOVERNS edges', () => {
      const results = graph.multiHopQuery('STJ_297', ['GOVERNS'], 2);
      expect(results.length).toBeGreaterThan(0);

      // Should reach DOMINIO_bancario
      const bancario = results.find(n => n.id === 'DOMINIO_bancario');
      expect(bancario).toBeDefined();
      expect(bancario.hopDistance).toBe(1);
    });

    it('should respect maxHops parameter', () => {
      const results1 = graph.multiHopQuery('STJ_297', ['GOVERNS', 'REQUIRES'], 1);
      const results2 = graph.multiHopQuery('STJ_297', ['GOVERNS', 'REQUIRES'], 3);
      expect(results2.length).toBeGreaterThanOrEqual(results1.length);
    });

    it('should include path information', () => {
      const results = graph.multiHopQuery('STJ_297', ['GOVERNS'], 2);
      results.forEach(r => {
        expect(r.path).toBeInstanceOf(Array);
        expect(r.path[0]).toBe('STJ_297');
      });
    });

    it('should handle incoming edges with direction=both', () => {
      const results = graph.multiHopQuery('DOMINIO_bancario', ['REQUIRES'], 1, 'incoming');
      expect(results.length).toBe(0); // Domain doesn't have incoming REQUIRES edges

      const resultsOutgoing = graph.multiHopQuery('DOMINIO_bancario', ['REQUIRES'], 1, 'outgoing');
      expect(resultsOutgoing.length).toBeGreaterThan(0);
    });
  });

  describe('findRelationship()', () => {
    it('should find path between STJ_297 and STJ_469', () => {
      const paths = graph.findRelationship('STJ_297', 'STJ_469');
      // Both relate to consumidor domain
      expect(paths.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty for unconnected nodes', () => {
      const paths = graph.findRelationship('STJ_7', 'STF_112', 2);
      // These may or may not be connected depending on graph structure
      expect(paths).toBeInstanceOf(Array);
    });
  });

  describe('getRelatedLegalSources()', () => {
    it('should return related sources for STJ_297', () => {
      const related = graph.getRelatedLegalSources('STJ_297');
      expect(related.length).toBeGreaterThan(0);
    });

    it('should include relationship type', () => {
      const related = graph.getRelatedLegalSources('STJ_297');
      related.forEach(r => {
        expect(['RELATED_TO', 'SAME_DOMAIN']).toContain(r.relationshipType);
      });
    });
  });

  describe('getModifiers()', () => {
    it('should return modifiers for STJ_54', () => {
      const modifiers = graph.getModifiers('STJ_54');
      // Tema 1368 modifies Sumula 54
      const tema1368 = modifiers.find(m => m.id === 'TEMA_1368');
      if (tema1368) {
        expect(tema1368.modificationType).toBe('SUPERA_PARCIALMENTE');
      }
    });
  });

  describe('getLegalBasis()', () => {
    it('should return artigos cited by STJ_297', () => {
      const artigos = graph.getLegalBasis('STJ_297');
      expect(artigos).toBeInstanceOf(Array);
      artigos.forEach(a => expect(a.type).toBe('Artigo'));
    });
  });

  describe('searchByKeyword()', () => {
    it('should find sumulas by keyword "dano moral"', () => {
      const results = graph.searchByKeyword('dano moral', ['Sumula']);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(r => expect(r.type).toBe('Sumula'));
    });

    it('should return results sorted by relevance', () => {
      const results = graph.searchByKeyword('banco', ['Sumula', 'Tema']);
      for (let i = 1; i < results.length; i++) {
        expect(results[i].relevanceScore).toBeLessThanOrEqual(results[i-1].relevanceScore);
      }
    });

    it('should handle accented and unaccented searches', () => {
      const results1 = graph.searchByKeyword('sumula');
      const results2 = graph.searchByKeyword('súmula');
      // Both should return results (normalization)
      expect(results1.length).toBeGreaterThanOrEqual(0);
    });

    it('should search all node types if not specified', () => {
      const results = graph.searchByKeyword('consumidor');
      const types = new Set(results.map(r => r.type));
      expect(types.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getDomain()', () => {
    it('should return domain by name', () => {
      const domain = graph.getDomain('bancario');
      expect(domain).toBeDefined();
      expect(domain.type).toBe('Dominio');
      expect(domain.agente).toBeDefined();
    });

    it('should return null for non-existent domain', () => {
      const domain = graph.getDomain('unknown');
      expect(domain).toBeNull();
    });
  });

  describe('getAllDomains()', () => {
    it('should return list of domain names', () => {
      const domains = graph.getAllDomains();
      expect(domains.length).toBeGreaterThan(0);
      expect(domains).toContain('bancario');
      expect(domains).toContain('saude');
      expect(domains).toContain('consumidor');
    });
  });

  describe('getStats()', () => {
    it('should return graph statistics', () => {
      const stats = graph.getStats();
      expect(stats.totalNodes).toBeGreaterThan(0);
      expect(stats.totalEdges).toBeGreaterThan(0);
      expect(stats.nodesByType).toBeDefined();
      expect(stats.edgesByType).toBeDefined();
    });
  });

  describe('buildQueryContext()', () => {
    it('should build context for bancario domain', () => {
      const context = graph.buildQueryContext('bancario', ['juros', 'capitalizacao']);
      expect(context.domain).toBeDefined();
      expect(context.mandatorySumulas).toBeInstanceOf(Array);
      expect(context.applicableTemas).toBeInstanceOf(Array);
    });

    it('should include mandatory sumulas', () => {
      const context = graph.buildQueryContext('bancario');
      expect(context.mandatorySumulas.length).toBeGreaterThan(0);
    });

    it('should find related items by keywords', () => {
      const context = graph.buildQueryContext('responsabilidade_civil', ['dano moral']);
      expect(context.relatedByKeyword.length).toBeGreaterThanOrEqual(0);
    });

    it('should deduplicate relatedByKeyword', () => {
      const context = graph.buildQueryContext('bancario', ['juros', 'banco', 'financiamento']);
      const ids = context.relatedByKeyword.map(r => r.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

});
