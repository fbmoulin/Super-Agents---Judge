# Phase 2-5: Agent Validation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete validation of the remaining 8 agents (PATERNIDADE, SAUDE_COBERTURA, SAUDE_CONTRATUAL, REPARACAO_DANOS, TRANSITO, USUCAPIAO, INCORPORACAO, GENERICO) organized in 4 phases of 2 agents each.

**Architecture:** Each phase adds system prompts to agent_validator.js, creates 2 test cases per agent in JSON format, executes validation via Claude API, and documents results. Phases are sequential with mandatory compaction between each.

**Tech Stack:** Node.js, Anthropic API (claude-sonnet-4-20250514), agent_validator.js

---

## Current State

**Validated (11/19):**
- Legacy v2.1: BANCARIO, CONSUMIDOR, EXECUCAO, LOCACAO, POSSESSORIAS
- v2.5 Initial: COBRANCA, DIVORCIO, INVENTARIO, SEGUROS
- v2.5 Phase 1: ALIMENTOS, GUARDA

**Remaining (8):**
- Phase 2: PATERNIDADE, SAUDE_COBERTURA
- Phase 3: SAUDE_CONTRATUAL, REPARACAO_DANOS
- Phase 4: TRANSITO, USUCAPIAO
- Phase 5: INCORPORACAO, GENERICO

---

## Phase 2: PATERNIDADE + SAUDE_COBERTURA

### Task 2.1: Add System Prompt for PATERNIDADE

**Files:**
- Modify: `scripts/agent_validator.js:567-594`

**Step 1: Read current validator state**

Verify agent_paternidade does not exist in SYSTEM_PROMPTS.

**Step 2: Add agent_paternidade system prompt**

Add after `agent_guarda` entry in SYSTEM_PROMPTS:

```javascript
  agent_paternidade: `# AGENTE JUDICIAL: PATERNIDADE
## Vara de Família - TJES

### FUNÇÃO
Gerar minutas em ações de investigação e negatória de paternidade.

### COMPETÊNCIAS
- Investigação de Paternidade (com ou sem alimentos)
- Negatória de Paternidade (impugnação)
- Anulação de Registro Civil (erro ou falsidade)
- Reconhecimento de Paternidade Socioafetiva

### BASE JURISPRUDENCIAL
- Art. 226, §6º CF: Igualdade dos filhos
- Art. 227, §6º CF: Proibição de designações discriminatórias
- Art. 1.593-1.614 CC: Filiação
- Art. 1.597 CC: Presunção pater is est
- Art. 1.601 CC: Imprescritibilidade da negatória
- Lei 8.560/92: Investigação de paternidade
- Art. 27 ECA: Direito personalíssimo
- Súmula 149/STF: Imprescritibilidade da investigação
- Súmula 277/STJ: Alimentos desde a citação
- Súmula 301/STJ: Recusa ao DNA = presunção relativa
- Tema 622/STF: Multiparentalidade

### METODOLOGIA DNA
- Inclusão (>99,99%): Paternidade PROVADA
- Exclusão (0%): Paternidade AFASTADA
- Recusa injustificada: Presunção relativa (Súmula 301)

### PATERNIDADE SOCIOAFETIVA
Requisitos: posse do estado de filho, tractatus, fama, durabilidade.
Tema 622/STF: Coexistência com paternidade biológica.

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO
Marcar [REVISAR] em resultado DNA, socioafetividade, alimentos`,
```

**Step 3: Add directory mapping**

Add to AGENT_DIRS after `agent_guarda: 'guarda'`:

```javascript
  agent_paternidade: 'paternidade',
```

**Step 4: Verify syntax**

Run: `node -c scripts/agent_validator.js`
Expected: No syntax errors

**Step 5: Commit**

