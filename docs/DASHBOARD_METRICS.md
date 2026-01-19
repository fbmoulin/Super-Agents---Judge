# Guia para Construção do Dashboard de Métricas - Lex Intelligentia

**Objetivo:** Criar um painel de monitoramento para avaliar a performance, qualidade, custo e confiabilidade do sistema Lex Intelligentia Judiciário.
**Fonte de Dados:** Planilha Google Sheets preenchida pelo workflow (`AUDIT_SHEET_ID`), abas "Logs" e "Errors".
**Ferramenta Sugerida:** Google Looker Studio (nativo), Metabase, ou similar.

---

## 1. KPIs Essenciais e Métricas

### 1.1 Qualidade e Confiança

| Métrica | Cálculo / Fonte | Visualização Sugerida | Objetivo |
|---|---|---|---|
| **Score QA Médio (Geral)** | Média da coluna `Score` na aba "Logs". | Medidor (Gauge) ou Cartão de KPI | Acompanhar a qualidade geral das minutas. Meta: > 85. |
| **Score QA Médio por Agente** | Média da coluna `Score` agrupada pela coluna `Agente`. | Gráfico de Barras | Identificar quais agentes especializados precisam de refinamento nos prompts. |
| **Taxa de Aprovação QA** | Porcentagem de linhas onde `Aprovado` = TRUE. | Anel (Donut Chart) ou KPI | Medir a taxa de sucesso do sistema. Meta: > 75%. |
| **Distribuição de Risco (CNJ)** | Contagem de `Risco` (BAIXO, MEDIO, ALTO). | Gráfico de Pizza | Monitorar o compliance e a segurança das operações. |
| **Acurácia do Router** | (Não diretamente mensurável sem feedback) *Plano: Adicionar feedback no futuro.* | N/A | (Futuro) Medir a eficácia da classificação inicial. |

### 1.2 Performance e Eficiência

| Métrica | Cálculo / Fonte | Visualização Sugerida | Objetivo |
|---|---|---|---|
| **Tempo Médio de Execução (Geral)** | Média da coluna `Tempo_ms` (converter para segundos). | Cartão de KPI com Gráfico de Linha (evolução) | Garantir que o sistema permaneça performático. Meta: < 6s. |
| **Tempo Médio por Agente** | Média de `Tempo_ms` agrupada por `Agente`. | Gráfico de Barras | Identificar gargalos de performance em agentes específicos. |
| **Volume de Minutas Geradas** | Contagem de linhas na aba "Logs" por dia/semana. | Gráfico de Linhas | Acompanhar o uso e a carga do sistema. |
| **Distribuição de Uso dos Agentes** | Porcentagem de cada `Agente` utilizado. | Gráfico de Pizza ou Barras | Entender a distribuição de tipos de ação e o uso do agente `agent_generico` (fallback). |

### 1.3 Custo Operacional

| Métrica | Cálculo / Fonte | Visualização Sugerida | Objetivo |
|---|---|---|---|
| **Custo Estimado por Execução** | Ver nota abaixo. | Cartão de KPI | Monitorar o custo individual de cada geração. |
| **Custo Total Diário/Mensal** | Soma do custo estimado por período. | Gráfico de Barras | Acompanhar o custo total da solução. |
| **Custo por Agente** | Soma do custo estimado agrupado por `Agente`. | Gráfico de Barras | Identificar os agentes que mais consomem recursos. |

**Nota sobre Cálculo de Custo:** O custo precisa ser estimado, pois não está nos logs. Use uma fórmula aproximada dentro da ferramenta de BI, assumindo os preços das APIs:
*   `Custo por Minuta ≈ (Preço_Claude * Tokens_Médios_Claude) + (Preço_Gemini * Tokens_Médios_Gemini)`
*   Para simplificar, pode-se usar uma média de custo por execução (e.g., $0.012, conforme o plano de otimização) e multiplicar pelo volume.

### 1.4 Confiabilidade e Erros

| Métrica | Cálculo / Fonte | Visualização Sugerida | Objetivo |
|---|---|---|---|
| **Taxa de Erro** | `(Contagem de linhas em "Errors") / (Contagem de linhas em "Logs")` | Cartão de KPI | Monitorar a estabilidade geral do workflow. Meta: < 2%. |
| **Erros por Nó do Workflow** | Contagem de `Error_Node` na aba "Errors". | Tabela ou Gráfico de Barras | Identificar os pontos mais frágeis do sistema. |
| **Taxa de Retentativas (`Retry`)** | Contagem de `Action` = 'RETRY' na aba "Errors". | Cartão de KPI | Entender a frequência de falhas transientes. |

---

## 2. Estrutura Sugerida para o Dashboard

O dashboard pode ser organizado em 3 seções principais:

### Seção 1: Visão Geral (Status Atual)
*   **KPIs Principais:** Score QA Médio, Taxa de Aprovação, Tempo Médio de Execução, Custo Total (Mês), Taxa de Erro.
*   **Gráficos:** Volume de Minutas (últimos 30 dias), Distribuição de Agentes (%).

### Seção 2: Análise de Qualidade e Agentes
*   **Gráficos:** Score QA Médio por Agente, Distribuição de Risco CNJ (%), Tempo de Execução por Agente.
*   **Tabela:** Logs das últimas minutas geradas com score baixo (< 70) para análise.

### Seção 3: Monitoramento de Erros e Custos
*   **Gráficos:** Custo Diário (últimos 30 dias), Custo Acumulado por Agente (Mês), Erros por Nó do Workflow.
*   **Tabela:** Detalhes dos últimos erros registrados na aba "Errors".

---

## 3. Próximos Passos

1.  **Conectar a Fonte de Dados:** Adicione a planilha Google Sheets como uma fonte de dados na ferramenta de BI escolhida.
2.  **Criar Campos Calculados:** Implemente a fórmula de custo estimado e conversões de unidades (e.g., milissegundos para segundos).
3.  **Construir as Visualizações:** Crie os gráficos e tabelas conforme as sugestões acima.
4.  **Montar o Dashboard:** Organize as visualizações nas seções propostas.
5.  **Configurar Atualização Automática:** Defina a frequência de atualização dos dados (e.g., a cada 15 minutos).
