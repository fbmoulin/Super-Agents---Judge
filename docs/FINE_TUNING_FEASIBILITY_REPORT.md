# Relatório de Viabilidade: Fine-Tuning de Modelos para o Lex Intelligentia

**Data:** 2026-01-14
**Versão:** 1.0
**Autor:** Gemini Agent

---

## 1. Resumo Executivo

Este relatório avalia a viabilidade, os custos e os benefícios da adoção de fine-tuning (ajuste fino) de modelos de linguagem para tarefas específicas no sistema Lex Intelligentia Judiciário, como uma alternativa ao uso de modelos de propósito geral de alto custo (e.g., Claude Sonnet 4).

**Recomendação:** A implementação de fine-tuning é **viável e recomendada a médio prazo**. Sugere-se iniciar com um projeto piloto focado no "Agente Bancário", que possui o maior volume de dados e tarefas repetitivas, para validar o ROI antes de expandir para outros agentes.

---

## 2. Análise Custo-Benefício

### 2.1. Vantagens do Fine-Tuning

*   **Redução de Custo por Minuta:** Um modelo menor e ajustado (e.g., Llama 3 8B, Gemini 1.5 Flash) tem um custo de inferência significativamente menor do que um modelo de ponta como o Claude Sonnet 4.
*   **Aumento da Performance (Velocidade):** Modelos menores geralmente têm latência de resposta mais baixa, acelerando a geração da minuta.
*   **Maior Consistência e Qualidade:** Um modelo treinado especificamente no estilo e na estrutura das minutas do TJES tende a produzir resultados mais consistentes e com menos "alucinações" ou desvios de formato.
*   **Redução da Complexidade do Prompt:** Com o conhecimento internalizado durante o fine-tuning, os system prompts podem ser simplificados, reduzindo o custo de tokens de entrada.

### 2.2. Desafios e Custos

*   **Custo Inicial de Treinamento:** O processo de fine-tuning em si tem um custo computacional (horas de GPU/TPU).
*   **Coleta e Preparação de Dados:** É necessário um dataset de alta qualidade com, no mínimo, 500 a 1.000 exemplos de pares "prompt" -> "minuta ideal". A fonte primária seriam os logs de auditoria, mas exigiria um processo de revisão e curadoria humana para garantir que apenas as melhores minutas sejam usadas no treinamento.
*   **Infraestrutura de Hospedagem:** Um modelo ajustado precisa ser hospedado em uma plataforma (e.g., Vertex AI, Hugging Face, Sagemaker), o que gera um custo fixo mensal, independentemente do uso.
*   **Manutenção e MLOps:** O modelo precisará ser re-treinado periodicamente para se manter atualizado com novas jurisprudências ou mudanças de estilo, exigindo um ciclo de MLOps (Machine Learning Operations).

---

## 3. Processo de Implementação Sugerido

### Etapa 1: Coleta e Preparação do Dataset (Pré-requisito)

1.  **Fonte de Dados:** A planilha ou banco de dados de **Audit Logs**.
2.  **Critério de Seleção:** Extrair todas as minutas com `Score QA > 95` e que foram geradas por um agente específico (e.g., `agent_bancario`).
3.  **Curadoria Humana:** Um especialista (assessor ou magistrado) deve revisar uma amostra de ~20% do dataset para garantir a qualidade e remover outliers.
4.  **Formatação:** Converter os dados para o formato JSONL (JSON Lines), onde cada linha é um objeto JSON com um par de `prompt` e `completion`.
    *   O `prompt` seria o "Human Message" usado na geração original.
    *   O `completion` seria o conteúdo da minuta final e aprovada.

### Etapa 2: Projeto Piloto - Fine-Tuning do Agente Bancário

1.  **Seleção do Modelo Base:**
    *   **Opção A (Google Cloud):** `gemini-1.5-flash` - Excelente balanço entre custo e capacidade.
    *   **Opção B (Open Source):** `meta-llama/Llama-3-8b-instruct` - Ótima performance para seu tamanho, pode ser hospedado em diversas plataformas.

