/**
 * Hybrid Search Module
 * Combines Graph RAG, Vector Search (Qdrant), and BM25 Keyword Search
 * using Reciprocal Rank Fusion (RRF) for optimal retrieval accuracy
 *
 * @module lib/hybrid_search
 * @version 1.0.0
 */

const graph = require('./graph');
const logger = require('./logger');

// Configuration
const config = {
  qdrant: {
    host: process.env.QDRANT_HOST || 'localhost',
    port: parseInt(process.env.QDRANT_PORT || '6333', 10),
    collection: process.env.QDRANT_COLLECTION || 'stj_precedentes'
  },
  rrf: {
    k: 60 // RRF constant (higher = less emphasis on top ranks)
  },
  defaults: {
    topK: 7,
    timeout: 5000
  }
};

/**
 * Reciprocal Rank Fusion implementation
 * Combines multiple ranked lists into a single fused ranking
 *
 * @param {Array<Array>} sources - Array of ranked result lists
 * @param {number} k - RRF constant (default: 60)
 * @returns {Array} Fused and sorted results
 */
function reciprocalRankFusion(sources, k = config.rrf.k) {
  const scores = new Map();

  for (const source of sources) {
    if (!Array.isArray(source)) continue;

    for (let rank = 0; rank < source.length; rank++) {
      const item = source[rank];
      if (!item) continue;

      // Get unique identifier
      const id = item.id || item.content_hash || item.numero?.toString() || JSON.stringify(item);

      if (!scores.has(id)) {
        scores.set(id, {
          item: item,
          score: 0,
          sources: []
        });
      }

      const entry = scores.get(id);
      entry.score += 1 / (k + rank + 1);
      entry.sources.push({
        sourceIndex: sources.indexOf(source),
        rank: rank + 1
      });
    }
  }

  // Sort by fused score (descending)
  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map(entry => ({
      ...entry.item,
      _rrf: {
        score: entry.score,
        sources: entry.sources
      }
    }));
}

/**
 * Graph-based context retrieval (instant, $0)
 *
 * @param {string} domain - Legal domain
 * @param {Object} options - Options
 * @returns {Array} Graph-based results
 */
function graphLookup(domain, options = {}) {
  const startTime = Date.now();

  try {
    // Get mandatory súmulas and temas for domain
    const sumulasAndTemas = graph.getSumulasForDomain(domain);

    // Build context from graph
    const results = sumulasAndTemas.map(item => ({
      id: item.id,
      type: item.type,
      numero: item.numero,
      texto: item.texto || item.tese,
      tribunal: item.tribunal,
      domains: item.domains,
      keywords: item.keywords,
      obrigatoriedade: item.obrigatoriedade,
      prioridade: item.prioridade,
      cenarios: item.cenarios,
      source: 'graph'
    }));

    const elapsed = Date.now() - startTime;
    logger.debug(`Graph lookup completed in ${elapsed}ms, found ${results.length} items`);

    return results;
  } catch (error) {
    logger.error('Graph lookup failed', { error: error.message });
    return [];
  }
}

/**
 * Qdrant vector similarity search
 *
 * @param {Array<number>} embedding - Query embedding vector
 * @param {string} domain - Optional domain filter
 * @param {number} topK - Number of results
 * @returns {Promise<Array>} Vector search results
 */
