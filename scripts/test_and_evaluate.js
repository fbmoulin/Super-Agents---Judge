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
const https = require('https');
const { evaluateMinuta } = require('./llm_evaluator');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 8192,
  temperature: 0.3,
  focusedDir: path.join(__dirname, '..', 'test_cases', 'focused'),
  resultsDir: path.join(__dirname, '..', 'test_results'),
  threshold: 90 // Target score
};

// ============================================================================
// SYSTEM PROMPTS (minimal versions for v5.0 workflow)
// ============================================================================

const SYSTEM_PROMPTS = {
  BANCARIO: `Agente BANCÁRIO. Súmulas 297, 381, 382, 379, 539, 565, 603/STJ. Juros abusivos >1.5x BACEN. Danos: negativação R$5-15k, fraude R$8-25k. Repetição: simples (boa-fé) ou dobro (má-fé art. 42 CDC). Use [REVISAR] para incertezas. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO.`,

  CONSUMIDOR: `Agente CONSUMIDOR. CDC art. 14 resp. objetiva. Súmulas 385, 388, 479, 469/STJ. Dano moral in re ipsa negativação. Método bifásico. Parâmetros: negativação R$5-15k, reincidente R$10-30k. Use [REVISAR] para incertezas. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO.`,

  EXECUCAO: `Agente EXECUÇÃO. Arts. 786, 523, 921 CPC. Prescrição: cheque 6m, NP 3a. Cumprimento sentença: 15 dias, multa 10% + honorários 10%. Prescrição intercorrente art. 921 §4º. Use [REVISAR] para incertezas. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO.`,

  LOCACAO: `Agente LOCAÇÃO especializado. Lei 8.245/91.

REGRAS:
- Despejo falta pagamento: purgação mora até contestação (art. 62 II)
- Renovatória: 5 requisitos cumulativos (art. 51 I-V)
- Denúncia vazia: só contratos ≥30 meses
- Benfeitorias: necessárias sempre indenizáveis, úteis se autorizadas (arts. 35-36)

SÚMULAS OBRIGATÓRIAS: 335, 549/STJ quando aplicáveis.

INSTRUÇÕES:
1. NUNCA use [REVISAR] - faça presunções razoáveis
2. Se falta contestação nos fatos: presuma revelia
3. Se falta autorização benfeitorias: presuma não autorizadas (art. 35)
4. Número do processo: use formato "Processo nº 0000000-00.0000.8.08.0000"
5. Nome das partes: use "AUTOR/LOCADOR" e "RÉU/LOCATÁRIO"

ESTRUTURA OBRIGATÓRIA: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO`,

  SAUDE: `Agente SAÚDE. Súmulas 302, 469, 597, 608, 609/STJ. Lei 9.656/98. Rol ANS exemplificativo (após Lei 14.454/22). Danos: negativa simples R$5-10k, oncológico R$20-30k. Use [REVISAR] para incertezas. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO.`,

  GENERICO: `Agente GENÉRICO. Use base legal expressa. ABUNDANTE uso de [REVISAR]. Output conservador. Honorários 10-20%. Fundamentar sempre com artigos específicos. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO.`
};

// ============================================================================
// CLAUDE API CALL
// ============================================================================

function callClaude(systemPrompt, userMessage) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      reject(new Error('ANTHROPIC_API_KEY not set'));
      return;
    }

    const body = JSON.stringify({
      model: CONFIG.model,
      max_tokens: CONFIG.maxTokens,
      temperature: CONFIG.temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message));
          } else {
            resolve(json.content[0].text);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
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
