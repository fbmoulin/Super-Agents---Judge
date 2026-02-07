#!/usr/bin/env node
/**
 * Agent Validator - Test Legal Agents via Claude API
 * Lex Intelligentia Judiciário
 *
 * Usage:
 *   node scripts/agent_validator.js [agent_name] [--all] [--verbose]
 *
 * Examples:
 *   node scripts/agent_validator.js bancario
 *   node scripts/agent_validator.js --all
 *   node scripts/agent_validator.js execucao --verbose
 *   node scripts/agent_validator.js --all --real   # Test with real PDF cases
 *
 * Flags:
 *   --all, -a      Test all agents
 *   --real, -r     Use real PDF cases from test_cases/processos_reais/
 *   --verbose, -v  Show full response text
 *
 * Environment:
 *   ANTHROPIC_API_KEY - Required
 */

const fs = require('fs');
const path = require('path');

// Load centralized configuration, HTTP client, and logger
const centralConfig = require('../../config');
const { anthropicRequest, extractText } = require('../../lib/http-client');
const logger = require('../../lib/logger');

// ============================================================================
// CONFIGURATION
// ============================================================================

const repoRoot = path.resolve(__dirname, '..', '..');
const apiConfig = centralConfig.getApiConfig('anthropic');
const CONFIG = {
  model: apiConfig.model || 'claude-sonnet-4-20250514',
  maxTokens: apiConfig.maxTokens || 8192,
  temperature: apiConfig.temperature || 0.3,
  testCasesDir: path.join(repoRoot, 'test_cases'),
  realCasesDir: path.join(repoRoot, 'test_cases', 'processos_reais'),
  resultsDir: path.join(repoRoot, 'test_cases', 'agent_validation_results'),
  apiUrl: 'https://api.anthropic.com/v1/messages'
};

// ============================================================================
// SYSTEM PROMPTS - Loaded from centralized config
// ============================================================================

/**
 * Get system prompt for an agent
 * @param {string} agentKey - Agent key like 'agent_bancario'
 * @returns {string} System prompt
 */
function getSystemPrompt(agentKey) {
  // Convert agent_bancario -> BANCARIO
  const agentName = agentKey.replace('agent_', '').toUpperCase();
  return centralConfig.getPrompt(agentName);
}

// Legacy SYSTEM_PROMPTS object for backward compatibility
const SYSTEM_PROMPTS = new Proxy({}, {
  get(target, prop) {
    return getSystemPrompt(prop);
  },
  has(target, prop) {
    const agentName = prop.replace('agent_', '').toUpperCase();
    return centralConfig.getAgentNames().includes(agentName);
  },
  ownKeys() {
    return centralConfig.getAgentNames().map(name => `agent_${name.toLowerCase()}`);
  },
  getOwnPropertyDescriptor(target, prop) {
    return { enumerable: true, configurable: true };
  }
});


// ============================================================================
// AGENT TO DIRECTORY MAPPING
// ============================================================================

const AGENT_DIRS = {
  agent_bancario: 'bancario',
  agent_consumidor: 'consumidor',
  agent_execucao: 'execucao',
  agent_locacao: 'locacao',
  agent_possessorias: 'possessorias',
  agent_saude_cobertura: 'saude_cobertura',
  agent_saude_contratual: 'saude_contratual',
  agent_reparacao_danos: 'reparacao_danos',
  agent_transito: 'transito',
  agent_usucapiao: 'usucapiao',
  agent_incorporacao: 'incorporacao',
  agent_generico: 'generico',
  // Novos agentes v2.5
  agent_cobranca: 'cobranca',
  agent_divorcio: 'divorcio',
  agent_inventario: 'inventario',
  agent_seguros: 'seguros',
  // Novos agentes v2.5 - Fase 1 (Família)
  agent_alimentos: 'alimentos',
  agent_guarda: 'guarda',
  // Novos agentes v2.5 - Fase 2 (Família/Saúde)
  agent_paternidade: 'paternidade',
  // Novos agentes Fazenda Pública
  agent_execucao_fiscal: 'execucao_fiscal',
  agent_resp_civil_estado: 'resp_civil_estado',
  agent_mandado_seguranca: 'mandado_seguranca',
  agent_saude_medicamentos: 'saude_medicamentos'
};

