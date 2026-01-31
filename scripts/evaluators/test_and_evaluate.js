#!/usr/bin/env node
/**
 * Test and Evaluate - Combined runner for agent testing with LLM evaluation
 *
 * Usage:
 *   node scripts/test_and_evaluate.js bancario
 *   node scripts/test_and_evaluate.js --all
 *   node scripts/test_and_evaluate.js bancario --focused
 */

const fs = require('fs');
const path = require('path');
const { evaluateMinuta } = require('./llm_evaluator');

// Load centralized configuration and HTTP client
const centralConfig = require('../../config');
const { anthropicRequest, extractText } = require('../../lib/http-client');

// ============================================================================
// CONFIGURATION
// ============================================================================

const apiConfig = centralConfig.getApiConfig('anthropic');
const CONFIG = {
  model: apiConfig.model || 'claude-sonnet-4-20250514',
  maxTokens: apiConfig.maxTokens || 8192,
  temperature: apiConfig.temperature || 0.3,
  focusedDir: path.join(__dirname, '..', 'test_cases', 'focused'),
  resultsDir: path.join(__dirname, '..', 'test_results'),
  threshold: centralConfig.settings?.validation?.targetScore || 90
};

// ============================================================================
// SYSTEM PROMPTS - Loaded from centralized config (minimal versions)
// ============================================================================

/**
 * Get minimal system prompt for an agent
 * @param {string} agentName - Agent name in uppercase (e.g., 'BANCARIO')
 * @returns {string} Minimal system prompt
 */
function getSystemPrompt(agentName) {
  return centralConfig.getMinimalPrompt(agentName);
}

// SYSTEM_PROMPTS proxy for backward compatibility
const SYSTEM_PROMPTS = new Proxy({}, {
  get(target, prop) {
    return getSystemPrompt(prop);
  },
  has(target, prop) {
    return centralConfig.getAgentNames().includes(prop);
  },
  ownKeys() {
    return centralConfig.getAgentNames();
  },
  getOwnPropertyDescriptor(target, prop) {
    return { enumerable: true, configurable: true };
  }
});


// ============================================================================
// CLAUDE API CALL - Using centralized HTTP client
// ============================================================================

/**
 * Call Claude API and return text response
 * @param {string} systemPrompt - System prompt
 * @param {string} userMessage - User message
 * @returns {Promise<string>} Text response from Claude
 */
