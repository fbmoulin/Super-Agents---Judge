# Guia de Configuração de Credenciais - Lex Intelligentia v2.1.1

## Credenciais Necessárias no n8n

### 1. Gemini API Key (Google AI)

**Tipo:** HTTP Header Auth
**Nome sugerido:** `Gemini API Key`

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Crie uma API Key
3. No n8n, crie uma credencial "HTTP Header Auth":
   - **Header Name:** `x-goog-api-key`
   - **Header Value:** `AIzaSy...` (sua key)

**No workflow:** Atualizar `GEMINI_CREDENTIALS_ID` nos nós:
- Gemini Router
- QA Semântico - Gemini

---

### 2. Anthropic API (Claude)

**Tipo:** Anthropic API
**Nome sugerido:** `Anthropic API`

1. Acesse [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Crie uma API Key
3. No n8n, crie uma credencial "Anthropic API":
   - **API Key:** `sk-ant-...`

**No workflow:** Atualizar `ANTHROPIC_CREDENTIALS_ID` nos nós:
- Claude: Bancário
- Claude: Consumidor
- Claude: Possessórias
- Claude: Locação
- Claude: Execução
- Claude: Genérico

---

### 3. Google Sheets OAuth2

**Tipo:** Google Sheets OAuth2
**Nome sugerido:** `Google Sheets`

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto ou use existente
3. Ative a API Google Sheets
4. Crie credenciais OAuth 2.0
5. No n8n, configure OAuth2 com Client ID e Secret

**No workflow:** Atualizar `GOOGLE_SHEETS_CREDENTIALS_ID` nos nós:
- Google Sheets: Audit Log
- Google Sheets: Error Log

---

## Variáveis de Ambiente

### AUDIT_SHEET_ID

ID da planilha Google Sheets para audit logs.

1. Crie uma nova planilha no Google Sheets
2. Crie duas abas: `Logs` e `Errors`
3. Copie o ID da URL: `https://docs.google.com/spreadsheets/d/[AUDIT_SHEET_ID]/edit`
4. Configure no n8n: Settings > Variables > `AUDIT_SHEET_ID`

**Estrutura da aba "Logs":**
| ID | Timestamp | Processo | Categoria | Agente | Risco | Score | Aprovado | Palavras | Tempo_ms | Hash_Input | Hash_Output |

**Estrutura da aba "Errors":**
| Timestamp | Workflow_ID | Error_Node | Error_Message | Tentativa | Action | Final_Failure |

---

## Verificação

Após configurar, teste o workflow com:

```bash
curl -X POST https://seu-n8n.app.n8n.cloud/webhook/lex-intelligentia-agentes \
  -H "Content-Type: application/json" \
  -d '{
    "fatos": "O autor celebrou contrato de empréstimo consignado em 2024. Verificou desconto indevido em seu benefício previdenciário.",
    "questoes": "Existência de vício de consentimento. Responsabilidade da instituição financeira.",
    "pedidos": "Declaração de nulidade do contrato. Restituição dos valores descontados. Danos morais.",
    "classe": "Procedimento Comum Cível",
    "assunto": "Empréstimo consignado fraudulento"
  }'
```

---

## Troubleshooting

### Erro 401 no Gemini Router
- Verificar se a API Key está correta
- Confirmar header `x-goog-api-key`

### Erro no Claude
- Verificar se a API Key Anthropic está ativa
- Confirmar modelo `claude-sonnet-4-20250514`

### Erro no Google Sheets
- Verificar se OAuth2 está conectado
- Confirmar se a planilha tem as abas corretas
- Verificar permissão de escrita

---

*Lex Intelligentia Judiciário v2.1.1 - 2026-01-14*
*Quality Score: 95/100 | Testes: 15/15 passando*
