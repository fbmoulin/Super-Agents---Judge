/**
 * Legal Knowledge Graph Query Module
 * Provides efficient graph traversal and lookup functions for the Brazilian legal knowledge base
 *
 * @module lib/graph
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Load graph lazily for better startup performance
let _graph = null;
let _nodeIndex = null;
let _edgeIndex = null;

/**
 * Load and cache the legal knowledge graph
 * @returns {Object} The loaded graph
 */
function getGraph() {
  if (!_graph) {
    const graphPath = path.join(__dirname, '../knowledge_base/legal_graph.json');
    _graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    buildIndices();
  }
  return _graph;
}

/**
 * Build internal indices for fast lookups
 */
function buildIndices() {
  // Index nodes by ID
  _nodeIndex = new Map();
  for (const node of _graph.nodes) {
    _nodeIndex.set(node.id, node);
  }

  // Index edges by source and target
  _edgeIndex = {
    bySource: new Map(),
    byTarget: new Map(),
    byType: new Map()
  };

  for (const edge of _graph.edges) {
    // By source
    if (!_edgeIndex.bySource.has(edge.source)) {
      _edgeIndex.bySource.set(edge.source, []);
    }
    _edgeIndex.bySource.get(edge.source).push(edge);

    // By target
    if (!_edgeIndex.byTarget.has(edge.target)) {
      _edgeIndex.byTarget.set(edge.target, []);
    }
    _edgeIndex.byTarget.get(edge.target).push(edge);

    // By type
    if (!_edgeIndex.byType.has(edge.type)) {
      _edgeIndex.byType.set(edge.type, []);
    }
    _edgeIndex.byType.get(edge.type).push(edge);
  }
}

/**
 * Get a node by its ID
 * @param {string} nodeId - The node ID
 * @returns {Object|null} The node or null if not found
 */
function getNode(nodeId) {
  getGraph(); // Ensure loaded
  return _nodeIndex.get(nodeId) || null;
}

/**
 * Get all nodes of a specific type
 * @param {string} type - Node type (Sumula, Tema, Dominio, Artigo, Conceito)
 * @returns {Array} Array of matching nodes
 */
function getNodesByType(type) {
  const graph = getGraph();
  return graph.nodes.filter(n => n.type === type);
}

/**
 * Get all súmulas required for a specific domain
 * @param {string} domain - Domain name (e.g., 'bancario', 'saude')
 * @returns {Array} Array of Sumula nodes with priority information
 */
function getSumulasForDomain(domain) {
  getGraph();
  const domainId = `DOMINIO_${domain}`;
  const edges = _edgeIndex.bySource.get(domainId) || [];

  const results = [];
  for (const edge of edges) {
    if (edge.type === 'REQUIRES') {
      const targetNode = _nodeIndex.get(edge.target);
      if (targetNode && (targetNode.type === 'Sumula' || targetNode.type === 'Tema')) {
        results.push({
          ...targetNode,
          obrigatoriedade: edge.properties?.obrigatoriedade || 'SEMPRE',
          prioridade: edge.properties?.prioridade || 999
        });
      }
    }
  }

  // Sort by priority
  return results.sort((a, b) => a.prioridade - b.prioridade);
}

/**
 * Get mandatory súmulas (SEMPRE requirement) for a domain
 * @param {string} domain - Domain name
 * @returns {Array} Array of mandatory Sumula nodes
 */
function getMandatorySumulasForDomain(domain) {
  return getSumulasForDomain(domain).filter(s => s.obrigatoriedade === 'SEMPRE');
}

/**
 * Get a tema by its number with scenario details
 * @param {number} temaNumero - The tema number
 * @returns {Object|null} The tema with cenarios or null
 */
function getTemasWithCenarios(temaNumero) {
  const graph = getGraph();
  const tema = graph.nodes.find(n => n.type === 'Tema' && n.numero === temaNumero);
  if (!tema) return null;

  return {
    ...tema,
    cenarios: tema.cenarios || tema.detalhamento?.cenarios || [],
    vedacoes: tema.vedacoes || tema.detalhamento?.vedacoes || []
  };
}

/**
 * Get all temas for a domain with cenarios
 * @param {string} domain - Domain name
 * @returns {Array} Array of Tema nodes with cenarios
 */
function getTemasForDomain(domain) {
  const domainItems = getSumulasForDomain(domain);
  return domainItems
    .filter(item => item.type === 'Tema')
    .map(tema => ({
      ...tema,
      cenarios: tema.cenarios || tema.detalhamento?.cenarios || [],
      vedacoes: tema.vedacoes || tema.detalhamento?.vedacoes || []
    }));
}

/**
 * Multi-hop graph traversal using BFS
 * @param {string} startNode - Starting node ID
 * @param {Array<string>} edgeTypes - Edge types to follow (e.g., ['REQUIRES', 'GOVERNS'])
 * @param {number} maxHops - Maximum traversal depth (default: 2)
 * @param {string} direction - 'outgoing', 'incoming', or 'both' (default: 'outgoing')
 * @returns {Array} Array of reachable nodes with hop distance
 */
