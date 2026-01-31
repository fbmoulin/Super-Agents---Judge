# PLANO ESTRATÉGICO MASTER - Lex Intelligentia v3.0

**Data:** 2026-01-31
**Versão:** 1.0
**Autor:** Kai (AI Assistant)
**Scope:** Roadmap completo Q1-Q4 2026

---

## Executive Summary

Este plano consolida todas as prioridades, tasks pendentes e oportunidades de otimização identificadas através de análise profunda do codebase e pesquisa de melhores práticas do mercado (2025-2026).

### Estado Atual
- **Versão:** 2.6.0
- **Agentes:** 19/21 validados (2 pendentes)
- **Score Qualidade:** 95/100
- **Deploy:** n8n Cloud (migração Anthropic pendente)
- **Compliance:** CNJ 615/2025 implementado

### Visão 12 Meses
Evoluir de **assistente de automação** para **parceiro de decisão proativo** com:
- 100% cobertura de domínios cíveis
- RAG com jurisprudência STJ em tempo real
- Redução de 50%+ no custo operacional
- Interface de revisão humana otimizada

---

## Matriz de Priorização

### 🔴 QUADRANTE 1: CRÍTICO (Alto Impacto + Alta Urgência)

| ID | Task | Impacto | Urgência | Esforço |
|----|------|---------|----------|---------|
| SEC-001 | Revogar API key exposta | 🔴 Crítico | IMEDIATO | 5min |
| N8N-001 | Completar migração Anthropic | Bloqueante | Alta | 4h |
| AGT-001 | Finalizar agent_MANDADO_SEGURANCA | Cobertura | Alta | 6h |
| AGT-005 | Finalizar agent_SAUDE_MEDICAMENTOS | Cobertura | Alta | 6h |

### 🟡 QUADRANTE 2: ESTRATÉGICO (Alto Impacto + Média Urgência)

| ID | Task | Impacto | Fase |
|----|------|---------|------|
| RAG-001 | Ativar Vector Store STJ | +15% qualidade | Q2 |
| OPT-001 | Cache Redis inteligente | -25% custo | Q2 |
| OPT-007 | Model routing (Haiku/Sonnet/Opus) | -20% custo | Q2 |
| ABT-001 | Framework A/B Testing | Científico | Q3 |

### 🟢 QUADRANTE 3: TÁTICO (Médio Impacto + Alta Urgência)

| ID | Task | Impacto | Esforço |
|----|------|---------|---------|
| LIB-001 | HTTP Client extraction | -100 linhas dup | 2h |
| LIB-003 | Logging estruturado | Observabilidade | 3h |
| TST-001 | Test coverage crítico | Qualidade | 6h |
| DOC-003 | Scripts reorganization | Manutenção | 2h |

### ⚪ QUADRANTE 4: MELHORIA CONTÍNUA

| ID | Task | Impacto |
|----|------|---------|
| DOC-001 | Python setup documentation | DX |
| FT-001 | Fine-tuning dataset collection | Futuro |
| UI-001 | Interface de revisão | UX |

---

## Sprint Planning

### Sprint 1 (Semana 1-2): CRITICAL PATH

**Objetivo:** Eliminar riscos de segurança e desbloquear produção

#### Dia 1: Emergência de Segurança
```
SEC-001: Revogar API key Anthropic no console        [5min]
SEC-002: Remover key de .claude/settings.local.json  [10min]
SEC-003: Adicionar .claude/ ao .gitignore            [5min]
SEC-004: Audit git history para outras exposições   [30min]
```

#### Dias 2-5: Migração n8n Cloud → Anthropic
```
N8N-001: Criar credencial Anthropic no n8n          [30min]
N8N-002: Substituir OpenAI → Anthropic (11 nodes)   [2h]
N8N-003: Configurar claude-sonnet-4-20250514        [30min]
N8N-004: Testar webhook com caso bancário           [1h]
N8N-005: Testar webhook com caso consumidor         [1h]
N8N-006: Publicar workflow v2.6.1                   [30min]
```

#### Dias 6-10: Agentes Pendentes
```
agent_MANDADO_SEGURANCA:
  AGT-001: Criar agent definition (.md)             [3h]
  AGT-002: Adicionar ao workflow n8n                [2h]
  AGT-003: Criar 2 test cases                       [1h]
  AGT-004: Validar agente                           [1h]

agent_SAUDE_MEDICAMENTOS:
  AGT-005: Criar agent definition (.md)             [3h]
  AGT-006: Adicionar ao workflow n8n                [2h]
  AGT-007: Criar 2 test cases                       [1h]
  AGT-008: Validar agente                           [1h]
```