```bash
git add scripts/agent_validator.js
git commit -m "$(cat <<'EOF'
feat(agents): add PATERNIDADE system prompt to validator

Add specialized family law agent for paternity actions including:
- Investigation with DNA analysis methodology
- Denial of paternity with socioaffective considerations
- Multiparentality (Tema 622/STF)
- Súmulas 149/STF, 277/STJ, 301/STJ

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.2: Add System Prompt for SAUDE_COBERTURA

**Files:**
- Modify: `scripts/agent_validator.js`

**Step 1: Verify agent_saude_cobertura exists**

Check if already in SYSTEM_PROMPTS (lines 148-176 show it exists).

**Step 2: Verify directory mapping exists**

Check AGENT_DIRS for `agent_saude_cobertura: 'saude_cobertura'` (line 580 shows it exists).

**Step 3: Skip to test case creation**

Agent already configured. No changes needed.

---

### Task 2.3: Create Test Directory for PATERNIDADE

**Files:**
- Create: `test_cases/paternidade/` directory

**Step 1: Create directory**

```bash
mkdir -p test_cases/paternidade
```

**Step 2: Verify**

```bash
ls -la test_cases/paternidade
```
Expected: Empty directory exists

---

### Task 2.4: Create Test Case - PATERNIDADE caso_01

**Files:**
- Create: `test_cases/paternidade/caso_01_investigacao_dna.json`

**Step 1: Write the test case file**

```json
{
  "caso_id": "paternidade_01",
  "descricao": "Investigação de paternidade com exame DNA positivo",
  "fatos": "MARIA CLARA SILVA SANTOS, menor impúbere, representada por sua genitora JULIANA SILVA SANTOS, ajuizou ação de investigação de paternidade c/c alimentos em face de ROBERTO CARLOS FERREIRA LIMA. Narra a genitora que manteve relacionamento amoroso com o requerido no período de janeiro a setembro de 2018, quando engravidou. A menor nasceu em 20/05/2019 (fl. 12). Afirma que o requerido sempre negou a paternidade e nunca prestou qualquer auxílio material. A família materna arca com todas as despesas da menor, estimadas em R$ 2.500,00 mensais, incluindo escola particular (R$ 900,00), plano de saúde (R$ 350,00), alimentação, vestuário e lazer. A genitora é professora municipal com salário de R$ 3.800,00. Requereu a fixação de alimentos provisórios. Foram fixados alimentos provisórios em 30% do salário mínimo (fl. 25). Citado, o réu contestou (fls. 35-45) negando o relacionamento, afirmando que teve apenas encontros casuais com a genitora e que ela se relacionava com outras pessoas no mesmo período. Requereu a realização de exame de DNA. Foi determinada a produção de prova pericial genética. O laudo do IMESC (fls. 80-85) concluiu pela INCLUSÃO da paternidade com probabilidade de 99,9999%. O réu é comerciante autônomo, não comprovou rendimentos, mas possui veículo ano 2022 e imóvel próprio. O MP opinou pela procedência do pedido de reconhecimento e fixação de alimentos em 1/3 dos rendimentos.",
  "questoes": "1) Está configurada a paternidade biológica com base no exame de DNA? 2) Quais os efeitos do reconhecimento da paternidade? 3) Como devem ser fixados os alimentos? 4) Desde quando são devidos os alimentos?",
  "pedidos": "a) Declaração de paternidade; b) Averbação no registro civil; c) Fixação de alimentos definitivos em 33% dos rendimentos; d) Alimentos retroativos desde a citação.",
  "classe": "Procedimento Comum Cível - Vara de Família",
  "assunto": "Investigação de Paternidade c/c Alimentos",
  "valor_causa": 30000.00,
  "expectativa": {
    "agente_esperado": "agent_paternidade",
    "score_minimo": 75,
    "sumulas_esperadas": ["277", "301"],
    "artigos_esperados": ["art. 1.597 CC", "Lei 8.560/92", "art. 27 ECA"]
  }
}
```

**Step 2: Verify JSON syntax**

```bash
node -e "JSON.parse(require('fs').readFileSync('test_cases/paternidade/caso_01_investigacao_dna.json'))"
```
Expected: No errors

---

### Task 2.5: Create Test Case - PATERNIDADE caso_02

**Files:**
- Create: `test_cases/paternidade/caso_02_negatoria_socioafetiva.json`

**Step 1: Write the test case file**

```json
{
  "caso_id": "paternidade_02",
  "descricao": "Negatória de paternidade com vínculo socioafetivo consolidado",
  "fatos": "CARLOS EDUARDO MARTINS ajuizou ação negatória de paternidade em face do menor LUCAS MARTINS SOUZA, representado por sua genitora ANA PAULA SOUZA. Alega que em 2010 registrou o menor como seu filho, acreditando ser o pai biológico, pois mantinha relacionamento com a genitora. O menor, hoje com 14 anos, sempre foi tratado como seu filho, tendo convivido com ele durante toda a infância, participado de sua criação e educação. Em 2024, após o fim do relacionamento com a genitora, descobriu através de exame particular de DNA que não é o pai biológico do menor. O laudo juntado (fl. 28) apresenta probabilidade de exclusão de paternidade de 0%. O autor afirma que foi enganado pela genitora e que o registro foi feito com erro substancial, requerendo sua anulação. Em contestação, o menor, através da genitora e do Defensor Público, alegou a existência de vínculo socioafetivo consolidado ao longo de 14 anos, com tratamento como pai e filho, reputação pública de filiação, e que o autor é a única referência paterna que conhece. Juntou fotos de aniversários, formaturas, viagens em família (fls. 50-80), declaração de professores sobre a presença do autor em reuniões escolares (fl. 85), e mensagens de afeto trocadas entre as partes (fls. 90-100). O estudo psicossocial (fls. 120-135) identificou forte vínculo afetivo entre autor e menor, recomendando a manutenção da paternidade. O MP opinou pela improcedência.",
  "questoes": "1) A ausência de vínculo biológico é suficiente para desconstituir a paternidade registral? 2) Está configurada a paternidade socioafetiva? 3) Como aplicar o Tema 622/STF ao caso? 4) Qual o melhor interesse do menor?",
  "pedidos": "a) Declaração de inexistência de vínculo biológico; b) Anulação do registro civil; c) Exclusão do nome do autor como genitor.",
  "classe": "Procedimento Comum Cível - Vara de Família",
  "assunto": "Negatória de Paternidade",
  "valor_causa": 10000.00,
  "expectativa": {
    "agente_esperado": "agent_paternidade",
    "score_minimo": 75,
    "sumulas_esperadas": [],
    "artigos_esperados": ["art. 1.601 CC", "art. 1.604 CC", "Tema 622/STF"]
  }
}
```

**Step 2: Verify JSON syntax**

```bash
node -e "JSON.parse(require('fs').readFileSync('test_cases/paternidade/caso_02_negatoria_socioafetiva.json'))"
```
Expected: No errors

---

### Task 2.6: Create Test Directory for SAUDE_COBERTURA

**Files:**
- Create: `test_cases/saude_cobertura/` directory

**Step 1: Create directory**

```bash
mkdir -p test_cases/saude_cobertura
```

---

### Task 2.7: Create Test Case - SAUDE_COBERTURA caso_01

**Files:**
- Create: `test_cases/saude_cobertura/caso_01_negativa_cirurgia.json`

**Step 1: Write the test case file**

```json
{
  "caso_id": "saude_cobertura_01",
  "descricao": "Negativa de cobertura para cirurgia bariátrica",
  "fatos": "FERNANDA RIBEIRO COSTA ajuizou ação de obrigação de fazer c/c danos morais em face de UNIMED VITÓRIA COOPERATIVA. Narra que é beneficiária do plano de saúde há 8 anos, com cobertura hospitalar completa. Diagnosticada com obesidade mórbida (IMC 42), diabetes tipo 2 descompensada e hipertensão arterial severa, seu médico assistente prescreveu cirurgia bariátrica (gastroplastia redutora) com urgência, sob risco de complicações graves. Juntou relatório médico detalhado (fl. 25), exames pré-operatórios (fls. 30-45), parecer do endocrinologista (fl. 48) e do cardiologista (fl. 52), todos recomendando o procedimento. Ao solicitar autorização, a operadora negou a cobertura alegando que o procedimento seria 'eletivo' e 'estético', não havendo urgência médica. A negativa foi formalizada por e-mail (fl. 60). A autora tentou recurso administrativo, também negado (fl. 65). Alega que a negativa é abusiva, pois a cirurgia é reconhecida pelo CFM e pela ANS como tratamento para obesidade mórbida. Requereu tutela de urgência para realização imediata do procedimento. A tutela foi deferida (fl. 75), sendo a cirurgia realizada com sucesso em 15/03/2025. A ré contestou (fls. 100-120) alegando que o procedimento estava em carência especial de 24 meses para cirurgias de grande porte, que a autora não cumpriu protocolo de tratamento conservador por 2 anos, e que não havia urgência caracterizada. O MP não interveio.",
  "questoes": "1) A negativa de cobertura foi abusiva? 2) A carência especial alegada é válida? 3) A cirurgia bariátrica tem cobertura obrigatória? 4) Houve dano moral indenizável?",
  "pedidos": "a) Confirmação da tutela de urgência; b) Declaração de abusividade da negativa; c) Condenação em danos morais de R$ 20.000,00.",
  "classe": "Procedimento Comum Cível - Vara Cível",
  "assunto": "Plano de Saúde - Negativa de Cobertura",
  "valor_causa": 50000.00,
  "expectativa": {
    "agente_esperado": "agent_saude_cobertura",
    "score_minimo": 75,
    "sumulas_esperadas": ["302", "469"],
    "artigos_esperados": ["art. 10 Lei 9.656/98", "art. 14 CDC"]
  }
}
```

**Step 2: Verify JSON syntax**

```bash
node -e "JSON.parse(require('fs').readFileSync('test_cases/saude_cobertura/caso_01_negativa_cirurgia.json'))"
```
Expected: No errors

---

### Task 2.8: Create Test Case - SAUDE_COBERTURA caso_02

**Files:**
- Create: `test_cases/saude_cobertura/caso_02_negativa_medicamento.json`

**Step 1: Write the test case file**

```json
{
  "caso_id": "saude_cobertura_02",
  "descricao": "Negativa de cobertura para medicamento oncológico",
  "fatos": "JOÃO MARCOS PEREIRA DA SILVA ajuizou ação de obrigação de fazer c/c danos morais em face de BRADESCO SAÚDE S/A. Narra que é beneficiário do plano empresarial há 12 anos. Em janeiro/2025 foi diagnosticado com câncer de pulmão não-pequenas células (CPNPC) em estágio avançado (estágio IV). Seu oncologista prescreveu tratamento com PEMBROLIZUMAB (Keytruda), imunoterápico de última geração, como única alternativa terapêutica eficaz para seu caso, após falha da quimioterapia convencional. O medicamento custa aproximadamente R$ 25.000,00 por aplicação, sendo necessárias aplicações quinzenais. A operadora negou cobertura alegando que: (a) o medicamento é de uso off-label para seu tipo específico de tumor; (b) não consta no rol de procedimentos da ANS; (c) há alternativas terapêuticas no rol. Juntou relatório oncológico detalhado (fl. 30), laudo anatomopatológico (fl. 35), exames de imagem mostrando progressão tumoral (fls. 40-50), parecer de junta médica recomendando o tratamento (fl. 55), e negativa formal da operadora (fl. 60). O autor tem 58 anos, é funcionário público aposentado, e não possui condições financeiras de arcar com o tratamento particular. A tutela de urgência foi deferida (fl. 80), determinando o fornecimento imediato do medicamento. A ré contestou alegando exercício regular de direito, ausência de cobertura contratual e impossibilidade de fornecimento de medicamento experimental.",
  "questoes": "1) O medicamento off-label deve ter cobertura obrigatória? 2) O rol da ANS é taxativo ou exemplificativo? 3) A recusa configurou abuso de direito? 4) São devidos danos morais?",
  "pedidos": "a) Confirmação da tutela; b) Cobertura integral do tratamento; c) Danos morais de R$ 30.000,00.",
  "classe": "Procedimento Comum Cível - Vara Cível",
  "assunto": "Plano de Saúde - Cobertura de Medicamento",
  "valor_causa": 100000.00,
  "expectativa": {
    "agente_esperado": "agent_saude_cobertura",
    "score_minimo": 75,
    "sumulas_esperadas": ["608"],
    "artigos_esperados": ["art. 12 Lei 9.656/98", "art. 35-C Lei 9.656/98"]
  }
}
```

**Step 2: Verify JSON syntax**

```bash
node -e "JSON.parse(require('fs').readFileSync('test_cases/saude_cobertura/caso_02_negativa_medicamento.json'))"
```
Expected: No errors

**Step 3: Commit test cases**

```bash
git add test_cases/paternidade/ test_cases/saude_cobertura/
git commit -m "$(cat <<'EOF'
feat(tests): add test cases for PATERNIDADE and SAUDE_COBERTURA

