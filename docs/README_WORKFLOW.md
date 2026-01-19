# n8n Workflow - Lex Intelligentia Judiciário v2.2

## Quick Start

### 1. Import Workflow
```
n8n_workflow_agentes_especializados_v2.2.json
```

### 2. Configure Credentials

| Credential | Type | Where to Get |
|------------|------|--------------|
| Gemini API Key | HTTP Header Auth | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| Anthropic API | Anthropic API | [Anthropic Console](https://console.anthropic.com/settings/keys) |
| Google Sheets | OAuth2 | [Google Cloud Console](https://console.cloud.google.com) |

See `credentials-setup.md` for detailed instructions.

### 3. Set Environment Variable
```
AUDIT_SHEET_ID = <your-google-sheet-id>
```

### 4. Create Google Sheet
- Tab 1: `Logs` (audit entries)
- Tab 2: `Errors` (error tracking)

### 5. Activate & Test
```bash
curl -X POST https://your-n8n.app.n8n.cloud/webhook/lex-intelligentia-agentes \
  -H "Content-Type: application/json" \
  -d '{
    "fatos": "O autor celebrou contrato de empréstimo consignado...",
    "questoes": "Existência de vício de consentimento...",
    "pedidos": "Declaração de nulidade. Danos morais.",
    "classe": "Procedimento Comum Cível",
    "assunto": "Empréstimo consignado fraudulento"
  }'
```

## Workflow Stats

| Metric | Value |
|--------|-------|
| Nodes | 59 |
| Connections | 52 |
| Quality Score | 95/100 |
| Agents | 11 |

## Architecture

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

## Models by Function

| Function | Model | Provider | Cost/req |
|----------|-------|----------|----------|
| Router + Classification | Gemini 2.5 Flash | Google | ~$0.00003 |
| Entity Extraction | Gemini 2.5 Flash | Google | (included) |
| **Minute Generation** | Claude Sonnet 4 | Anthropic | ~$0.02 |
| QA Semantic | Gemini 2.5 Flash | Google | ~$0.00003 |
| Audit formatting | Code Node | - | $0 |

**Estimated cost per request:** ~$0.02 (90%+ is Claude)

## Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Minuta gerada com sucesso |
| 503 | Transient Error | Retry after `retry_after_seconds` |
| 500 | Permanent Error | Manual intervention needed |

## Specialized Agents

| Agent | Status | Confidence |
|-------|--------|------------|
| agent_BANCARIO | ✅ Validated | 0.98 |
| agent_CONSUMIDOR | ✅ Validated | 0.95 |
| agent_EXECUCAO | ⚠️ Issue | 0.30 (truncation) |
| agent_LOCACAO | ✅ Validated | 0.98 |
| agent_POSSESSORIAS | ✅ Validated | 0.98 |
| agent_SAUDE_COBERTURA | ⏳ Pending | - |
| agent_SAUDE_CONTRATUAL | ⏳ Pending | - |
| agent_TRANSITO | ⏳ Pending | - |
| agent_USUCAPIAO | ⏳ Pending | - |
| agent_INCORPORACAO | ⏳ Pending | - |
| agent_GENERICO | ⏳ Pending | - |

## Files Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Full project documentation |
| `credentials-setup.md` | Credential configuration guide |
| `docs/TUTORIAL_INICIANTES.md` | Beginner tutorial |
| `init_db_audit_logs.sql` | PostgreSQL schema (optional) |
| `test_cases/` | Test cases for all domains |

## CNJ 615/2025 Compliance

- Risk classification: BAIXO / MEDIO / ALTO
- Human supervision: Always required
- Audit hash: djb2 + FNV-1a hybrid
- Full traceability: audit_id, workflow_id, timestamps

---

*Lex Intelligentia Judiciário v2.2 - Updated 2026-01-19*