**Métricas de Sucesso Sprint 1:**
- [ ] Zero API keys expostas no codebase
- [ ] Webhook n8n respondendo com Claude
- [ ] 21/21 agentes validados (100%)

---

### Sprint 2 (Semana 3-4): TECHNICAL FOUNDATION

**Objetivo:** Estabelecer infraestrutura de qualidade

#### Week 3: Code Quality
```
LIB-001: Finalizar lib/http-client.js               [1h]
LIB-002: Atualizar scripts para usar http-client    [2h]
LIB-003: Finalizar lib/logger.js                    [1h]
LIB-004: Migrar agent_validator.js para logger      [2h]
LIB-005: Migrar validate_workflow.js para logger    [2h]
LIB-006: Migrar test_and_evaluate.js para logger    [1h]
```

#### Week 3-4: Testing
```
TST-001: Criar tests/unit/http-client.test.js       [2h]
TST-002: Criar tests/unit/validation-criteria.test.js [3h]
TST-003: Criar tests/unit/logger.test.js            [1h]
TST-004: Criar tests/integration/agent-validation.test.js [3h]
TST-005: Configurar CI/CD para rodar testes         [1h]
TST-006: Atingir 50%+ coverage em lib/              [2h]
```

#### Week 4: Documentation & Organization
```
DOC-001: Criar docs/PYTHON_SETUP.md                 [1h]
DOC-002: Atualizar requirements.txt completo        [30min]
DOC-003: Reorganizar scripts/ em subdirs            [2h]
DOC-004: Atualizar package.json scripts             [30min]
```

**Métricas de Sucesso Sprint 2:**
- [ ] 0 linhas duplicadas de HTTP client
- [ ] 0 console.log nos 3 scripts principais
- [ ] ≥50% test coverage em lib/
- [ ] CI pipeline passando

---

### Sprint 3-4 (Mês 2): RAG & VECTOR STORE

**Objetivo:** Ativar fundamentação jurisprudencial via STJ

#### Fase 3.1: Infraestrutura Vector Store
```
RAG-001: Deploy Qdrant via Docker Compose           [2h]
RAG-002: Testar conexão Qdrant local                [1h]
RAG-003: Executar stj_downloader.py --download-all  [4h]
RAG-004: Validar dados baixados                     [1h]
RAG-005: Configurar embedding (OpenAI ada-002)      [1h]
RAG-006: Executar qdrant_ingest.py                  [3h]
RAG-007: Validar ingestion (query test)             [1h]
```

#### Fase 3.2: Integração n8n
```
RAG-008: Ativar workflow stj_vectorstore.json       [2h]
RAG-009: Criar Tool node para busca vetorial        [3h]
RAG-010: Integrar Tool nos 6 agentes core           [4h]
RAG-011: Testar retrieval caso bancário             [1h]
RAG-012: Testar retrieval caso consumidor           [1h]
```

#### Fase 3.3: Hybrid Retrieval
```
RAG-013: Implementar BM25 keyword search            [3h]
RAG-014: Criar fusion ranker (RRF)                  [2h]
RAG-015: A/B test: vector-only vs hybrid            [4h]
RAG-016: Deploy configuração vencedora              [2h]
```

**Métricas de Sucesso:**
- [ ] Qdrant operacional com 10K+ documentos STJ
- [ ] Latência de retrieval < 500ms
- [ ] +15% no score QA de "precisão técnica"
- [ ] 80% das minutas citam jurisprudência via RAG

---

### Sprint 5-6 (Mês 3): OTIMIZAÇÃO DE CUSTOS

**Objetivo:** Reduzir custo por minuta em 40-60%

#### Fase 4.1: Caching Inteligente (Redis)
```
OPT-001: Deploy Redis via Docker Compose            [1h]
OPT-002: Cache de classificação router              [3h] → -10% custo
OPT-003: Cache de minutas similares                 [4h] → -15% custo
OPT-004: Algoritmo de similaridade (embeddings)     [3h]
OPT-005: TTL e invalidação de cache                 [2h]
OPT-006: Métricas de hit ratio                      [2h]
```