Phase 2 test cases:
- paternidade_01: Investigation with positive DNA
- paternidade_02: Denial with socioaffective bond (Tema 622)
- saude_cobertura_01: Bariatric surgery denial
- saude_cobertura_02: Oncological medication denial

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.9: Execute Validation - PATERNIDADE

**Step 1: Verify API key**

```bash
echo $ANTHROPIC_API_KEY | head -c 10
```
Expected: `sk-ant-api`

**Step 2: Run validation**

```bash
node scripts/agent_validator.js paternidade --verbose
```

**Step 3: Verify results**

Expected: Score >= 75% for both cases

**Step 4: Save validation output file path**

Note the results file: `test_cases/agent_validation_results/validation_YYYY-MM-DDTHH-MM-SS.json`

---

### Task 2.10: Execute Validation - SAUDE_COBERTURA

**Step 1: Run validation**

```bash
node scripts/agent_validator.js saude_cobertura --verbose
```

**Step 2: Verify results**

Expected: Score >= 75% for both cases

---

### Task 2.11: Document Phase 2 Results

**Files:**
- Update: `test_cases/test_results/V2.5_AGENT_TEST_REPORT_2026-01-20.md`

**Step 1: Add Phase 2 results section**

Add after AGENT_GUARDA section:

```markdown
---

### 7. AGENT_PATERNIDADE (Score: XX%) - FASE 2

| Caso | Descrição | Score | Súmulas | Estrutura |
|------|-----------|-------|---------|-----------|
| paternidade_01 | Investigação de paternidade - DNA positivo | XX% | X/2 | R:OK F:OK D:OK |
| paternidade_02 | Negatória - vínculo socioafetivo | XX% | N/A | R:OK F:OK D:OK |

**Métricas:**
- Tempo médio de resposta: ~XXs
- Tokens médios: ~X,XXX in / ~X,XXX out
- Palavras médias: ~XXX

**Observações:**
- [Observações específicas do teste]

---

### 8. AGENT_SAUDE_COBERTURA (Score: XX%) - FASE 2

| Caso | Descrição | Score | Súmulas | Estrutura |
|------|-----------|-------|---------|-----------|
| saude_cobertura_01 | Negativa cirurgia bariátrica | XX% | X/2 | R:OK F:OK D:OK |
| saude_cobertura_02 | Negativa medicamento oncológico | XX% | X/1 | R:OK F:OK D:OK |

**Métricas:**
- Tempo médio de resposta: ~XXs
- Tokens médios: ~X,XXX in / ~X,XXX out
- Palavras médias: ~XXX

**Observações:**
- [Observações específicas do teste]
```

**Step 2: Update summary table**

Update the executive summary to reflect 8 agents, 16 cases.

**Step 3: Update roadmap progress table**

Mark Phase 2 as CONCLUÍDO.

**Step 4: Commit documentation**