// ============================================================================
// VALIDATION CRITERIA
// ============================================================================

const VALIDATION_CRITERIA = {
  // Structure checks
  hasRelatorio: {
    name: 'Relatório (I)',
    regex: /I\s*[-–—]\s*RELAT[ÓO]RIO|RELAT[ÓO]RIO|^I\s*[.-]/im,
    weight: 15
  },
  hasFundamentacao: {
    name: 'Fundamentação (II)',
    regex: /II\s*[-–—]\s*FUNDAMENTA[ÇC][ÃA]O|FUNDAMENTA[ÇC][ÃA]O|^II\s*[.-]/im,
    weight: 15
  },
  hasDispositivo: {
    name: 'Dispositivo (III)',
    regex: /III\s*[-–—]\s*DISPOSITIVO|DISPOSITIVO|^III\s*[.-]/im,
    weight: 15
  },

  // Legal content
  hasLegalBasis: {
    name: 'Base Legal',
    regex: /art(?:igo)?\.?\s*\d+|Lei\s*(?:n[ºo°]?\s*)?\d+|CC|CPC|CDC|CF/i,
    weight: 10
  },
  hasSumula: {
    name: 'Súmulas STJ/STF',
    regex: /[Ss][úu]mula\s*(?:n[ºo°]?\s*)?\d+/,
    weight: 10
  },
  hasJurisprudence: {
    name: 'Jurisprudência',
    regex: /STJ|STF|TJES|TJ[A-Z]{2}|REsp|AgRg|precedent/i,
    weight: 5
  },

  // Decision elements
  hasDecision: {
    name: 'Decisão Clara',
    regex: /JULGO\s*(IM)?PROCEDENTE|CONDENO|DECLARO|DETERMINO|DEFIRO|INDEFIRO/i,
    weight: 10
  },
  hasHonorarios: {
    name: 'Honorários',
    regex: /honor[áa]rios|art(?:igo)?\.?\s*85/i,
    weight: 5
  },
  hasCustas: {
    name: 'Custas Processuais',
    regex: /custas|despesas\s*processuais/i,
    weight: 5
  },

  // Quality markers
  hasReviewMarkers: {
    name: 'Marcadores [REVISAR]',
    regex: /\[REVISAR[^\]]*\]/,
    weight: 5,
    optional: true
  },
  hasMonetaryValues: {
    name: 'Valores Monetários',
    regex: /R\$\s*[\d.,]+/,
    weight: 5
  }
};

// ============================================================================
// API CALL FUNCTION
// ============================================================================

/**
 * Call Claude API using centralized HTTP client
 * @param {string} systemPrompt - System prompt
 * @param {string} userMessage - User message
 * @returns {Promise<Object>} API response
 */
async function callClaude(systemPrompt, userMessage) {
  return anthropicRequest({
    systemPrompt,
    userMessage,
    model: CONFIG.model,
    maxTokens: CONFIG.maxTokens,
    temperature: CONFIG.temperature
  });
}

// ============================================================================
// VALIDATION FUNCTION
// ============================================================================

function validateMinuta(minuta, testCase) {
  const results = {
    totalScore: 0,
    maxScore: 0,
    checks: [],
    summary: {}
  };

  // Run each validation check
  for (const [key, criteria] of Object.entries(VALIDATION_CRITERIA)) {
    const passed = criteria.regex.test(minuta);
    const score = passed ? criteria.weight : 0;

    results.checks.push({
      name: criteria.name,
      passed,
      score,
      maxScore: criteria.weight,
      optional: criteria.optional || false
    });

    if (!criteria.optional) {
      results.maxScore += criteria.weight;
    }
    results.totalScore += score;
  }

  // Calculate percentage
  results.percentage = Math.round((results.totalScore / results.maxScore) * 100);

  // Check expected súmulas if provided
  if (testCase.expectativa?.sumulas_esperadas) {
    const expectedSumulas = testCase.expectativa.sumulas_esperadas;
    const foundSumulas = [];
    const missingSumulas = [];

    for (const sumula of expectedSumulas) {
      const regex = new RegExp(`[Ss][úu]mula\\s*(?:n[ºo°]?\\s*)?${sumula}`, 'i');
      if (regex.test(minuta)) {
        foundSumulas.push(sumula);
      } else {
        missingSumulas.push(sumula);
      }
    }

    results.summary.expectedSumulas = {
      found: foundSumulas,
      missing: missingSumulas,
      percentage: Math.round((foundSumulas.length / expectedSumulas.length) * 100)
    };
  }

  // Word count
  results.summary.wordCount = minuta.split(/\s+/).length;

  // Structure analysis
  results.summary.structure = {
    hasRelatorio: VALIDATION_CRITERIA.hasRelatorio.regex.test(minuta),
    hasFundamentacao: VALIDATION_CRITERIA.hasFundamentacao.regex.test(minuta),
    hasDispositivo: VALIDATION_CRITERIA.hasDispositivo.regex.test(minuta)
  };

  return results;
}

