# Roadmap de Evolução - Lex Intelligentia Judiciário

Este roadmap detalha as próximas fases de desenvolvimento para o sistema Lex Intelligentia Judiciário.

---

## 📊 Status Atual (v2.8.0 - Fevereiro 2026)

| Componente | Status |
|------------|--------|
| Agentes Especializados | **23 (todos validados)** ✅ |
| Router | Gemini 2.5 Flash (hierárquico 2-stage) |
| QA | Híbrido (estrutural + semântico) + **Parallel QA** (lib/parallel-qa.js) |
| Compliance CNJ 615 | ✅ Implementado |
| **Security** | ✅ Prompt injection + Webhook auth |
| **Cache** | ✅ Implementado (lib/cache.js) |
| **RAG** | ✅ Implementado (lib/rag.js + lib/hybrid_search.js) |
| **Hallucination Detection** | ✅ Implementado (lib/hallucination-detector.js) |
| **Pipeline Orchestrator** | ✅ Implementado (lib/pipeline.js) |
| Workflow Nodes | 60+ |
| Testes | **327 passed (14 suites)** |
| Coverage | lib/ >80%, config/ 85% |

---

## 🎯 Visão Geral Estratégica

O objetivo é evoluir o sistema de um assistente de automação para um parceiro de decisão proativo, aumentando a qualidade das minutas, reduzindo custos operacionais e melhorando a experiência de revisão do usuário final (magistrados e assessores).

**Target Q1 2026:**
- 52% cost reduction (caching + model routing)
- 40% latency improvement (parallel QA)
- 100% CNJ 615 compliance
- RAG integration with STJ jurisprudence

---

## 🗺️ Fases do Roadmap

### Fase 0: Validação em Produção (Janeiro 2026) ✅

**Objetivo:** Validar todos os agentes em produção com casos reais.

**Resultado:** 23/23 agentes validados, score médio 98.5%

### Fase 0.5: Security Hardening (Fevereiro 2026) ✅

**Objetivo:** Implementar proteções de segurança críticas.

| # | Tarefa | Status |
|---|--------|--------|
| **0.5.1** | Prompt injection detection (20+ patterns) | ✅ Concluído |
| **0.5.2** | Webhook authentication (API Key, Bearer, HMAC) | ✅ Concluído |
| **0.5.3** | Input sanitization aprimorada | ✅ Concluído |
| **0.5.4** | Security tests (31 testes) | ✅ Concluído |
| **0.5.5** | Enhancement Master Plan | ✅ Concluído |

**Documentação:**
- `docs/plans/2026-01-31-ENHANCEMENT-MASTER-PLAN.md`
- `docs/plans/2026-01-31-EXECUTIVE-SUMMARY.md`
- `docs/research/llm-legal-document-generation-best-practices-2025-2026.md`

### Fase 1: Fundações de Dados (Concluída) ✅

| # | Tarefa | Status |
|---|--------|--------|
| **0.1** | Validar agent_BANCARIO | ✅ Concluído (0.98 confiança) |
| **0.2** | Validar agent_CONSUMIDOR | ✅ Concluído (0.95 confiança) |
| **0.3** | Validar agent_LOCACAO | ✅ Concluído (0.98 confiança) |
| **0.4** | Validar agent_POSSESSORIAS | ✅ Concluído (0.98 confiança) |
| **0.5** | Validar agent_EXECUCAO | ✅ Concluído |
| **0.6** | Validar novos agentes (Saúde, Trânsito, Usucapião, Incorporação, +4) | ✅ 23/23 agentes |
| **0.7** | Fix router truncation issue | ✅ Concluído |

---

### Sprint 4: v2.7.0 — Caching, RAG e Agentes (Janeiro 2026) ✅

| # | Tarefa | Status |
|---|--------|--------|
| **4.1** | Implementar cache layer (lib/cache.js) | ✅ Concluído |
| **4.2** | Implementar RAG (lib/rag.js) | ✅ Concluído |
| **4.3** | Implementar hybrid search (lib/hybrid_search.js) | ✅ Concluído |
| **4.4** | Implementar graph module (lib/graph.js) | ✅ Concluído |
| **4.5** | Completar 23/23 agentes | ✅ Concluído |
| **4.6** | Security hardening | ✅ Concluído |

### Sprint 5: v2.8.0 — QA, Pipeline e Testes (Fevereiro 2026) ✅

| # | Tarefa | Status |
|---|--------|--------|
| **5.1** | Hallucination detector (lib/hallucination-detector.js) | ✅ Concluído |
| **5.2** | Pipeline orchestrator (lib/pipeline.js) | ✅ Concluído |
| **5.3** | Parallel QA (lib/parallel-qa.js) | ✅ Concluído |
| **5.4** | Expansão de testes (327 tests, 14 suites) | ✅ Concluído |
| **5.5** | CI/CD agent validation | ✅ Concluído |

### Sprint 6: v2.9.0 — Otimização e Dashboard (Próximo)

| # | Tarefa | Status |
|---|--------|--------|
| **6.1** | RAG-002: Hybrid search Qdrant live deployment | ⏳ Pendente |
| **6.2** | PERF-003: Model routing optimization | ⏳ Pendente |
| **6.3** | Dashboard de métricas | ⏳ Pendente |
| **6.4** | A/B testing framework | ⏳ Pendente |