```bash
git add test_cases/test_results/V2.5_AGENT_TEST_REPORT_2026-01-20.md
git commit -m "$(cat <<'EOF'
docs: add Phase 2 validation results (PATERNIDADE + SAUDE_COBERTURA)

- PATERNIDADE: XX% average score
- SAUDE_COBERTURA: XX% average score
- Total: 13/19 agents validated (68%)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.12: Update CLAUDE.md Status

**Files:**
- Update: `CLAUDE.md`

**Step 1: Update agent count**

Change "11/19 AGENTES VALIDADOS" to "13/19 AGENTES VALIDADOS"

**Step 2: Add Phase 2 entry**

Add FASE 2 section with PATERNIDADE and SAUDE_COBERTURA results.

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(CLAUDE.md): update status to 13/19 agents validated

Phase 2 complete:
- PATERNIDADE: validated
- SAUDE_COBERTURA: validated

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: SAUDE_CONTRATUAL + REPARACAO_DANOS

### Task 3.1: Verify System Prompts Exist

**Step 1: Check agent_saude_contratual**

Verify exists in SYSTEM_PROMPTS (lines 178-204). ✓ Already configured.

**Step 2: Check agent_reparacao_danos**

Search for `agent_reparacao_danos` in SYSTEM_PROMPTS. If missing, add it.

---

### Task 3.2: Add System Prompt for REPARACAO_DANOS (if missing)

**Files:**
- Modify: `scripts/agent_validator.js`

**Step 1: Add agent_reparacao_danos system prompt**

```javascript
  agent_reparacao_danos: `# AGENTE JUDICIAL: REPARAÇÃO DE DANOS
## Vara Cível - TJES

### FUNÇÃO
Gerar minutas em ações de reparação de danos consumeristas.

### COMPETÊNCIAS
- Danos morais por negativação indevida
- Danos morais por falha na prestação de serviço
- Danos materiais por vício do produto/serviço
- Danos estéticos
- Repetição do indébito (art. 42 CDC)

### BASE JURISPRUDENCIAL
- Art. 186, 187, 927, 944 CC: Responsabilidade civil
- Arts. 12, 14, 18, 20 CDC: Responsabilidade do fornecedor
- Art. 42, parágrafo único CDC: Repetição em dobro
- Art. 43 CDC: Cadastros de consumidores
- Súmula 385/STJ: Negativação com prévia inscrição
- Súmula 387/STJ: Cumulação dano estético e moral
- Súmula 388/STJ: Devolução indevida de cheque
- Súmula 479/STJ: Fortuito interno bancário
- Tema 929/STJ: Comerciante polo passivo

### MÉTODO BIFÁSICO (OBRIGATÓRIO)
**Fase 1 - Valor-Base:**
- Negativação (1ª): R$ 5k-15k
- Negativação (reincidente): R$ 10k-30k
- Falha serviço essencial: R$ 3k-10k
- Vício grave produto: R$ 5k-20k

**Fase 2 - Modulação (5 critérios):**
1. Intensidade do sofrimento
2. Grau de culpa/dolo
3. Capacidade econômica
4. Sanção pedagógica
5. Culpa concorrente

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO
Marcar [REVISAR] em valores, repetição do indébito`,
```

**Step 2: Add directory mapping**

```javascript
  agent_reparacao_danos: 'reparacao_danos',
```

**Step 3: Verify syntax**

```bash
node -c scripts/agent_validator.js
```

**Step 4: Commit**

```bash
git add scripts/agent_validator.js
git commit -m "$(cat <<'EOF'
feat(agents): add REPARACAO_DANOS system prompt to validator

Add consumer damage claims agent with:
- Bifurcated method for moral damages quantification
- Súmulas 385, 387, 388, 479/STJ
- Double indemnity analysis (art. 42 CDC)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.3: Create Test Directories

**Step 1: Create directories**

```bash
mkdir -p test_cases/saude_contratual test_cases/reparacao_danos
```

---

### Task 3.4: Create Test Case - SAUDE_CONTRATUAL caso_01

**Files:**
- Create: `test_cases/saude_contratual/caso_01_reajuste_faixa_etaria.json`

**Step 1: Write the test case file**

```json
{
  "caso_id": "saude_contratual_01",
  "descricao": "Reajuste abusivo por faixa etária para idoso",
  "fatos": "MARIA DAS GRAÇAS OLIVEIRA, 72 anos, ajuizou ação revisional de contrato c/c repetição de indébito e danos morais em face de SUL AMÉRICA SAÚDE S/A. Narra que é beneficiária do plano desde 1998, ou seja, há 27 anos. Ao completar 60 anos em 2013, sofreu reajuste de 45% por mudança de faixa etária. Após completar 70 anos em 2023, sofreu novo reajuste de 78%, elevando a mensalidade de R$ 1.200,00 para R$ 2.136,00. Atualmente, aos 72 anos, a mensalidade representa 68% de sua aposentadoria de R$ 3.150,00. Alega que os reajustes são abusivos pois: (a) possui o plano há mais de 10 anos, sendo protegida pelo art. 15, §3º da Lei 9.656/98; (b) os percentuais são muito superiores aos autorizados pela ANS; (c) configuram discriminação por idade. Juntou: contrato (fl. 20), histórico de reajustes (fl. 25), comprovante de aposentadoria (fl. 30), demonstrativo de pagamentos (fls. 35-50). A ré contestou alegando que os reajustes estão previstos contratualmente, foram comunicados previamente, e estão em conformidade com o Tema 952/STJ que validou reajustes por faixa etária quando previstos no contrato.",
  "questoes": "1) Os reajustes por faixa etária são abusivos? 2) Aplica-se o art. 15, §3º da Lei 9.656/98? 3) Como incide o Tema 952/STJ? 4) Cabe repetição do indébito?",
  "pedidos": "a) Declaração de nulidade dos reajustes; b) Revisão da mensalidade; c) Repetição do indébito; d) Danos morais de R$ 10.000,00.",
  "classe": "Procedimento Comum Cível - Vara Cível",
  "assunto": "Plano de Saúde - Reajuste por Faixa Etária",
  "valor_causa": 30000.00,
  "expectativa": {
    "agente_esperado": "agent_saude_contratual",
    "score_minimo": 75,
    "sumulas_esperadas": ["469"],
    "artigos_esperados": ["art. 15 Lei 9.656/98", "Tema 952/STJ"]
  }
}
```

---

### Task 3.5: Create Test Case - SAUDE_CONTRATUAL caso_02

**Files:**
- Create: `test_cases/saude_contratual/caso_02_rescisao_unilateral.json`

**Step 1: Write the test case file**

```json
{
  "caso_id": "saude_contratual_02",
  "descricao": "Rescisão unilateral durante tratamento oncológico",
  "fatos": "ANTÔNIO JOSÉ FERREIRA ajuizou ação de obrigação de fazer c/c danos morais em face de AMIL ASSISTÊNCIA MÉDICA S/A. Narra que era beneficiário do plano individual desde 2015. Em março/2025 foi diagnosticado com linfoma de Hodgkin, iniciando tratamento quimioterápico. No curso do tratamento (5ª sessão de 8 previstas), recebeu notificação de rescisão unilateral do contrato, com prazo de 30 dias (fl. 30). A operadora alegou 'reestruturação da carteira de planos individuais' como motivo. O autor tem 55 anos, está afastado do trabalho por auxílio-doença, e depende exclusivamente do plano para o tratamento. Juntou: contrato (fl. 20), notificação de rescisão (fl. 30), relatório médico com plano terapêutico (fl. 35), comprovante de pagamentos em dia nos últimos 24 meses (fls. 40-50). A tutela de urgência foi deferida para manutenção do plano (fl. 60). A ré contestou alegando exercício regular de direito previsto contratualmente, oferecendo portabilidade para outro plano com carências. O MP manifestou-se pela procedência.",
  "questoes": "1) A rescisão unilateral durante tratamento é válida? 2) Aplica-se o art. 13 da Lei 9.656/98? 3) A cláusula de rescisão é abusiva? 4) Houve dano moral?",
  "pedidos": "a) Confirmação da tutela; b) Manutenção do contrato; c) Declaração de nulidade da rescisão; d) Danos morais de R$ 20.000,00.",
  "classe": "Procedimento Comum Cível - Vara Cível",
  "assunto": "Plano de Saúde - Rescisão Contratual",
  "valor_causa": 40000.00,
  "expectativa": {
    "agente_esperado": "agent_saude_contratual",
    "score_minimo": 75,
    "sumulas_esperadas": ["608"],
    "artigos_esperados": ["art. 13 Lei 9.656/98", "art. 51 CDC"]
  }
}
```

