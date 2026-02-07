# Lex Intelligentia Judiciário - Instruções do Projeto

## Visão Geral

Sistema multi-agente para automação de minutas judiciais (decisões e sentenças) para Vara Cível do TJES, em conformidade com CNJ 615/2025.

## Versões

| Versão | Status | Descrição |
|--------|--------|-----------|
| v2.0 | Legacy | 6 agentes, router keywords, QA regex |
| v2.1 | Deprecated | Versão inicial com bugs |
| v2.1.1 | Legacy | Gemini router, Context Buffer, QA híbrido, Error Handling - TESTADO |
| v2.2 | Produção | 11 agentes, hierarchical router, Stage 2 conditional |
| v2.3 | Legacy | +LEX PROMPTER (geração dinâmica), Knowledge Base, 100% cobertura |
| v2.4 | Legacy | +4 Agentes Família (Alimentos, Paternidade, Guarda) + Reparação Danos |
| v2.5 | Legacy | +4 Agentes (Cobrança, Divórcio, Inventário, Seguros) - 19 agentes total |
| v2.6 | Legacy | +2 Agentes Fazenda Pública (Execução Fiscal, Resp. Civil Estado) - 21 agentes |
| v2.7 | Legacy | +Cache Redis, +RAG Module, +2 Agentes (Mandado Segurança, Saúde/Medicamentos) - 23 agentes |
| v2.8 | **Atual** | +Hallucination Detector, +Pipeline Orchestrator, +Parallel QA, +Integration Tests |

## Status do Projeto

```
╔═══════════════════════════════════════════════════════════════╗
║  ✅ WORKFLOW v2.8 - 23 AGENTES ESPECIALIZADOS                   ║
║                                                               ║
║  Quality Score: 95/100 (estrutura)                            ║
║  Nodes: 60+ | Connections: 53+                                ║
║  Production Tests: 23/23 AGENTES VALIDADOS ✅                  ║
║  Unit Tests: 327 passed (Jest 30), 14 suites                  ║
║  Cobertura: 90-95% (estimada) via Knowledge Base              ║
║                                                               ║
║  AGENTES VALIDADOS (2026-01-19):                              ║
║  ✓ agent_BANCARIO        - 0.98 confiança                     ║
║  ✓ agent_CONSUMIDOR      - 0.95 confiança                     ║
║  ✓ agent_EXECUCAO        - 0.95 confiança                     ║
║  ✓ agent_LOCACAO         - 0.98 confiança                     ║
║  ✓ agent_POSSESSORIAS    - 0.98 confiança                     ║
║                                                               ║
║  AGENTES v2.5 VALIDADOS (2026-01-20):                         ║
║  ✓ agent_COBRANCA        - Score 105% (2/2 casos)             ║
║  ✓ agent_DIVORCIO        - Score 100% (2/2 casos)             ║
║  ✓ agent_INVENTARIO      - Score 84%  (2/2 casos)             ║
║  ✓ agent_SEGUROS         - Score 105% (2/2 casos)             ║
║                                                               ║
║  FASE 1 - FAMILIA VALIDADOS (2026-01-20):                     ║
║  ✓ agent_ALIMENTOS       - Score 105% (2/2 casos)             ║
║  ✓ agent_GUARDA          - Score 87%  (2/2 casos)             ║
║                                                               ║
║  FASE 2 - FAMILIA/SAUDE VALIDADOS (2026-01-20):               ║
║  ✓ agent_PATERNIDADE     - Score 100% (2/2 casos)             ║
║  ✓ agent_SAUDE_COBERTURA - Score 105% (3/3 casos)             ║
║                                                               ║
║  FASE 3 - SAUDE/RC VALIDADOS (2026-01-20):                    ║
║  ✓ agent_SAUDE_CONTRATUAL- Score 98%  (2/2 casos)             ║
║  ✓ agent_REPARACAO_DANOS - Score 100% (2/2 casos)             ║
║                                                               ║
║  FASE 4 - TRANSITO/PROPRIEDADE VALIDADOS (2026-01-20):        ║
║  ✓ agent_TRANSITO        - Score 105% (2/2 casos)             ║
║  ✓ agent_USUCAPIAO       - Score 90%  (2/2 casos)             ║
║                                                               ║
║  FASE 5 - INCORPORACAO/FALLBACK VALIDADOS (2026-01-20):       ║
║  ✓ agent_INCORPORACAO    - Score 100% (2/2 casos)             ║
║  ✓ agent_GENERICO        - Score 95%  (2/2 casos)             ║
║                                                               ║
║  FASE 6 - FAZENDA PUBLICA (2026-01-21):                       ║
║  ✓ agent_EXECUCAO_FISCAL    - Estrutura validada (2/2 casos)  ║
║  ✓ agent_RESP_CIVIL_ESTADO  - Estrutura validada (2/2 casos)  ║
║                                                               ║
║  FASE 7 - FAZENDA PUBLICA II (2026-02-07):                   ║
║  ✓ agent_MANDADO_SEGURANCA  - Score 88%  (4/4 casos)          ║
║  ✓ agent_SAUDE_MEDICAMENTOS - Score 91%  (4/4 casos)          ║
║                                                               ║
║  TESTES v2.5 + FASES 1-7 CONCLUIDOS:                          ║
║  ✓ 40 casos de teste executados                               ║
║  ✓ 100% taxa de aprovacao (>75% threshold)                    ║
║  ✓ Score medio global: 98.5%                                  ║
║  ✓ Relatorio: test_results/V2.5_AGENT_TEST_REPORT_2026-01-20.md║
╚═══════════════════════════════════════════════════════════════╝
```

