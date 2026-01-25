# Integração LEX PROMPTER no Workflow n8n

**Data:** 2026-01-19
**Versão:** 1.0
**Status:** Especificação para Implementação

---

## Visão Geral

O **LEX PROMPTER** é um agente de meta-prompting que gera prompts especializados em tempo real para casos que não possuem template pré-definido no sistema Lex Intelligentia.

### Problema Resolvido

| Situação Atual | Com LEX PROMPTER |
|----------------|------------------|
| 11 agentes especializados | 11 agentes + geração dinâmica |
| Casos não classificados → template genérico | Casos não classificados → prompt otimizado |
| ~85% cobertura especializada | ~100% cobertura especializada |

---

## Arquitetura de Integração

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW LEX INTELLIGENTIA v2.3              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Webhook: Processo]                                            │
│          ↓                                                       │
│  [Extrator FIRAC]                                               │
│          ↓                                                       │
│  [Classificador de Domínio]                                     │
│          ↓                                                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              SWITCH: Domínio Identificado?            │       │
│  └──────────────────────────────────────────────────────┘       │
│          │                                                       │
│    ┌─────┼─────┬─────┬─────┬─────┬─────┬─────┐                 │
│    │     │     │     │     │     │     │     │                 │
│    ↓     ↓     ↓     ↓     ↓     ↓     ↓     ↓                 │
│  [BANC] [SAUDE] [TRANS] [IMOB] [USUC] [EXEC] [CONS] [???]      │
│    │     │     │     │     │     │     │     │                 │
│    │     │     │     │     │     │     │     ↓                 │
│    │     │     │     │     │     │     │  ┌──────────────┐     │
│    │     │     │     │     │     │     │  │ LEX PROMPTER │     │
│    │     │     │     │     │     │     │  │   (NOVO)     │     │
│    │     │     │     │     │     │     │  └──────┬───────┘     │
│    │     │     │     │     │     │     │         ↓             │
│    │     │     │     │     │     │     │  [Prompt Gerado]      │
│    │     │     │     │     │     │     │         ↓             │
│    │     │     │     │     │     │     │  [Agente Dinâmico]   │
│    │     │     │     │     │     │     │         │             │
│    └─────┴─────┴─────┴─────┴─────┴─────┴─────────┘             │
│                         ↓                                        │
│              [Validador de Qualidade]                           │
│                         ↓                                        │
│              [Formatador de Saída]                              │
│                         ↓                                        │
│              [Webhook Response]                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuração do Node LEX PROMPTER

### Node: AI Agent (n8n-nodes-langchain)

```json
{
  "name": "LEX PROMPTER",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "position": [1200, 600],
  "parameters": {
    "mode": "agent",
    "agent": "conversationalAgent",
    "options": {
      "systemMessage": "{{ $json.lex_prompter_system }}",
      "maxIterations": 5,
      "returnIntermediateSteps": true
    }
  },
  "credentials": {
    "anthropicApi": {
      "id": "xxx",
      "name": "Anthropic API"
    }
  }
}
```

### Model Configuration

```json
{
  "name": "Claude Sonnet 4",
  "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
  "parameters": {
    "model": "claude-sonnet-4-20250514",
    "options": {
      "temperature": 0.3,
      "maxTokensToSample": 8000
    }
  }
}
```

### Tools Disponíveis

#### 1. search_knowledge_base

```json
{
  "name": "search_knowledge_base",
  "type": "@n8n/n8n-nodes-langchain.toolCode",
  "parameters": {
    "name": "search_knowledge_base",
    "description": "Busca súmulas, temas repetitivos e base legal na base de conhecimento. Input: { \"type\": \"sumulas|temas|base_legal\", \"keywords\": [\"palavra1\", \"palavra2\"], \"domain\": \"bancario|saude|...\" }",
    "code": "const kb = require('/knowledge_base');\nconst { type, keywords, domain } = $input.item.json;\nreturn kb.search(type, keywords, domain);"
  }
}
```

#### 2. get_template

```json
{
  "name": "get_template",
  "type": "@n8n/n8n-nodes-langchain.toolCode",
  "parameters": {
    "name": "get_template",
    "description": "Obtém template base para um domínio jurídico. Input: { \"domain\": \"bancario|saude|transito|...\" }",
    "code": "const templates = require('/knowledge_base/templates');\nreturn templates.get($input.item.json.domain);"
  }
}
```

---

## Fluxo de Dados

### Input do LEX PROMPTER

```json
{
  "processo": {
    "numero": "0001234-56.2026.8.08.0001",
    "vara": "1ª Vara Cível de Vitória"
  },
  "firac": {
    "fatos": "Texto extraído com os fatos do caso...",
    "questoes": ["Questão 1", "Questão 2"],
    "regras_aplicaveis": "CDC, CC art. 186",
    "analise": "Análise preliminar do caso",
    "conclusao_preliminar": "Possível procedência"
  },
  "classificacao": {
    "dominio_identificado": null,
    "confianca": 0.35,
    "keywords_extraidas": ["contrato", "serviço", "defeito", "dano"]
  }
}
```

