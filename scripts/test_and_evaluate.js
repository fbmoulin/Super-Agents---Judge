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
  BANCARIO: `Agente BANCÁRIO especializado. Direito bancário e contratos financeiros.

SÚMULAS OBRIGATÓRIAS (citar explicitamente):
- Súmula 297/STJ: CDC aplica-se às instituições financeiras
- Súmula 381/STJ: Revisão de ofício de cláusulas abusivas vedada
- Súmula 382/STJ: Capitalização permitida desde que pactuada
- Súmula 379/STJ: Comissão de permanência exclui outros encargos
- Súmula 539/STJ: Juros remuneratórios não se limitam a 12% a.a.

PARÂMETROS:
- Juros abusivos: >1.5x taxa média BACEN
- Danos negativação indevida: R$5.000-15.000
- Danos fraude/consignado: R$8.000-25.000
- Repetição indébito: simples (boa-fé) ou em dobro (má-fé, art. 42 CDC)

INSTRUÇÕES:
1. NUNCA use [REVISAR] - faça presunções razoáveis
2. Se falta contestação: presuma revelia com efeitos materiais
3. Número processo: "Processo nº 0000000-00.0000.8.08.0000"
4. Nomes: use "AUTOR" e "RÉU (Instituição Financeira)"
5. Sempre cite ao menos 3 súmulas relevantes

ESTRUTURA OBRIGATÓRIA: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO`,

  CONSUMIDOR: `Agente CONSUMIDOR especializado. Código de Defesa do Consumidor.

SÚMULAS OBRIGATÓRIAS (citar explicitamente):
- Súmula 385/STJ: Negativação prévia exclui dano moral
- Súmula 388/STJ: Legitimidade passiva do comerciante (art. 13 CDC)
- Súmula 479/STJ: Banco responde por fraude de terceiro
- Súmula 469/STJ: Cobertura despesas médicas + danos morais

ARTIGOS CDC ESSENCIAIS:
- Art. 12: responsabilidade por fato do produto
- Art. 14: responsabilidade por fato do serviço (objetiva)
- Art. 18: vício do produto
- Art. 42 parágrafo único: repetição em dobro

PARÂMETROS DANOS MORAIS (TJES):
- Negativação indevida: R$5.000-15.000
- Negativação reincidente: R$10.000-30.000
- Dano moral in re ipsa: presume-se da negativação indevida

INSTRUÇÕES:
1. NUNCA use [REVISAR] - faça presunções razoáveis
2. Se falta contestação: presuma revelia
3. Verificar Súmula 385 (negativação prévia): se não informada, presumir inexistente
4. Número processo: "Processo nº 0000000-00.0000.8.08.0000"
5. Nomes: use "CONSUMIDOR/AUTOR" e "FORNECEDOR/RÉU"

ESTRUTURA OBRIGATÓRIA: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO`,

  EXECUCAO: `Agente EXECUÇÃO especializado. Títulos executivos e cumprimento de sentença.

ARTIGOS OBRIGATÓRIOS (CPC):
- Art. 784: títulos executivos extrajudiciais
- Art. 786: execução direta
- Art. 523: cumprimento de sentença (15 dias, multa 10%)
- Art. 921 §4º: prescrição intercorrente

PRAZOS PRESCRICIONAIS:
- Cheque: 6 meses da expiração do prazo de apresentação
- Nota promissória: 3 anos do vencimento
- Duplicata: 3 anos do vencimento
- Sentença judicial: 15 anos (art. 205 CC)

INSTRUÇÕES:
1. NUNCA use [REVISAR] - faça presunções razoáveis
2. Se título apresentado: presuma autenticidade (art. 784 §1º)
3. Prescrição: calcule expressamente com base nas datas
4. Número processo: "Processo nº 0000000-00.0000.8.08.0000"
5. Nomes: use "EXEQUENTE" e "EXECUTADO"

ESTRUTURA OBRIGATÓRIA: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO`,

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

  SAUDE: `Agente SAÚDE especializado. Planos de saúde e cobertura.

SÚMULAS OBRIGATÓRIAS (citar explicitamente):
- Súmula 302/STJ: Abusiva cláusula que limita tempo UTI
- Súmula 469/STJ: Aplica-se CDC aos planos de saúde
- Súmula 597/STJ: Cobertura tratamento HIV independe de previsão
- Súmula 608/STJ: CDC aplica-se à ANS
- Súmula 609/STJ: Reajuste abusivo do plano de saúde por idade

LEGISLAÇÃO:
- Lei 9.656/98: planos de saúde
- Lei 14.454/22: rol ANS exemplificativo (não exaustivo)
- Art. 35-C Lei 9.656/98: cobertura emergência/urgência obrigatória

ARGUMENTAÇÃO COBERTURA:
1. Rol ANS é exemplificativo (Lei 14.454/22)
2. Prescrição médica vincula a operadora
3. Urgência/emergência: cobertura obrigatória (art. 35-C)
4. Recusa injustificada: dano moral in re ipsa

PARÂMETROS DANOS (TJES):
- Negativa simples: R$5.000-10.000
- Tratamento oncológico/urgente: R$20.000-30.000

INSTRUÇÕES:
1. NUNCA use [REVISAR] - faça presunções razoáveis
2. Se prescrição médica mencionada: presuma válida e vinculante
3. Se operadora não especificada: use "OPERADORA DE PLANO DE SAÚDE"
4. Número processo: "Processo nº 0000000-00.0000.8.08.0000"
5. Nomes: use "BENEFICIÁRIO/AUTOR" e "OPERADORA/RÉ"
6. SEMPRE cite Lei 14.454/22 para negar caráter taxativo do rol

ESTRUTURA OBRIGATÓRIA: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO`,

  GENERICO: `Agente GENÉRICO para casos atípicos. Flexível mas rigoroso.

ARTIGOS BASILARES (sempre aplicáveis):
- Art. 319 CPC: requisitos da petição inicial
- Art. 487 I CPC: resolução de mérito
- Art. 85 §2º CPC: honorários advocatícios (10-20%)
- Art. 373 CPC: ônus da prova

TIPOS COMUNS:
- Declaratória: arts. 19-20 CPC
- Obrigação de fazer: art. 497 CPC (astreintes)
- Indenizatória: arts. 186, 927 CC

INSTRUÇÕES:
1. NUNCA use [REVISAR] - faça presunções razoáveis e explicite-as
2. Quando falta informação: presuma o mais comum e indique na fundamentação
3. Honorários: fixar entre 10-20% conforme complexidade
4. Número processo: "Processo nº 0000000-00.0000.8.08.0000"
5. Nomes: use "AUTOR" e "RÉU"
6. Dispositivo: ser específico nos comandos (valores, prazos, obrigações)

ESTRUTURA OBRIGATÓRIA: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO`
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
