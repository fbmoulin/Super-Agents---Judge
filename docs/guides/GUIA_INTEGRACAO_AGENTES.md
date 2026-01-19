# 🔗 GUIA DE INTEGRAÇÃO - LEX INTELLIGENTIA JUDICIÁRIO
## Conectando os Agentes ao seu Fluxo n8n Existente

**Versão:** 2.0 - Janeiro 2026  
**Última atualização:** 14/01/2026

---

## 📋 VISÃO GERAL

Este guia explica como integrar os agentes especializados ao seu fluxo n8n existente (PDF → Extração → FIRAC → Minutas).

### Arquitetura Final

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SEU FLUXO N8N EXISTENTE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────────────┐   │
│  │   Upload     │───▶│ Extração PDF     │───▶│   Análise FIRAC+         │   │
│  │   Processo   │    │ (OCR/Parser)     │    │   (LLM Principal)        │   │
│  │   (PDF)      │    │                  │    │                          │   │
│  └──────────────┘    └──────────────────┘    └────────────┬─────────────┘   │
│                                                           │                  │
│                                    ┌──────────────────────┘                  │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                 NOVO: WORKFLOW AGENTES ESPECIALIZADOS               │    │
│  │  ┌────────────┐   ┌────────────────────────────────────────────┐   │    │
│  │  │  HTTP      │   │                SWITCH                       │   │    │
│  │  │  Request   │──▶│  ┌─────────┬─────────┬─────────┬─────────┐ │   │    │
│  │  │  (POST)    │   │  │BANCÁRIO │CONSUMO  │LOCAÇÃO  │EXECUÇÃO │ │   │    │
│  │  └────────────┘   │  └────┬────┴────┬────┴────┬────┴────┬────┘ │   │    │
│  │                   │       └─────────┴─────────┴─────────┘      │   │    │
│  │                   │                    │                        │   │    │
│  │                   │               QA CHECK + AUDIT              │   │    │
│  │                   └────────────────────┼────────────────────────┘   │    │
│  └─────────────────────────────────────────┼───────────────────────────┘    │
│                                            ▼                                 │
│                               ┌────────────────────────┐                    │
│                               │   Output: Minuta       │                    │
│                               │   + Score QA           │                    │
│                               │   + Audit Log          │                    │
│                               └────────────────────────┘                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 OPÇÕES DE INTEGRAÇÃO

### Opção 1: HTTP Request (RECOMENDADA)

Adicione um nó HTTP Request após seu nó FIRAC para chamar o workflow de agentes:

```javascript
// Nó HTTP Request após FIRAC
{
  "method": "POST",
  "url": "http://localhost:5678/webhook/lex-intelligentia-agentes",
  "body": {
    "firac": "={{ $json.firac_output }}",
    "classe_processual": "={{ $json.classe }}",
    "assunto": "={{ $json.assunto }}",
    "pedidos": "={{ $json.pedidos }}"
  }
}
```

### Opção 2: Sub-Workflow (Execute Workflow)

Use o nó "Execute Workflow" para chamar o workflow de agentes como sub-workflow:

```javascript
// Configuração Execute Workflow
{
  "workflowId": "ID_DO_WORKFLOW_AGENTES",
  "options": {
    "waitForCompletion": true
  }
}
```

### Opção 3: Integração Direta

Copie os nós do workflow de agentes diretamente para seu fluxo existente.

---

## 📝 PASSO A PASSO

### Passo 1: Importar o Workflow de Agentes

1. No n8n, vá em **Settings** → **Import Workflow**
2. Carregue o arquivo `n8n_workflow_agentes_especializados.json`
3. Configure as credenciais da Anthropic API

### Passo 2: Configurar Credenciais

```yaml
# Credenciais necessárias
Anthropic API:
  - Nome: anthropic_credentials
  - API Key: sk-ant-xxx...
  - Modelo: claude-sonnet-4-20250514
```

### Passo 3: Adicionar Chamada no Fluxo Existente

Após seu nó FIRAC, adicione um nó **HTTP Request**:

```json
{
  "parameters": {
    "method": "POST",
    "url": "={{ $env.AGENTES_WEBHOOK_URL || 'http://localhost:5678/webhook/lex-intelligentia-agentes' }}",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify({ body: $json }) }}"
  }
}
```

### Passo 4: Tratar a Resposta

Adicione um nó **Code** para processar a resposta dos agentes:

```javascript
const response = $input.first().json;

if (!response.success) {
  throw new Error('Falha na geração da minuta');
}

return [{
  json: {
    minuta: response.minuta,
    score_qa: response.qa.score,
    aprovado: response.qa.aprovado,
    agente_usado: response.compliance.agente,
    risco: response.compliance.risco,
    requer_revisao: response.qa.marcadores_revisar > 0
  }
}];
```