// ============================================================================
// BUILD USER MESSAGE
// ============================================================================

function buildUserMessage(testCase) {
  return `## PROCESSO

**Classe:** ${testCase.classe || 'Não informada'}
**Assunto:** ${testCase.assunto || 'Não informado'}
**Valor da Causa:** ${testCase.valor_causa ? 'R$ ' + Number(testCase.valor_causa).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : 'Não informado'}

---

## ANÁLISE FIRAC

### FATOS
${testCase.fatos || '[Não fornecido]'}

### QUESTÕES JURÍDICAS
${testCase.questoes || '[Não fornecido]'}

### PEDIDOS
${testCase.pedidos || '[Não fornecido]'}

---

## TAREFA

Gere a **minuta completa de sentença/decisão** para este caso.

**Siga rigorosamente a estrutura:**
- I - RELATÓRIO (síntese objetiva)
- II - FUNDAMENTAÇÃO (preliminares + mérito + jurisprudência)
- III - DISPOSITIVO (julgamento + sucumbência)

**Use marcadores [REVISAR: motivo] para qualquer ponto de incerteza.**`;
}

// ============================================================================
// TEST SINGLE AGENT
// ============================================================================

async function testAgent(agentName, verbose = false, useRealCases = false) {
  logger.section(`Testing Agent: ${agentName}${useRealCases ? ' (PROCESSOS REAIS)' : ''}`);

  const systemPrompt = SYSTEM_PROMPTS[agentName];
  if (!systemPrompt) {
    logger.error('Unknown agent', { agent: agentName });
    return null;
  }

  const dirName = AGENT_DIRS[agentName];
  const testDir = useRealCases
    ? path.join(CONFIG.realCasesDir, dirName)
    : path.join(CONFIG.testCasesDir, dirName);

  if (!fs.existsSync(testDir)) {
    if (useRealCases) {
      logger.warn('No real cases directory, skipping', { agent: agentName });
      return [];
    }
    logger.error('Test directory not found', { path: testDir });
    return null;
  }

  const testFiles = fs.readdirSync(testDir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(testDir, f));

  if (testFiles.length === 0) {
    if (useRealCases) {
      logger.warn('No real cases found, skipping', { agent: agentName });
      return [];
    }
    logger.error('No test cases found', { path: testDir });
    return null;
  }

  logger.info('Found test cases', { count: testFiles.length, type: useRealCases ? 'real' : 'synthetic' });

  const results = [];

  for (const testFile of testFiles) {
    const testCase = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    logger.info('Running test case', { id: testCase.caso_id, description: testCase.descricao });

    const userMessage = buildUserMessage(testCase);

    try {
      const startTime = Date.now();
      logger.debug('Calling Claude API');

      const response = await callClaude(systemPrompt, userMessage);
      const endTime = Date.now();

      const minuta = response.content[0]?.text || '';
      const validation = validateMinuta(minuta, testCase);

      const result = {
        testCase: testCase.caso_id,
        descricao: testCase.descricao,
        agente: agentName,
        success: true,
        executionTime: endTime - startTime,
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
        validation,
        minuta: verbose ? minuta : minuta.substring(0, 500) + '...'
      };

      results.push(result);

      // Log validation result
      const passed = validation.percentage >= 75;
      logger.testResult(
        `${testCase.caso_id}: ${validation.percentage}%`,
        passed,
        `${validation.totalScore}/${validation.maxScore} points`
      );

      logger.info('Test metrics', {
        words: validation.summary.wordCount,
        timeMs: result.executionTime,
        tokensIn: result.inputTokens,
        tokensOut: result.outputTokens
      });

      if (validation.summary.expectedSumulas) {
        const s = validation.summary.expectedSumulas;
        logger.info('Súmulas check', {
          found: s.found.length,
          total: s.found.length + s.missing.length,
          percentage: s.percentage,
          missing: s.missing.length > 0 ? s.missing.join(', ') : undefined
        });
      }

      // Log structure
      const struct = validation.summary.structure;
      logger.debug('Structure check', {
        relatorio: struct.hasRelatorio,
        fundamentacao: struct.hasFundamentacao,
        dispositivo: struct.hasDispositivo
      });

    } catch (error) {
      logger.error('Test failed', { testCase: testCase.caso_id, error: error.message });
      results.push({
        testCase: testCase.caso_id,
        descricao: testCase.descricao,
        agente: agentName,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const testAll = args.includes('--all') || args.includes('-a');
  const useRealCases = args.includes('--real') || args.includes('-r');

  logger.section('Lex Intelligentia - Agent Validator');

  if (useRealCases) {
    logger.info('Mode: PROCESSOS REAIS');
  }

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    logger.error('ANTHROPIC_API_KEY environment variable not set');
    logger.info('Usage: export ANTHROPIC_API_KEY=sk-ant-... && node scripts/agent_validator.js bancario');
    process.exit(1);
  }

  // Ensure results directory exists
  if (!fs.existsSync(CONFIG.resultsDir)) {
    fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
  }

  let agentsToTest = [];

  if (testAll) {
    agentsToTest = Object.keys(SYSTEM_PROMPTS);
  } else {
    const agentArg = args.find(a => !a.startsWith('-'));
    if (agentArg) {
      const normalizedAgent = agentArg.startsWith('agent_') ? agentArg : `agent_${agentArg}`;
      if (SYSTEM_PROMPTS[normalizedAgent]) {
        agentsToTest = [normalizedAgent];
      } else {
        logger.error('Unknown agent', { agent: agentArg });
        logger.info('Available agents', { agents: Object.keys(AGENT_DIRS).map(a => a.replace('agent_', '')).join(', ') });
        process.exit(1);
      }
    } else {
      logger.info('Usage: node scripts/agent_validator.js <agent_name> | --all [--real] [--verbose]');
      logger.info('Available agents', { agents: Object.keys(AGENT_DIRS).map(a => a.replace('agent_', '')).join(', ') });
      process.exit(0);
    }
  }

  logger.info('Testing agents', { count: agentsToTest.length, agents: agentsToTest.map(a => a.replace('agent_', '')).join(', ') });

  const allResults = [];
  const summary = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    avgScore: 0,
    byAgent: {}
  };

  for (const agent of agentsToTest) {
    const results = await testAgent(agent, verbose, useRealCases);
    if (results && results.length > 0) {
      allResults.push(...results);

      const agentSummary = {
        tests: results.length,
        passed: results.filter(r => r.success && r.validation?.percentage >= 75).length,
        avgScore: Math.round(results.filter(r => r.success).reduce((sum, r) => sum + (r.validation?.percentage || 0), 0) / results.filter(r => r.success).length) || 0
      };

      summary.byAgent[agent] = agentSummary;
      summary.totalTests += agentSummary.tests;
      summary.passed += agentSummary.passed;
    }
  }

  summary.failed = summary.totalTests - summary.passed;
  summary.avgScore = Math.round(allResults.filter(r => r.success).reduce((sum, r) => sum + (r.validation?.percentage || 0), 0) / allResults.filter(r => r.success).length) || 0;

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const resultsFile = path.join(CONFIG.resultsDir, `validation_${timestamp}.json`);

  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary,
    results: allResults
  }, null, 2));

  // Print final summary
  logger.section('FINAL SUMMARY');
  logger.info('Summary', {
    totalTests: summary.totalTests,
    passed: summary.passed,
    failed: summary.failed,
    avgScore: `${summary.avgScore}%`
  });

  for (const [agent, stats] of Object.entries(summary.byAgent)) {
    const passed = stats.avgScore >= 75;
    logger.testResult(
      `${agent.replace('agent_', '')}`,
      passed,
      `${stats.avgScore}% (${stats.passed}/${stats.tests} passed)`
    );
  }

  logger.success('Results saved', { file: resultsFile });
}

main().catch(err => logger.error('Fatal error', { error: err.message }));