---

### Fase 1: Fundações de Dados e Monitoramento (Curto Prazo: Próximos 2 Meses)

**Objetivo:** Aumentar a confiabilidade e a transparência do sistema, estabelecendo as bases para otimizações futuras.

| # | Tarefa | Descrição | Métrica de Sucesso |
|---|---|---|---|
| **1.1** | **Implementar RAG com Vector Store STJ** | Ativar o workflow de ingestão de dados do STJ. Integrar uma ferramenta de busca vetorial (Tool) aos agentes especializados para que possam consultar a jurisprudência em tempo real e fundamentar as minutas com precedentes atualizados. | Aumento de 15% no score de "precisão técnica" do QA Semântico. 80% das minutas geradas citam jurisprudência relevante via RAG. |
| **1.2** | **Desenvolver Dashboard de Métricas** | Criar um dashboard (usando Google Looker Studio, Metabase ou similar) conectado à planilha de Audit Logs. O painel deve monitorar: score médio de QA por agente, acurácia do router, tempo médio de execução e custo por minuta. | Dashboard operacional e acessível, atualizado em tempo real. |
| **1.3** | **Refinar o Tratamento de Erros** | Além do retry, implementar um sistema de notificação (e.g., via e-mail ou chat) para a equipe de desenvolvimento quando um erro persistir após 3 tentativas, incluindo o log completo do erro para análise rápida. | Redução de 90% no tempo de identificação e diagnóstico de falhas de produção. |

### Fase 2: Eficiência e Otimização de Custos (Médio Prazo: 2-6 Meses)

**Objetivo:** Reduzir o custo por operação e o tempo de resposta em casos de alta frequência, otimizando o uso dos recursos de IA.

| # | Tarefa | Descrição | Métrica de Sucesso |
|---|---|---|---|
| **2.1** | **Implementar Cache Inteligente com Redis** | Utilizar o Redis (já presente na stack) para armazenar em cache as minutas geradas e aprovadas com score QA > 95. Para novos casos com alta similaridade (calculada via embeddings), o sistema pode sugerir a minuta em cache em vez de gerar uma nova. | Redução de 25% no custo total de API para os 2 tipos de ação de maior volume. |
| **2.2** | **A/B Testing de Prompts e Modelos** | Criar um mecanismo no n8n que permita rotear uma pequena porcentagem do tráfego (e.g., 10%) para um "Agente Canário" com um prompt alternativo ou um modelo de LLM diferente (e.g., novo Claude, Llama 3). Comparar os scores de QA para validar melhorias. | Framework de A/B testing implementado, permitindo a validação de novas versões de prompt com dados reais. |
| **2.3** | **Investigar Fine-tuning de Modelos** | Com um volume suficiente de dados de minutas geradas e revisadas, iniciar a exploração de fine-tuning de um modelo menor (e.g., Gemini ou Llama) para agentes de tarefas muito específicas (e.g., apenas para sentenças de negativação indevida), visando substituir o LLM de propósito geral. | Relatório de viabilidade concluído, com análise de custo x benefício e primeiros resultados de testes de fine-tuning. |

### Fase 3: Inteligência Aumentada e Experiência do Usuário (Longo Prazo: 6-12 Meses)

**Objetivo:** Transformar a ferramenta em um sistema proativo que auxilia não apenas na redação, mas também na análise e revisão do processo.

| # | Tarefa | Descrição | Métrica de Sucesso |
|---|---|---|---|
| **3.1** | **Criar um "Agente Crítico" no QA** | Implementar um segundo agente de IA no fluxo de QA. O "Agente Gerador" produz a minuta, e o "Agente Crítico" recebe a mesma tarefa e tenta encontrar falhas, inconsistências ou fundamentações alternativas na minuta original. O resultado desse "debate" é consolidado antes da saída final. | Aumento de 10% no score médio geral de QA. Redução de 50% nos marcadores `[REVISAR]` por minuta. |
| **3.2** | **Desenvolver "Agente Pesquisador" Autônomo** | Para casos de alta complexidade (identificados pelo router ou pelo usuário), acionar um agente que possa realizar buscas em fontes externas pré-aprovadas (diários oficiais, sistemas de jurimetria) para coletar dados adicionais e enriquecer o contexto antes da geração da minuta. | Implementação de pelo menos uma integração de pesquisa externa (e.g., busca em Diário Oficial). |
| **3.3** | **Melhorar a Interface de Revisão Humana** | Desenvolver um front-end simples (e.g., com Streamlit ou Retool) que renderize a minuta final. A interface deve destacar visualmente os trechos gerados pela IA, incluir links para a jurisprudência citada (via RAG) e ter botões de feedback ("Aprovar", "Rejeitar com motivo") que retroalimentem o sistema para fine-tuning. | Ferramenta de revisão em uso pela equipe, com taxa de adoção de 90% para o processo de revisão de minutas. |
| **3.4** | **Explorar Análise Jurimétrica Preditiva** | Utilizar os dados coletados para treinar um modelo simples que, com base nos dados do FIRAC, possa fornecer insights jurimétricos, como a probabilidade de procedência do pedido e a faixa de valor provável para a condenação, com base em casos similares já julgados. | Módulo de jurimetria fornece predições com acurácia superior a 75% em relação aos resultados históricos. |

---