---

## 🔧 CONFIGURAÇÕES AVANÇADAS

### Variáveis de Ambiente

```bash
# .env do n8n
AGENTES_WEBHOOK_URL=http://localhost:5678/webhook/lex-intelligentia-agentes
ANTHROPIC_API_KEY=sk-ant-xxx
DEFAULT_MODEL=claude-sonnet-4-20250514
QA_SCORE_MINIMO=0.7
```

### Ajuste de Thresholds

No nó **Router Judiciário**, ajuste os thresholds:

```javascript
// Linha ~85 do código
if (confianca < 0.5 || melhorClassif.peso === 0) {  // ← Ajuste aqui
  agenteEscolhido = 'agent_generico';
  nomeEscolhido = 'Genérico (Fallback)';
}
```

### Adicionar Novo Agente

Para adicionar um novo agente especializado:

1. Adicione nova classificação no Router:
```javascript
{
  agente: 'agent_novo',
  nome: 'Novo Tipo',
  keywords: ['keyword1', 'keyword2', ...],
  peso: 0
}
```

2. Adicione nova opção no Switch Node

3. Crie o AI Agent Node com system prompt específico

4. Conecte ao Merge

---

## 📊 FORMATO DO INPUT

O workflow espera receber um JSON com a análise FIRAC:

```json
{
  "body": {
    "fatos": "O autor celebrou contrato de empréstimo consignado...",
    "questoes": "1. Houve fraude na contratação? 2. É cabível dano moral?",
    "pedidos": "Declaração de inexistência do débito e danos morais",
    "classe_processual": "Procedimento Comum Cível",
    "assunto": "Contratos Bancários",
    "analise_juridica": "...",
    "aplicacao_normas": "CDC, CC, Súmulas STJ...",
    "conclusao_firac": "..."
  }
}
```

---

## 📤 FORMATO DO OUTPUT

O workflow retorna:

```json
{
  "success": true,
  "minuta": "SENTENÇA\n\nI - RELATÓRIO\n...",
  "qa": {
    "score": 0.85,
    "aprovado": true,
    "marcadores_revisar": 2
  },
  "compliance": {
    "risco": "BAIXO",
    "agente": "agent_bancario",
    "confianca": 0.87
  },
  "audit_id": "abc123...",
  "timestamp": "2026-01-14T10:30:00.000Z"
}
```

---

## 🧪 TESTANDO A INTEGRAÇÃO

### Teste Manual via cURL

```bash
curl -X POST http://localhost:5678/webhook/lex-intelligentia-agentes \
  -H "Content-Type: application/json" \
  -d '{
    "body": {
      "fatos": "O autor contratou empréstimo consignado junto ao Banco Réu...",
      "questoes": "Houve desconto indevido em folha?",
      "pedidos": "Devolução em dobro e danos morais",
      "classe_processual": "Procedimento Comum Cível",
      "assunto": "Empréstimo Consignado"
    }
  }'
```

### Teste via n8n

1. Ative o workflow de agentes
2. Execute seu fluxo existente com um PDF de teste
3. Verifique os logs de execução
4. Confira o audit log no console

---

## 🔍 TROUBLESHOOTING

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| 404 no webhook | Workflow não ativo | Ativar o workflow |
| Timeout | Minuta muito longa | Aumentar timeout no HTTP Request |
| Agent genérico sempre | Keywords não matcheando | Revisar keywords do Router |
| Score QA baixo | Estrutura incompleta | Ajustar system prompt do agente |
| Erro de credenciais | API key inválida | Verificar credenciais Anthropic |

---

## 📈 MÉTRICAS E MONITORAMENTO

### Logs Importantes

```javascript
// Console logs gerados pelo workflow
console.log('ROUTER:', agenteEscolhido, 'Confiança:', confianca);
console.log('QA SCORE:', scoreQA, 'Aprovado:', aprovado);
console.log('AUDIT LOG CNJ 615:', JSON.stringify(auditLog));
```

### Dashboard Sugerido

Monitore:
- Total de minutas geradas por dia
- Distribuição por tipo de agente
- Score QA médio
- Taxa de marcadores [REVISAR]
- Tempo médio de geração

---

## 📚 PRÓXIMOS PASSOS

1. ✅ Importar workflow de agentes
2. ✅ Configurar credenciais
3. ✅ Conectar ao fluxo existente
4. ⬜ Testar com 20 processos de cada tipo
5. ⬜ Calibrar thresholds do Router
6. ⬜ Ajustar parâmetros de dano moral conforme TJES
7. ⬜ Integrar vector store STJ (opcional)
8. ⬜ Configurar PostgreSQL para audit logs persistentes

---

*Guia gerado em Janeiro 2026 - Lex Intelligentia Judiciário v2.0*
