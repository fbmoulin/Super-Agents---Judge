/**
 * Hallucination Detector - Sumula/Tema Validation
 * Cross-references LLM-generated citations (sumulas, temas repetitivos)
 * against the knowledge base to detect fabricated references.
 *
 * @module lib/hallucination-detector
 * @version 1.0.0
 */

const path = require('path');
const logger = require('./logger');

// Load knowledge base at module init
const sumulasDB = require(path.join(__dirname, '..', 'knowledge_base', 'sumulas.json'));
const temasDB = require(path.join(__dirname, '..', 'knowledge_base', 'temas_repetitivos.json'));

/**
 * Regex patterns for extracting legal citations from text.
 *
 * Handles:
 *  - "Sumula 297 do STJ" / "Sumula 297 do STF"
 *  - "Sumula 297/STJ"
 *  - "Sumula n. 297 do STJ"
 *  - "Sumula n\u00ba 297 do STJ"
 *  - Case-insensitive, with or without accents
 */
const SUMULA_PATTERNS = [
  // "Sumula [n./n\u00ba] 297 do STJ" or "Sumula [n./n\u00ba] 297 do STF"
  /[Ss][uú]mula\s+(?:n[.\u00ba]\s*)?(\d+)\s+do\s+(STJ|STF)/gi,
  // "Sumula 297/STJ" or "Sumula 297/STF"
  /[Ss][uú]mula\s+(?:n[.\u00ba]\s*)?(\d+)\/(STJ|STF)/gi
];

const TEMA_PATTERNS = [
  // "Tema Repetitivo 952", "Tema 952", "Tema Repetitivo n. 952"
  /[Tt]ema\s+(?:[Rr]epetitivo\s+)?(?:n[.\u00ba]\s*)?(\d+)/gi
];

const ARTIGO_PATTERNS = [
  // "art. 37" or "artigo 37", optionally with ordinal suffix like "5o"
  /(?:art\.|artigo)\s*(\d+)[o\u00ba]?/gi
];

/**
 * Extract legal citations (sumulas, temas, artigos) from a text.
 * @param {string} text - The text to scan for citations
 * @returns {{ sumulas: Array, temas: Array, artigos: Array }}
 */
function extractCitations(text) {
  if (!text || typeof text !== 'string') {
    return { sumulas: [], temas: [], artigos: [] };
  }

  const sumulas = [];
  const sumulasSeen = new Set();

  for (const pattern of SUMULA_PATTERNS) {
    // Reset lastIndex for global regex
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const numero = match[1];
      const tribunal = match[2].toUpperCase();
      const key = `${numero}-${tribunal}`;
      if (!sumulasSeen.has(key)) {
        sumulasSeen.add(key);
        sumulas.push({ numero, tribunal });
      }
    }
  }

  const temas = [];
  const temasSeen = new Set();

  for (const pattern of TEMA_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const numero = match[1];
      if (!temasSeen.has(numero)) {
        temasSeen.add(numero);
        temas.push({ numero });
      }
    }
  }

  const artigos = [];
  const artigosSeen = new Set();

  for (const pattern of ARTIGO_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const numero = match[1];
      if (!artigosSeen.has(numero)) {
        artigosSeen.add(numero);
        artigos.push({ numero });
      }
    }
  }

  return { sumulas, temas, artigos };
}

/**
 * Validate a sumula citation against the knowledge base.
 * @param {string} numero - Sumula number
 * @param {string} tribunal - Tribunal (STJ or STF)
 * @returns {{ valid: boolean, texto?: string, issue?: string, severity?: string, tribunalCorreto?: string }}
 */
function validateSumulaCitation(numero, tribunal) {
  const tribunalUpper = tribunal.toUpperCase();

  // Check if the sumula exists in the specified tribunal
  if (sumulasDB.sumulas[tribunalUpper] && sumulasDB.sumulas[tribunalUpper][numero]) {
    return {
      valid: true,
      texto: sumulasDB.sumulas[tribunalUpper][numero].texto
    };
  }

  // Check if the sumula exists in the OTHER tribunal (wrong tribunal attribution)
  const otherTribunal = tribunalUpper === 'STJ' ? 'STF' : 'STJ';
  if (sumulasDB.sumulas[otherTribunal] && sumulasDB.sumulas[otherTribunal][numero]) {
    return {
      valid: false,
      issue: 'TRIBUNAL_INCORRETO',
      severity: 'MEDIUM',
      numero,
      tribunalCitado: tribunalUpper,
      tribunalCorreto: otherTribunal,
      texto: sumulasDB.sumulas[otherTribunal][numero].texto
    };
  }

  // Sumula not found in any tribunal
  return {
    valid: false,
    issue: 'SUMULA_NAO_ENCONTRADA',
    severity: 'HIGH',
    numero,
    tribunalCitado: tribunalUpper
  };
}

/**
 * Validate a tema repetitivo citation against the knowledge base.
 * @param {string} numero - Tema number
 * @returns {{ valid: boolean, tese?: string, tribunal?: string, issue?: string, severity?: string }}
 */
function validateTemaCitation(numero) {
  if (temasDB.temas[numero]) {
    return {
      valid: true,
      tese: temasDB.temas[numero].tese,
      tribunal: temasDB.temas[numero].tribunal,
      situacao: temasDB.temas[numero].situacao
    };
  }

  return {
    valid: false,
    issue: 'TEMA_NAO_ENCONTRADO',
    severity: 'HIGH',
    numero
  };
}

/**
 * Detect hallucinations in a text by extracting and validating all legal citations.
 * @param {string} text - The text to analyze
 * @returns {{ hallucinated: boolean, issues: Array, citationsChecked: number, issuesCount: number }}
 */
function detectHallucinations(text) {
  const citations = extractCitations(text);
  const issues = [];
  let citationsChecked = 0;

  // Validate sumulas
  for (const sumula of citations.sumulas) {
    citationsChecked++;
    const validation = validateSumulaCitation(sumula.numero, sumula.tribunal);
    if (!validation.valid) {
      issues.push({
        type: validation.issue,
        severity: validation.severity,
        numero: sumula.numero,
        tribunal: sumula.tribunal,
        ...(validation.tribunalCorreto && { tribunalCorreto: validation.tribunalCorreto })
      });
    }
  }

  // Validate temas
  for (const tema of citations.temas) {
    citationsChecked++;
    const validation = validateTemaCitation(tema.numero);
    if (!validation.valid) {
      issues.push({
        type: validation.issue,
        severity: validation.severity,
        numero: tema.numero
      });
    }
  }

  // Note: artigos are extracted but not validated against a DB (no DB for artigos yet)
  // They are counted as checked for completeness tracking
  citationsChecked += citations.artigos.length;

  const hallucinated = issues.length > 0;

  if (hallucinated) {
    logger.warn(`Hallucination detected: ${issues.length} issue(s) found in text`, {
      issues: issues.map(i => `${i.type}: ${i.numero}`)
    });
  }

  return {
    hallucinated,
    issues,
    citationsChecked,
    issuesCount: issues.length
  };
}

module.exports = {
  extractCitations,
  validateSumulaCitation,
  validateTemaCitation,
  detectHallucinations
};
