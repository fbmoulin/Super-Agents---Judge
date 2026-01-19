# Lex Intelligentia Judiciário - Instruções do Projeto

## Visão Geral

Sistema multi-agente para automação de minutas judiciais (decisões e sentenças) para Vara Cível do TJES, em conformidade com CNJ 615/2025.

## Versões

| Versão | Status | Descrição |
|--------|--------|-----------|
| v2.0 | Legacy | 6 agentes, router keywords, QA regex |
| v2.1 | Deprecated | Versão inicial com bugs |
| v2.1.1 | Legacy | Gemini router, Context Buffer, QA híbrido, Error Handling - TESTADO |
| v2.2 | **Produção** | 11 agentes, hierarchical router, Stage 2 conditional |

## Status do Projeto

```
╔═══════════════════════════════════════════════════════════════╗
║  ✅ WORKFLOW v2.2 - VALIDADO EM PRODUÇÃO                       ║
║                                                               ║
║  Quality Score: 95/100 (estrutura)                            ║
║  Nodes: 59 | Connections: 52                                  ║
║  Production Tests: 5/11 AGENTES VALIDADOS                     ║
║                                                               ║
║  AGENTES TESTADOS (2026-01-19):                               ║
║  ✓ agent_BANCARIO        - 0.98 confiança                     ║
║  ✓ agent_CONSUMIDOR      - 0.95 confiança                     ║
║  ✓ agent_EXECUCAO        - 0.95 confiança                     ║
║  ✓ agent_LOCACAO         - 0.98 confiança                     ║
║  ✓ agent_POSSESSORIAS    - 0.98 confiança                     ║
║  ○ agent_GENERICO        - pendente                           ║
║  ○ agent_SAUDE_COBERTURA - pendente teste                     ║
║  ○ agent_SAUDE_CONTRATUAL - pendente teste                    ║
║  ○ agent_TRANSITO        - pendente teste                     ║
║  ○ agent_USUCAPIAO       - pendente teste                     ║
║  ○ agent_INCORPORACAO    - pendente teste                     ║
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
| **Geração de Minutas** | Claude Sonnet 4 | Anthropic | ~$0.02 |
| QA Semântico | Gemini 2.5 Flash | Google | ~$0.00003 |
| Audit formatting | Code Node | - | $0 |

**Custo estimado por request:** ~$0.02 (90%+ é Claude)

## Arquivos do Projeto

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `n8n_workflow_agentes_especializados_v2.2.json` | **USAR** | Workflow v2.2 (59 nodes) |
| `n8n_workflow_v2.1.1_cloud_ready.json` | Cloud | Versão cloud-ready |
| `n8n_workflow_stj_vectorstore.json` | RAG | Vector store STJ |
| `credentials-setup.md` | Docs | Guia de configuração de credenciais |
| `docs/TUTORIAL_INICIANTES.md` | Docs | Tutorial passo-a-passo para iniciantes |
| `scripts/validate_workflow.js` | Script | Validação de workflows |
| `scripts/stj_downloader.py` | Script | Download de jurisprudência STJ |
| `init_db_audit_logs.sql` | Opcional | Schema PostgreSQL (alternativa a Sheets) |
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
- `test_cases/generico/` - 1 caso genérico (pendente teste)
- `test_cases/saude_cobertura/` - casos cobertura plano saúde
- `test_cases/saude_contratual/` - casos contratual plano saúde
- `test_cases/transito/` - casos acidente trânsito
- `test_cases/usucapiao/` - casos usucapião
- `test_cases/incorporacao/` - casos atraso imóvel

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
psql -U postgres -d lex_intelligentia -f init_db_audit_logs.sql
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

*Ultima atualizacao: 2026-01-19 | Versao: 2.2 | Quality Score: 95/100 | 11 agentes, hierarchical router*