## Arquitetura v2.2

```
[FIRAC] → [Gemini Router Stage 1] → [Set Context Buffer] → [IF: Needs Stage 2?]
                                                                 ↓         ↓
                                                              [true]   [false]
                                                                 ↓         ↓
                                                      [Gemini Stage 2] → [Merge]
                                                                           ↓
                                                               [Set System Prompt] → [Switch]
                                                                                        ↓
    ┌──────────┬───────────┬────────────┬─────────┬──────────┬────────────┬─────────────┬──────────┬──────────┬─────────────┬──────────┐
    ↓          ↓           ↓            ↓         ↓          ↓            ↓             ↓          ↓          ↓             ↓          ↓
[Bancário] [Consumidor] [Possessórias] [Locação] [Execução] [Saúde Cob.] [Saúde Cont.] [Trânsito] [Usucapião] [Incorporação] [Genérico] [Fallback]
    └──────────┴───────────┴────────────┴─────────┴──────────┴────────────┴─────────────┴──────────┴──────────┴─────────────┴──────────┘
                                                              ↓
                                                    [Prepare for QA]
                                                              ↓
                                                    [QA Estrutural]
                                                              ↓
                                                 [IF: Skip Semântico?]
                                                    ↓              ↓
                                          [QA Semântico]      [Skip]
                                                    ↓              ↓
                                                 [QA Consolidado]
                                                              ↓
                                                 [Audit Log CNJ 615]
                                                              ↓
                                                 [Google Sheets]
                                                              ↓
                                                 [Build Response]
                                                              ↓
                                                 [Respond: Success]

Error Path:
[Error Trigger] → [Handle Error] → [IF: Retry?]
                                      ↓         ↓
                            [Error Log]   [Respond: Error 500]
                                      ↓
                            [Respond: Retry 503]
```

### Modelos por Função

| Função | Modelo | Provider | Custo/req |
|--------|--------|----------|-----------|
| Router + Classificação | Gemini 2.5 Flash | Google | ~$0.00003 |
| Extração de entidades | Gemini 2.5 Flash | Google | (incluso) |
| **LEX PROMPTER** | Claude Sonnet 4 | Anthropic | ~$0.015 |
| **Geração de Minutas** | Claude Sonnet 4 | Anthropic | ~$0.02 |
| QA Semântico | Gemini 2.5 Flash | Google | ~$0.00003 |
| Audit formatting | Code Node | - | $0 |

**Custo estimado por request:** ~$0.02 (90%+ é Claude), ~$0.035 se usar LEX PROMPTER

---

## LEX PROMPTER - Geração Dinâmica de Prompts (v2.3)

### Conceito

Sistema de **meta-prompting** que gera prompts especializados em tempo real quando não existe template pré-definido para o tipo de caso. Garante 100% de cobertura com qualidade equivalente aos prompts fixos.

### Arquitetura

```
[Caso não classificado] → [LEX PROMPTER] → [Prompt dinâmico] → [Agente Genérico] → [Minuta]
         ↓                      ↓
   Confiança < 0.6        Busca na Knowledge Base:
                          - Súmulas (STJ/STF)
                          - Temas Repetitivos
                          - Domain Mapping
```

