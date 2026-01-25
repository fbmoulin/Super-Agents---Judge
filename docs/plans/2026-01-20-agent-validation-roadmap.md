# Lex Intelligentia v2.5 - Roadmap de Validação dos Agentes Pendentes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan phase-by-phase.

**Goal:** Validar os 10 agentes pendentes organizados em 5 fases de 2 agentes cada, priorizados por volume de casos (CNJ Justiça em Números).

**Architecture:** Testes diretos via Anthropic API usando agent_validator.js com system prompts específicos de cada agente.

**Tech Stack:** Node.js, Anthropic API (Claude Sonnet 4), agent_validator.js

---

## Contexto

**Agentes já validados (9/19):**
- agent_BANCARIO, agent_CONSUMIDOR, agent_EXECUCAO, agent_LOCACAO, agent_POSSESSORIAS (v2.1)
- agent_COBRANCA, agent_DIVORCIO, agent_INVENTARIO, agent_SEGUROS (v2.5)

**Agentes pendentes (10):**
- Família: ALIMENTOS (~8-12%), GUARDA (~5-8%), PATERNIDADE (~5-8%)
- Saúde: SAUDE_COBERTURA (~15%), SAUDE_CONTRATUAL (~10%)
- RC: REPARACAO_DANOS (~10-15%), TRANSITO (~12%)
- Propriedade: USUCAPIAO (~5%), INCORPORACAO (~8%)
- Fallback: GENERICO (~5%)

---

## Ciclo de Cada Fase

Cada fase segue este ciclo:
1. **S1:Setup** - Verificar/criar system prompts no validator
2. **S2:Test** - Criar 2 casos de teste por agente
3. **S3:Execute** - Executar validação via API
4. **S4:Fix** - Ajustar prompts se score < 75%
5. **S5:Document** - Registrar resultados e compact

---

## Fase 1: ALIMENTOS + GUARDA (Família - Alta Prioridade)

**Volume estimado:** ~13-20% dos casos TJES

### Prerequisites
- [x] agent_ALIMENTOS.md definido (v2.4)
- [x] agent_GUARDA.md definido (v2.4)
- [ ] System prompts no agent_validator.js

### Task 1.1: Configurar System Prompts

**Files:**
- Modify: `scripts/agent_validator.js`

**Step 1:** Verificar se agent_alimentos já existe no validator
**Step 2:** Se não existir, adicionar system prompt baseado em agents/agent_ALIMENTOS.md
**Step 3:** Verificar se agent_guarda já existe no validator
**Step 4:** Se não existir, adicionar system prompt baseado em agents/agent_GUARDA.md

---

### Task 1.2: Criar Casos de Teste - ALIMENTOS

**Files:**
- Create: `test_cases/alimentos/caso_01_alimentos_revisional.json`
- Create: `test_cases/alimentos/caso_02_alimentos_exoneracao.json`

Casos devem cobrir:
- Ação revisional de alimentos (majoração/redução)
- Ação de exoneração de alimentos

**Estrutura do caso:**
```json
{
  "caso_id": "alimentos_01",
  "descricao": "...",
  "fatos": "...",
  "questoes": "...",
  "pedidos": "...",
  "classe": "Procedimento Comum Cível",
  "assunto": "...",
  "valor_causa": 0.00,
  "expectativa": {
    "agente_esperado": "agent_alimentos",
    "score_minimo": 75,
    "sumulas_esperadas": ["309", "358"],
    "artigos_esperados": ["art. 1.694 CC", "art. 1.699 CC"]
  }
}
```

---

### Task 1.3: Criar Casos de Teste - GUARDA

**Files:**
- Create: `test_cases/guarda/caso_01_guarda_compartilhada.json`
- Create: `test_cases/guarda/caso_02_guarda_unilateral.json`

Casos devem cobrir:
- Regulamentação de guarda compartilhada com visitas
- Modificação de guarda (unilateral por descumprimento)