2.  **Plataforma de Treinamento:**
    *   **Google Vertex AI:** Plataforma gerenciada que simplifica o processo de fine-tuning para modelos Gemini.
    *   **Hugging Face TRL / Axolotl:** Para modelos open source, oferecem frameworks que facilitam o treinamento.

3.  **Execução do Treinamento:**
    *   Iniciar com um dataset de 500 exemplos.
    *   Treinar por um número limitado de épocas (e.g., 3 a 5).
    *   Monitorar as métricas de perda (loss) para evitar overfitting.

### Etapa 3: Avaliação e Teste A/B

1.  **Avaliação Offline:** Comparar as minutas geradas pelo modelo ajustado com as minutas do dataset de teste (uma porção separada dos dados de treino). Usar o "Agente de QA" (Gemini) para pontuar ambos os modelos e comparar os scores.
2.  **Implantação como "Agente Canário":** Implementar o modelo ajustado no workflow n8n como um novo agente (`agent_bancario_finetuned`).
3.  **Teste A/B:** Usar a estrutura da Tarefa 2.2 do roadmap para desviar 10-20% do tráfego do Agente Bancário para a versão fine-tuned.
4.  **Análise de Métricas:** Após um período de teste (e.g., 2 semanas), comparar as métricas do dashboard:
    *   Score QA Médio: `agent_bancario` vs. `agent_bancario_finetuned`.
    *   Custo por Minuta: Custo da API do Claude vs. Custo de inferência do modelo hospedado.
    *   Tempo Médio de Resposta.

---

## 4. Análise de Viabilidade Financeira (Estimativa)

**Premissas:**
*   **Volume:** 200 processos bancários por dia.
*   **Custo Claude Sonnet 4:** ~$0.02 por minuta.
*   **Custo Modelo Fine-tuned (Hospedado):** ~$400/mês (custo fixo de uma GPU/endpoint mediano) + ~$0.001 por minuta (custo de inferência).
*   **Custo de Treinamento (único):** ~$100 (para um dataset de ~1k exemplos).

**Análise:**
*   **Custo Mensal (Claude):** 200 minutas/dia * 22 dias úteis * $0.02/minuta = **$88/mês**
*   **Custo Mensal (Fine-tuned):** $400 (hospedagem) + (200 * 22 * $0.001) = **~$404.4/mês**

**Conclusão da Análise Financeira:**
No volume atual, o custo de um endpoint dedicado para o modelo fine-tuned **não compensa financeiramente**. O custo fixo de hospedagem é muito superior ao custo variável da API.

**O fine-tuning se torna vantajoso em cenários de:**
1.  **Escala Massiva:** Com um volume 10x maior (~2.000 processos/dia), o custo do Claude seria de $880/mês, tornando o modelo fine-tuned mais competitivo.
2.  **Uso de Endpoints "Serverless":** Plataformas que permitem hospedar modelos em infraestrutura serverless (que escala a zero) eliminam o custo fixo, tornando o fine-tuning vantajoso em qualquer escala.
3.  **Qualidade Superior:** Se o modelo ajustado demonstrar uma melhoria de qualidade tão significativa que reduza drasticamente o tempo de revisão humana, o ganho de produtividade pode justificar o custo maior.

---

## 5. Próximos Passos

1.  **Iniciar a Coleta de Dados:** Modificar o processo de auditoria para salvar os pares (prompt, minuta_aprovada) em um local de fácil acesso para futuro treinamento.
2.  **Pesquisar Plataformas Serverless:** Investigar opções de "serverless inference" para modelos fine-tuned em plataformas como Google Vertex AI, AWS Sagemaker ou Hugging Face.
3.  **Reavaliar em 6 Meses:** Após coletar um volume significativo de dados e com o amadurecimento das plataformas de IA, reavaliar a análise de custo-benefício.
