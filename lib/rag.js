/**
 * RAG (Retrieval-Augmented Generation) Query Module
 * Prepares queries and formats results for LLM context injection.
 *
 * @module lib/rag
 * @version 1.0.0
 */

const logger = require('./logger');

// Legal term extraction patterns
const LEGAL_PATTERNS = [
  { regex: /s[úu]mula\s+(\d+)/gi, format: (m) => `súmula ${m[1]}` },
  { regex: /art(?:igo)?\.?\s*(\d+)\s+(?:do\s+)?(\w+)/gi, format: (m) => `art. ${m[1]} ${m[2].toLowerCase()}` },
  { regex: /tema(?:\s+repetitivo)?\s+(\d+)/gi, format: (m) => `tema ${m[1]}` },
  { regex: /lei\s+([\d.]+\/\d+)/gi, format: (m) => `lei ${m[1]}` }
];

/**
 * Extract legal term references from text.
 * @param {string} text - Input text
 * @returns {string[]} Extracted legal terms (normalized, deduplicated)
 */
function extractLegalTerms(text) {
  if (!text) return [];

  const terms = new Set();

  for (const pattern of LEGAL_PATTERNS) {
    let match;
    pattern.regex.lastIndex = 0;
    while ((match = pattern.regex.exec(text)) !== null) {
      terms.add(pattern.format(match));
    }
  }

  return Array.from(terms);
}

/**
 * Build a RAG query object from case input.
 * @param {Object} input - Case input
 * @param {string} input.fatos - Case facts
 * @param {string} input.questoes - Legal questions
 * @param {string} input.pedidos - Requests
 * @param {string} input.domain - Legal domain
 * @returns {Object} Query object for hybrid search
 */
function buildRAGQuery(input) {
  const fullText = [input.fatos, input.questoes, input.pedidos].filter(Boolean).join(' ');
  const legalTerms = extractLegalTerms(fullText);

  return {
    text: fullText,
    domain: input.domain || null,
    legalTerms
  };
}

/**
 * Format precedent results as markdown for prompt injection.
 * @param {Array} precedents - Search result items
 * @param {Object} options
 * @param {number} options.maxTokens - Maximum estimated tokens (default: 2000)
 * @returns {string} Formatted markdown context
 */
function formatPrecedentsForPrompt(precedents, options = {}) {
  if (!precedents || precedents.length === 0) return '';

  const { maxTokens = 2000 } = options;
  const maxChars = maxTokens * 4;
  let output = '## JURISPRUDÊNCIA RELEVANTE (RAG)\n\n';
  let currentLength = output.length;

  for (const item of precedents) {
    const typeLabel = item.type === 'Sumula' ? 'Súmula' : item.type === 'Tema' ? 'Tema' : item.type;
    const entry = `### ${typeLabel} ${item.numero || ''}/${item.tribunal || 'STJ'}\n${item.texto || ''}\n\n`;

    if (currentLength + entry.length > maxChars) break;

    output += entry;
    currentLength += entry.length;
  }

  return output;
}

module.exports = {
  extractLegalTerms,
  buildRAGQuery,
  formatPrecedentsForPrompt,
  LEGAL_PATTERNS
};