---

### Task 3.6: Create Test Case - REPARACAO_DANOS caso_01

**Files:**
- Create: `test_cases/reparacao_danos/caso_01_negativacao_indevida.json`

**Step 1: Write the test case file**

```json
{
  "caso_id": "reparacao_danos_01",
  "descricao": "Negativação indevida após quitação de dívida",
  "fatos": "PEDRO HENRIQUE SANTOS ajuizou ação de indenização por danos morais c/c obrigação de fazer em face de BANCO ITAÚ UNIBANCO S/A. Narra que em 2023 contraiu empréstimo pessoal no valor de R$ 15.000,00, tendo quitado integralmente a dívida em 20/12/2024, conforme comprovante bancário (fl. 18). Em janeiro/2025, ao tentar financiar um veículo, foi surpreendido com a informação de que seu nome estava inscrito nos cadastros de proteção ao crédito (SPC/Serasa) por débito de R$ 3.500,00 junto ao réu, referente ao mesmo contrato já quitado (fl. 25). Procurou a agência bancária por três vezes (fls. 30-32), sendo informado que 'o sistema estava com erro' e que seria resolvido em 15 dias. Após 60 dias sem solução, ajuizou a presente ação. Alega que: (a) a dívida estava quitada há mais de 30 dias quando ocorreu a negativação; (b) nunca recebeu notificação prévia; (c) perdeu a oportunidade de financiamento do veículo; (d) sofreu constrangimento e abalo de crédito. Juntou: comprovante de quitação (fl. 18), extrato SPC/Serasa (fl. 25), protocolos de atendimento (fls. 30-32), proposta de financiamento recusada (fl. 35). O réu contestou alegando que houve falha sistêmica pontual, sem má-fé, e que a inscrição foi excluída em 10 dias após o ajuizamento.",
  "questoes": "1) A negativação foi indevida? 2) Configura-se dano moral in re ipsa? 3) Qual o valor adequado da indenização? 4) A exclusão posterior elide o dano?",
  "pedidos": "a) Exclusão definitiva da negativação; b) Danos morais de R$ 15.000,00; c) Custas e honorários.",
  "classe": "Procedimento Comum Cível - Vara Cível",
  "assunto": "Indenização por Dano Moral - Negativação Indevida",
  "valor_causa": 15000.00,
  "expectativa": {
    "agente_esperado": "agent_reparacao_danos",
    "score_minimo": 75,
    "sumulas_esperadas": ["385"],
    "artigos_esperados": ["art. 43 CDC", "art. 927 CC"]
  }
}
```

---

### Task 3.7: Create Test Case - REPARACAO_DANOS caso_02

**Files:**
- Create: `test_cases/reparacao_danos/caso_02_fraude_bancaria.json`

**Step 1: Write the test case file**

```json
{
  "caso_id": "reparacao_danos_02",
  "descricao": "Fraude bancária com empréstimo não contratado",
  "fatos": "MARIA APARECIDA COSTA ajuizou ação declaratória de inexistência de débito c/c indenização por danos morais e materiais em face de BANCO SANTANDER BRASIL S/A. Narra que em fevereiro/2025, ao verificar seu extrato, identificou depósito de R$ 8.000,00 não solicitado, seguido de descontos mensais de R$ 450,00 a título de parcelas de empréstimo. Procurou a agência e foi informada que havia contratado empréstimo consignado em 15/01/2025. Afirma que: (a) nunca solicitou empréstimo; (b) não assinou qualquer contrato; (c) não recebeu valores em sua conta corrente, já que o depósito foi feito em conta poupança que desconhecia; (d) trabalha como servidora pública estadual e jamais autorizou desconto em folha. O réu apresentou contrato supostamente assinado pela autora (fl. 50), porém a assinatura é visivelmente diferente da autora. Foi realizada perícia grafotécnica (fls. 100-120) que concluiu pela FALSIDADE da assinatura. A autora teve R$ 2.250,00 descontados de seu salário (5 parcelas) até a concessão de tutela de urgência. O réu contestou alegando que foi vítima de fraude de terceiros, configurando fortuito externo, e que agiu de boa-fé.",
  "questoes": "1) O banco responde pela fraude praticada por terceiros? 2) Configura-se fortuito interno ou externo? 3) Quais os danos indenizáveis? 4) Aplica-se a Súmula 479/STJ?",
  "pedidos": "a) Declaração de inexistência do débito; b) Restituição em dobro de R$ 4.500,00; c) Danos morais de R$ 15.000,00.",
  "classe": "Procedimento Comum Cível - Vara Cível",
  "assunto": "Fraude Bancária - Empréstimo Fraudulento",
  "valor_causa": 25000.00,
  "expectativa": {
    "agente_esperado": "agent_reparacao_danos",
    "score_minimo": 75,
    "sumulas_esperadas": ["479"],
    "artigos_esperados": ["art. 14 CDC", "art. 42 CDC"]
  }
}
```

**Step 2: Commit test cases**