### Output do LEX PROMPTER

```json
{
  "prompt_gerado": {
    "versao": "LEX MAGISTER v2.0 - Dinâmico",
    "dominio_inferido": "consumidor/responsabilidade_civil",
    "conteudo": "# PROMPT COMPLETO EM MARKDOWN...",
    "sumulas_incluidas": ["297", "362"],
    "temas_incluidos": ["1062"],
    "base_legal": ["CDC art. 14", "CC art. 186, 927"],
    "metodologia": "3_paragrafos + bifasico"
  },
  "metadata": {
    "tempo_geracao_ms": 2500,
    "tokens_utilizados": 3200,
    "confianca_prompt": 0.85
  }
}
```

---

## Configuração do Switch

### Condição para Acionar LEX PROMPTER

```javascript
// No node Switch "Domínio Identificado?"
// Adicionar case para domínio não identificado ou baixa confiança

const classificacao = $json.classificacao;

if (!classificacao.dominio_identificado ||
    classificacao.confianca < 0.6) {
  return 'lex_prompter';  // Rota para LEX PROMPTER
}

return classificacao.dominio_identificado;  // Rota para agente especializado
```

---

## Validação Pós-Geração

### Checklist Automático

Após o LEX PROMPTER gerar o prompt, validar:

```javascript
function validateGeneratedPrompt(prompt) {
  const checks = {
    has_system_layer: prompt.includes('<system>'),
    has_legal_base: prompt.includes('## BASE LEGAL'),
    has_methodology: prompt.includes('## METODOLOGIA'),
    has_template: prompt.includes('## ESTRUTURA DA SENTENÇA'),
    has_checklist: prompt.includes('## CHECKLIST'),
    has_3_paragraph_rule: prompt.includes('3 parágrafos'),
    has_art489_prohibitions: prompt.includes('Art. 489'),
    has_lgpd_compliance: prompt.includes('[DADOS PROTEGIDOS]')
  };

  const score = Object.values(checks).filter(v => v).length / Object.keys(checks).length;

  return {
    valid: score >= 0.8,
    score: score,
    checks: checks
  };
}
```

---

## Métricas de Monitoramento

### KPIs do LEX PROMPTER

| Métrica | Target | Descrição |
|---------|--------|-----------|
| Taxa de Acionamento | <15% | % de casos que precisam do LEX PROMPTER |
| Tempo de Geração | <5s | Tempo médio para gerar prompt |
| Score de Qualidade | >85% | Score do checklist automático |
| Taxa de Fallback | <5% | % que falha e vai para genérico |

### Logs para Auditoria (CNJ 615/2025)

```json
{
  "timestamp": "2026-01-19T15:30:00Z",
  "processo": "0001234-56.2026.8.08.0001",
  "evento": "PROMPT_DINAMICO_GERADO",
  "dados": {
    "dominio_inferido": "consumidor",
    "sumulas_utilizadas": ["297"],
    "tempo_geracao_ms": 2100,
    "score_qualidade": 0.92,
    "modelo_utilizado": "claude-sonnet-4-20250514"
  },
  "audit_trail": true
}
```

---

## Próximos Passos de Implementação

### Fase 1: Preparação (1 dia)
- [ ] Fazer deploy da base de conhecimento no n8n
- [ ] Configurar acesso às tools de busca
- [ ] Testar conexão com Anthropic API

### Fase 2: Implementação (2 dias)
- [ ] Criar node LEX PROMPTER no workflow
- [ ] Configurar switch com condição de confiança
- [ ] Implementar tools de busca na base de conhecimento
- [ ] Conectar output ao agente dinâmico

### Fase 3: Testes (2 dias)
- [ ] Testar com 10 casos de diferentes domínios
- [ ] Validar qualidade dos prompts gerados
- [ ] Comparar output com prompts fixos
- [ ] Ajustar thresholds de confiança

### Fase 4: Deploy (1 dia)
- [ ] Configurar logs de auditoria
- [ ] Ativar métricas de monitoramento
- [ ] Documentar para equipe
- [ ] Go-live em ambiente de produção

---

## Referências

- [Promptomatix: Automatic Prompt Optimization](https://arxiv.org/abs/2507.14241)
- [Harvey AI Workflow Builder](https://www.harvey.ai/blog/introducing-workflow-builder)
- [Meta-Prompting Guide](https://www.promptingguide.ai/techniques/meta-prompting)
- Framework Legal Prompt Engineering: `/docs/FRAMEWORK_LEGAL_PROMPT_ENGINEERING.md`
- Agente LEX PROMPTER: `/agents/lex_prompter.md`

---

*Documento de integração para Lex Intelligentia Judiciário v2.3*
