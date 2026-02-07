# Tutorial de Execução e Validação - Lex Intelligentia Judiciário

**Objetivo:** Este guia fornece os passos necessários para configurar o ambiente, popular a base de dados de jurisprudência (Vector Store) e executar o workflow completo do Lex Intelligentia, ativando todas as funcionalidades que foram implementadas e planejadas.

---

### **Pré-requisitos**

Antes de começar, garanta que você tenha:
1.  **Docker e Docker Compose** instalados e em execução.
2.  **Acesso a uma instância n8n** (self-hosted ou cloud).
3.  **Credenciais de API:**
    *   Anthropic (Claude)
    *   Google AI (Gemini)
    *   OpenAI (para embeddings)
    *   Acesso a uma planilha Google Sheets e suas credenciais.
4.  **Um serviço Redis** acessível via API REST (como o da Upstash) e as credenciais (`URL` e `TOKEN`).
5.  **Python 3.10+** instalado em sua máquina local.

---

### **Passo 1: Configuração do Ambiente n8n**

Configure as seguintes variáveis de ambiente na sua instância n8n. Elas são essenciais para o funcionamento dos workflows.

1.  Acesse sua instância n8n e vá para **Settings -> Environment Variables**.
2.  Adicione as seguintes variáveis:
    *   `ANTHROPIC_API_KEY`: Sua chave da API da Anthropic.
    *   `GEMINI_API_KEY`: Sua chave da API do Google AI.
    *   `OPENAI_API_KEY`: Sua chave da API da OpenAI.
    *   `AUDIT_SHEET_ID`: O ID da sua planilha Google Sheets para os logs.
    *   `REDIS_API_URL`: A URL da sua API Redis (e.g., `https://us1-shiny-dassie-12345.upstash.io`).
    *   `REDIS_API_TOKEN`: O token de autorização da sua API Redis.
    *   `ERROR_WEBHOOK_URL`: (Opcional) A URL para receber notificações de erro (e.g., um webhook do Slack ou Teams).
    *   `N8N_WEBHOOK_URL`: A URL base dos seus webhooks do n8n (e.g., `https://meu-n8n.com/webhook/`).

---

### **Passo 2: Preparação do Vector Store (RAG)**

Estes passos irão popular a base de dados de jurisprudência do STJ.

#### **2.1. Instalar Dependências Python**
No seu terminal local, no diretório do projeto, execute:
```sh
pip install requests
```

#### **2.2. Iniciar o Banco de Dados Vetorial (Qdrant)**
A documentação do projeto sugere o Qdrant. Crie um arquivo `docker-compose.yml` com o seguinte conteúdo e execute `docker-compose up -d`.
```yaml
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_data:/qdrant/storage
```

#### **2.3. Baixar e Processar Dados do STJ**
Execute os seguintes comandos no seu terminal, na pasta do projeto. **Atenção: o download pode demorar e consumir um espaço considerável em disco.**

```sh
# 1. Baixar todos os datasets
python stj_downloader.py --download-all

# 2. Processar os dados baixados em chunks
python stj_downloader.py --process
```
Ao final, você terá um arquivo chamado `stj_processed/stj_chunks_vectorstore.json`.

#### **2.4. Importar e Ativar o Workflow de Ingestão no n8n**
1.  No n8n, importe o workflow `n8n_workflow_stj_vectorstore.json`.
2.  Configure as credenciais da `OpenAI API`.
3.  Ative o workflow.

#### **2.5. Ingerir os Dados no Qdrant**
1.  No workflow `STJ Vector Store`, copie a URL do webhook `Webhook: Ingestão`.
2.  Mova o arquivo `stj_chunks_vectorstore.json` para um local acessível pelo n8n (se estiver usando docker, pode ser necessário um volume compartilhado; o workflow espera `/data/stj_chunks_vectorstore.json`).
3.  **Execute o webhook** para iniciar o processo de ingestão dos dados no Qdrant. Isso pode levar vários minutos.

---

### **Passo 3: Execução do Workflow Principal**

Agora que o ambiente e o RAG estão configurados, você pode executar o sistema.

1.  Abra o workflow `Lex Intelligentia Judiciário v2.1` no n8n.
2.  Copie a URL de teste do webhook `Webhook: Recebe FIRAC`.
3.  Use a URL no comando `curl` abaixo para enviar um processo de teste.

```sh
curl -X POST SEU_WEBHOOK_URL_AQUI \
  -H "Content-Type: application/json" \
  -d 
    "{
    "body": {
      "fatos": "O autor celebrou contrato de empréstimo consignado com o banco réu, mas alega que as taxas de juros são abusivas e superiores à média de mercado.",
      "questoes": "Houve cobrança de juros abusivos? É cabível a repetição do indébito?",
      "pedidos": "Revisão do contrato, devolução em dobro dos valores pagos a maior e danos morais.",
      "classe_processual": "Procedimento Comum Cível",
      "assunto": "Contratos Bancários"
    }
  }"
```

---

### **Passo 4: Verificação e Próximos Passos**

*   **Verifique a Resposta:** Você deve receber um JSON contendo a minuta da sentença gerada.
*   **Consulte os Logs:** Verifique a planilha Google Sheets para ver se o log de auditoria foi registrado corretamente.
*   **Teste o RAG:** Na resposta, observe se a fundamentação da minuta inclui citações de jurisprudência que não estavam no prompt original. Isso indica que a ferramenta RAG foi acionada com sucesso.
*   **Implemente Melhorias Adicionais:** Com o sistema base funcionando, você pode agora seguir os guias que criamos para implementar as funcionalidades das Fases 2 e 3:
    *   `CACHE_IMPLEMENTATION_GUIDE.md`: Para ativar o cache com Redis.
    *   `AB_TESTING_PLAN.md`: Para começar a testar variações de prompts.
    *   `CRITICAL_AGENT_DESIGN.md`: Para implementar o agente revisor.
    *   E os demais planos para as funcionalidades futuras.

Este tutorial conclui a configuração inicial e validação do sistema.
