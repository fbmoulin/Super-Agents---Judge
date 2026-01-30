# Segurança - Lex Intelligentia

## Visão Geral

Este documento descreve as medidas de segurança implementadas no sistema.

## Validação de Input

```javascript
const { security } = require('./config');

// Validar input do webhook
const result = security.validateInput(webhookInput);

if (!result.valid) {
  return { error: result.errors.join(', '), status: 400 };
}

// Usar dados sanitizados
const { fatos, questoes, pedidos } = result.data;
```

### Limites Configurados

| Campo | Limite | Descrição |
|-------|--------|-----------|
| fatos | 50.000 chars | ~10 páginas |
| questoes | 10.000 chars | ~2 páginas |
| pedidos | 10.000 chars | ~2 páginas |
| classe | 500 chars | Classe processual |
| assunto | 500 chars | Assunto |
| **Total** | 100KB | Tamanho máximo da requisição |

### Sanitização

- Remove null bytes
- Normaliza quebras de linha
- Remove caracteres de controle
- Limita whitespace excessivo

## Rate Limiting

### Configuração Recomendada

| Tipo | Limite | Janela |
|------|--------|--------|
| Por IP | 60 req | 1 min |
| Por API Key | 1000 req | 1 hora |
| Global | 100 req/s | - |

### Implementação no n8n

Adicione um Code node no início do workflow:

```javascript
// Copie o código de:
const { security } = require('./config');
console.log(security.N8N_RATE_LIMIT_CODE);
```

## Headers de Segurança

Recomendados para respostas da API:

```javascript
const headers = security.SECURITY_HEADERS;
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// Strict-Transport-Security: max-age=31536000
// etc.
```

## Auditoria (CNJ 615/2025)

```javascript
const audit = security.createAuditEntry({
  operacao: 'GERACAO_MINUTA',
  agente: 'agent_bancario',
  inputHash: '...',
  outputHash: '...',
  confianca: 0.95,
  scoreQA: 87,
  tempoExecucaoMs: 4500,
  clientIP: '192.168.1.100'
});
```

### Campos do Audit Log

| Campo | Descrição |
|-------|-----------|
| audit_id | ID único (LEX-timestamp-random) |
| timestamp | ISO 8601 |
| operacao | Tipo da operação |
| classificacao_risco | BAIXO/MEDIO/ALTO |
| requer_revisao_humana | Sempre `true` |
| hash_input/output | Hash dos dados |

## Proteção de Credenciais

### .gitignore

O arquivo `.gitignore` protege:

- `.env` e variantes
- `*.keys`, `*.pem`, `*.p12`
- `credentials.json`, `secrets.json`
- Tokens OAuth
- Service accounts

### Variáveis de Ambiente

```bash
# Obrigatórias
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# Opcionais
GOOGLE_SHEETS_CREDENTIALS=...
```

**NUNCA** commite credenciais no repositório.

## Classificação de Risco

| Classificação | Confiança | Score QA |
|---------------|-----------|----------|
| BAIXO | >= 0.85 | >= 85 |
| MÉDIO | >= 0.65 | >= 70 |
| ALTO | < 0.65 | < 70 |

---

*Última atualização: 2026-01-30*
