# Documentação - Lex Intelligentia Judiciário v2.2

## Índice de Documentos

Este arquivo serve como índice central para toda a documentação do projeto Lex Intelligentia.

---

## 📚 Documentação Principal

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **CLAUDE.md** | Documentação principal do projeto, status e configuração | `/CLAUDE.md` |
| **README_LEX_INTELLIGENTIA.md** | Visão geral, arquitetura, agentes e roadmap | `/README_LEX_INTELLIGENTIA.md` |
| **README_WORKFLOW.md** | Quick start e arquitetura do workflow n8n | `/README_WORKFLOW.md` |

---

## 🔧 Configuração

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **credentials-setup.md** | Guia de configuração de credenciais (Gemini, Claude, Sheets) | `/credentials-setup.md` |
| **init_db_audit_logs.sql** | Schema PostgreSQL (alternativa a Sheets) | `/init_db_audit_logs.sql` |

---

## 📖 Tutoriais

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **TUTORIAL_INICIANTES.md** | Tutorial passo-a-passo para iniciantes | `/docs/TUTORIAL_INICIANTES.md` |

---

## 🧪 Testes

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **test_cases/README.md** | Documentação dos casos de teste | `/test_cases/README.md` |
| **run_production_tests.js** | Script de testes automatizados | `/test_cases/run_production_tests.js` |
| **test_results/*.md** | Relatórios de testes de produção | `/test_cases/test_results/` |

---

## 📋 Planos e Roadmap

| Documento | Descrição | Localização |
|-----------|-----------|-------------|
| **ROADMAP.md** | Roadmap de evolução do projeto | `/ROADMAP.md` |
| **plans/*.md** | Planos de implementação e otimização | `/docs/plans/` |

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