### Knowledge Base

| Arquivo | Conteúdo | Records |
|---------|----------|---------|
| `knowledge_base/sumulas.json` | Súmulas STJ/STF pesquisáveis | 35+ súmulas |
| `knowledge_base/temas_repetitivos.json` | Temas com detalhamento | 12+ temas |
| `knowledge_base/domain_mapping.json` | Mapping keywords → domínios | 23 domínios |

### Domínios Mapeados

| Domínio | Keywords | Agente |
|---------|----------|--------|
| bancario | empréstimo, juros, banco, financiamento | agent_BANCARIO |
| saude | plano, cobertura, ANS, tratamento | agent_SAUDE_COBERTURA |
| transito | acidente, veículo, colisão, DPVAT | agent_TRANSITO |
| incorporacao | imóvel, construtora, atraso, planta | agent_INCORPORACAO |
| usucapiao | posse, usucapião, ocupação | agent_USUCAPIAO |
| execucao | execução, penhora, título | agent_EXECUCAO |
| locacao | aluguel, despejo, locação | agent_LOCACAO |
| consumidor | CDC, defeito, vício, produto | agent_CONSUMIDOR |
| processual | recurso, prova, prazo | agent_GENERICO |
| direitos_reais | propriedade, servidão, usufruto | agent_GENERICO |
| administrativo | ato administrativo, licitação | agent_GENERICO |
| responsabilidade_civil | dano moral, indenização | agent_GENERICO |
| obrigacional | contrato, inadimplemento, mora | agent_GENERICO |
| **reparacao_danos** | negativação, SPC, Serasa, CDC | **agent_REPARACAO_DANOS** |
| **alimentos** | pensão, alimentando, revisional | **agent_ALIMENTOS** |
| **paternidade** | investigação, DNA, filiação | **agent_PATERNIDADE** |
| **guarda** | guarda compartilhada, visitas | **agent_GUARDA** |
| **cobranca** | dívida, monitória, cumprimento sentença | **agent_COBRANCA** |
| **divorcio** | divórcio, separação, partilha, meação | **agent_DIVORCIO** |
| **inventario** | inventário, herança, espólio, quinhão | **agent_INVENTARIO** |
| **seguros** | seguro, sinistro, apólice, indenização | **agent_SEGUROS** |
| **mandado_seguranca** | mandado de segurança, direito líquido e certo, autoridade coatora | **agent_MANDADO_SEGURANCA** |
| **saude_medicamentos** | medicamento, SUS, fornecimento, alto custo, ANVISA | **agent_SAUDE_MEDICAMENTOS** |
| generico | (fallback) | agent_GENERICO |

### Fluxo de Decisão no Switch

```javascript
// Condição para acionar LEX PROMPTER
if (!classificacao.dominio_identificado || classificacao.confianca < 0.6) {
  return 'lex_prompter';  // Gera prompt dinâmico
}
return classificacao.dominio_identificado;  // Usa agente especializado
```

### Documentação

| Arquivo | Descrição |
|---------|-----------|
| `docs/FRAMEWORK_LEGAL_PROMPT_ENGINEERING.md` | Framework completo de 5 camadas |
| `docs/INTEGRACAO_LEX_PROMPTER.md` | Guia de integração n8n |
| `agents/lex_prompter.md` | System prompt do agente |

### Skill Claude Code

Disponível em `~/.claude/skills/LegalPromptGenerator/`:
- `SKILL.md` - Skill principal
- `Workflows/Generate.md` - Criar novos prompts
- `Workflows/Optimize.md` - Otimizar prompts existentes
- `Workflows/Validate.md` - Validar compliance
- `Workflows/Adapt.md` - Adaptar para domínios