#### Fase 4.2: Model Routing Inteligente
```
OPT-007: Classificar complexidade do caso           [2h]
OPT-008: Casos simples → Claude Haiku               [2h] → -20% custo
OPT-009: Casos médios → Claude Sonnet               [atual]
OPT-010: Casos complexos → Claude Opus              [2h] → +qualidade
OPT-011: Threshold calibration                      [3h]
```

#### Fase 4.3: Prompt Optimization
```
OPT-012: Audit de token usage por agente            [2h]
OPT-013: Prompt compression (LLMLingua)             [4h] → -30% tokens
OPT-014: Template abstraction                       [2h] → -10% tokens
OPT-015: Context window optimization                [2h] → -15% tokens
OPT-016: Benchmark antes/depois                     [3h]
```

#### ROI Esperado
```
CUSTO ATUAL:    ~$0.035/minuta (Claude Sonnet + Gemini)

APÓS OTIMIZAÇÃO:
├── Caching:            -25% em casos repetitivos
├── Model routing:      -20% média ponderada
└── Prompt optimization: -20% tokens

CUSTO TARGET:   ~$0.015-0.020/minuta (43-57% redução)

Volume: 1000 minutas/mês
Economia: $15-20/mês → $180-240/ano
```

**Métricas de Sucesso:**
- [ ] Cache hit ratio ≥30% em casos bancários/consumidor
- [ ] Custo médio por minuta ≤$0.020
- [ ] Qualidade mantida (score ≥90)

---

### Sprint 7-8 (Mês 4): A/B TESTING & FINE-TUNING

**Objetivo:** Validação científica + especialização

#### Fase 5.1: Framework A/B Testing
```
ABT-001: Configurar Langfuse para tracking          [3h]
ABT-002: Implementar version labeling               [2h]
ABT-003: Criar Switch A/B node                      [2h]
ABT-004: Métricas: latency, cost, QA score          [2h]
ABT-005: Statistical significance calculator        [2h]
```

#### Fase 5.2: Experimentos A/B
| ID | Controle | Variante | Duração |
|----|----------|----------|---------|
| EXP-001 | Prompt v5.1 | Prompt v5.2 (compressed) | 2 semanas |
| EXP-002 | Claude Sonnet | Claude Haiku (simples) | 2 semanas |
| EXP-003 | Vector-only | Hybrid RAG | 2 semanas |
| EXP-004 | Sem cache | Com cache Redis | 2 semanas |

#### Fase 5.3: Fine-Tuning Exploration
```
FT-001: Coletar dataset (500+ minutas aprovadas)    [Contínuo]
FT-002: Anotar qualidade (score manual)             [10h]
FT-003: Preparar formato JSONL                      [2h]
FT-004: POC: QLoRA em Llama 3.1 8B                  [8h]
FT-005: Benchmark vs Claude Sonnet                  [4h]
FT-006: Cost-benefit analysis                       [2h]
```

**Métricas de Sucesso:**
- [ ] Framework A/B operacional
- [ ] ≥2 experimentos concluídos com significância estatística
- [ ] Dataset de fine-tuning iniciado (≥100 minutas anotadas)

---

## Roadmap Visual (12 meses)

```
2026
     Jan        Feb        Mar        Apr        May        Jun
      │          │          │          │          │          │
Q1    ├──Sprint 1-2──┤
      │ Security     │
      │ Migration    │
      │ Agents 21/21 │
      │ Testing      │
                     │
Q2                   ├───Sprint 3-4───┼───Sprint 5-6───┤
                     │ Vector Store   │ Caching        │
                     │ RAG STJ        │ Model Routing  │
                     │ Hybrid Search  │ Prompt Optim   │
                                                       │
Q3                                                     ├───Sprint 7-8───┤
                                                       │ A/B Testing    │
                                                       │ Fine-tuning POC│
                                                       │ Agente Crítico │
```

---

## Investimento & ROI

### Esforço de Desenvolvimento
| Fase | Horas Dev | Período |
|------|-----------|---------|
| Sprint 1-2 | 60-80h | Jan-Fev |
| Sprint 3-4 | 40-50h | Fev-Mar |
| Sprint 5-6 | 40-50h | Mar-Abr |
| Sprint 7-8 | 40-50h | Abr-Mai |
| **Total Q1-Q2** | **180-230h** | 4 meses |