async function qdrantVectorSearch(embedding, domain = null, topK = config.defaults.topK) {
  const startTime = Date.now();

  try {
    // Dynamic import for optional dependency
    let QdrantClient;
    try {
      const qdrant = await import('@qdrant/js-client-rest');
      QdrantClient = qdrant.QdrantClient;
    } catch (e) {
      logger.warn('Qdrant client not available, skipping vector search');
      return [];
    }

    const client = new QdrantClient({
      url: `http://${config.qdrant.host}:${config.qdrant.port}`
    });

    // Build filter if domain specified
    const filter = domain ? {
      must: [{
        key: 'domains',
        match: { any: [domain] }
      }]
    } : undefined;

    const results = await client.search(config.qdrant.collection, {
      vector: embedding,
      limit: topK,
      filter: filter,
      with_payload: true
    });

    const elapsed = Date.now() - startTime;
    logger.debug(`Qdrant vector search completed in ${elapsed}ms, found ${results.length} results`);

    return results.map((r, idx) => ({
      id: r.payload?.id || r.id,
      type: r.payload?.tipo || 'documento',
      numero: r.payload?.numero,
      texto: r.payload?.text,
      tribunal: r.payload?.tribunal,
      domains: r.payload?.domains || [],
      keywords: r.payload?.keywords || [],
      content_hash: r.payload?.content_hash,
      score: r.score,
      source: 'vector',
      rank: idx + 1
    }));
  } catch (error) {
    logger.error('Qdrant vector search failed', { error: error.message });
    return [];
  }
}

/**
 * BM25 keyword search on Qdrant
 *
 * @param {Array<string>} legalTerms - Legal terms to search
 * @param {string} domain - Optional domain filter
 * @param {number} topK - Number of results
 * @returns {Promise<Array>} Keyword search results
 */
async function qdrantBM25Search(legalTerms, domain = null, topK = config.defaults.topK) {
  const startTime = Date.now();

  try {
    // For now, use graph-based keyword search as fallback
    // In production, this would use Qdrant's full-text search or a dedicated BM25 index
    const results = [];

    for (const term of legalTerms) {
      const matches = graph.searchByKeyword(term, ['Sumula', 'Tema']);
      for (const match of matches.slice(0, Math.ceil(topK / legalTerms.length))) {
        // Filter by domain if specified
        if (domain && match.domains && !match.domains.includes(domain)) continue;

        results.push({
          id: match.id,
          type: match.type,
          numero: match.numero,
          texto: match.texto || match.tese,
          tribunal: match.tribunal,
          domains: match.domains,
          keywords: match.keywords,
          relevanceScore: match.relevanceScore,
          matchedTerm: term,
          source: 'bm25'
        });
      }
    }

    // Deduplicate and sort by relevance
    const seen = new Set();
    const unique = results.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    const elapsed = Date.now() - startTime;
    logger.debug(`BM25 search completed in ${elapsed}ms, found ${unique.length} results`);

    return unique.slice(0, topK);
  } catch (error) {
    logger.error('BM25 search failed', { error: error.message });
    return [];
  }
}

/**
 * Check if Tema 1368 scenarios apply and return relevant rules
 *
 * @param {string} tipoAcao - Type of legal action
 * @param {string} naturezaDano - Nature of damage (contratual/extracontratual)
 * @returns {Object|null} Applicable scenario or null
 */
function checkTema1368Scenario(tipoAcao, naturezaDano) {
  const tema1368 = graph.getTemasWithCenarios(1368);
  if (!tema1368 || !tema1368.cenarios) return null;

  // Map common action types to scenario types
  const scenarioMap = {
    'dano_moral': naturezaDano === 'extracontratual' ? 'Dano moral extracontratual' : 'Dano moral contratual',
    'dano_material': naturezaDano === 'extracontratual' ? 'Dano material extracontratual' : 'Dano material contratual',
    'indenizacao': naturezaDano === 'extracontratual' ? 'Dano material extracontratual' : 'Dano material contratual'
  };

  const targetScenario = scenarioMap[tipoAcao] || tipoAcao;

  const scenario = tema1368.cenarios.find(c =>
    c.tipo.toLowerCase().includes(targetScenario.toLowerCase())
  );

  if (scenario) {
    return {
      tema: tema1368,
      scenario: scenario,
      vedacoes: tema1368.vedacoes || []
    };
  }

  return null;
}

