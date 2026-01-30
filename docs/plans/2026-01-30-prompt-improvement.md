# Agent Prompt Improvement Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve all 6 agent system prompts from 82% average to 90%+ quality scores.

**Architecture:** Iterative prompt refinement. Each agent's system prompt is modified to: (1) reduce [REVISAR] markers by making reasonable assumptions, (2) use clear placeholder format for process data, (3) ensure expected súmulas are explicitly cited. After each modification, re-run tests to measure improvement.

**Tech Stack:** Node.js, Claude API (generation), Gemini API (evaluation)

---

## Context

### Current Scores (Baseline)
| Agent | Overall | Structure | Legal | Utility |
|-------|---------|-----------|-------|---------|
| LOCACAO | 85% | 100 | 85 | 70 |
| BANCARIO | 83% | 93 | 85 | 70 |
| EXECUCAO | 83% | 93 | 85 | 70 |
| GENERICO | 83% | 93 | 85 | 70 |
| CONSUMIDOR | 80% | 85 | 85 | 70 |
| SAUDE | 78% | 85 | 78 | 70 |

### Root Cause Analysis
1. **Utility at 70%**: All agents use 3-5 [REVISAR] markers (scoring rubric penalizes >2)
2. **Legal at 85%**: Súmulas referenced but not always quoted/applied correctly
3. **Structure good**: All agents produce proper I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO

### Evaluation Scoring Rubric (from llm_evaluator.js:38-57)
- **Utility 100**: No [REVISAR], dispositivo clear
- **Utility 85**: 1-2 [REVISAR] markers
- **Utility 70**: 3-5 [REVISAR] markers ← Current state
- **Legal 100**: Correct súmulas, pertinent articles, logical reasoning
- **Legal 85**: Minor imprecisions but legally solid

---

## Task 1: Update LOCACAO Prompt (closest to target)

**Files:**
- Modify: `scripts/test_and_evaluate.js:40` (LOCACAO system prompt)

**Step 1: Read current prompt**

Current prompt (line 40):
```javascript
LOCACAO: `Agente LOCAÇÃO. Lei 8.245/91. Despejo: purgação até contestação. Renovatória: 5 requisitos (art. 51). Denúncia vazia: contrato ≥30 meses. Benfeitorias: art. 35-36. Use [REVISAR] para incertezas. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO.`,
```

**Step 2: Replace with improved prompt**

New prompt:
```javascript
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
```

**Step 3: Run test**

Run: `export GEMINI_API_KEY="..." && export ANTHROPIC_API_KEY="..." && node scripts/test_and_evaluate.js locacao`

Expected: Score ≥ 90%

**Step 4: Record results**

If passed: proceed to next agent
If failed: analyze problems, adjust prompt, repeat

**Step 5: Commit if passed**

```bash
git add scripts/test_and_evaluate.js
git commit -m "feat(prompts): improve LOCACAO prompt to 90%+ score"
```

---

## Task 2: Update BANCARIO Prompt

**Files:**
- Modify: `scripts/test_and_evaluate.js:34` (BANCARIO system prompt)

**Step 1: Read current prompt**

Current prompt (line 34):
```javascript
BANCARIO: `Agente BANCÁRIO. Súmulas 297, 381, 382, 379, 539, 565, 603/STJ. Juros abusivos >1.5x BACEN. Danos: negativação R$5-15k, fraude R$8-25k. Repetição: simples (boa-fé) ou dobro (má-fé art. 42 CDC). Use [REVISAR] para incertezas. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO.`,
```

**Step 2: Replace with improved prompt**

New prompt:
```javascript
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
```

**Step 3: Run test**

Run: `node scripts/test_and_evaluate.js bancario`

Expected: Score ≥ 90%

**Step 4: Record results and iterate if needed**

**Step 5: Commit if passed**

```bash
git add scripts/test_and_evaluate.js
git commit -m "feat(prompts): improve BANCARIO prompt to 90%+ score"
```

---

## Task 3: Update EXECUCAO Prompt

**Files:**
- Modify: `scripts/test_and_evaluate.js:38` (EXECUCAO system prompt)

**Step 1: Read current prompt**

Current prompt (line 38):
```javascript
EXECUCAO: `Agente EXECUÇÃO. Arts. 786, 523, 921 CPC. Prescrição: cheque 6m, NP 3a. Cumprimento sentença: 15 dias, multa 10% + honorários 10%. Prescrição intercorrente art. 921 §4º. Use [REVISAR] para incertezas. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO.`,
```

**Step 2: Replace with improved prompt**

New prompt:
```javascript
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
```

**Step 3: Run test**

Run: `node scripts/test_and_evaluate.js execucao`

Expected: Score ≥ 90%

**Step 4: Record results and iterate if needed**

**Step 5: Commit if passed**

```bash
git add scripts/test_and_evaluate.js
git commit -m "feat(prompts): improve EXECUCAO prompt to 90%+ score"
```

---

## Task 4: Update CONSUMIDOR Prompt

**Files:**
- Modify: `scripts/test_and_evaluate.js:36` (CONSUMIDOR system prompt)

