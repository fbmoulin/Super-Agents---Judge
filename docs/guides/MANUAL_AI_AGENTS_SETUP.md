# Guia: Configuração Manual dos AI Agents

**Projeto:** Lex Intelligentia Judiciário v2.3
**Data:** 2026-01-19

---

## Contexto

O workflow `n8n_workflow_MINIMAL_v2.3.json` foi criado sem os AI Agent nodes devido a incompatibilidades de schema com n8n 2.0+. Este guia explica como adicionar os 11 AI Agents manualmente.

---

## Pré-requisitos

1. ✅ Workflow MINIMAL importado no n8n
2. ✅ Credencial **Anthropic API** configurada
3. ✅ Credencial **Gemini API Key** configurada
4. ✅ Credencial **Google Sheets OAuth2** configurada

---

## Estrutura de Cada Agente

Cada agente segue esta estrutura:

```
[Switch: Seleciona Agente]
         │
         ▼
   [AI Agent Node]  ◄──── [Anthropic Chat Model]
         │
         ▼
[Merge: Coleta Outputs]
```

---

## Passo a Passo para CADA Agente

### 1. Localize o Placeholder

Procure nodes com nome `⚠️ ADD: AI Agent: [Nome]`

### 2. Delete o Placeholder

Selecione e delete o node placeholder.

### 3. Adicione AI Agent Node

1. Clique em **+** (Add Node)
2. Busque por **"AI Agent"**
3. Selecione **AI Agent** (não Tools Agent ou outros)

### 4. Configure o AI Agent

| Parâmetro | Valor |
|-----------|-------|
| **Agent** | Tools Agent |
| **Prompt** | `={{ $json.human_message }}` |

**Em Options:**

| Opção | Valor |
|-------|-------|
| **System Message** | `={{ $json.system_prompt }}` |
| **Max Iterations** | 10 |

### 5. Adicione Anthropic Chat Model

1. No AI Agent node, clique em **+ Add sub-node**
2. Selecione **Anthropic Chat Model**
3. Configure:

| Parâmetro | Valor |
|-----------|-------|
| **Credential** | Sua credencial Anthropic |
| **Model** | `claude-sonnet-4-20250514` |
| **Max Tokens** | 8192 |

### 6. Conecte as Arestas

1. **Entrada**: Conecte a saída correspondente do Switch ao AI Agent
2. **Saída**: Conecte o AI Agent ao node "Merge: Coleta Outputs"

---

## Lista dos 11 Agentes

### Agentes Principais (6)

| # | Nome | Output do Switch |
|---|------|------------------|
| 1 | AI Agent: Bancário | Output 0 (Bancário) |
| 2 | AI Agent: Consumidor | Output 1 (Consumidor) |
| 3 | AI Agent: Execução | Output 2 (Execução) |
| 4 | AI Agent: Locação | Output 3 (Locação) |
| 5 | AI Agent: Possessórias | Output 4 (Possessórias) |
| 6 | AI Agent: Genérico | Output 10 (Genérico/Fallback) |

### Agentes Saúde (2)

| # | Nome | Output do Switch |
|---|------|------------------|
| 7 | AI Agent: Saúde Cobertura | Output 5 |
| 8 | AI Agent: Saúde Contratual | Output 6 |

### Agentes Especializados (3)

| # | Nome | Output do Switch |
|---|------|------------------|
| 9 | AI Agent: Trânsito | Output 7 |
| 10 | AI Agent: Usucapião | Output 8 |
| 11 | AI Agent: Incorporação | Output 9 |

---

## Configuração Detalhada do Anthropic Chat Model

```
Model: claude-sonnet-4-20250514
Max Tokens: 8192
Temperature: 0.3 (opcional, para consistência)
```

**Credencial Anthropic:**
- Tipo: Anthropic API
- API Key: `sk-ant-...` (sua chave)

---

## Verificação

Após configurar todos os 11 agentes:

1. **Save** o workflow
2. **Ative** o workflow (toggle)
3. **Teste** com curl:

```bash
curl -X POST "https://lexintel.app.n8n.cloud/webhook/lex-intelligentia-agentes" \
  -H "Content-Type: application/json" \
  -d '{
    "fatos": "Teste de conexão",
    "questoes": "Verificar funcionamento",
    "pedidos": "Resposta do sistema",
    "classe": "Teste",
    "assunto": "Teste de sistema"
  }'
```

---

## Troubleshooting

### Erro: "Model not supported"
- Verifique se o AI Agent node é a versão mais recente
- Delete e adicione novamente do menu

### Erro: "Could not find property option"
- O node foi importado, não criado manualmente
- Delete e recrie do zero

### Erro: Anthropic 401
- Verifique a API Key na credencial
- Confirme que a key está ativa no console Anthropic

### Erro: Switch não roteia corretamente
- Verifique se os outputs do Switch estão conectados aos agents certos
- Verifique a expressão: `={{ $json.classificacao?.agente }}`

---

## System Prompts de Referência

Os system prompts estão definidos no node **"Set System Prompt"**. Cada agente recebe automaticamente o prompt correto baseado na classificação do Gemini Router.

### Agentes e seus Prompts:

| Agente | Contexto |
|--------|----------|
| Bancário | Empréstimos, juros abusivos, fraudes bancárias |
| Consumidor | CDC, danos morais, falha de serviço |
| Execução | Títulos extrajudiciais, cumprimento de sentença |
| Locação | Lei 8.245/91, despejo, renovatória |
| Possessórias | Reintegração, manutenção de posse |
| Saúde Cobertura | Negativa de procedimentos, ANS |
| Saúde Contratual | Reajustes, rescisão, carência |
| Trânsito | Acidentes, responsabilidade civil |
| Usucapião | Todas modalidades (extraordinária, ordinária, etc.) |
| Incorporação | Atraso entrega, Lei 4.591/64 |
| Genérico | Fallback para casos não classificados |

---

## Tempo Estimado

- **Por agente:** ~3-5 minutos
- **Total (11 agentes):** ~45-60 minutos

---

*Lex Intelligentia Judiciário v2.3 - Manual Setup Guide*