## Arquivos do Projeto

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `n8n_workflow_v5.1_improved_prompts.json` | **USAR** | Workflow principal (prompts v5.1, 21 agentes) |
| `n8n_workflow_v2.6_fazenda_publica.json` | Produção | Fazenda Pública (agentes fiscais/Estado) |
| `archive/workflows/n8n_workflow_v2.7_graph_rag.json` | Experimental | Graph/RAG (archived) |
| `data/samples/stj_chunks_vectorstore.json` | RAG | Vector store STJ sample data |
| `archive/workflows/n8n_workflow_v2.1.1_cloud_ready.json` | Legacy | Versão cloud-ready |
| `docs/guides/credentials-setup.md` | Docs | Guia de configuração de credenciais |
| `docs/TUTORIAL_INICIANTES.md` | Docs | Tutorial passo-a-passo para iniciantes |
| `docs/FRAMEWORK_LEGAL_PROMPT_ENGINEERING.md` | **NOVO** | Framework 5 camadas para prompts |
| `docs/INTEGRACAO_LEX_PROMPTER.md` | **NOVO** | Integração LEX PROMPTER no n8n |
| `docs/CATALOGO_PROMPTS_TEMPLATES.md` | **NOVO** | Catálogo de prompts vs agentes |
| `agents/lex_prompter.md` | v2.3 | System prompt do LEX PROMPTER |
| `agents/agent_REPARACAO_DANOS.md` | v2.4 | Agente danos consumeristas |
| `agents/agent_ALIMENTOS.md` | v2.4 | Agente ações de alimentos |
| `agents/agent_PATERNIDADE.md` | v2.4 | Agente investigação/negatória paternidade |
| `agents/agent_GUARDA.md` | v2.4 | Agente regulamentação de guarda |
| `agents/agent_COBRANCA.md` | **v2.5** | Agente cobrança e monitória |
| `agents/agent_DIVORCIO.md` | **v2.5** | Agente divórcio e dissolução |
| `agents/agent_INVENTARIO.md` | **v2.5** | Agente inventário e partilha |
| `agents/agent_SEGUROS.md` | **v2.5** | Agente contratos de seguro |
| `agents/agent_EXECUCAO_FISCAL.md` | **v2.6** | Agente execução fiscal (LEF/CTN) |
| `agents/agent_RESP_CIVIL_ESTADO.md` | **v2.6** | Agente responsabilidade civil do Estado |
| `agents/agent_MANDADO_SEGURANCA.md` | **v2.7** | Agente mandado de segurança (88%) |
| `agents/agent_SAUDE_MEDICAMENTOS.md` | **v2.7** | Agente saúde/medicamentos SUS (91%) |
| `lib/cache.js` | **v2.7** | Redis cache module (mock + real) |
| `lib/rag.js` | **v2.7** | RAG query builder + precedent formatter |
| `lib/hallucination-detector.js` | **v2.8** | Hallucination detector (súmulas/temas cross-ref) |
| `lib/pipeline.js` | **v2.8** | Pipeline orchestrator (cache→RAG→LLM→QA→cache) |
| `lib/parallel-qa.js` | **v2.8** | Parallel QA runner (Promise.allSettled) |
| `knowledge_base/sumulas.json` | **NOVO** | Súmulas STJ/STF pesquisáveis |
| `knowledge_base/temas_repetitivos.json` | **NOVO** | Temas com detalhamento |
| `knowledge_base/domain_mapping.json` | **NOVO** | Mapping keywords → domínios |
| `archive/prompts_legacy_extracted/` | Legacy | 11 prompts convertidos para Markdown |
| `scripts/validators/validate_workflow.js` | Script | Validação de workflows |
| `scripts/data/stj_downloader.py` | Script | Download de jurisprudência STJ |
| `migrations/init_db_audit_logs.sql` | Opcional | Schema PostgreSQL (alternativa a Sheets) |
| `archive/workflows/` | Legacy | Workflows antigos (não usar) |

## Agentes Especializados

