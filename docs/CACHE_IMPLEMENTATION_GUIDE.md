# Guia de Implementação: Cache Inteligente com Redis

**Data:** 2026-01-14
**Versão:** 1.0
**Autor:** Gemini Agent

---

## 1. Objetivo

Implementar uma camada de cache no workflow `Lex Intelligentia Judiciário v2.1` para armazenar e reutilizar minutas de alta qualidade, visando reduzir a latência e os custos com APIs de LLMs em processos repetitivos.

**Tecnologia:** Redis (ou qualquer banco de dados chave-valor rápido). A interação será feita via `HTTP Request` para uma API compatível (e.g., Upstash, ou um wrapper sobre seu Redis).

---

## 2. Arquitetura da Solução

O fluxo de cache será inserido em dois pontos do workflow principal:

1.  **Cache Read (Leitura):** Logo após a classificação do agente (`Set Context Buffer`), o sistema verificará se uma minuta para um caso similar já existe no cache.
2.  **Cache Write (Escrita):** Ao final do processo, se uma minuta foi gerada (não veio do cache) e atingiu um alto score de qualidade (e.g., > 95), ela será armazenada no cache para uso futuro.

```mermaid
graph TD
    A[Webhook: Recebe FIRAC] --> B[Gemini Router];
    B --> C[Set Context Buffer];
    C --> D{Calcular Hash do Input};
    D --> E[HTTP: Ler do Cache (GET)];
    E --> F{Cache Hit?};
    F -- Sim --> G[Formatar Resposta do Cache];
    F -- Não --> H[Set System Prompt];
    H --> I[Switch: Agentes];
    I --> J[AI Agent];
    J --> K[QA Check];
    K --> L{Score > 95?};
    L -- Sim --> M[HTTP: Escrever no Cache (SET)];
    L -- Não --> N[Audit Log];
    M --> N;
    G --> Z[Respond: Success];
    N --> Z;

    style G fill:#d4edda,stroke:#155724
    style M fill:#d4edda,stroke:#155724
```

---

## 3. Passo a Passo da Implementação no n8n

### Pré-requisitos:
*   Um serviço Redis acessível via API REST. Para este guia, usaremos o padrão da Upstash (compatível com `curl`).
*   Variáveis de ambiente no n8n:
    *   `REDIS_API_URL`: A URL base da sua API Redis (e.g., `https://us1-shiny-dassie-12345.upstash.io`).
    *   `REDIS_API_TOKEN`: O token de autenticação.

### Passo 1: Nó "Calcular Hash do Input" (Code)

*   **Posição:** Após o nó `Set Context Buffer`.
*   **Objetivo:** Criar uma chave única e determinística para o processo.

```javascript
// ============================================================================
// CALCULAR CACHE KEY (HASH)
// ============================================================================
const crypto = require('crypto');
const ctx = $input.first().json;

// Usar os elementos essenciais do FIRAC para o hash
const inputParaHash = JSON.stringify({
  fatos: ctx.firac.fatos,
  questoes: ctx.firac.questoes,
  pedidos: (ctx.entidades.valores || []).join(',') // Adicionar pedidos se disponíveis
});

const hash = crypto.createHash('sha256').update(inputParaHash).digest('hex');

const cacheKey = `lex_minuta:${ctx.classificacao.categoria}:${hash}`;

// Passar a chave e o contexto adiante
return [{
  json: {
    ...ctx,
    cache_key: cacheKey
  }
}];
```

### Passo 2: Nó "Ler do Cache (GET)" (HTTP Request)

*   **Posição:** Após "Calcular Hash do Input".
*   **Objetivo:** Consultar o Redis pela chave.

| Parâmetro | Valor |
|---|---|
| **Method** | `GET` |
| **URL** | `={{ $env.REDIS_API_URL }}/get/{{ $json.cache_key }}` |
| **Authentication** | `Header Auth` |
| **Name** | `Authorization` |
| **Value** | `Bearer {{ $env.REDIS_API_TOKEN }}` |
| **Options** | `Continue on Fail` -> `true` (Importante!) |