/**
 * Main hybrid search function
 * Combines Graph + Vector + BM25 using RRF
 *
 * @param {Object} query - Query object
 * @param {string} query.text - Query text
 * @param {Array<number>} query.embedding - Query embedding (optional)
 * @param {string} query.domain - Legal domain
 * @param {Array<string>} query.legalTerms - Extracted legal terms
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Hybrid search results
 */
async function hybridSearch(query, options = {}) {
  const startTime = Date.now();
  const { topK = config.defaults.topK, includeScenarios = true } = options;

  const searchResults = {
    items: [],
    metadata: {
      query: query.text,
      domain: query.domain,
      timing: {},
      sources: {
        graph: 0,
        vector: 0,
        bm25: 0
      }
    },
    scenarios: null
  };

  try {
    // 1. Graph lookup (instant, $0)
    const graphStart = Date.now();
    const graphResults = graphLookup(query.domain, options);
    searchResults.metadata.timing.graph = Date.now() - graphStart;
    searchResults.metadata.sources.graph = graphResults.length;

    // 2. Vector search (if embedding provided)
    let vectorResults = [];
    if (query.embedding && Array.isArray(query.embedding)) {
      const vectorStart = Date.now();
      vectorResults = await qdrantVectorSearch(query.embedding, query.domain, topK);
      searchResults.metadata.timing.vector = Date.now() - vectorStart;
      searchResults.metadata.sources.vector = vectorResults.length;
    }

    // 3. BM25 keyword search
    const bm25Start = Date.now();
    const bm25Results = await qdrantBM25Search(query.legalTerms || [], query.domain, topK);
    searchResults.metadata.timing.bm25 = Date.now() - bm25Start;
    searchResults.metadata.sources.bm25 = bm25Results.length;

    // 4. RRF fusion + deduplication
    const fused = reciprocalRankFusion([graphResults, vectorResults, bm25Results]);
    searchResults.items = fused.slice(0, topK);

    // 5. Check for Tema 1368 scenarios if applicable
    if (includeScenarios && ['bancario', 'obrigacional', 'cobranca', 'responsabilidade_civil'].includes(query.domain)) {
      const tipoAcao = query.legalTerms?.find(t =>
        ['dano_moral', 'dano_material', 'indenizacao'].includes(t.toLowerCase())
      );
      if (tipoAcao) {
        searchResults.scenarios = checkTema1368Scenario(tipoAcao, query.naturezaDano || 'contratual');
      }
    }

    // Calculate total time
    searchResults.metadata.timing.total = Date.now() - startTime;

    logger.info(`Hybrid search completed in ${searchResults.metadata.timing.total}ms`, {
      domain: query.domain,
      results: searchResults.items.length,
      sources: searchResults.metadata.sources
    });

    return searchResults;
  } catch (error) {
    logger.error('Hybrid search failed', { error: error.message });
    searchResults.error = error.message;
    searchResults.metadata.timing.total = Date.now() - startTime;
    return searchResults;
  }
}

/**
 * Build augmented context for LLM generation
 *
 * @param {Object} searchResults - Results from hybridSearch
 * @param {Object} options - Context building options
 * @returns {Object} Augmented context
 */