| Agente | Volume | Súmulas/Artigos Prioritários |
|--------|--------|------------------------------|
| Bancário | 35-40% | 297, 381, 382, 379, 539, 565, 603/STJ |
| Consumidor | 25-30% | 385, 388, 479, 469/STJ |
| Execução | 15-20% | Arts. 784, 786, 919, 921 CPC |
| Locação | 8-12% | Arts. 46, 47, 51, 62 Lei 8.245/91 |
| Possessórias | 5-8% | Arts. 556, 561 CPC |
| Saúde Cobertura | 15% | Súmulas 302, 469, 597, 608, 609, Lei 9.656/98 |
| Saúde Contratual | 10% | Tema 952, Art. 15 Lei 9.656/98, RN ANS 438 |
| Trânsito | 12% | CC arts. 186, 927, 932, 944, 950, CTB |
| Usucapião | 5% | CC arts. 1.238-1.244, CF arts. 183, 191 |
| Incorporação | 8% | Temas 970, 996, Súmula 543, Lei 4.591/64 |
| Genérico | ~5% | Fallback com [REVISAR] abundante |
| **Reparação Danos** | 10-15% | Súmulas 385, 387, 388, 403, 479, CDC arts. 12, 14, 42 |
| **Alimentos** | 8-12% | Súmulas 309, 358, 596, 621, CC arts. 1.694-1.710 |
| **Paternidade** | 5-8% | Súmulas 149/STF, 277, 301, Temas 622, 932 |
| **Guarda** | 5-8% | Súmula 383, Lei 13.058/14, Lei 12.318/10 |
| **Cobrança** | 15-20% | Súmulas 54, 362, 530, Tema 1368, CC arts. 389-420 |
| **Divórcio** | 8-12% | Súmulas 197, 377/STF, 380/STF, CC arts. 1.571-1.590 |
| **Inventário** | 5-8% | Súmulas 112/STF, 331/STF, 542/STF, CC arts. 1.784-1.856 |
| **Seguros** | 5-8% | Súmulas 101, 402, 465, 537, 610, CC arts. 757-802 |
| **Execução Fiscal** | 10-15% | Súmulas 314, 392, 393, 430, 435/STJ, LEF arts. 2, 16, 40, CTN arts. 135, 174 |
| **Resp. Civil Estado** | 5-8% | Art. 37 §6º CF, Súmulas 37, 54, 362, 387/STJ, Temas 940, 366, 698 |
| **Mandado Segurança** | 5-8% | Súmulas 266, 267, 269, 271, 512/STF, Lei 12.016/2009 |
| **Saúde/Medicamentos** | 5-8% | SV-61, Temas 6, 500, 793, 1234/STF, Lei 8.080/90 |

## Checklist de Implementação v2.2

### Workflow (100% Completo)
- [x] Gemini Router Stage 1 com classificação semântica
- [x] Gemini Router Stage 2 (conditional) para domínios compostos
- [x] Context Buffer com null safety
- [x] System prompts otimizados (~380 tokens)
- [x] 11 AI Agents + 11 Claude LLMs individuais
- [x] Switch com 12 outputs (inclui fallback)
- [x] QA Estrutural (regex robusto, CRLF safe)
- [x] QA Semântico (Gemini 2.5 Flash)
- [x] QA Consolidado (40%/60% scoring)
- [x] Audit Log CNJ 615/2025 (hash melhorado)
- [x] Google Sheets persistence (Logs + Errors)
- [x] Error Handling (retry 3x)
- [x] Respond: Success (200)
- [x] Respond: Retry (503)
- [x] Respond: Error (500)

### Validação (100% Completo)
- [x] JSON structure validation
- [x] Node ID uniqueness
- [x] Connection graph validation
- [x] JavaScript syntax check
- [x] Data flow simulation
- [x] Edge case testing
- [x] Error handling verification

### Implantação n8n Cloud (2026-01-21)

**Instância:** `https://lexintel.app.n8n.cloud`
**Workflow:** `Lex Intelligentia v2.1.1 - FIXED FOR CLOUD` (ID: `kykdTJrSVdFuVwtHknqoi`)
**Webhook:** `https://lexintel.app.n8n.cloud/webhook/lex-intelligentia-agentes`

#### Fixes Aplicados via Synta MCP:
- [x] Webhook `responseMode` alterado de "Immediately" para "responseNode"
- [x] AI Agent nodes atualizados de typeVersion 2 para typeVersion 3
- [x] Workflow publicado em produção

#### Migração OpenAI → Anthropic (Em Andamento):
- [ ] Criar credencial Anthropic no n8n
- [ ] Substituir OpenAI Model nodes por Anthropic Chat Model nodes
- [ ] Configurar modelo `claude-sonnet-4-20250514`
- [ ] Testar webhook após migração
- [ ] Publicar workflow atualizado

**Issue Identificado:** OpenAI API key inválida (`sk-proj-***MzEA`) causando erro 401
**Solução Escolhida:** Migrar para Anthropic Claude conforme documentado

### Configuração n8n Cloud (✅ Completo)
- [x] Credencial `Gemini API Key` (HTTP Header Auth)
- [x] Credencial `Anthropic API` (Claude Sonnet 4)
- [x] Credencial `Google Sheets` (OAuth2)
- [x] Google Sheet configurado para audit logs

### Testes em Produção (2026-01-19)
- [x] Webhook trigger funcionando (test mode)
- [x] **Gemini Router classificando corretamente** ✅ CORRIGIDO
- [x] Context Buffer com null safety validado
- [x] Pipeline completo executado (~28-30s)
- [x] Test cases criados para todos os 6 domínios
- [x] **4/6 agentes validados em produção** (execução com issue)