### Passo 3: Nó "Cache Hit?" (IF)

*   **Posição:** Após "Ler do Cache (GET)".
*   **Objetivo:** Desviar o fluxo se o cache retornar um resultado.

| Condição | Operação | Valor |
|---|---|---|
| `{{ $json.result }}` | `Is Not Null` | |

*   **Saída `true`:** Conectar a um novo nó "Formatar Resposta do Cache".
*   **Saída `false`:** Conectar ao nó existente `Set System Prompt`.

### Passo 4: Nó "Score > 95?" (IF)

*   **Posição:** Após `QA Consolidado`.
*   **Objetivo:** Decidir se a minuta gerada tem qualidade suficiente para ser salva no cache.

| Condição | Operação | Valor 1 |
|---|---|---|
| `{{ $json.qa_result.score_final }}` | `Larger Or Equal` | `95` |

*   **Saída `true`:** Conectar ao novo nó "Escrever no Cache (SET)".
*   **Saída `false`:** Conectar ao nó existente `Audit Log CNJ 615`.

### Passo 5: Nó "Escrever no Cache (SET)" (HTTP Request)

*   **Posição:** Após a saída `true` de "Score > 95?".
*   **Objetivo:** Salvar a minuta no Redis.

| Parâmetro | Valor |
|---|---|
| **Method** | `POST` |
| **URL** | `={{ $env.REDIS_API_URL }}/set/{{ $json.contexto.cache_key }}` |
| **Authentication** | `Header Auth` |
| **Name** | `Authorization` |
| **Value** | `Bearer {{ $env.REDIS_API_TOKEN }}` |
| **Body Content Type**| `JSON` |
| **Body** | `={{ { "minuta_gerada": $json.minuta_gerada, "score": $json.qa_result.score_final, "cached_at": new Date().toISOString() } }}` |
| **Options** | `Continue on Fail` -> `true` |

*   **Conexão de Saída:** Conectar este nó ao `Audit Log CNJ 615` para que o fluxo continue normalmente após o cache.

### Passo 6: Nó "Formatar Resposta do Cache" (Code)

*   **Posição:** Após a saída `true` de "Cache Hit?".
*   **Objetivo:** Preparar a resposta final usando os dados do cache, pulando o resto do workflow.

```javascript
// ============================================================================
// FORMATAR RESPOSTA DO CACHE
// ============================================================================
const cacheData = JSON.parse($('Ler do Cache (GET)').item.json.result);
const ctx = $('Calcular Hash do Input').item.json;

// Simular a estrutura da resposta final
const response = {
  success: true,
  timestamp: new Date().toISOString(),
  minuta: {
    conteudo: cacheData.minuta_gerada,
    palavras: cacheData.minuta_gerada.split(/\s+/).length,
    formato: 'markdown'
  },
  qualidade: {
    score: cacheData.score,
    aprovado: true,
    detalhes: {
      "fonte": "cache"
    }
  },
  compliance: {
    risco: "BAIXO",
    agente: ctx.classificacao.agente
  },
  rastreabilidade: {
    "fonte": "cache",
    "cache_key": ctx.cache_key
  }
};

return [{ json: response }];
```
*   **Conexão de Saída:** Conectar este nó diretamente ao `Respond: Success`.

---

## 4. Considerações Finais

*   **TTL (Time-To-Live):** Para evitar que as minutas fiquem obsoletas, configure um TTL (tempo de vida) no Redis. Isso pode ser feito adicionando `?ex=2592000` à URL do comando SET para um cache de 30 dias.
*   **Estratégia de Invalidação:** Inicialmente, o TTL é suficiente. Uma estratégia mais avançada poderia ser invalidar (deletar) chaves de cache para um tipo de ação específico se uma nova lei ou súmula relevante for publicada.
*   **Monitoramento:** Adicione ao seu dashboard uma métrica de "Taxa de Cache Hit" (`Cache Hits / (Cache Hits + Cache Misses)`) para medir a eficácia do cache.
