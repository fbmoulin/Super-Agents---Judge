# Catálogo de Prompts Templates

**Data:** 2026-01-19
**Fonte:** Google Drive (prompts coletados nos últimos 6 meses)
**Total:** 11 arquivos

---

## Mapeamento: Prompts vs Agentes v2.2

| # | Arquivo Template | Agente v2.2 | Status | Ação Recomendada |
|---|------------------|-------------|--------|------------------|
| 1 | PROMPT - Sentença-Banco (dez-25) | agent_BANCARIO | ✅ Match | Atualizar com súmulas |
| 2 | PROMPT OTIMIZADO - CONTRATOS BANCÁRIOS | agent_BANCARIO | ✅ Match | **SUBSTITUIR** (mais completo) |
| 3 | PROMPT CLAUDE - LIMINAR BANCÁRIA | agent_BANCARIO | ⚠️ Parcial | Criar sub-agente liminares |
| 4 | PROMPT - Sentença Cível Genérica | agent_GENERICO | ✅ Match | Atualizar metodologia |
| 5 | PROMPT CLAUDE - SENTENÇA AREA MÉDICA | agent_SAUDE_COBERTURA | ✅ Match | **SUBSTITUIR** (v4.0) |
| 6 | PROMPT CLAUDE - LIMINAR ÁREA MÉDICA | agent_SAUDE_COBERTURA | ⚠️ Parcial | Criar sub-agente liminares |
| 7 | PROMPT OTIMIZADO - DANO MORAL TRÂNSITO | agent_TRANSITO | ✅ Match | **SUBSTITUIR** (v2.0) |
| 8 | PROMPT OTIMIZADO - COMPRA E VENDA IMÓVEIS | agent_INCORPORACAO | ✅ Match | **SUBSTITUIR** (v2.0) |
| 9 | Prompt sentença usucapião avançado | agent_USUCAPIAO | ✅ Match | **SUBSTITUIR** (LEX MAGISTER) |
| 10 | PROMPT - Prescrição Intercorrente | agent_EXECUCAO | 🆕 Novo | **INTEGRAR** ao agente |
| 11 | Prompt - Embargos de Declaração | - | 🆕 Novo | **CRIAR** novo agente |

---

## Análise Detalhada por Prompt

### 1. Bancário - Versão Atual vs Nova

**Arquivo:** `PROMPT OTIMIZADO PARA MAGISTRADO - ELABORAÇÃO DE SENTENÇAS EM CONTRATOS BANCÁRIOS.md`
**Versão:** 2.0 (atualizado com Tema 1.368 STJ)

**Melhorias identificadas:**
- ✅ Tabela completa de Súmulas STJ (297, 382, 539, 541, 30, 472, 565)
- ✅ Temas repetitivos (972, EAREsp 676.608/RS)
- ✅ Resoluções CMN/BACEN (3.517, 3.518, 4.558)
- ✅ Prazos prescricionais detalhados
- ✅ Frameworks: juros excessivos, capitalização, venda casada
- ✅ Método bifásico para danos morais com faixas TJES
- ✅ Exemplos de relatório, fundamentação e dispositivo
- ✅ Checklist de qualidade

**Tokens estimados:** ~4.500 (vs ~380 atual)

---

### 2. Saúde - Versão 4.0

**Arquivo:** `PROMPT CLAUDE - SENTENÇA AREA MÉDICA.md`
**Versão:** 4.0 FINAL

**Melhorias identificadas:**
- ✅ Súmulas 302, 469, 597, 608, 609 STJ
- ✅ Lei 9.656/98 e Resoluções ANS
- ✅ Tema 952 (reajuste por faixa etária)
- ✅ Rol ANS exemplificativo (Lei 14.454/22)
- ✅ Metodologia 5 camadas por questão
- ✅ Temas: negativa cobertura, urgência/emergência, doença preexistente

---

### 3. Trânsito - Versão 2.0

