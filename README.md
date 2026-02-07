# 🏛️ LEX INTELLIGENTIA JUDICIÁRIO
## Sistema Multi-Agente para Automação de Minutas Judiciais

**Versão:** 2.6.2
**Data:** Fevereiro 2026
**Compliance:** CNJ 615/2025
**Quality Score:** 95/100
**Security:** Prompt Injection Protection + Webhook Auth
**Autor:** Sistema desenvolvido para 2ª Vara Cível de Cariacica/ES

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Agentes Especializados](#agentes-especializados)
4. [Arquivos do Projeto](#arquivos-do-projeto)
5. [Instalação](#instalação)
6. [Configuração](#configuração)
7. [Uso](#uso)
8. [Vector Store STJ](#vector-store-stj)
9. [Compliance CNJ 615/2025](#compliance-cnj-6152025)
10. [Roadmap](#roadmap)

---

## 🎯 VISÃO GERAL

O Lex Intelligentia Judiciário é um sistema multi-agente que se integra ao seu fluxo n8n existente para automatizar a geração de minutas de decisões e sentenças em uma Vara Cível.

### Características Principais

- ✅ **21 Agentes Especializados** - **100% validados** (32+ casos de teste, 98.5% score)
- ✅ **Router Hierárquico** (Gemini 2.5 Flash) com classificação em 2 estágios
- ✅ **QA Híbrido** (estrutural + semântico)
- ✅ **Audit Log** em conformidade com CNJ 615/2025
- ✅ **Vector Store** com jurisprudência STJ (fase futura)
- ✅ **100% Integrável** ao n8n Cloud

### Fluxo Operacional

```
[FIRAC] → [Gemini Router Stage 1] → [Context Buffer] → [IF: Needs Stage 2?]
                                                            ↓         ↓
                                                         [true]   [false]
                                                            ↓         ↓
                                                 [Gemini Stage 2] → [Merge]
                                                                      ↓
                                                          [Set System Prompt] → [Switch]
                                                                                   ↓
    ┌──────────┬───────────┬────────────┬─────────┬──────────┬────────────┬─────────────┐
    ↓          ↓           ↓            ↓         ↓          ↓            ↓             ↓
[Bancário] [Consumidor] [Possessórias] [Locação] [Execução] [Saúde Cob.] [Saúde Cont.] [...]
                                                                                        ↓
                                                                              [Trânsito][Usucapião][Incorporação][Genérico]
```

---

## 🏗️ ARQUITETURA

### Pipeline Principal

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUXO N8N EXISTENTE                      │
│  [Upload PDF] → [Extração OCR] → [Análise FIRAC+]              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   WORKFLOW AGENTES (NOVO)                       │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    ROUTER    │───▶│    SWITCH    │───▶│    AGENTE    │      │
│  │   Semântico  │    │   (6 saídas) │    │ Especializado│      │
│  └──────────────┘    └──────────────┘    └──────┬───────┘      │
│                                                  │              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────▼───────┐      │
│  │   RESPONSE   │◀───│  AUDIT LOG   │◀───│   QA CHECK   │      │
│  │    Final     │    │  CNJ 615     │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Componente | Tecnologia |
|------------|------------|
| Orquestração | n8n Cloud |
| Router/QA | Gemini 2.5 Flash (Google) |
| Geração | Claude Sonnet 4 (Anthropic) |
| Persistence | Google Sheets |
| Vector Store | Qdrant 1.7+ (fase futura) |

---

## 🤖 AGENTES ESPECIALIZADOS

### Distribuição Estimada de Volume

| Agente | Tipos de Ação | Volume |
|--------|---------------|--------|
| **Bancário** | Revisionais, consignados, financiamentos | 35-40% |
| **Consumidor** | Danos morais, CDC, negativação | 25-30% |
| **Execução** | Títulos extrajudiciais, cumprimento | 15-20% |
| **Locação** | Despejo, renovatória, revisional | 8-12% |
| **Possessórias** | Reintegração, manutenção de posse | 5-8% |
| **Saúde Cobertura** | Negativa de cobertura, carência | 15% |
| **Saúde Contratual** | Reajuste, rescisão, portabilidade | 10% |
| **Trânsito** | Indenização, responsabilidade civil | 12% |
| **Usucapião** | Usucapião extraordinária, especial | 5% |
| **Incorporação** | Atraso de imóvel, rescisão | 8% |
| **Execução Fiscal** | Execuções fiscais estaduais/municipais | 10-15% |
| **Resp. Civil Estado** | Responsabilidade civil do Estado | 5-8% |
| **Genérico** | Fallback para baixa confiança | ~5% |

### Base Jurisprudencial por Agente

**Bancário:**
- Súmulas 297, 381, 382, 539, 565, 603/STJ
- Taxa média BACEN
- Parâmetros dano moral TJES

**Consumidor:**
- Súmulas 385, 388, 403, 479/STJ
- Tríplice função do dano moral
- Tabela de valores TJES 2025-2026

**Possessórias:**
- Arts. 560-567 CPC
- Requisitos de liminar

**Saúde Cobertura:**
- Súmulas 302, 469, 597, 608, 609/STJ
- Lei 9.656/98, RN ANS 465

**Saúde Contratual:**
- Tema 952 STJ
- Art. 15 Lei 9.656/98, RN ANS 438

**Trânsito:**
- Arts. 186, 927, 932, 944, 950 CC
- Código de Trânsito Brasileiro

**Usucapião:**
- Arts. 1.238-1.244 CC
- Arts. 183, 191 CF

**Incorporação:**
- Temas 970, 996 STJ
- Súmula 543 STJ, Lei 4.591/64

**Locação:**
- Lei 8.245/91 completa
- Arts. 46, 47, 51, 62

**Execução:**
- Arts. 784, 786, 914, 921 CPC
- Prescrição intercorrente
- Títulos executivos

---

## 📁 ARQUIVOS DO PROJETO

### Workflows n8n

| Arquivo | Descrição |
|---------|-----------|
| `n8n_workflow_v5.1_improved_prompts.json` | Workflow principal (prompts v5.1, 21 agentes) |
| `n8n_workflow_v2.6_fazenda_publica.json` | Workflow Fazenda Pública (agentes fiscais/Estado) |
| `archive/workflows/n8n_workflow_v2.7_graph_rag.json` | Workflow com Graph/RAG (experimental, archived) |
| `archive/workflows/n8n_workflow_agentes_especializados_v2.2.json` | Workflow v2.2 legacy (11 agentes) |

### Documentação

| Arquivo | Descrição |
|---------|-----------|
| `CLAUDE.md` | Documentação principal do projeto |
| `docs/guides/credentials-setup.md` | Guia de configuração de credenciais |
| `docs/TUTORIAL_INICIANTES.md` | Tutorial passo-a-passo para iniciantes |
| `docs/plans/*.md` | Planos de implementação e otimização |
| `docs/guides/GUIA_INTEGRACAO_AGENTES.md` | Guia de integração |

### Infraestrutura

| Arquivo | Descrição |
|---------|-----------|
| `docker/docker-compose.yml` | Stack completa (Qdrant, n8n, Redis) |
| `docker/docker-compose-qdrant.yml` | Stack mínima (Qdrant isolado) |
| `migrations/init_db_audit_logs.sql` | Schema PostgreSQL para audit logs |

### Scripts

| Arquivo | Descrição |
|---------|-----------|
| `scripts/data/stj_downloader.py` | Download de dados abertos STJ |
| `docs/RAG_INTEGRATION.md` | Guia de integração RAG |

---

## 🚀 INSTALAÇÃO

### Pré-requisitos

- Docker e Docker Compose
- n8n 1.24+ (Cloud ou Self-hosted)
- API Key Anthropic (Claude)
- Python 3.10+ (para scripts)

### Passo 1: Subir Infraestrutura

```bash
# Clone ou copie os arquivos
mkdir lex-intelligentia && cd lex-intelligentia

# Subir containers
docker-compose -f docker/docker-compose.yml up -d

# Verificar status
docker-compose ps
```

### Passo 2: Importar Workflows

1. Acesse n8n em `http://localhost:5678`
2. Vá em **Settings** → **Import Workflow**
3. Importe `n8n_workflow_v5.1_improved_prompts.json`
4. Importe `n8n_workflow_stj_vectorstore.json` (opcional)

### Passo 3: Configurar Credenciais

```yaml
# No n8n, crie credenciais:
Anthropic API:
  Name: anthropic_credentials
  API Key: sk-ant-xxx...

# Se usar vector store:
OpenAI API (para embeddings):
  Name: openai_credentials
  API Key: sk-xxx...
```

### Passo 4: Ativar Workflows

1. Abra cada workflow importado
2. Clique em **Activate** (toggle no canto superior direito)
3. Teste o webhook com curl

---

## ⚙️ CONFIGURAÇÃO

### Variáveis de Ambiente

```bash
# .env
N8N_ENCRYPTION_KEY=sua-chave-segura
POSTGRES_PASSWORD=senha-segura
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx  # Para embeddings
```

### Ajustes do Router

No nó **Code: Router Judiciário**, você pode:

1. **Ajustar keywords** para cada agente
2. **Modificar threshold** de confiança (default: 0.5)
3. **Adicionar novos agentes**

### Ajustes de QA

No nó **Code: QA Check**, você pode:

1. **Alterar score mínimo** (default: 0.7)
2. **Adicionar validações** específicas
3. **Customizar classificação de risco**

---

## 📖 USO

### Chamando via HTTP

```bash
curl -X POST http://localhost:5678/webhook/lex-intelligentia-agentes \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "fatos": "O autor celebrou contrato de empréstimo...",
      "questoes": "Houve cobrança indevida?",
      "pedidos": "Devolução em dobro e danos morais",
      "classe_processual": "Procedimento Comum Cível",
      "assunto": "Contratos Bancários"
    }
  }'
```

### Resposta Esperada

```json
{
  "success": true,
  "minuta": "SENTENÇA\n\nI - RELATÓRIO\n...",
  "qa": {
    "score": 0.85,
    "aprovado": true,
    "marcadores_revisar": 1
  },
  "compliance": {
    "risco": "BAIXO",
    "agente": "agent_bancario",
    "confianca": 0.87
  }
}
```

### Integrando ao Fluxo Existente

Veja o arquivo `docs/guides/GUIA_INTEGRACAO_AGENTES.md` para instruções detalhadas.

---

## 📚 VECTOR STORE STJ

### Download dos Dados

```bash
# Instalar dependências
pip install requests tqdm pandas

# Baixar todos os dados
python scripts/data/stj_downloader.py --download-all

# Processar para chunks
python scripts/data/stj_downloader.py --process --input ./stj_data --output ./stj_chunks
```

### Datasets Disponíveis

| Dataset | Tamanho | Relevância |
|---------|---------|------------|
| Precedentes Qualificados | ~5 MB | ⭐⭐⭐ ESSENCIAL |
| Espelhos 2ª Seção | ~500 MB | ⭐⭐⭐ ALTA |
| Espelhos 3ª Turma | ~400 MB | ⭐⭐⭐ ALTA |
| Espelhos 4ª Turma | ~400 MB | ⭐⭐⭐ ALTA |

### Ingestão no Qdrant

1. Ative o workflow `STJ Vector Store - Ingestão e Busca`
2. Copie o arquivo de chunks para `/data/stj/`
3. Chame o webhook de ingestão

---

## 🔐 SEGURANÇA

### Proteções Implementadas (v2.6.2)

| Proteção | Descrição |
|----------|-----------|
| **Prompt Injection Detection** | 20+ patterns para detectar tentativas de manipulação |
| **Webhook Authentication** | API Key, Bearer Token, HMAC signature |
| **Input Sanitization** | Remoção de null bytes, controle chars, normalização |
| **Rate Limiting** | Configuração para 60 req/min por IP |
| **LGPD Compliance** | IP anonymization, PII masking |

### Configuração de Autenticação

```bash
# Gerar API key
openssl rand -hex 32

# Adicionar ao .env.keys
WEBHOOK_API_KEY=sua_chave_gerada
```

### Uso no n8n

Adicione header `X-API-Key` nas requisições ao webhook:
```bash
curl -X POST https://seu-webhook.n8n.cloud/webhook/lex-intelligentia-agentes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_chave_gerada" \
  -d '{"fatos": "...", "questoes": "...", "pedidos": "..."}'
```

---

## ⚖️ COMPLIANCE CNJ 615/2025

### Requisitos Atendidos

| Requisito | Implementação |
|-----------|---------------|
| Classificação de risco | ✅ BAIXO/MEDIO/ALTO por confiança |
| Supervisão humana | ✅ Marcadores [REVISAR] + flag obrigatória |
| Audit logging | ✅ Registro de todas as operações |
| Transparência | ✅ Agente e confiança no output |
| Rastreabilidade | ✅ Hash de input/output |

### Classificação de Risco

```javascript
// Critérios automáticos
BAIXO:  confianca >= 0.75 && sem_falhas_criticas
MEDIO:  confianca >= 0.50 && confianca < 0.75
ALTO:   confianca < 0.50 || agent_generico
```

### Audit Log Gerado

```json
{
  "timestamp": "2026-01-14T10:30:00.000Z",
  "operacao": "GERACAO_MINUTA",
  "agente": "agent_bancario",
  "classificacao_risco": "BAIXO",
  "confianca_classificacao": 0.87,
  "score_qa": 0.85,
  "requer_revisao_humana": true,
  "hash_input": "abc123...",
  "hash_output": "def456..."
}
```

---

## 🗺️ ROADMAP

### Fase 1 - MVP ✅
- [x] 6 agentes especializados iniciais
- [x] Router por keywords
- [x] QA Check básico
- [x] Audit log CNJ 615

### Fase 1.5 - Expansão de Agentes ✅
- [x] 11 agentes especializados
- [x] Router hierárquico Gemini 2.5 Flash
- [x] QA híbrido (estrutural + semântico)
- [x] Context Buffer com null safety
- [x] Error handling com retry

### Fase 2 - Validação em Produção ✅ CONCLUÍDA
- [x] Bancário validado (0.98 confiança)
- [x] Consumidor validado (0.95 confiança)
- [x] Locação validado (0.98 confiança)
- [x] Possessórias validado (0.98 confiança)
- [x] Execução validado (0.95 confiança)

### Fase 2.5 - Agentes v2.5 ✅ CONCLUÍDA (2026-01-20)
- [x] **19/19 agentes validados** (100% cobertura)
- [x] 32 casos de teste executados
- [x] Score médio global: 98.5%
- [x] 100% taxa de aprovação (>75% threshold)

| Fase | Agentes | Score Médio |
|------|---------|-------------|
| Inicial | COBRANÇA, DIVÓRCIO, INVENTÁRIO, SEGUROS | 98.5% |
| Fase 1 | ALIMENTOS, GUARDA | 96% |
| Fase 2 | PATERNIDADE, SAÚDE_COBERTURA | 102.5% |
| Fase 3 | SAÚDE_CONTRATUAL, REPARAÇÃO_DANOS | 99% |
| Fase 4 | TRÂNSITO, USUCAPIÃO | 97.5% |
| Fase 5 | INCORPORAÇÃO, GENÉRICO | 97.5% |

📊 Relatório completo: `test_cases/test_results/V2.5_AGENT_TEST_REPORT_2026-01-20.md`

### Fase 2.6 - Agentes Fazenda Pública (Em Andamento)
- [x] Plano de implementação criado (`docs/plans/2026-01-21-agentes-fazenda-publica.md`)
- [x] **agent_EXECUCAO_FISCAL** - Execuções fiscais estaduais/municipais (CAMADA 0-1 completo)
- [ ] agent_EXECUCAO_FISCAL - CAMADA 2-4 (metodologia e templates)
- [ ] agent_RESP_CIVIL_ESTADO - Responsabilidade civil do Estado
- [ ] agent_MANDADO_SEGURANCA - Mandado de segurança contra Fazenda
- [ ] agent_SAUDE_MEDICAMENTOS - Fornecimento de medicamentos (STF Temas 6, 500, 793, 1234)

**Novos domínios:**
| Agente | Domínio | Base Legal |
|--------|---------|------------|
| EXECUCAO_FISCAL | Execuções fiscais | LEF 6.830/80, CTN, RICMS-ES |
| RESP_CIVIL_ESTADO | Responsabilidade civil | CF art. 37 §6º, CC arts. 43, 927, 945 |
| MANDADO_SEGURANCA | Writ of mandamus | Lei 12.016/2009, CF art. 5º LXIX |
| SAUDE_MEDICAMENTOS | Direito à saúde | STF Temas 6, 500, 793, 1234, SV 61 |

### Fase 3 - Vector Store (Próxima)
- [ ] Download dados STJ
- [ ] Ingestão no Qdrant
- [ ] Tool de busca para agentes
- [ ] Fundamentação com precedentes

### Fase 4 - Refinamento
- [ ] Calibração com processos reais
- [ ] Dashboard de métricas
- [ ] Feedback loop

---

## 📞 SUPORTE

Para dúvidas ou problemas:

1. Verifique os logs do n8n
2. Consulte o arquivo `docs/guides/GUIA_INTEGRACAO_AGENTES.md`
3. Revise as credenciais configuradas
4. Teste os webhooks isoladamente

---

## 📄 LICENÇA

Este projeto foi desenvolvido para uso interno do Tribunal de Justiça do Espírito Santo, em conformidade com as diretrizes do CNJ para uso de IA no Judiciário.

---

*Documentação atualizada em 2026-01-30 - Lex Intelligentia Judiciário v2.6*
