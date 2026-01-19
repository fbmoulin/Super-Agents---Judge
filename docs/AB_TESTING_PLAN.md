# Plano Técnico: Estrutura de Testes A/B para Agentes

**Data:** 2026-01-14
**Versão:** 1.0
**Autor:** Gemini Agent

---

## 1. Objetivo

Implementar uma estrutura de teste A/B (também conhecido como "Canary Testing") no workflow `Lex Intelligentia Judiciário v2.1`. O objetivo é permitir a experimentação e validação de novos prompts, modelos ou configurações de agentes de forma controlada, desviando uma pequena porcentagem do tráfego de produção para uma versão "canário" e comparando os resultados de qualidade.

---

## 2. Arquitetura da Solução

A modificação central ocorrerá após o roteamento (`Switch: Seleciona Agente`). Para cada agente especializado que se deseja testar (e.g., `agent_bancario`), será inserido um novo nó do tipo `Switch` que dividirá o tráfego.

*   **90% do tráfego (Controle):** Seguirá para o `AI Agent` de produção existente.
*   **10% do tráfego (Canário):** Será direcionado para um novo `AI Agent` duplicado, que conterá o prompt ou o modelo a ser testado.

Ambos os fluxos (controle e canário) convergirão para as mesmas etapas de QA e auditoria, garantindo que a comparação de performance seja justa.

```mermaid
graph TD
    A[Switch: Seleciona Agente] -- agent_bancario --> B{Switch A/B (10/90)};
    B -- 90% Controle --> C[AI Agent: Bancário (Produção)];
    B -- 10% Canário --> D[AI Agent: Bancário (Canário)];
    C --> E[Prepare for QA];
    D --> E;
    E --> F[QA Check];
    F --> G[Audit Log];
    
    subgraph "Versão Canário"
        D
    end

    subgraph "Versão de Produção"
        C
    end

    style D fill:#fff3cd,stroke:#856404
```

---

## 3. Passo a Passo da Implementação no n8n

Este exemplo foca na criação de um teste A/B para o **Agente Bancário**. O processo pode ser replicado para os outros.

### Passo 1: Duplicar o Agente "Canário"

1.  No workflow, selecione o nó `AI Agent: Bancário` e seu respectivo nó de modelo (`Claude: Bancário`).
2.  Copie e cole ambos os nós. Renomeie-os para:
    *   `AI Agent: Bancário (Canário)`
    *   `Claude: Bancário (Canário)`
3.  Conecte o novo nó de modelo ao novo nó de agente.

### Passo 2: Modificar o Agente "Canário"

1.  Abra o nó `AI Agent: Bancário (Canário)`.
2.  É aqui que a **mudança** é aplicada. Você pode:
    *   **Testar um novo prompt:** Modificar o campo `System Message` diretamente no nó.
    *   **Testar um novo modelo:** Desconectar do `Claude: Bancário (Canário)` e conectar a um novo nó de modelo (e.g., um `LM GPT-4` ou uma nova versão do Claude).
    *   **Testar novos parâmetros:** Modificar a temperatura ou outras configurações no nó `Claude: Bancário (Canário)`.

### Passo 3: Inserir o Nó "Switch A/B"

1.  **Exclua** a conexão direta entre `Switch: Seleciona Agente` e `AI Agent: Bancário`.
2.  Crie um novo nó do tipo **Switch** chamado `Switch A/B Bancário`.
3.  Conecte a saída `Bancário` do `Switch: Seleciona Agente` à entrada do `Switch A/B Bancário`.

4.  **Configure as regras do Switch A/B:**
    *   **Routing Rule 1 (Canário - 10%):**
        *   **Value 1:** `{{ Math.random() }}`
        *   **Operation:** `Smaller`
        *   **Value 2:** `0.1`
        *   **Output:** `Canário`
    *   **Default Output / Fallback (Controle - 90%):**
        *   **Output:** `Controle`

5.  **Reconecte os fluxos:**
    *   Conecte a saída `Controle` do `Switch A/B` ao `AI Agent: Bancário` (Produção).
    *   Conecte a saída `Canário` do `Switch A/B` ao `AI Agent: Bancário (Canário)`.

### Passo 4: Unificar os Fluxos

1.  O workflow já possui um nó `Prepare for QA` que recebe as saídas de todos os agentes.
2.  **Exclua** a conexão antiga do `AI Agent: Bancário` para o `Prepare for QA`.
3.  Conecte a saída de **ambos** os agentes (`Produção` e `Canário`) à entrada do `Prepare for QA`. O n8n unificará automaticamente as duas ramificações.

### Passo 5: Modificar o Log de Auditoria

Para que a análise dos resultados seja possível, é crucial registrar qual versão do agente foi usada.

1.  Abra o nó de código `Audit Log CNJ 615`.
2.  Adicione um campo para rastrear a versão, obtendo a informação de qual caminho foi seguido.

```javascript
// Dentro do objeto auditLog, adicione:
const auditLog = {
  // ... outros campos ...
  versao_agente: $('Switch A/B Bancário').item.outputName || 'controle', // 'Controle' ou 'Canário'
  // ...
};
```
*Observação: A expressão `$('Switch A/B Bancário').item.outputName` pode precisar de ajuste dependendo de como o n8n estrutura os dados de entrada após a unificação. Um nó `Code` intermediário pode ser necessário para preservar essa informação.*

---

## 4. Análise dos Resultados

Com a estrutura acima implementada, a análise do teste A/B pode ser feita diretamente no **Dashboard de Métricas**:

1.  **Filtre o Dashboard:** Adicione um filtro para o campo `versao_agente`.
2.  **Compare as Métricas:** Compare lado a lado o `Score QA Médio`, `Taxa de Aprovação` e `Tempo Médio de Execução` para as versões `controle` e `canário`.
3.  **Decisão:** Se a versão canário demonstrar uma melhoria estatisticamente significativa, ela pode ser promovida para produção (substituindo o agente de controle). Se não, ela pode ser descartada ou refinada para um novo teste.

---

## 5. Generalização

Para testar múltiplos agentes simultaneamente, repita os passos 1-4 para cada agente (e.g., `agent_consumidor`). Cada um terá seu próprio `Switch A/B`. Lembre-se de atualizar o `Audit Log` para capturar a versão de cada agente testado.