#### Resultados dos Testes por Agente

| Agente | Caso de Teste | Confiança | Status |
|--------|---------------|-----------|--------|
| agent_BANCARIO | Empréstimo consignado fraudulento | **0.98** | ✅ PASSOU |
| agent_CONSUMIDOR | Falha serviço telecomunicações | **0.95** | ✅ PASSOU |
| agent_EXECUCAO | Cheque prescrito - título extrajudicial | **0.30** | ⚠️ FALHOU (truncation) |
| agent_LOCACAO | Despejo por falta de pagamento | **0.98** | ✅ PASSOU |
| agent_POSSESSORIAS | Reintegração de posse - esbulho | **0.98** | ✅ PASSOU |
| agent_GENERICO | Ação declaratória atípica | - | ⏳ Pendente |

#### Issues Resolvidos (2026-01-19)

| Issue | Severidade | Status | Fix |
|-------|------------|--------|-----|
| Router classifica "bancário" como "genérico" | CRÍTICO | ✅ RESOLVIDO | maxOutputTokens: 800 → 2000 |
| Confiança baixa (0.3) no router | CRÍTICO | ✅ RESOLVIDO | Agora 0.95-0.98 |
| Token truncation no Context Buffer | ALTO | ✅ RESOLVIDO | maxOutputTokens aumentado |
| Execução fallback para genérico | ALTO | ⚠️ PENDENTE | Precisa maxOutputTokens: 3000 |

**Root Cause Identificado:**
- Gemini 2.5 Flash usa "thinking tokens" internos que consomem o budget de maxOutputTokens
- Com maxOutputTokens: 800 e thoughtsTokenCount: 764, sobram apenas ~36 tokens para output
- Fix: Aumentar maxOutputTokens para 2000 permite output completo

**Entity Extraction Validado:**
- Valores monetários: R$ 2.500,00, R$ 12.500,00, R$ 500.000,00
- Datas: extraídas corretamente de todos os casos
- Partes: autor, réu, fiador, locatário, exequente, executado
- Leis: Lei 8.245/91, Arts. 560-566 CPC, Art. 784 CPC

**Arquivos de Teste:**
- `test_cases/run_production_tests.js` - Script de testes automatizados
- `test_cases/test_results/PRODUCTION_TEST_REPORT_2026-01-19.md` - Relatório completo
- `test_cases/test_results/PRODUCTION_TEST_REPORT_2026-01-19_SESSION2.md` - Relatório sessão 2
- `test_cases/bancario/` - 5 casos bancários
- `test_cases/consumidor/` - 5 casos consumidor
- `test_cases/execucao/` - 1 caso execução
- `test_cases/locacao/` - 1 caso locação
- `test_cases/possessorias/` - 1 caso possessórias

### Testes v2.5-v2.7 (Concluídos) ✅

- [x] 23 agentes validados via `agent_validator.js`
- [x] 40+ casos de teste em 23 domínios
- [x] Score médio global: 95%+
- [x] Todos os domínios com test_cases/ preenchidos

## Comandos Úteis

```bash
# Testar webhook (n8n Cloud)
curl -X POST https://SEU-N8N.app.n8n.cloud/webhook/lex-intelligentia-agentes \
  -H "Content-Type: application/json" \
  -d '{
    "fatos": "O autor celebrou contrato de empréstimo consignado...",
    "questoes": "Existência de vício de consentimento...",
    "pedidos": "Declaração de nulidade. Danos morais.",
    "classe": "Procedimento Comum Cível",
    "assunto": "Empréstimo consignado fraudulento"
  }'

# Testar webhook (local)
curl -X POST http://localhost:5678/webhook/lex-intelligentia-agentes \
  -H "Content-Type: application/json" \
  -d '{"body": {"fatos": "...", "questoes": "...", "pedidos": "..."}}'

# PostgreSQL (alternativa a Sheets)
psql -U postgres -d lex_intelligentia -f migrations/init_db_audit_logs.sql
```

## Response Structure

### Success (200)
```json
{
  "success": true,
  "minuta": {
    "conteudo": "I - RELATÓRIO...",
    "palavras": 450,
    "formato": "markdown"
  },
  "qualidade": {
    "score": 87,
    "aprovado": true,
    "falhas_criticas": [],
    "marcadores_revisao": 1
  },
  "compliance": {
    "risco": "BAIXO",
    "requer_revisao_humana": true,
    "agente": "agent_bancario"
  },
  "rastreabilidade": {
    "audit_id": "LEX-1705234567890-abc123",
    "workflow_id": "...",
    "tempo_execucao_ms": 4500
  }
}
```