function buildAugmentedContext(searchResults, options = {}) {
  const { maxTokens = 4000, includeRelated = true } = options;

  const context = {
    mandatoryCitations: [],
    applicableTemas: [],
    relatedSources: [],
    scenarioRules: null,
    estimatedTokens: 0
  };

  // Separate mandatory from optional
  for (const item of searchResults.items) {
    if (item.obrigatoriedade === 'SEMPRE') {
      context.mandatoryCitations.push({
        id: item.id,
        type: item.type,
        numero: item.numero,
        texto: item.texto,
        tribunal: item.tribunal
      });
    } else if (item.type === 'Tema' && item.cenarios) {
      context.applicableTemas.push(item);
    } else if (includeRelated) {
      context.relatedSources.push(item);
    }
  }

  // Add scenario rules if present
  if (searchResults.scenarios) {
    context.scenarioRules = {
      tema: searchResults.scenarios.tema.numero,
      scenario: searchResults.scenarios.scenario,
      vedacoes: searchResults.scenarios.vedacoes
    };
  }

  // Estimate tokens (rough: 1 token ≈ 4 chars in Portuguese)
  const textContent = JSON.stringify(context);
  context.estimatedTokens = Math.ceil(textContent.length / 4);

  // Trim if exceeding token limit
  if (context.estimatedTokens > maxTokens) {
    // Keep mandatory, trim related
    const mandatoryTokens = JSON.stringify(context.mandatoryCitations).length / 4;
    const remainingTokens = maxTokens - mandatoryTokens - 200; // buffer

    if (remainingTokens > 0) {
      let currentTokens = 0;
      context.relatedSources = context.relatedSources.filter(item => {
        const itemTokens = JSON.stringify(item).length / 4;
        if (currentTokens + itemTokens < remainingTokens) {
          currentTokens += itemTokens;
          return true;
        }
        return false;
      });
    } else {
      context.relatedSources = [];
    }

    context.estimatedTokens = Math.ceil(JSON.stringify(context).length / 4);
  }

  return context;
}

/**
 * Format context for LLM prompt injection
 *
 * @param {Object} context - Augmented context
 * @returns {string} Formatted context string
 */
function formatContextForPrompt(context) {
  let prompt = '';

  // Mandatory citations
  if (context.mandatoryCitations.length > 0) {
    prompt += '## CITACOES OBRIGATORIAS\n\n';
    for (const item of context.mandatoryCitations) {
      prompt += `### ${item.type === 'Sumula' ? 'Sumula' : 'Tema'} ${item.numero}/${item.tribunal}\n`;
      prompt += `${item.texto}\n\n`;
    }
  }

  // Applicable temas with scenarios
  if (context.applicableTemas.length > 0) {
    prompt += '## TEMAS REPETITIVOS APLICAVEIS\n\n';
    for (const tema of context.applicableTemas) {
      prompt += `### Tema ${tema.numero}/${tema.tribunal}\n`;
      prompt += `Tese: ${tema.texto || tema.tese}\n`;
      if (tema.cenarios && tema.cenarios.length > 0) {
        prompt += '\nCenarios:\n';
        for (const cenario of tema.cenarios) {
          prompt += `- ${cenario.tipo}: ${cenario.correcao}\n`;
        }
      }
      prompt += '\n';
    }
  }

  // Scenario rules
  if (context.scenarioRules) {
    prompt += '## REGRA ESPECIFICA DO TEMA 1368 (SELIC)\n\n';
    prompt += `Cenario aplicavel: ${context.scenarioRules.scenario.tipo}\n`;
    prompt += `Correcao: ${context.scenarioRules.scenario.correcao}\n`;
    if (context.scenarioRules.scenario.juros) {
      prompt += `Juros: ${context.scenarioRules.scenario.juros}\n`;
    }
    if (context.scenarioRules.vedacoes.length > 0) {
      prompt += '\nVedacoes:\n';
      for (const vedacao of context.scenarioRules.vedacoes) {
        prompt += `- ${vedacao}\n`;
      }
    }
    prompt += '\n';
  }

  // Related sources (abbreviated)
  if (context.relatedSources.length > 0) {
    prompt += '## FONTES RELACIONADAS\n\n';
    for (const item of context.relatedSources.slice(0, 5)) {
      prompt += `- ${item.type} ${item.numero || item.id}: ${(item.texto || '').substring(0, 100)}...\n`;
    }
    prompt += '\n';
  }

  return prompt;
}

module.exports = {
  // Core functions
  reciprocalRankFusion,
  hybridSearch,

  // Component searches
  graphLookup,
  qdrantVectorSearch,
  qdrantBM25Search,

  // Context building
  buildAugmentedContext,
  formatContextForPrompt,

  // Scenario checking
  checkTema1368Scenario,

  // Configuration
  config
};