async function callClaude(systemPrompt, userMessage) {
  const response = await anthropicRequest({
    systemPrompt,
    userMessage,
    model: CONFIG.model,
    maxTokens: CONFIG.maxTokens,
    temperature: CONFIG.temperature
  });
  return extractText(response);
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
// MAIN TEST FUNCTION
// ============================================================================

async function testAgent(agentName, useFocused = true) {
  const agent = agentName.toUpperCase();
  const systemPrompt = SYSTEM_PROMPTS[agent];

  if (!systemPrompt) {
    console.error(`Unknown agent: ${agent}`);
    console.log('Available agents:', Object.keys(SYSTEM_PROMPTS).join(', '));
    process.exit(1);
  }

  // Find test cases
  const testDir = useFocused ? CONFIG.focusedDir : path.join(__dirname, '..', 'test_cases', agentName.toLowerCase());

  if (!fs.existsSync(testDir)) {
    console.error(`Test directory not found: ${testDir}`);
    process.exit(1);
  }

  const testFiles = fs.readdirSync(testDir)
    .filter(f => f.endsWith('.json') && f.includes(agentName.toLowerCase()));

  if (testFiles.length === 0) {
    console.error(`No test cases found for ${agent} in ${testDir}`);
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🤖 Testing Agent: ${agent}`);
  console.log(`📁 Test Cases: ${testFiles.length}`);
  console.log(`🎯 Target Score: ${CONFIG.threshold}%`);
  console.log('='.repeat(60));

  const results = [];

  for (const file of testFiles) {
    const testCase = JSON.parse(fs.readFileSync(path.join(testDir, file), 'utf-8'));
    console.log(`\n📋 Case: ${testCase.id || file}`);
    console.log(`   ${testCase.descricao || ''}`);

    try {
      // Generate minuta
      console.log('   ⏳ Generating minuta...');
      const startTime = Date.now();
      const minuta = await callClaude(systemPrompt, buildUserMessage(testCase));
      const genTime = Date.now() - startTime;
      console.log(`   ✅ Generated (${genTime}ms, ${minuta.split(/\s+/).length} words)`);

      // Evaluate with LLM
      console.log('   ⏳ Evaluating with LLM...');
      const evaluation = await evaluateMinuta(
        minuta,
        agent,
        testCase.expectativa?.sumulas_esperadas || []
      );

      const passed = evaluation.overall >= CONFIG.threshold;
      const emoji = passed ? '✅' : '❌';

      console.log(`   ${emoji} Score: ${evaluation.overall}% (E:${evaluation.estrutura} J:${evaluation.juridico} U:${evaluation.utilidade})`);

      if (evaluation.problemas?.length) {
        console.log(`   ⚠️  Problems: ${evaluation.problemas.slice(0, 2).join('; ')}`);
      }

      results.push({
        case_id: testCase.id || file,
        agent,
        passed,
        scores: {
          estrutura: evaluation.estrutura,
          juridico: evaluation.juridico,
          utilidade: evaluation.utilidade,
          overall: evaluation.overall
        },
        problems: evaluation.problemas || [],
        suggestions: evaluation.sugestoes || [],
        generation_time_ms: genTime,
        word_count: minuta.split(/\s+/).length,
        minuta
      });

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        case_id: testCase.id || file,
        agent,
        passed: false,
        error: error.message
      });
    }
  }

  // Save results
  const timestamp = new Date().toISOString().split('T')[0];
  const runId = Date.now().toString(36);
  const resultsFile = path.join(CONFIG.resultsDir, `${agent.toLowerCase()}_${timestamp}_${runId}.json`);

  if (!fs.existsSync(CONFIG.resultsDir)) {
    fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
  }

  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

  // Print summary
  const passed = results.filter(r => r.passed).length;
  const avgScore = Math.round(results.filter(r => r.scores).reduce((sum, r) => sum + r.scores.overall, 0) / results.filter(r => r.scores).length);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 SUMMARY: ${agent}`);
  console.log(`   Tests: ${results.length} | Passed: ${passed} | Failed: ${results.length - passed}`);
  console.log(`   Average Score: ${avgScore}% (target: ${CONFIG.threshold}%)`);
  console.log(`   Results saved: ${resultsFile}`);

  if (avgScore < CONFIG.threshold) {
    console.log(`\n💡 Prompt improvement needed. Review problems and suggestions.`);
  } else {
    console.log(`\n🎉 Agent ${agent} passes the ${CONFIG.threshold}% threshold!`);
  }

  return { agent, passed, total: results.length, avgScore, results };
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
const useAll = args.includes('--all') || args.includes('-a');
const useFocused = args.includes('--focused') || args.includes('-f') || true; // default to focused

if (useAll) {
  (async () => {
    const agents = Object.keys(SYSTEM_PROMPTS);
    const summaries = [];

    for (const agent of agents) {
      const summary = await testAgent(agent, useFocused);
      summaries.push(summary);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 OVERALL SUMMARY');
    console.log('='.repeat(60));

    for (const s of summaries) {
      const emoji = s.avgScore >= CONFIG.threshold ? '✅' : '❌';
      console.log(`${emoji} ${s.agent.padEnd(12)} Score: ${s.avgScore}% (${s.passed}/${s.total} passed)`);
    }
  })();
} else if (args.length > 0 && !args[0].startsWith('-')) {
  testAgent(args[0], useFocused);
} else {
  console.log('Usage:');
  console.log('  node scripts/test_and_evaluate.js <agent_name>');
  console.log('  node scripts/test_and_evaluate.js --all');
  console.log('');
  console.log('Agents:', Object.keys(SYSTEM_PROMPTS).join(', '));
}