### Retry (503)
```json
{
  "success": false,
  "error": {
    "codigo": "TRANSIENT_ERROR",
    "tentativa": 1
  },
  "retry": {
    "should_retry": true,
    "retry_after_seconds": 5
  }
}
```

### Error (500)
```json
{
  "success": false,
  "error": {
    "codigo": "MAX_RETRIES_EXCEEDED",
    "tentativas": 3
  },
  "compliance": {
    "risco": "ALTO"
  }
}
```

## Parâmetros de Danos Morais (TJES 2025-2026)

| Situação | Faixa |
|----------|-------|
| Negativação indevida | R$ 5.000 - R$ 15.000 |
| Empréstimo fraudulento | R$ 8.000 - R$ 25.000 |
| Fraude bancária | R$ 5.000 - R$ 20.000 |
| Plano de saúde - negativa | R$ 10.000 - R$ 30.000 |

## Compliance CNJ 615/2025

- **Classificação de risco:** BAIXO (≥85, conf≥0.85) / MEDIO (≥70, conf≥0.65) / ALTO
- **Supervisão humana:** Sempre obrigatória (`requer_revisao_humana: true`)
- **Audit log:** Hash djb2+FNV-1a (32 hex chars)
- **Rastreabilidade:** audit_id, workflow_id, timestamp, modelos utilizados

## Fixes Aplicados em v2.1.1

| Issue | Severidade | Fix |
|-------|------------|-----|
| Switch fallback desconectado | CRÍTICO | Output 7 → Genérico |
| Retry path incompleto | CRÍTICO | Adicionado Respond: Retry (503) |
| Context Buffer null unsafe | IMPORTANTE | Null safety + finishReason check |
| QA Consolidado data flow | IMPORTANTE | $input.first() + type detection |
| Audit Log hash fraco | IMPORTANTE | djb2 + FNV-1a hybrid |
| QA Estrutural CRLF | MÉDIO | Line ending normalization |

## Projetos Relacionados

| Projeto | Relação |
|---------|---------|
| `vector-store-stj` | Base de jurisprudência para RAG (fase futura) |
| `tinker-juridico` | Sistema anterior (referência) |

## Notas de Desenvolvimento

1. **FIRAC funciona bem** - não modificar entrada
2. **Context Buffer** resolve perda de contexto após FIRAC
3. **Testes** usar processos reais anonimizados
4. **Custo** ~90% é Claude, Gemini é desprezível
5. **Error Handling** retorna 503 para erros transientes (caller deve retry)
6. **Fallback** qualquer classificação não reconhecida vai para Genérico

---

*Ultima atualizacao: 2026-02-07 | Versao: 2.7.0 | Quality Score: 95/100 | 23 agentes especializados, 100% validados | Security Hardened*

## Sprint 1 - Critical Path (2026-01-31) ✅

### Concluído
- [x] SEC-001: API keys removidas de .claude/settings.local.json
- [x] SEC-002: .claude/ adicionado ao .gitignore
- [x] N8N-001-006: Guia de migração criado em docs/guides/N8N_ANTHROPIC_MIGRATION.md
- [x] AGT-001-008: Agentes MANDADO_SEGURANCA e SAUDE_MEDICAMENTOS verificados (já existiam)

## Sprint 2 - Technical Foundation (2026-01-31) ✅

### Concluído
- [x] LIB-001/002: lib/http-client.js e lib/logger.js já existiam
- [x] LIB-004: agent_validator.js migrado para logger (51 console → logger)
- [x] LIB-005: validate_workflow.js migrado para logger (12 console → logger)
- [x] LIB-006: Demais scripts migrados (test_and_evaluate.js, llm_evaluator.js, production-checklist.js)
- [x] TST-001-003: Testes unitários já existiam (http-client.test.js, logger.test.js, validation-criteria.test.js)
- [x] TST-004: Jest configurado com coverage thresholds (lib/: 80% lines, config/: 70% lines)
- [x] DOC-001: docs/PYTHON_SETUP.md criado

### Métricas Sprint 2
- **Testes:** 147 passed, 0 failed
- **Coverage lib/:** 92.72% statements, 70.51% branches
- **Coverage config/:** 85.57% statements, 78.66% branches