**Step 1: Read current prompt**

Current prompt (line 36):
```javascript
CONSUMIDOR: `Agente CONSUMIDOR. CDC art. 14 resp. objetiva. Súmulas 385, 388, 479, 469/STJ. Dano moral in re ipsa negativação. Método bifásico. Parâmetros: negativação R$5-15k, reincidente R$10-30k. Use [REVISAR] para incertezas. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO.`,
```

**Step 2: Replace with improved prompt**

New prompt:
```javascript
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
```

**Step 3: Run test**

Run: `node scripts/test_and_evaluate.js consumidor`

Expected: Score ≥ 90%

**Step 4: Record results and iterate if needed**

**Step 5: Commit if passed**

```bash
git add scripts/test_and_evaluate.js
git commit -m "feat(prompts): improve CONSUMIDOR prompt to 90%+ score"
```

---

## Task 5: Update SAUDE Prompt (lowest score - needs most work)

**Files:**
- Modify: `scripts/test_and_evaluate.js:42` (SAUDE system prompt)

**Step 1: Read current prompt**

Current prompt (line 42):
```javascript
SAUDE: `Agente SAÚDE. Súmulas 302, 469, 597, 608, 609/STJ. Lei 9.656/98. Rol ANS exemplificativo (após Lei 14.454/22). Danos: negativa simples R$5-10k, oncológico R$20-30k. Use [REVISAR] para incertezas. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO.`,
```

**Step 2: Replace with improved prompt**

New prompt:
```javascript
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
```

**Step 3: Run test**

Run: `node scripts/test_and_evaluate.js saude`

Expected: Score ≥ 90%

**Step 4: Record results and iterate if needed**

**Step 5: Commit if passed**

```bash
git add scripts/test_and_evaluate.js
git commit -m "feat(prompts): improve SAUDE prompt to 90%+ score"
```

---

## Task 6: Update GENERICO Prompt

**Files:**
- Modify: `scripts/test_and_evaluate.js:44` (GENERICO system prompt)

**Step 1: Read current prompt**

Current prompt (line 44):
```javascript
GENERICO: `Agente GENÉRICO. Use base legal expressa. ABUNDANTE uso de [REVISAR]. Output conservador. Honorários 10-20%. Fundamentar sempre com artigos específicos. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO.`
```

**Step 2: Replace with improved prompt**

New prompt:
```javascript
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

ESTRUTURA OBRIGATÓRIA: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO`,
```

**Step 3: Run test**

Run: `node scripts/test_and_evaluate.js generico`

Expected: Score ≥ 90%

**Step 4: Record results and iterate if needed**

**Step 5: Commit if passed**

```bash
git add scripts/test_and_evaluate.js
git commit -m "feat(prompts): improve GENERICO prompt to 90%+ score"
```

---

## Task 7: Run Full Test Suite and Generate Final Report

**Files:**
- Run: all 6 agents
- Create: `test_results/IMPROVEMENT_REPORT_2026-01-30.md`

**Step 1: Run all tests**

Run: `node scripts/test_and_evaluate.js --all`

**Step 2: Verify all agents pass (≥90%)**

Expected: All 6 agents score ≥ 90%

**Step 3: Generate comparison report**

Create `test_results/IMPROVEMENT_REPORT_2026-01-30.md`:

```markdown
# Agent Prompt Improvement Report

**Date:** 2026-01-30
**Target:** 90%

## Before vs After

| Agent | Before | After | Improvement |
|-------|--------|-------|-------------|
| LOCACAO | 85% | ?% | +?% |
| BANCARIO | 83% | ?% | +?% |
| EXECUCAO | 83% | ?% | +?% |
| GENERICO | 83% | ?% | +?% |
| CONSUMIDOR | 80% | ?% | +?% |
| SAUDE | 78% | ?% | +?% |

## Changes Made
[list key changes]

## Next Steps
[if any agents still below 90%]
```

**Step 4: Commit final results**

```bash
git add scripts/test_and_evaluate.js test_results/
git commit -m "feat(prompts): all agents improved to 90%+ quality score"
```

---

## Success Criteria

- [ ] LOCACAO: ≥90%
- [ ] BANCARIO: ≥90%
- [ ] EXECUCAO: ≥90%
- [ ] CONSUMIDOR: ≥90%
- [ ] SAUDE: ≥90%
- [ ] GENERICO: ≥90%
- [ ] All results committed
- [ ] Improvement report generated

---

## Iteration Strategy

If any agent fails to reach 90% after first prompt update:

1. Analyze specific `problems` from evaluation JSON
2. Identify which dimension (Structure/Legal/Utility) needs work
3. Adjust prompt targeting that dimension
4. Re-test
5. Repeat until ≥90%

Common fixes:
- **Utility low**: Remove [REVISAR] instructions, add explicit presumption rules
- **Legal low**: Add more súmulas, cite articles explicitly
- **Structure low**: Reinforce section formatting requirements

---

*Plan created: 2026-01-30 | Estimated tasks: 7 | Target: 90%+ all agents*