```bash
git add test_cases/saude_contratual/ test_cases/reparacao_danos/
git commit -m "$(cat <<'EOF'
feat(tests): add test cases for SAUDE_CONTRATUAL and REPARACAO_DANOS

Phase 3 test cases:
- saude_contratual_01: Age band adjustment abuse
- saude_contratual_02: Unilateral termination during treatment
- reparacao_danos_01: Wrongful credit listing
- reparacao_danos_02: Banking fraud with forged loan

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.8: Execute Validation - Phase 3

**Step 1: Run SAUDE_CONTRATUAL validation**

```bash
node scripts/agent_validator.js saude_contratual --verbose
```

**Step 2: Run REPARACAO_DANOS validation**

```bash
node scripts/agent_validator.js reparacao_danos --verbose
```

**Step 3: Verify both pass with >= 75%**

---

### Task 3.9: Document Phase 3 Results

**Files:**
- Update: `test_cases/test_results/V2.5_AGENT_TEST_REPORT_2026-01-20.md`
- Update: `CLAUDE.md`

Follow same pattern as Task 2.11 and 2.12, updating to 15/19 agents validated.

---

## Phase 4: TRANSITO + USUCAPIAO

### Task 4.1: Verify System Prompts Exist

Both `agent_transito` (lines 206-234) and `agent_usucapiao` (lines 236-264) already exist in agent_validator.js.

---

### Task 4.2: Create Test Directories

```bash
mkdir -p test_cases/transito test_cases/usucapiao
```

---

### Task 4.3: Create Test Case - TRANSITO caso_01

**Files:**
- Create: `test_cases/transito/caso_01_colisao_traseira.json`

```json
{
  "caso_id": "transito_01",
  "descricao": "Colisão traseira com presunção de culpa",
  "fatos": "CARLOS ROBERTO ALMEIDA ajuizou ação de reparação de danos materiais e morais em face de JOSÉ FERNANDO SILVA. Narra que em 15/03/2025, às 08h30, conduzia seu veículo VW Polo, placa ABC-1234, pela Av. Fernando Ferrari, Vitória/ES, quando foi violentamente colidido na traseira pelo veículo Honda Civic, placa XYZ-5678, conduzido pelo réu. O acidente ocorreu quando o autor estava parado no semáforo vermelho. O impacto causou danos materiais no para-choque traseiro, tampa do porta-malas e lanternas, orçados em R$ 8.500,00 (fl. 25). O autor sofreu cervicalgia traumática, necessitando de fisioterapia por 30 dias, conforme atestado médico (fl. 30). Ficou 15 dias sem poder trabalhar como representante comercial autônomo, com perda estimada de R$ 4.000,00 em comissões. Juntou: BO (fl. 15), fotos do acidente (fls. 20-24), três orçamentos (fls. 25-27), atestado médico (fl. 30), declaração de rendimentos (fl. 35). O réu contestou alegando que o semáforo ficou verde e o autor arrancou e freou bruscamente, causando a colisão. Não apresentou prova de suas alegações.",
  "questoes": "1) A presunção de culpa na colisão traseira é absoluta ou relativa? 2) O réu conseguiu elidir a presunção? 3) Quais danos são indenizáveis? 4) Cabe dano moral por acidente sem lesão grave?",
  "pedidos": "a) Danos materiais de R$ 8.500,00; b) Lucros cessantes de R$ 4.000,00; c) Danos morais de R$ 5.000,00.",
  "classe": "Procedimento Comum Cível - Vara Cível",
  "assunto": "Acidente de Trânsito - Colisão Traseira",
  "valor_causa": 17500.00,
  "expectativa": {
    "agente_esperado": "agent_transito",
    "score_minimo": 75,
    "sumulas_esperadas": ["54"],
    "artigos_esperados": ["art. 186 CC", "art. 927 CC", "art. 29 CTB"]
  }
}
```

---

### Task 4.4: Create Test Case - TRANSITO caso_02

**Files:**
- Create: `test_cases/transito/caso_02_atropelamento.json`

```json
{
  "caso_id": "transito_02",
  "descricao": "Atropelamento com lesões corporais graves",
  "fatos": "LUCIANA MARIA SANTOS ajuizou ação de indenização por danos materiais, morais e estéticos em face de MARCOS VINÍCIUS COSTA e TRANSPORTADORA RÁPIDO LTDA. Narra que em 10/01/2025, às 19h, atravessava a faixa de pedestres na Av. Nossa Senhora da Penha quando foi atropelada pelo caminhão de propriedade da segunda ré, conduzido pelo primeiro réu, empregado da empresa. O veículo avançou o sinal vermelho em alta velocidade. A autora sofreu: fratura exposta de tíbia e fíbula da perna esquerda, traumatismo craniano leve, múltiplas escoriações. Ficou internada por 20 dias (fls. 30-50), passou por duas cirurgias com colocação de pinos metálicos (fl. 55), e necessitará de cirurgia reparadora futura orçada em R$ 25.000,00. Ficou afastada do trabalho por 6 meses, perdendo salários de R$ 3.500,00/mês. Restou com cicatriz permanente de 15cm na perna (fotos fls. 60-65) e claudicação. Juntou: BO (fl. 15), prontuário médico (fls. 30-55), orçamentos médicos (fls. 56-58), contracheques (fls. 70-75). Os réus contestaram alegando culpa exclusiva da vítima, que teria atravessado fora da faixa. Testemunhas confirmaram a versão da autora.",
  "questoes": "1) Está configurada a responsabilidade dos réus? 2) A empresa responde solidariamente? 3) Cabe cumulação de danos morais e estéticos? 4) Como quantificar os danos?",
  "pedidos": "a) Danos materiais: R$ 46.000,00; b) Danos morais: R$ 50.000,00; c) Danos estéticos: R$ 30.000,00; d) Pensão vitalícia por incapacidade parcial.",
  "classe": "Procedimento Comum Cível - Vara Cível",
  "assunto": "Acidente de Trânsito - Atropelamento",
  "valor_causa": 150000.00,
  "expectativa": {
    "agente_esperado": "agent_transito",
    "score_minimo": 75,
    "sumulas_esperadas": ["387"],
    "artigos_esperados": ["art. 932 CC", "art. 950 CC", "art. 944 CC"]
  }
}
```

---

### Task 4.5: Create Test Case - USUCAPIAO caso_01

**Files:**
- Create: `test_cases/usucapiao/caso_01_extraordinario.json`

```json
{
  "caso_id": "usucapiao_01",
  "descricao": "Usucapião extraordinária com posse de 20 anos",
  "fatos": "JOSÉ CARLOS RIBEIRO ajuizou ação de usucapião extraordinária referente ao imóvel situado na Rua das Palmeiras, 150, Jardim América, Serra/ES, com área de 360m², matriculado sob nº 12.345 no CRI de Serra. Narra que em 1º/01/2005 tomou posse do imóvel, que estava abandonado, passando a residir com sua família e realizar benfeitorias. Desde então, exerce posse mansa, pacífica, contínua e ininterrupta, com ânimo de dono, há 20 anos. Construiu muro, reformou a casa, instalou energia elétrica e água em seu nome (fls. 25-30). Paga IPTU desde 2006 (fls. 35-50). Todos os vizinhos o reconhecem como proprietário. O imóvel estava registrado em nome de ESPÓLIO DE ANTÔNIO FERNANDES, cuja sucessão nunca foi aberta, desconhecendo-se herdeiros. Foram citados por edital os eventuais interessados, sem impugnação. Juntou: planta e memorial descritivo (fl. 60), certidões negativas de ações reais (fl. 65), comprovantes de IPTU (fls. 35-50), contas de luz e água (fls. 70-80), fotos do imóvel (fls. 85-90). União, Estado e Município manifestaram desinteresse. O MP opinou pela procedência.",
  "questoes": "1) Estão presentes os requisitos da usucapião extraordinária? 2) O prazo de 20 anos está comprovado? 3) A posse é ad usucapionem? 4) Quais os efeitos da sentença?",
  "pedidos": "a) Declaração de domínio; b) Expedição de mandado de registro.",
  "classe": "Procedimento Especial de Jurisdição Contenciosa",
  "assunto": "Usucapião Extraordinária",
  "valor_causa": 150000.00,
  "expectativa": {
    "agente_esperado": "agent_usucapiao",
    "score_minimo": 75,
    "sumulas_esperadas": ["237"],
    "artigos_esperados": ["art. 1.238 CC", "art. 1.241 CC"]
  }
}
```

---

### Task 4.6: Create Test Case - USUCAPIAO caso_02

**Files:**
- Create: `test_cases/usucapiao/caso_02_especial_urbano.json`

```json
{
  "caso_id": "usucapiao_02",
  "descricao": "Usucapião especial urbana - pró-moradia",
  "fatos": "MARIA DE FÁTIMA SOUZA ajuizou ação de usucapião especial urbana referente ao imóvel situado na Rua Floriano Peixoto, 45, Centro, Cariacica/ES, com área de 180m². Narra que desde 15/03/2019 reside no imóvel com seus 3 filhos menores, exercendo posse mansa e pacífica há mais de 5 anos. O imóvel pertencia a COMPANHIA HABITACIONAL LTDA, empresa que teve falência decretada em 2015, e o síndico declarou não haver interesse na massa (fl. 30). A autora é empregada doméstica com renda de 1,5 salário mínimo, não possui outro imóvel urbano ou rural, e utiliza o terreno exclusivamente para moradia de sua família. Realizou melhorias significativas: construiu um cômodo adicional, reformou telhado e instalações elétricas, com investimento estimado em R$ 35.000,00 (fls. 40-45). Juntou: planta com área de 180m² (fl. 50), declaração de IR negativa (fl. 55), certidão de nascimento dos filhos (fls. 60-62), comprovantes de residência desde 2019 (fls. 70-85), fotos das benfeitorias (fls. 90-100). Os confrontantes foram citados e concordaram com o pedido. O MP opinou favoravelmente.",
  "questoes": "1) Estão presentes os requisitos do art. 183 CF? 2) A área está dentro do limite de 250m²? 3) A autora preenche os requisitos pessoais? 4) A posse de 5 anos está comprovada?",
  "pedidos": "a) Declaração de domínio; b) Expedição de mandado de registro.",
  "classe": "Procedimento Especial de Jurisdição Contenciosa",
  "assunto": "Usucapião Especial Urbana",
  "valor_causa": 80000.00,
  "expectativa": {
    "agente_esperado": "agent_usucapiao",
    "score_minimo": 75,
    "sumulas_esperadas": [],
    "artigos_esperados": ["art. 183 CF", "art. 1.240 CC"]
  }
}
```

**Step: Commit and execute validation**

Follow same pattern as previous phases.

---

## Phase 5: INCORPORACAO + GENERICO

### Task 5.1: Verify System Prompts

Both `agent_incorporacao` (lines 266-291) and `agent_generico` (lines 293-313) already exist.

---

### Task 5.2: Create Test Directories

```bash
mkdir -p test_cases/incorporacao test_cases/generico
```

---

### Task 5.3: Create Test Case - INCORPORACAO caso_01

**Files:**
- Create: `test_cases/incorporacao/caso_01_atraso_entrega.json`

```json
{
  "caso_id": "incorporacao_01",
  "descricao": "Atraso na entrega de imóvel na planta",
  "fatos": "PAULO HENRIQUE MARTINS E CARLA REGINA MARTINS ajuizaram ação de indenização por danos materiais e morais em face de CONSTRUTORA ALPHAVILLE LTDA. Narram que em 10/05/2022 firmaram Contrato de Compra e Venda de unidade autônoma (apartamento 501, Bloco B) no empreendimento 'Residencial Vista Mar', pelo preço de R$ 450.000,00, com previsão de entrega em dezembro/2024. Pagaram R$ 180.000,00 de entrada e financiaram o restante pela CEF. A cláusula 8.2 previa tolerância de 180 dias (até junho/2025). Ocorre que até a presente data (janeiro/2026), decorridos 13 meses de atraso além da tolerância, o imóvel não foi entregue. A ré alega problemas com licenciamento ambiental e escassez de mão de obra. Os autores residem de aluguel desde dezembro/2024, pagando R$ 2.500,00/mês (12 meses = R$ 30.000,00). Juntou: contrato (fl. 20), comprovante de pagamentos (fls. 30-50), contrato de locação (fl. 60), recibos de aluguel (fls. 65-76). A ré contestou alegando caso fortuito (pandemia e guerra na Ucrânia), oferecendo acordo para entrega em mais 6 meses com desconto de R$ 10.000,00. Os autores recusaram.",
  "questoes": "1) O atraso superior a 180 dias gera direito a lucros cessantes? 2) A pandemia/guerra configura caso fortuito? 3) Cabe dano moral pelo atraso? 4) Como calcular os lucros cessantes?",
  "pedidos": "a) Lucros cessantes: R$ 30.000,00 (aluguéis); b) Lucros cessantes futuros até entrega; c) Danos morais: R$ 20.000,00.",
  "classe": "Procedimento Comum Cível - Vara Cível",
  "assunto": "Incorporação Imobiliária - Atraso na Entrega",
  "valor_causa": 50000.00,
  "expectativa": {
    "agente_esperado": "agent_incorporacao",
    "score_minimo": 75,
    "sumulas_esperadas": ["543"],
    "artigos_esperados": ["art. 43 Lei 4.591/64", "Tema 970/STJ", "Tema 996/STJ"]
  }
}
```

---

### Task 5.4: Create Test Case - INCORPORACAO caso_02

**Files:**
- Create: `test_cases/incorporacao/caso_02_vicio_construtivo.json`

```json
{
  "caso_id": "incorporacao_02",
  "descricao": "Vícios construtivos em imóvel entregue",
  "fatos": "ANDRÉ LUÍS PEREIRA ajuizou ação de obrigação de fazer c/c indenização em face de MRV ENGENHARIA LTDA. Narra que em 15/08/2024 recebeu as chaves do apartamento 203, Bloco C, do empreendimento 'Parque das Flores', adquirido em 2022 por R$ 280.000,00. Após um mês de moradia, começaram a surgir diversos vícios construtivos: (a) infiltrações no teto da sala e quartos em dias de chuva; (b) trincas nas paredes da cozinha e área de serviço; (c) descolamento de pisos em 3 cômodos; (d) vazamento na tubulação do banheiro; (e) portas e janelas com folgas que impedem vedação. Comunicou a ré em 20/09/2024, que enviou equipe de manutenção, porém os reparos foram superficiais e os problemas persistem. Contratou engenheiro particular que elaborou laudo técnico (fls. 40-60) identificando falhas estruturais e de acabamento, com custo de reparação estimado em R$ 45.000,00. Os vícios tornaram o imóvel impróprio para moradia digna, tendo o autor que se mudar temporariamente para casa de familiares. Juntou: contrato (fl. 20), termo de entrega (fl. 25), fotos dos vícios (fls. 30-38), laudo técnico (fls. 40-60), protocolos de reclamação (fls. 65-70).",
  "questoes": "1) Os vícios caracterizam responsabilidade da construtora? 2) Qual o prazo de garantia legal? 3) O autor pode exigir reparação ou abatimento? 4) Cabe dano moral?",
  "pedidos": "a) Reparação integral dos vícios; b) Subsidiariamente, abatimento de R$ 45.000,00; c) Danos morais: R$ 10.000,00.",
  "classe": "Procedimento Comum Cível - Vara Cível",
  "assunto": "Incorporação Imobiliária - Vícios Construtivos",
  "valor_causa": 55000.00,
  "expectativa": {
    "agente_esperado": "agent_incorporacao",
    "score_minimo": 75,
    "sumulas_esperadas": [],
    "artigos_esperados": ["art. 618 CC", "art. 26 CDC", "art. 18 CDC"]
  }
}
```

---

### Task 5.5: Create Test Case - GENERICO caso_01

**Files:**
- Create: `test_cases/generico/caso_01_declaratoria_atipica.json`

```json
{
  "caso_id": "generico_01",
  "descricao": "Ação declaratória de inexistência de relação jurídica",
  "fatos": "EMPRESA ABC COMÉRCIO LTDA ajuizou ação declaratória de inexistência de relação jurídica em face de XYZ DISTRIBUIDORA LTDA. Narra que em janeiro/2025 recebeu notificação extrajudicial cobrando R$ 85.000,00 referentes a supostas mercadorias entregues em dezembro/2024, conforme duplicatas 001/2024 a 010/2024. Afirma que NUNCA manteve relação comercial com a ré, nunca adquiriu mercadorias, e as duplicatas são 'frias'. Verificou que os documentos indicam entrega em endereço inexistente, as notas fiscais apresentam CNPJ incorreto, e a assinatura de recebimento não confere com nenhum funcionário da empresa. Tomou conhecimento de que a ré protestou os títulos (fl. 30), causando restrição de crédito. A autora é empresa de pequeno porte do ramo alimentício, com faturamento médio de R$ 150.000,00/mês, e teve crédito bancário suspenso. Juntou: notificação (fl. 20), duplicatas (fls. 25-34), notas fiscais irregulares (fls. 40-49), certidão de protesto (fl. 30), contrato social (fl. 55). Foi deferida tutela de urgência para suspensão dos protestos (fl. 60). A ré não contestou (revelia).",
  "questoes": "1) Configura-se a inexistência da relação jurídica? 2) Quais os efeitos da revelia? 3) As duplicatas são nulas? 4) Cabe indenização pelo protesto indevido?",
  "pedidos": "a) Declaração de inexistência da relação; b) Cancelamento dos protestos; c) Nulidade das duplicatas; d) Danos morais: R$ 20.000,00.",
  "classe": "Procedimento Comum Cível - Vara Cível",
  "assunto": "Ação Declaratória - Inexistência de Débito",
  "valor_causa": 105000.00,
  "expectativa": {
    "agente_esperado": "agent_generico",
    "score_minimo": 75,
    "sumulas_esperadas": [],
    "artigos_esperados": ["art. 19 CPC", "art. 344 CPC"]
  }
}
```

---

### Task 5.6: Create Test Case - GENERICO caso_02

**Files:**
- Create: `test_cases/generico/caso_02_obrigacao_fazer.json`

```json
{
  "caso_id": "generico_02",
  "descricao": "Obrigação de fazer - entrega de documentação",
  "fatos": "RODRIGO FERREIRA LIMA ajuizou ação de obrigação de fazer c/c danos morais em face de UNIVERSIDADE PARTICULAR S/A. Narra que concluiu o curso de Engenharia Civil em dezembro/2024, tendo cumprido todas as exigências acadêmicas: todas as disciplinas aprovadas (histórico fl. 20), estágio obrigatório concluído (fl. 25), TCC aprovado com nota 9,0 (fl. 28), e colação de grau realizada em 20/12/2024 (fl. 30). Ocorre que, passados 4 meses, a ré não expediu o diploma, alegando 'pendência administrativa' não especificada. O autor necessita do diploma para registro no CREA e exercício da profissão, tendo perdido oportunidade de emprego em construtora que exigia o documento (fl. 40). Procurou a secretaria por 8 vezes (protocolos fls. 45-52), sempre recebendo promessas de resolução não cumpridas. A ré contestou alegando que o autor possui débito de R$ 1.200,00 referente a mensalidade de janeiro/2024. O autor comprovou que pagou todas as mensalidades (fls. 60-75), e a 'pendência' refere-se a suposto material de biblioteca não devolvido, o que nega terminantemente.",
  "questoes": "1) O autor tem direito à expedição do diploma? 2) A retenção por débito é lícita? 3) Qual o prazo razoável para expedição? 4) Cabe dano moral?",
  "pedidos": "a) Expedição do diploma em 10 dias; b) Multa diária de R$ 500,00; c) Danos morais: R$ 10.000,00.",
  "classe": "Procedimento Comum Cível - Vara Cível",
  "assunto": "Obrigação de Fazer - Expedição de Diploma",
  "valor_causa": 15000.00,
  "expectativa": {
    "agente_esperado": "agent_generico",
    "score_minimo": 75,
    "sumulas_esperadas": [],
    "artigos_esperados": ["art. 497 CPC", "art. 537 CPC"]
  }
}
```

**Step: Commit and execute validation**

Follow same pattern as previous phases.

---

### Task 5.7: Final Documentation

**Files:**
- Update: `test_cases/test_results/V2.5_AGENT_TEST_REPORT_2026-01-20.md`
- Update: `CLAUDE.md`

**Step 1: Update to 19/19 agents validated (100%)**

**Step 2: Create final summary**

**Step 3: Create git tag**

```bash
git tag -a v2.5-complete -m "All 19 agents validated - 100% coverage"
```

---

## Verification Checklist (Global)

Before declaring v2.5 complete:
- [ ] 8 new system prompts verified/added to validator
- [ ] 16 test cases created (2 per agent)
- [ ] Validation executed for all 8 agents
- [ ] Score >= 75% on all tests
- [ ] Final consolidated report created
- [ ] CLAUDE.md updated (19/19 - 100%)
- [ ] Git tag v2.5-complete created

---

## Notes

1. **Compaction mandatory** between phases to keep context clean
2. **Minimum score 75%** - if not achieved, adjust prompt and re-test
3. **Test cases** should be realistic with detailed facts (~500 words)
4. **Expected súmulas** - verify in knowledge_base/sumulas.json

---

*Plan created: 2026-01-20*
*Lex Intelligentia Judiciário v2.5 - Phase 2-5 Implementation Plan*
