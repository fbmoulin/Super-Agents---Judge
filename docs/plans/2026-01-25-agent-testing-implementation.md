# Agent Testing & Tuning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build testing infrastructure to validate 6 legal agents with ≥90% quality score, combining regex-based structural checks with LLM-as-judge evaluation.

**Architecture:** Extend existing `agent_validator.js` with Gemini-based LLM evaluation. Create focused test cases. Iterate until all agents pass 90% threshold.

**Tech Stack:** Node.js, Anthropic SDK (Claude), Google Generative AI (Gemini for evaluation)

---

## Task 1: Install Gemini SDK

**Files:**
- Modify: `package.json` (create if doesn't exist)

**Step 1: Initialize package.json if needed**

Run:
```bash
cd /mnt/c/projetos-2026/superagents-judge
[ -f package.json ] || npm init -y
```

**Step 2: Install Gemini SDK**

Run:
```bash
npm install @google/generative-ai
```

Expected: `package.json` updated with `@google/generative-ai` dependency

**Step 3: Verify installation**

Run:
```bash
node -e "require('@google/generative-ai'); console.log('Gemini SDK OK')"
```

Expected: `Gemini SDK OK`

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Gemini SDK for LLM evaluation"
```

---

## Task 2: Create LLM Evaluator Script

**Files:**
- Create: `scripts/llm_evaluator.js`

**Step 1: Create the evaluator module**

```javascript
#!/usr/bin/env node
/**
 * LLM Evaluator - Uses Gemini to score legal minutas
 *
 * Evaluates on 3 dimensions:
 * - ESTRUTURA (33%): Has Relatório, Fundamentação, Dispositivo
 * - JURIDICO (33%): Correct súmulas, articles, reasoning
 * - UTILIDADE (33%): Ready for use, minimal [REVISAR] markers
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY or GOOGLE_API_KEY environment variable required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const EVALUATION_PROMPT = `Você é um avaliador de minutas judiciais. Avalie a minuta abaixo em 3 dimensões.

## MINUTA A AVALIAR
{minuta}

## DOMÍNIO ESPERADO
{domain}

## SÚMULAS ESPERADAS
{expected_sumulas}

---

## CRITÉRIOS DE AVALIAÇÃO

### 1. ESTRUTURA (0-100)
- 100: Tem I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO claramente separados
- 85: Tem as 3 seções mas formatação inconsistente
- 70: Falta 1 seção ou seções misturadas
- 50: Falta 2 seções
- 0: Sem estrutura reconhecível

### 2. JURÍDICO (0-100)
- 100: Súmulas corretas, artigos pertinentes, raciocínio lógico
- 85: Pequenas imprecisões mas juridicamente sólido
- 70: Faltam súmulas importantes ou artigos imprecisos
- 50: Fundamentação fraca ou súmulas erradas
- 0: Sem base jurídica ou completamente errado

### 3. UTILIDADE (0-100)
- 100: Pronta para uso, sem [REVISAR], dispositivo claro
- 85: 1-2 marcadores [REVISAR], dispositivo claro
- 70: 3-5 marcadores ou dispositivo ambíguo
- 50: Muitos marcadores ou dispositivo incompleto
- 0: Não utilizável

---

## RESPOSTA
Retorne APENAS um JSON válido (sem markdown, sem explicação):
{"estrutura": N, "juridico": N, "utilidade": N, "problemas": ["problema 1", "problema 2"], "sugestoes": ["sugestão 1"]}`;

async function evaluateMinuta(minuta, domain, expectedSumulas = []) {
  const prompt = EVALUATION_PROMPT
    .replace('{minuta}', minuta)
    .replace('{domain}', domain)
    .replace('{expected_sumulas}', expectedSumulas.join(', ') || 'Não especificadas');

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
        responseMimeType: 'application/json'
      }
    });

    const text = result.response.text();
    const evaluation = JSON.parse(text);

    // Calculate overall score (equal weights)
    evaluation.overall = Math.round(
      (evaluation.estrutura + evaluation.juridico + evaluation.utilidade) / 3
    );

    return evaluation;
  } catch (error) {
    console.error('Evaluation error:', error.message);
    return {
      estrutura: 0,
      juridico: 0,
      utilidade: 0,
      overall: 0,
      problemas: [`Erro na avaliação: ${error.message}`],
      sugestoes: []
    };
  }
}

// Export for use as module
module.exports = { evaluateMinuta };

// CLI usage
if (require.main === module) {
  const fs = require('fs');

  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node llm_evaluator.js <minuta_file.txt> [domain] [sumulas]');
    console.log('Example: node llm_evaluator.js output.txt BANCARIO "297,382"');
    process.exit(1);
  }

  const minutaFile = args[0];
  const domain = args[1] || 'GENERICO';
  const sumulas = args[2] ? args[2].split(',') : [];

  if (!fs.existsSync(minutaFile)) {
    console.error(`File not found: ${minutaFile}`);
    process.exit(1);
  }

  const minuta = fs.readFileSync(minutaFile, 'utf-8');

  evaluateMinuta(minuta, domain, sumulas).then(result => {
    console.log('\n📊 LLM Evaluation Results:');
    console.log('─'.repeat(40));
    console.log(`  Estrutura: ${result.estrutura}%`);
    console.log(`  Jurídico:  ${result.juridico}%`);
    console.log(`  Utilidade: ${result.utilidade}%`);
    console.log('─'.repeat(40));
    console.log(`  OVERALL:   ${result.overall}%`);

    if (result.problemas?.length) {
      console.log('\n⚠️  Problemas:');
      result.problemas.forEach(p => console.log(`  - ${p}`));
    }

    if (result.sugestoes?.length) {
      console.log('\n💡 Sugestões:');
      result.sugestoes.forEach(s => console.log(`  - ${s}`));
    }
  });
}
```

**Step 2: Make executable and test syntax**

Run:
```bash
chmod +x scripts/llm_evaluator.js
node -c scripts/llm_evaluator.js
```

Expected: `Syntax OK` (or no output = no errors)

**Step 3: Commit**

```bash
git add scripts/llm_evaluator.js
git commit -m "feat: add LLM evaluator using Gemini for minuta scoring"
```

---

## Task 3: Create Focused Test Cases

**Files:**
- Create: `test_cases/focused/bancario_01_simple.json`
- Create: `test_cases/focused/bancario_02_complex.json`
- Create: `test_cases/focused/consumidor_01_simple.json`
- Create: `test_cases/focused/consumidor_02_complex.json`
- Create: `test_cases/focused/execucao_01_simple.json`
- Create: `test_cases/focused/execucao_02_complex.json`

**Step 1: Create focused directory**

Run:
```bash
mkdir -p test_cases/focused
```

**Step 2: Create bancario simple case**

File: `test_cases/focused/bancario_01_simple.json`
```json
{
  "id": "bancario_01_simple",
  "agent": "BANCARIO",
  "descricao": "Caso simples de juros abusivos em empréstimo pessoal",
  "fatos": "O autor contratou empréstimo pessoal de R$ 10.000,00 em janeiro de 2025, com taxa de juros de 8% ao mês. A taxa média do BACEN para a modalidade era de 3,5% ao mês. O autor pagou 6 parcelas de R$ 1.800,00 cada.",
  "questoes": "Os juros cobrados são abusivos? Cabe revisão contratual?",
  "pedidos": "Revisão contratual para limitar juros a 1,5x a taxa média BACEN. Restituição dos valores pagos a maior.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Contratos Bancários - Juros",
  "valor_causa": 5400.00,
  "expectativa": {
    "agente_esperado": "agent_bancario",
    "score_minimo": 90,
    "sumulas_esperadas": ["382", "379"],
    "resultado_esperado": "PROCEDENTE"
  }
}
```

**Step 3: Create bancario complex case**

File: `test_cases/focused/bancario_02_complex.json`
```json
{
  "id": "bancario_02_complex",
  "agent": "BANCARIO",
  "descricao": "Caso complexo: empréstimo consignado fraudulento com danos morais",
  "fatos": "O autor, aposentado de 68 anos, descobriu descontos de R$ 600,00/mês em seu benefício referentes a empréstimo consignado de R$ 15.000,00 que nunca contratou. Não assinou contrato, não recebeu valores, não reconhece a biometria. Descontos iniciaram em março/2025. Registrou B.O. e reclamou no banco sem sucesso. Sofreu constrangimento e angústia.",
  "questoes": "1) Houve falha na prestação do serviço bancário? 2) É cabível declaração de inexistência do débito? 3) São devidos danos morais? 4) Cabe repetição do indébito?",
  "pedidos": "a) Declaração de inexistência do contrato; b) Cessação dos descontos; c) Restituição em dobro (R$ 3.600,00 descontados x 2 = R$ 7.200,00); d) Danos morais de R$ 15.000,00.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Empréstimo Consignado - Fraude",
  "valor_causa": 22200.00,
  "expectativa": {
    "agente_esperado": "agent_bancario",
    "score_minimo": 90,
    "sumulas_esperadas": ["297", "479"],
    "resultado_esperado": "PROCEDENTE"
  }
}
```

**Step 4: Create consumidor simple case**

File: `test_cases/focused/consumidor_01_simple.json`
```json
{
  "id": "consumidor_01_simple",
  "agent": "CONSUMIDOR",
  "descricao": "Caso simples: produto com defeito - celular",
  "fatos": "O autor comprou celular na loja ré por R$ 2.500,00 em dezembro/2025. Após 15 dias, o aparelho parou de funcionar. Levou à assistência técnica que constatou defeito de fabricação. A loja recusou troca ou devolução alegando que o prazo de 7 dias havia passado.",
  "questoes": "O consumidor tem direito à troca ou devolução do valor? Aplica-se o CDC?",
  "pedidos": "Restituição do valor pago (R$ 2.500,00) ou troca por produto equivalente.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Responsabilidade do Fornecedor - Vício do Produto",
  "valor_causa": 2500.00,
  "expectativa": {
    "agente_esperado": "agent_consumidor",
    "score_minimo": 90,
    "sumulas_esperadas": [],
    "resultado_esperado": "PROCEDENTE"
  }
}
```

**Step 5: Create consumidor complex case**

File: `test_cases/focused/consumidor_02_complex.json`
```json
{
  "id": "consumidor_02_complex",
  "agent": "CONSUMIDOR",
  "descricao": "Caso complexo: negativação indevida com danos morais",
  "fatos": "O autor teve seu nome inscrito nos cadastros do SPC/Serasa pela empresa ré em razão de dívida de R$ 850,00 que alega já ter quitado. Apresenta comprovante de pagamento datado de outubro/2025. A negativação ocorreu em novembro/2025. O autor foi impedido de obter crédito para compra de veículo. Não possui outras negativações.",
  "questoes": "1) A negativação foi indevida? 2) Configura dano moral in re ipsa? 3) Qual o valor adequado para indenização?",
  "pedidos": "a) Declaração de inexigibilidade do débito; b) Exclusão do nome dos cadastros; c) Danos morais de R$ 10.000,00.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Responsabilidade Civil - Negativação Indevida",
  "valor_causa": 10850.00,
  "expectativa": {
    "agente_esperado": "agent_consumidor",
    "score_minimo": 90,
    "sumulas_esperadas": ["385", "388"],
    "resultado_esperado": "PROCEDENTE"
  }
}
```

**Step 6: Create execucao simple case**

File: `test_cases/focused/execucao_01_simple.json`
```json
{
  "id": "execucao_01_simple",
  "agent": "EXECUCAO",
  "descricao": "Caso simples: execução de cheque",
  "fatos": "O exequente recebeu do executado cheque no valor de R$ 5.000,00 com vencimento em janeiro/2025. O cheque foi apresentado e devolvido por insuficiência de fundos (alínea 11). O executado foi notificado extrajudicialmente mas não pagou.",
  "questoes": "O cheque é título executivo extrajudicial? Estão presentes os requisitos da execução?",
  "pedidos": "Citação do executado para pagar em 3 dias. Penhora de bens suficientes. Honorários de 10%.",
  "classe": "Execução de Título Extrajudicial",
  "assunto": "Cheque",
  "valor_causa": 5000.00,
  "expectativa": {
    "agente_esperado": "agent_execucao",
    "score_minimo": 90,
    "sumulas_esperadas": [],
    "resultado_esperado": "PROCEDENTE"
  }
}
```

**Step 7: Create execucao complex case**

File: `test_cases/focused/execucao_02_complex.json`
```json
{
  "id": "execucao_02_complex",
  "agent": "EXECUCAO",
  "descricao": "Caso complexo: cumprimento de sentença com impugnação",
  "fatos": "O exequente move cumprimento de sentença contra o executado, cobrando R$ 50.000,00 de condenação em ação de indenização transitada em julgado em agosto/2025. O executado foi intimado e não pagou no prazo de 15 dias. Apresentou impugnação alegando excesso de execução, afirmando que os juros foram calculados incorretamente.",
  "questoes": "1) Incide a multa de 10%? 2) A impugnação tem efeito suspensivo? 3) Como calcular os juros?",
  "pedidos": "Rejeição da impugnação. Aplicação da multa de 10%. Penhora de bens. Honorários de 10%.",
  "classe": "Cumprimento de Sentença",
  "assunto": "Execução de Título Judicial",
  "valor_causa": 55000.00,
  "expectativa": {
    "agente_esperado": "agent_execucao",
    "score_minimo": 90,
    "sumulas_esperadas": [],
    "resultado_esperado": "PROCEDENTE"
  }
}
```

**Step 8: Commit test cases**

```bash
git add test_cases/focused/
git commit -m "feat: add 6 focused test cases for agent validation (bancario, consumidor, execucao)"
```

---

## Task 4: Create Remaining Focused Test Cases

**Files:**
- Create: `test_cases/focused/locacao_01_simple.json`
- Create: `test_cases/focused/locacao_02_complex.json`
- Create: `test_cases/focused/saude_01_simple.json`
- Create: `test_cases/focused/saude_02_complex.json`
- Create: `test_cases/focused/generico_01_simple.json`
- Create: `test_cases/focused/generico_02_complex.json`

**Step 1: Create locacao simple case**

File: `test_cases/focused/locacao_01_simple.json`
```json
{
  "id": "locacao_01_simple",
  "agent": "LOCACAO",
  "descricao": "Caso simples: despejo por falta de pagamento",
  "fatos": "O autor é proprietário de imóvel residencial alugado ao réu por R$ 1.500,00/mês. O réu deixou de pagar os aluguéis de outubro, novembro e dezembro/2025, totalizando R$ 4.500,00 de débito. Foi notificado extrajudicialmente sem sucesso.",
  "questoes": "É cabível a ação de despejo? O locatário pode purgar a mora?",
  "pedidos": "Decretação do despejo. Condenação no pagamento dos aluguéis vencidos e vincendos. Honorários de 10%.",
  "classe": "Ação de Despejo",
  "assunto": "Locação de Imóvel",
  "valor_causa": 4500.00,
  "expectativa": {
    "agente_esperado": "agent_locacao",
    "score_minimo": 90,
    "sumulas_esperadas": [],
    "resultado_esperado": "PROCEDENTE"
  }
}
```

**Step 2: Create locacao complex case**

File: `test_cases/focused/locacao_02_complex.json`
```json
{
  "id": "locacao_02_complex",
  "agent": "LOCACAO",
  "descricao": "Caso complexo: renovatória de locação comercial",
  "fatos": "O autor explora comércio no imóvel locado há 8 anos, sempre no mesmo ramo (lanchonete). O contrato atual, de 5 anos, vence em março/2026. O locador notificou que não renovará. O autor investiu R$ 80.000,00 em benfeitorias. O ponto comercial é estabelecido na região.",
  "questoes": "1) Estão presentes os requisitos da renovatória? 2) O locador pode recusar? 3) As benfeitorias são indenizáveis?",
  "pedidos": "Renovação compulsória do contrato por mais 5 anos. Subsidiariamente, indenização pelas benfeitorias e fundo de comércio.",
  "classe": "Ação Renovatória",
  "assunto": "Locação Comercial",
  "valor_causa": 90000.00,
  "expectativa": {
    "agente_esperado": "agent_locacao",
    "score_minimo": 90,
    "sumulas_esperadas": [],
    "resultado_esperado": "PROCEDENTE"
  }
}
```

**Step 3: Create saude simple case**

File: `test_cases/focused/saude_01_simple.json`
```json
{
  "id": "saude_01_simple",
  "agent": "SAUDE",
  "descricao": "Caso simples: negativa de cobertura de exame",
  "fatos": "O autor é beneficiário de plano de saúde há 3 anos. Seu médico prescreveu ressonância magnética com contraste para investigação de dores lombares. O plano negou cobertura alegando que o exame não está no rol da ANS.",
  "questoes": "A negativa é abusiva? O rol da ANS é taxativo ou exemplificativo?",
  "pedidos": "Cobertura do exame prescrito. Danos morais de R$ 5.000,00.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Plano de Saúde - Cobertura",
  "valor_causa": 7000.00,
  "expectativa": {
    "agente_esperado": "agent_saude",
    "score_minimo": 90,
    "sumulas_esperadas": ["469"],
    "resultado_esperado": "PROCEDENTE"
  }
}
```

**Step 4: Create saude complex case**

File: `test_cases/focused/saude_02_complex.json`
```json
{
  "id": "saude_02_complex",
  "agent": "SAUDE",
  "descricao": "Caso complexo: negativa de tratamento oncológico",
  "fatos": "O autor foi diagnosticado com câncer de pulmão em estágio III. O oncologista prescreveu imunoterapia (pembrolizumabe) como tratamento de primeira linha. O plano negou cobertura alegando que o medicamento não está no rol da ANS e que há alternativa mais barata. O autor está em risco de progressão da doença.",
  "questoes": "1) A negativa é abusiva? 2) O médico assistente pode escolher o tratamento? 3) Cabem danos morais pela negativa em tratamento oncológico?",
  "pedidos": "Tutela de urgência para cobertura imediata. Cobertura integral do tratamento. Danos morais de R$ 30.000,00.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Plano de Saúde - Tratamento Oncológico",
  "valor_causa": 150000.00,
  "expectativa": {
    "agente_esperado": "agent_saude",
    "score_minimo": 90,
    "sumulas_esperadas": ["302", "608"],
    "resultado_esperado": "PROCEDENTE"
  }
}
```

**Step 5: Create generico simple case**

File: `test_cases/focused/generico_01_simple.json`
```json
{
  "id": "generico_01_simple",
  "agent": "GENERICO",
  "descricao": "Caso simples: ação declaratória de inexistência de relação jurídica",
  "fatos": "O autor recebeu cobrança de R$ 2.000,00 referente a suposta compra em loja virtual que alega nunca ter realizado. Não reconhece a transação, não recebeu produto, não forneceu seus dados. A empresa insiste na cobrança.",
  "questoes": "Existe a relação jurídica alegada? O autor deve pagar o valor cobrado?",
  "pedidos": "Declaração de inexistência do débito. Abstenção de cobrança sob pena de multa.",
  "classe": "Ação Declaratória",
  "assunto": "Inexistência de Débito",
  "valor_causa": 2000.00,
  "expectativa": {
    "agente_esperado": "agent_generico",
    "score_minimo": 90,
    "sumulas_esperadas": [],
    "resultado_esperado": "PROCEDENTE"
  }
}
```

**Step 6: Create generico complex case**

File: `test_cases/focused/generico_02_complex.json`
```json
{
  "id": "generico_02_complex",
  "agent": "GENERICO",
  "descricao": "Caso complexo: ação de obrigação de fazer com multa cominatória",
  "fatos": "O autor contratou empresa de mudanças para transporte de móveis. A empresa realizou o serviço mas reteve 3 caixas com pertences pessoais do autor, exigindo pagamento adicional de R$ 500,00 não previsto no contrato. O autor recusou pagar. A empresa não devolve os pertences há 30 dias.",
  "questoes": "1) A retenção dos bens é lícita? 2) Cabe obrigação de fazer? 3) Qual o valor da multa cominatória adequada?",
  "pedidos": "Tutela de urgência para devolução imediata. Obrigação de entregar os bens sob pena de multa de R$ 500,00/dia. Danos morais de R$ 5.000,00.",
  "classe": "Ação de Obrigação de Fazer",
  "assunto": "Prestação de Serviços",
  "valor_causa": 5500.00,
  "expectativa": {
    "agente_esperado": "agent_generico",
    "score_minimo": 90,
    "sumulas_esperadas": [],
    "resultado_esperado": "PROCEDENTE"
  }
}
```

**Step 7: Commit remaining test cases**

```bash
git add test_cases/focused/
git commit -m "feat: add 6 more focused test cases (locacao, saude, generico)"
```

---

## Task 5: Create Combined Test Runner

**Files:**
- Create: `scripts/test_and_evaluate.js`

**Step 1: Create the combined test runner**

```javascript
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

  LOCACAO: `Agente LOCAÇÃO. Lei 8.245/91. Despejo: purgação até contestação. Renovatória: 5 requisitos (art. 51). Denúncia vazia: contrato ≥30 meses. Benfeitorias: art. 35-36. Use [REVISAR] para incertezas. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO.`,

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
```

**Step 2: Make executable and test syntax**

Run:
```bash
chmod +x scripts/test_and_evaluate.js
node -c scripts/test_and_evaluate.js
```

Expected: No syntax errors

**Step 3: Commit**

```bash
git add scripts/test_and_evaluate.js
git commit -m "feat: add combined test runner with LLM evaluation"
```

---

## Task 6: Run First Test Cycle

**Step 1: Verify environment variables**

Run:
```bash
echo "ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+set}"
echo "GEMINI_API_KEY: ${GEMINI_API_KEY:+set}"
```

Expected: Both should show "set"

If not set:
```bash
export ANTHROPIC_API_KEY="your-key-here"
export GEMINI_API_KEY="your-key-here"
```

**Step 2: Test one agent (BANCARIO)**

Run:
```bash
node scripts/test_and_evaluate.js bancario
```

Expected output:
```
==============================================================
🤖 Testing Agent: BANCARIO
📁 Test Cases: 2
🎯 Target Score: 90%
==============================================================

📋 Case: bancario_01_simple
   Caso simples de juros abusivos...
   ⏳ Generating minuta...
   ✅ Generated (xxxms, xxx words)
   ⏳ Evaluating with LLM...
   ✅ Score: XX% (E:XX J:XX U:XX)

... (continues for case 2)

────────────────────────────────────────────────────────────────
📊 SUMMARY: BANCARIO
   Tests: 2 | Passed: X | Failed: X
   Average Score: XX% (target: 90%)
```

**Step 3: Review results file**

Run:
```bash
cat test_results/bancario_*.json | head -100
```

**Step 4: If score < 90%, note problems for prompt improvement**

Problems will be listed in the JSON results. Common issues:
- Missing súmulas → Add to system prompt
- Poor structure → Clarify structure requirements
- Too many [REVISAR] → Adjust confidence guidance

---

## Task 7: Test All Agents

**Step 1: Run all agents**

Run:
```bash
node scripts/test_and_evaluate.js --all
```

Expected: Summary showing score for each agent

**Step 2: Commit results**

```bash
git add test_results/
git commit -m "test: first test cycle results for all 6 agents"
```

---

## Success Criteria

After completing all tasks:

- [ ] Gemini SDK installed
- [ ] LLM evaluator script works standalone
- [ ] 12 focused test cases created (2 per agent)
- [ ] Combined test runner works
- [ ] First test cycle completed
- [ ] Results saved in test_results/

**Next iteration:** If any agent scores < 90%, improve system prompts in `agents/` directory and re-run tests.

---

*Plan created: 2026-01-25 | Based on design doc: 2026-01-25-agent-testing-tuning-design.md*