---

### Task 1.4: Executar Validação

**Step 1:** Verificar API key configurada
```bash
echo $ANTHROPIC_API_KEY | head -c 10
```

**Step 2:** Testar cada agente
```bash
node scripts/agent_validator.js alimentos --verbose
node scripts/agent_validator.js guarda --verbose
```

**Step 3:** Verificar scores >= 75%

---

### Task 1.5: Documentar e Compact

**Files:**
- Update: `test_cases/test_results/V2.5_AGENT_TEST_REPORT_2026-01-20.md`

**Step 1:** Adicionar resultados da Fase 1 ao relatório
**Step 2:** Atualizar CLAUDE.md com novo status (11/19 validados)
**Step 3:** Commit das mudanças
**Step 4:** Solicitar compact da sessão antes de Fase 2

---

## Fase 2: PATERNIDADE + SAUDE_COBERTURA (Família/Saúde)

**Volume estimado:** ~20-23% dos casos TJES

### Task 2.1: Configurar System Prompts

**Files:**
- Modify: `scripts/agent_validator.js`

**Step 1:** Adicionar/verificar system prompt agent_paternidade
**Step 2:** Adicionar/verificar system prompt agent_saude_cobertura

---

### Task 2.2: Criar Casos de Teste - PATERNIDADE

**Files:**
- Create: `test_cases/paternidade/caso_01_investigacao_paternidade.json`
- Create: `test_cases/paternidade/caso_02_negatoria_paternidade.json`

Casos devem cobrir:
- Investigação de paternidade com DNA
- Negatória de paternidade socioafetiva

---

### Task 2.3: Criar Casos de Teste - SAUDE_COBERTURA

**Files:**
- Create: `test_cases/saude_cobertura/caso_01_negativa_cirurgia.json`
- Create: `test_cases/saude_cobertura/caso_02_negativa_medicamento.json`

Casos devem cobrir:
- Negativa de cobertura para procedimento cirúrgico
- Negativa de cobertura para medicamento off-label

---

### Task 2.4: Executar Validação

```bash
node scripts/agent_validator.js paternidade --verbose
node scripts/agent_validator.js saude_cobertura --verbose
```

---

### Task 2.5: Documentar e Compact

**Step 1:** Adicionar resultados da Fase 2 ao relatório
**Step 2:** Atualizar CLAUDE.md (13/19 validados)
**Step 3:** Compact antes de Fase 3

---

## Fase 3: SAUDE_CONTRATUAL + REPARACAO_DANOS (Saúde/RC)

**Volume estimado:** ~20-25% dos casos TJES

### Task 3.1: Configurar System Prompts

**Step 1:** Adicionar/verificar system prompt agent_saude_contratual
**Step 2:** Adicionar/verificar system prompt agent_reparacao_danos

---

### Task 3.2: Criar Casos de Teste - SAUDE_CONTRATUAL

**Files:**
- Create: `test_cases/saude_contratual/caso_01_reajuste_faixa_etaria.json`
- Create: `test_cases/saude_contratual/caso_02_rescisao_contratual.json`

Casos devem cobrir:
- Reajuste abusivo por faixa etária
- Rescisão unilateral do contrato

---

### Task 3.3: Criar Casos de Teste - REPARACAO_DANOS

**Files:**
- Create: `test_cases/reparacao_danos/caso_01_negativacao_indevida.json`
- Create: `test_cases/reparacao_danos/caso_02_fraude_bancaria.json`

Casos devem cobrir:
- Negativação indevida SPC/Serasa
- Fraude bancária com danos morais

---

### Task 3.4: Executar Validação

```bash
node scripts/agent_validator.js saude_contratual --verbose
node scripts/agent_validator.js reparacao_danos --verbose
```

---

### Task 3.5: Documentar e Compact

**Step 1:** Adicionar resultados da Fase 3 ao relatório
**Step 2:** Atualizar CLAUDE.md (15/19 validados)
**Step 3:** Compact antes de Fase 4