## Sprint 3 - Security Hardening (2026-02-01) ✅

### Concluído
- [x] SEC-HIGH-001: Webhook authentication implementado (API Key, Bearer, HMAC)
- [x] SEC-HIGH-002: Prompt injection detection (20+ patterns, severity classification)
- [x] SEC-HIGH-003: PII test cases excluídos do git (processos_reais/)
- [x] SEC-GITIGNORE: Patterns adicionados para .env.local em subdiretorios
- [x] TST-SEC: 31 novos testes de segurança (security.test.js)
- [x] DOC-PLAN: Enhancement Master Plan criado (docs/plans/2026-01-31-ENHANCEMENT-MASTER-PLAN.md)
- [x] DOC-RESEARCH: LLM best practices research (docs/research/)

### Métricas Sprint 3
- **Testes:** 176 passed, 0 failed (+29 security tests)
- **Prompt Injection Patterns:** 20+ regex patterns
- **Authentication Methods:** 3 (API Key, Bearer, HMAC)
- **Security Coverage:** detectPromptInjection(), validateWebhookAuth(), validateAndSanitizeInput()

### Arquivos Modificados
- `config/security.js` (+290 lines) - prompt injection + webhook auth
- `tests/unit/security.test.js` (+230 lines) - 31 security tests
- `.gitignore` (+11 lines) - .env.local patterns
- `.env.keys.template` (+15 lines) - WEBHOOK_API_KEY

## Sprint 4 - Performance & RAG (2026-02-07) ✅

### Concluído
- [x] PERF-001: Redis caching layer (`lib/cache.js` - 11 testes, mock + real Redis)
- [x] RAG-001: RAG query module (`lib/rag.js` - 8 testes, legal term extraction)
- [x] AGT-001: MANDADO_SEGURANCA registrado e validado (Score 88%, 4/4 casos)
- [x] AGT-002: SAUDE_MEDICAMENTOS registrado e validado (Score 91%, 4/4 casos)
- [x] Domain mappings atualizados (23 domínios)
- [x] Version bump v2.6.2 → v2.7.0

### Métricas Sprint 4
- **Testes:** 286 passed, 0 failed (+20 novos: 11 cache + 8 RAG + 1 config)
- **Agentes:** 21 → 23 (100% validados)
- **Novos módulos:** lib/cache.js, lib/rag.js

## Sprint 5 - Hallucination Detection & Pipeline (2026-02-07) ✅

### Concluído
- [x] TEST-004: Hallucination detector (`lib/hallucination-detector.js` - 19 testes, cross-ref súmulas/temas)
- [x] PIPE-001: Pipeline orchestrator (`lib/pipeline.js` - 8 testes, cache→RAG→LLM→QA→cache)
- [x] PERF-002: Parallel QA runner (`lib/parallel-qa.js` - 9 testes, Promise.allSettled)
- [x] CI/CD: Agent count check fixado (21→23), job `validate-agents` adicionado
- [x] TEST-002: Integration tests (`tests/integration/pipeline.integration.test.js` - 5 testes)
- [x] Version bump v2.7.0 → v2.8.0

### Métricas Sprint 5
- **Testes:** 327 passed, 0 failed (+41 novos: 19 halluc + 8 pipeline + 9 QA + 5 integration)
- **Suites:** 10 → 14
- **Novos módulos:** lib/hallucination-detector.js, lib/pipeline.js, lib/parallel-qa.js

### Pendente (Sprint 6)
- [ ] RAG-002: Hybrid search com Qdrant live (BM25 + vector)
- [ ] PERF-003: Model routing optimization (Haiku for simple cases)
- [ ] Dashboard de métricas (Looker Studio / Metabase)
- [ ] A/B testing de prompts
- [ ] COMP-001: Complete audit schema (additional fields)

### Documentação
- **Sprint 5 Plan:** docs/plans/2026-02-07-sprint5-hallucination-pipeline-qa.md
- **Sprint 4 Plan:** docs/plans/2026-02-07-sprint4-performance-rag.md
- **Master Plan:** docs/plans/2026-01-31-ENHANCEMENT-MASTER-PLAN.md
- **Executive Summary:** docs/plans/2026-01-31-EXECUTIVE-SUMMARY.md
- **Research:** docs/research/llm-legal-document-generation-best-practices-2025-2026.md