### Custos de Infraestrutura
| Componente | Custo/Mês | Início |
|------------|-----------|--------|
| n8n Cloud | $50 | Atual |
| Qdrant (Docker) | $0 (self-hosted) | Q2 |
| Redis (Docker) | $0 (self-hosted) | Q2 |
| OpenAI Embeddings | ~$10 | Q2 |
| Fine-tuning (Together AI) | ~$50-100 (one-time) | Q3 |
| **Total** | **~$60-70/mês** | - |

### ROI Projetado
```
INVESTIMENTO:
├── Desenvolvimento: 200h × $0 (interno) = $0
├── Infra/mês: $70 × 12 = $840/ano
└── Total 1º Ano: ~$840

RETORNO:
├── Economia de custo: $20/mês × 12 = $240
├── Produtividade: 2h/dia × $50/h × 250 dias = $25,000/ano
├── Qualidade: Redução de revisões (-30%) = valor intangível
└── Total Benefício: >$25,000/ano

ROI: >2,900%
```

---

## KPIs Globais

| Métrica | Atual | Target Q2 | Target Q4 |
|---------|-------|-----------|-----------|
| Agentes validados | 19/21 | 21/21 | 25/25 |
| Score QA médio | 95 | 97 | 98 |
| Custo/minuta | $0.035 | $0.020 | $0.015 |
| Latência (p95) | 25s | 15s | 10s |
| Test coverage | ~0% | 50% | 80% |
| Minutas com RAG | 0% | 80% | 95% |
| Cache hit ratio | N/A | 30% | 50% |

---

## Riscos e Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| 🔴 API key exposure | OCORREU | CRÍTICO | Revogar IMEDIATAMENTE |
| 🟡 Hallucination legal | Médio | Alto | RAG + QA duplo + human-in-loop |
| 🟡 Custo escalando | Médio | Médio | Caching + model routing |
| 🟢 Compliance CNJ | Baixo | Alto | Registrar no Sinapses |
| 🟢 Vendor lock-in | Baixo | Médio | Abstração multi-model |
| 🟢 Latência alta | Médio | Baixo | Streaming + cache |

---

## Compliance CNJ 615/2025

### Requisitos Implementados ✅
- [x] Human-in-the-loop obrigatório
- [x] Audit logging com hash
- [x] Classificação de risco (BAIXO/MEDIO/ALTO)
- [x] Rastreabilidade (audit_id, workflow_id)

### Requisitos Pendentes ⏳
- [ ] Registro no Sinapses (plataforma CNJ)
- [ ] DPIA (Data Protection Impact Assessment)
- [ ] Documentação de treinamento dos modelos

---

## Próximos Passos (Hoje)

### IMEDIATO (Próximos 30 minutos)
1. ⚡ **SEC-001:** Revogar API key no console Anthropic
2. ⚡ **SEC-002:** Remover de .claude/settings.local.json
3. ⚡ **SEC-003:** Adicionar .claude/ ao .gitignore

### ESTA SEMANA
4. 📋 Aprovar este plano
5. 🚀 Iniciar Sprint 1 (migração n8n)
6. 📝 Criar agents pendentes

### PRÓXIMA SEMANA
7. 🧪 Validar 21/21 agentes
8. 📊 Setup métricas de baseline
9. 🔧 Iniciar refatoração técnica

---

## Referências

### Pesquisa Realizada
- [Stanford Legal Hallucination Benchmark](https://hai.stanford.edu/news/ai-trial-legal-models-hallucinate-1-out-6-or-more-benchmarking-queries)
- [n8n Error Handling Best Practices](https://docs.n8n.io/flow-logic/error-handling/)
- [n8n Cost Optimization Guide](https://www.clixlogix.com/cost-optimization-guide-for-n8n-ai-workflows/)
- [Harvey AI - Enterprise RAG Systems](https://www.harvey.ai/blog/enterprise-grade-rag-systems)
- [CNJ Resolution 615/2025](https://www.cnj.jus.br/wp-content/uploads/2025/02/draft-ai-resolution.pdf)
- [DeepEval - LLM Evaluation Framework](https://github.com/confident-ai/deepeval)

### Documentação Interna
- `docs/plans/*.md` - 18 planos detalhados
- `ROADMAP.md` - Roadmap original
- `CLAUDE.md` - Estado do projeto
- `.serena/memories/` - Contexto do projeto

---

*Plano criado em 2026-01-31 | Lex Intelligentia v2.6.0 → v3.0*