---

## Fase 4: TRANSITO + USUCAPIAO (RC/Propriedade)

**Volume estimado:** ~17% dos casos TJES

### Task 4.1: Configurar System Prompts

**Step 1:** Adicionar/verificar system prompt agent_transito
**Step 2:** Adicionar/verificar system prompt agent_usucapiao

---

### Task 4.2: Criar Casos de Teste - TRANSITO

**Files:**
- Create: `test_cases/transito/caso_01_colisao_traseira.json`
- Create: `test_cases/transito/caso_02_atropelamento.json`

Casos devem cobrir:
- Colisão traseira (presunção de culpa)
- Atropelamento com lesão corporal

---

### Task 4.3: Criar Casos de Teste - USUCAPIAO

**Files:**
- Create: `test_cases/usucapiao/caso_01_usucapiao_extraordinario.json`
- Create: `test_cases/usucapiao/caso_02_usucapiao_especial_urbano.json`

Casos devem cobrir:
- Usucapião extraordinário (15 anos)
- Usucapião especial urbano (art. 183 CF)

---

### Task 4.4: Executar Validação

```bash
node scripts/agent_validator.js transito --verbose
node scripts/agent_validator.js usucapiao --verbose
```

---

### Task 4.5: Documentar e Compact

**Step 1:** Adicionar resultados da Fase 4 ao relatório
**Step 2:** Atualizar CLAUDE.md (17/19 validados)
**Step 3:** Compact antes de Fase 5

---

## Fase 5: INCORPORACAO + GENERICO (Propriedade/Fallback)

**Volume estimado:** ~13% dos casos TJES

### Task 5.1: Configurar System Prompts

**Step 1:** Adicionar/verificar system prompt agent_incorporacao
**Step 2:** Verificar system prompt agent_generico (fallback)

---

### Task 5.2: Criar Casos de Teste - INCORPORACAO

**Files:**
- Create: `test_cases/incorporacao/caso_01_atraso_entrega.json`
- Create: `test_cases/incorporacao/caso_02_vicio_construtivo.json`

Casos devem cobrir:
- Atraso na entrega de imóvel na planta
- Vícios construtivos em unidade entregue

---

### Task 5.3: Criar Casos de Teste - GENERICO

**Files:**
- Create: `test_cases/generico/caso_01_declaratoria_atipica.json`
- Create: `test_cases/generico/caso_02_obrigacao_fazer.json`

Casos devem cobrir:
- Ação declaratória atípica
- Obrigação de fazer não categorizada

---

### Task 5.4: Executar Validação

```bash
node scripts/agent_validator.js incorporacao --verbose
node scripts/agent_validator.js generico --verbose
```

---

### Task 5.5: Documentar e Finalizar

**Step 1:** Adicionar resultados da Fase 5 ao relatório
**Step 2:** Atualizar CLAUDE.md (19/19 validados - 100%)
**Step 3:** Criar relatório final consolidado
**Step 4:** Commit e tag v2.5-complete

---

## Verification Checklist (Global)

Antes de declarar v2.5 completo:
- [ ] 10 novos system prompts adicionados ao validator
- [ ] 20 casos de teste criados (2 por agente)
- [ ] Validação executada para todos os 10 agentes
- [ ] Score >= 75% em todos os testes
- [ ] Relatório final consolidado
- [ ] CLAUDE.md atualizado (19/19 - 100%)

---

## Notas

1. **Compaction obrigatório** entre fases para manter contexto limpo
2. **Score mínimo 75%** - se não atingido, ajustar prompt e re-testar
3. **Casos de teste** devem ser realistas com fatos detalhados (~500 palavras)
4. **Súmulas esperadas** verificar no knowledge_base/sumulas.json

---

*Plan created: 2026-01-20*
*Lex Intelligentia Judiciário v2.5 - Agent Validation Roadmap*
