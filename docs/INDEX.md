# Documentação - Lex Intelligentia Judiciário v2.2

## Índice de Documentos

Este arquivo serve como índice central para toda a documentação do projeto Lex Intelligentia.

---

## 📚 Documentação Principal

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **CLAUDE.md** | Documentação principal do projeto, status e configuração | `/CLAUDE.md` |
| **README.md** | Visão geral, arquitetura, agentes e roadmap | `/README.md` |
| **ROADMAP.md** | Roadmap de evolução do projeto | `/ROADMAP.md` |
| **TUTORIAL.md** | Tutorial rápido | `/TUTORIAL.md` |

---

## 🔧 Configuração

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **credentials-setup.md** | Guia de configuração de credenciais (Gemini, Claude, Sheets) | `/credentials-setup.md` |
| **.env.keys.template** | Template de variáveis de ambiente | `/.env.keys.template` |
| **init_db_audit_logs.sql** | Schema PostgreSQL (alternativa a Sheets) | `/init_db_audit_logs.sql` |

---

## 📖 Tutoriais e Guias

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **TUTORIAL_INICIANTES.md** | Tutorial passo-a-passo para iniciantes | `/docs/TUTORIAL_INICIANTES.md` |
| **GUIA_INTEGRACAO_AGENTES.md** | Guia completo de integração | `/docs/guides/GUIA_INTEGRACAO_AGENTES.md` |
| **GEMINI.md** | Configuração do Gemini Router | `/docs/guides/GEMINI.md` |
| **Plano_Agentes_n8n_Revisado.md** | Plano completo dos agentes | `/docs/guides/LexIntelligentia_Judiciario_Plano_Agentes_n8n_Revisado.md` |
| **Prompts_Agentes_Especializados.md** | System prompts dos agentes | `/docs/guides/LexIntelligentia_Judiciario_Prompts_Agentes_Especializados.md` |

---

## 🧪 Testes e Validação

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **test_cases/README.md** | Documentação dos casos de teste | `/test_cases/README.md` |
| **run_production_tests.js** | Script de testes automatizados | `/test_cases/run_production_tests.js` |
| **test_results/*.md** | Relatórios de testes de produção | `/test_cases/test_results/` |
| **VALIDATION_REPORT.md** | Relatório de validação | `/docs/validation/VALIDATION_REPORT.md` |
| **VALIDATION_SUMMARY.md** | Resumo de validação | `/docs/validation/VALIDATION_SUMMARY.md` |
| **VALIDATION_INDEX.md** | Índice de validação | `/docs/validation/VALIDATION_INDEX.md` |

---

## 📋 Planos e Design

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **plans/** | Planos de implementação e otimização | `/docs/plans/` |
| **CRITICAL_AGENT_DESIGN.md** | Design crítico dos agentes | `/docs/CRITICAL_AGENT_DESIGN.md` |
| **RESEARCH_AGENT_DESIGN.md** | Design do agente de pesquisa | `/docs/RESEARCH_AGENT_DESIGN.md` |
| **REVIEW_INTERFACE_PLAN.md** | Plano da interface de revisão | `/docs/REVIEW_INTERFACE_PLAN.md` |

---

## 🚀 Funcionalidades Futuras

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **AB_TESTING_PLAN.md** | Plano de testes A/B | `/docs/AB_TESTING_PLAN.md` |
| **CACHE_IMPLEMENTATION_GUIDE.md** | Guia de implementação de cache | `/docs/CACHE_IMPLEMENTATION_GUIDE.md` |
| **DASHBOARD_METRICS.md** | Métricas do dashboard | `/docs/DASHBOARD_METRICS.md` |
| **JURIMETRIC_ANALYSIS_PLAN.md** | Plano de análise jurimétrica | `/docs/JURIMETRIC_ANALYSIS_PLAN.md` |
| **FINE_TUNING_FEASIBILITY_REPORT.md** | Relatório de viabilidade de fine-tuning | `/docs/FINE_TUNING_FEASIBILITY_REPORT.md` |

---

## 🛠️ Scripts

| Script | Descrição | Localização |
|--------|-----------|-------------|
| **validate_workflow.js** | Validação de workflows n8n | `/scripts/validate_workflow.js` |
| **validate_detailed.js** | Validação detalhada | `/scripts/validate_detailed.js` |
| **stj_downloader.py** | Download de jurisprudência STJ | `/scripts/stj_downloader.py` |
| **test_scenarios.js** | Cenários de teste | `/scripts/test_scenarios.js` |

---

## 📁 Workflows n8n

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| **n8n_workflow_agentes_especializados_v2.2.json** | Workflow principal (11 agentes) | **PRODUÇÃO** |
| **n8n_workflow_v2.1.1_cloud_ready.json** | Versão cloud-ready | Backup |
| **n8n_workflow_stj_vectorstore.json** | Vector store STJ | RAG (futuro) |
| **archive/workflows/** | Workflows legados | Arquivados |
| **test_cases/workflows/** | Workflows de teste | Testes |

---

## 🤖 Agentes Especializados

### Agentes Validados ✅

| Agente | Volume | Confiança | Status |
|--------|--------|-----------|--------|
| Bancário | 35-40% | 0.98 | ✅ Validado |
| Consumidor | 25-30% | 0.95 | ✅ Validado |
| Locação | 8-12% | 0.98 | ✅ Validado |
| Possessórias | 5-8% | 0.98 | ✅ Validado |

### Agentes Pendentes Validação ⏳

| Agente | Volume | Status |
|--------|--------|--------|
| Execução | 15-20% | ⚠️ Issue (truncation) |
| Saúde Cobertura | 15% | ⏳ Pendente |
| Saúde Contratual | 10% | ⏳ Pendente |
| Trânsito | 12% | ⏳ Pendente |
| Usucapião | 5% | ⏳ Pendente |
| Incorporação | 8% | ⏳ Pendente |
| Genérico | ~5% | ⏳ Pendente |

---

## 📊 Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| Versão | 2.2 |
| Nodes | 59 |
| Connections | 52 |
| Quality Score | 95/100 |
| Agentes | 11 |
| Agentes Validados | 5 |

---

## 🔗 Links Úteis

- [n8n Cloud](https://lexintel.app.n8n.cloud)
- [Google AI Studio](https://aistudio.google.com/app/apikey) - Gemini API Keys
- [Anthropic Console](https://console.anthropic.com/settings/keys) - Claude API Keys
- [Google Cloud Console](https://console.cloud.google.com) - OAuth2

---

*Atualizado: 2026-01-19 | Lex Intelligentia Judiciário v2.2*