**Arquivo:** `PROMPT OTIMIZADO PARA MAGISTRADO - AÇÕES DE DANO MORAL POR ACIDENTE DE TRÂNSITO.md`
**Versão:** 2.0

**Melhorias identificadas:**
- ✅ 12 tipos de acidentes catalogados
- ✅ 7 modalidades de responsabilidade
- ✅ Arts. 186, 187, 927 CC
- ✅ Art. 37, §6º CF (responsabilidade Estado)
- ✅ Arts. 932, 933 CC (responsabilidade por fato de terceiro)
- ✅ CTB Lei 9.503/97
- ✅ Tabela de danos morais por gravidade

---

### 4. Incorporação Imobiliária - Versão 2.0

**Arquivo:** `PROMPT OTIMIZADO PARA MAGISTRADO - AÇÕES DE COMPRA E VENDA DE IMÓVEIS NA PLANTA.md`
**Versão:** 2.0

**Melhorias identificadas:**
- ✅ Temas 970, 996 STJ
- ✅ Súmula 543 STJ
- ✅ Lei 4.591/64
- ✅ Prazo tolerância 180 dias
- ✅ SATI e comissão de corretagem
- ✅ Lucros cessantes por atraso

---

### 5. Usucapião - LEX MAGISTER v1.0

**Arquivo:** `Prompt sentença usucapião avançado.md`
**Versão:** LEX MAGISTER v1.0

**Melhorias identificadas:**
- ✅ Art. 1.238 CC (extraordinária)
- ✅ Tema 985 STJ (não exige área mínima)
- ✅ REsp 1.361.226/MG (prazo durante ação)
- ✅ Súmula 340 STF (bens públicos)
- ✅ 4 fases estruturadas
- ✅ LGPD compliance (mascaramento PII)

---

### 6. Prescrição Intercorrente - NOVO

**Arquivo:** `PROMPT - Prescrição Intercorrente.md`

**Uso:** Integrar ao agent_EXECUCAO

**Conteúdo:**
- ✅ Art. 921, III, §§ 1º, 4º, 4º-A, 5º CPC
- ✅ Marcos interruptivos e suspensivos
- ✅ Análise sistemática de prescrição em execuções

---

### 7. Embargos de Declaração - NOVO

**Arquivo:** `Prompt - Embargos de Declaração - Claude.md`

**Uso:** Criar novo agente ou sub-fluxo

**Conteúdo:**
- ✅ Art. 1.022 CPC (omissão, contradição, obscuridade)
- ✅ Art. 489, §1º CPC
- ✅ Análise de cabimento

---

## Recomendações de Implementação

### Prioridade ALTA (Substituir imediatamente)
1. **agent_BANCARIO** → Usar PROMPT OTIMIZADO CONTRATOS BANCÁRIOS
2. **agent_SAUDE_COBERTURA** → Usar PROMPT SENTENÇA AREA MÉDICA v4.0
3. **agent_TRANSITO** → Usar PROMPT DANO MORAL TRÂNSITO v2.0

### Prioridade MÉDIA (Atualizar)
4. **agent_INCORPORACAO** → Usar PROMPT COMPRA E VENDA IMÓVEIS v2.0
5. **agent_USUCAPIAO** → Usar LEX MAGISTER v1.0
6. **agent_GENERICO** → Usar Sentença Cível Genérica v2.0

### Prioridade BAIXA (Novos recursos)
7. **agent_EXECUCAO** → Integrar lógica de Prescrição Intercorrente
8. **Novo: agent_EMBARGOS** → Criar para embargos de declaração
9. **Sub-agentes liminares** → Bancário e Saúde

---

## Métricas de Melhoria Esperada

| Métrica | Atual | Esperado | Melhoria |
|---------|-------|----------|----------|
| Súmulas corretas | ~60% | ~90% | +30% |
| Fundamentação 3 parágrafos | ~70% | ~95% | +25% |
| Citações jurisprudenciais | ~50% | ~85% | +35% |
| Método bifásico danos | ~40% | ~90% | +50% |

---

*Gerado automaticamente em 2026-01-19*