function multiHopQuery(startNode, edgeTypes, maxHops = 2, direction = 'outgoing') {
  getGraph();

  const visited = new Set();
  const results = [];
  const queue = [{ nodeId: startNode, depth: 0, path: [startNode] }];

  while (queue.length > 0) {
    const { nodeId, depth, path } = queue.shift();

    if (visited.has(nodeId) || depth > maxHops) continue;
    visited.add(nodeId);

    const node = _nodeIndex.get(nodeId);
    if (node && depth > 0) {
      results.push({
        ...node,
        hopDistance: depth,
        path: path
      });
    }

    if (depth < maxHops) {
      // Get neighbors based on direction
      let neighbors = [];

      if (direction === 'outgoing' || direction === 'both') {
        const outEdges = _edgeIndex.bySource.get(nodeId) || [];
        neighbors = neighbors.concat(
          outEdges
            .filter(e => edgeTypes.includes(e.type))
            .map(e => ({ nodeId: e.target, edge: e }))
        );
      }

      if (direction === 'incoming' || direction === 'both') {
        const inEdges = _edgeIndex.byTarget.get(nodeId) || [];
        neighbors = neighbors.concat(
          inEdges
            .filter(e => edgeTypes.includes(e.type))
            .map(e => ({ nodeId: e.source, edge: e }))
        );
      }

      for (const { nodeId: neighborId } of neighbors) {
        if (!visited.has(neighborId)) {
          queue.push({
            nodeId: neighborId,
            depth: depth + 1,
            path: [...path, neighborId]
          });
        }
      }
    }
  }

  return results;
}

/**
 * Find relationships between two nodes
 * @param {string} nodeA - First node ID
 * @param {string} nodeB - Second node ID
 * @param {number} maxHops - Maximum path length (default: 3)
 * @returns {Array} Array of paths connecting the nodes
 */
function findRelationship(nodeA, nodeB, maxHops = 3) {
  getGraph();

  const visited = new Set();
  const paths = [];
  const queue = [{ nodeId: nodeA, path: [nodeA], edges: [] }];

  while (queue.length > 0) {
    const { nodeId, path, edges } = queue.shift();

    if (path.length > maxHops + 1) continue;
    if (visited.has(nodeId + ':' + path.length)) continue;
    visited.add(nodeId + ':' + path.length);

    if (nodeId === nodeB && path.length > 1) {
      paths.push({
        nodes: path.map(id => _nodeIndex.get(id)),
        edges: edges,
        length: path.length - 1
      });
      continue;
    }

    // Explore outgoing edges
    const outEdges = _edgeIndex.bySource.get(nodeId) || [];
    for (const edge of outEdges) {
      if (!path.includes(edge.target)) {
        queue.push({
          nodeId: edge.target,
          path: [...path, edge.target],
          edges: [...edges, edge]
        });
      }
    }

    // Explore incoming edges
    const inEdges = _edgeIndex.byTarget.get(nodeId) || [];
    for (const edge of inEdges) {
      if (!path.includes(edge.source)) {
        queue.push({
          nodeId: edge.source,
          path: [...path, edge.source],
          edges: [...edges, { ...edge, reversed: true }]
        });
      }
    }
  }

  return paths.sort((a, b) => a.length - b.length);
}

/**
 * Get related súmulas/temas for a given súmula or tema
 * @param {string} nodeId - Node ID (e.g., 'STJ_297' or 'TEMA_1368')
 * @returns {Array} Array of related nodes
 */
function getRelatedLegalSources(nodeId) {
  getGraph();

  const edges = _edgeIndex.bySource.get(nodeId) || [];
  const reverseEdges = _edgeIndex.byTarget.get(nodeId) || [];

  const related = new Set();
  const results = [];

  // Related through RELATED_TO edges
  for (const edge of [...edges, ...reverseEdges]) {
    if (edge.type === 'RELATED_TO') {
      const otherId = edge.source === nodeId ? edge.target : edge.source;
      if (!related.has(otherId)) {
        related.add(otherId);
        const node = _nodeIndex.get(otherId);
        if (node) {
          results.push({
            ...node,
            relationshipType: 'RELATED_TO',
            description: edge.properties?.descricao
          });
        }
      }
    }
  }

  // Súmulas/Temas that govern the same domains
  const currentNode = _nodeIndex.get(nodeId);
  if (currentNode && currentNode.domains) {
    for (const domain of currentNode.domains) {
      const domainSumulas = getSumulasForDomain(domain);
      for (const sumula of domainSumulas) {
        if (sumula.id !== nodeId && !related.has(sumula.id)) {
          related.add(sumula.id);
          results.push({
            ...sumula,
            relationshipType: 'SAME_DOMAIN',
            sharedDomain: domain
          });
        }
      }
    }
  }

  return results;
}

/**
 * Get súmulas/temas that modify or supersede a given súmula
 * @param {string} sumulaId - Súmula ID (e.g., 'STJ_54')
 * @returns {Array} Array of modifying nodes
 */
function getModifiers(sumulaId) {
  getGraph();

  const inEdges = _edgeIndex.byTarget.get(sumulaId) || [];
  return inEdges
    .filter(e => e.type === 'MODIFIES')
    .map(e => ({
      ...(_nodeIndex.get(e.source)),
      modificationType: e.properties?.tipo,
      description: e.properties?.descricao
    }));
}

/**
 * Get legal basis (artigos) cited by a súmula or tema
 * @param {string} nodeId - Node ID
 * @returns {Array} Array of Artigo nodes
 */
function getLegalBasis(nodeId) {
  getGraph();

  const edges = _edgeIndex.bySource.get(nodeId) || [];
  return edges
    .filter(e => e.type === 'CITES' && e.properties?.tipo === 'BASE_LEGAL')
    .map(e => _nodeIndex.get(e.target))
    .filter(Boolean);
}

/**
 * Search nodes by keyword
 * @param {string} keyword - Keyword to search
 * @param {Array<string>} nodeTypes - Node types to search (default: all)
 * @returns {Array} Array of matching nodes with relevance score
 */
function searchByKeyword(keyword, nodeTypes = null) {
  const graph = getGraph();
  const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const results = [];
  for (const node of graph.nodes) {
    if (nodeTypes && !nodeTypes.includes(node.type)) continue;

    let score = 0;

    // Check keywords field
    if (node.keywords) {
      for (const kw of node.keywords) {
        const normalizedKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalizedKw.includes(normalizedKeyword)) {
          score += normalizedKw === normalizedKeyword ? 10 : 5;
        }
      }
    }

    // Check texto/tese field
    const text = (node.texto || node.tese || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (text.includes(normalizedKeyword)) {
      score += 3;
    }

    // Check nome/descricao field
    const name = (node.nome || node.descricao || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (name.includes(normalizedKeyword)) {
      score += 4;
    }

    if (score > 0) {
      results.push({ ...node, relevanceScore: score });
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Get the domain (Dominio node) for a given domain name
 * @param {string} domainName - Domain name (e.g., 'bancario')
 * @returns {Object|null} The Dominio node
 */
function getDomain(domainName) {
  return getNode(`DOMINIO_${domainName}`);
}

/**
 * Get all domain names
 * @returns {Array<string>} Array of domain names
 */
function getAllDomains() {
  const domains = getNodesByType('Dominio');
  return domains.map(d => d.id.replace('DOMINIO_', ''));
}

/**
 * Get graph statistics
 * @returns {Object} Graph statistics
 */
function getStats() {
  const graph = getGraph();
  return graph.metadata.stats;
}

/**
 * Build context for a legal query based on domain and keywords
 * @param {string} domain - Legal domain
 * @param {Array<string>} keywords - Query keywords
 * @returns {Object} Context object with mandatory items and related sources
 */
function buildQueryContext(domain, keywords = []) {
  const context = {
    domain: getDomain(domain),
    mandatorySumulas: getMandatorySumulasForDomain(domain),
    applicableTemas: getTemasForDomain(domain),
    relatedByKeyword: [],
    conceptsApplied: []
  };

  // Search for relevant items by keywords
  for (const keyword of keywords) {
    const matches = searchByKeyword(keyword, ['Sumula', 'Tema', 'Conceito']);
    context.relatedByKeyword.push(...matches.slice(0, 3));
  }

  // Deduplicate
  const seen = new Set(context.mandatorySumulas.map(s => s.id));
  context.relatedByKeyword = context.relatedByKeyword.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  // Get applicable concepts
  const allItems = [...context.mandatorySumulas, ...context.applicableTemas];
  for (const item of allItems) {
    const edges = _edgeIndex.bySource.get(item.id) || [];
    for (const edge of edges) {
      if (edge.type === 'APPLIES_TO') {
        const concept = _nodeIndex.get(edge.target);
        if (concept && concept.type === 'Conceito' && !context.conceptsApplied.find(c => c.id === concept.id)) {
          context.conceptsApplied.push({
            ...concept,
            appliedBy: item.id,
            context: edge.properties?.contexto
          });
        }
      }
    }
  }

  return context;
}

module.exports = {
  // Core functions
  getGraph,
  getNode,
  getNodesByType,
  getStats,

  // Domain-specific
  getDomain,
  getAllDomains,
  getSumulasForDomain,
  getMandatorySumulasForDomain,
  getTemasForDomain,
  getTemasWithCenarios,

  // Graph traversal
  multiHopQuery,
  findRelationship,
  getRelatedLegalSources,
  getModifiers,
  getLegalBasis,

  // Search
  searchByKeyword,

  // Context building
  buildQueryContext
};
