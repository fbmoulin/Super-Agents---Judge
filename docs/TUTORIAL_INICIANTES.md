# Tutorial para Iniciantes - Lex Intelligentia Judiciário

## O que é o Lex Intelligentia?

O Lex Intelligentia é um sistema de **inteligência artificial** que ajuda a criar minutas de decisões judiciais automaticamente. Ele usa:

- **Gemini 2.5 Flash** (Google) - Para classificar o tipo de caso
- **Claude Sonnet 4** (Anthropic) - Para gerar a minuta judicial
- **n8n** - Plataforma de automação que orquestra todo o processo

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuário   │ --> │   Gemini    │ --> │   Claude    │ --> │   Minuta    │
│  (Webhook)  │     │  (Router)   │     │  (Agente)   │     │  (Output)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Pré-requisitos

### 1. Acesso ao n8n Cloud

Você precisa ter acesso à instância n8n Cloud:
- **URL:** https://lexintel.app.n8n.cloud
- **Credenciais:** Solicite ao administrador do projeto

### 2. Ferramentas Opcionais (para testes avançados)

- **curl** - Para enviar requisições HTTP (já vem instalado no Linux/Mac)
- **Node.js** - Para executar o script de testes automatizados
- **Postman** - Interface gráfica para testar APIs (opcional)

---

## Parte 1: Entendendo a Interface do n8n

### Acessando o Workflow

1. Acesse https://lexintel.app.n8n.cloud
2. Faça login com suas credenciais
3. No menu lateral, clique em **"Personal"** ou **"Overview"**
4. Localize o workflow: **"Lex Intelligentia v2.1.1 - FIXED FOR CLOUD"**
5. Clique para abrir

### Conhecendo os Elementos

Ao abrir o workflow, você verá:

```
┌─────────────────────────────────────────────────────────────────┐
│  BARRA SUPERIOR                                                  │
│  [Personal / Lex Intelligentia v2.1.1]  [Tags]  [Publish][Saved] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ÁREA DE TRABALHO (Canvas)                                       │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │ Webhook  │--->│  Router  │--->│  Agent   │---> ...           │
│  └──────────┘    └──────────┘    └──────────┘                   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  PAINEL INFERIOR                                                 │
│  [Execute workflow from Webhook: Recebe FIRAC]                   │
└─────────────────────────────────────────────────────────────────┘
```

### Nós Principais do Workflow

| Nó | Função | Modelo |
|----|--------|--------|
| **Webhook: Recebe FIRAC** | Recebe os dados do caso | - |
| **Gemini Router** | Classifica o tipo de caso | Gemini 2.5 Flash |
| **Set Context Buffer** | Prepara os dados | - |
| **Switch: Seleciona Agente** | Direciona para o agente correto | - |
| **AI Agent: [Tipo]** | Gera a minuta | Claude Sonnet 4 |
| **QA Estrutural** | Verifica estrutura da minuta | - |
| **QA Semântico** | Verifica qualidade jurídica | Gemini 2.5 Flash |

---

## Parte 2: Executando um Teste Manual

### Passo 1: Ativar o Modo de Teste

1. No workflow aberto, localize o botão na parte inferior:
   ```
   [▶ Execute workflow from Webhook: Recebe FIRAC]
   ```

2. Clique neste botão

3. O sistema entrará em **modo de espera**:
   ```
   [🔄 Waiting for trigger event from Webhook: Recebe FIRAC]
   ```

4. O webhook está agora **ativo e aguardando** uma requisição

### Passo 2: Enviar um Caso de Teste

Abra um **terminal** (Prompt de Comando no Windows, Terminal no Mac/Linux) e execute:

```bash
curl -X POST https://lexintel.app.n8n.cloud/webhook-test/lex-intelligentia-agentes \
  -H "Content-Type: application/json" \
  -d '{
    "fatos": "O autor celebrou contrato de empréstimo consignado junto ao Banco Réu, no valor de R$ 10.000,00. Alega que nunca solicitou tal empréstimo e não reconhece a assinatura do contrato. Os descontos iniciaram em janeiro de 2025.",
    "questoes": "1) Houve fraude na contratação? 2) São devidos danos morais?",
    "pedidos": "a) Declaração de inexistência do contrato; b) Devolução em dobro dos valores; c) Danos morais de R$ 10.000,00",
    "classe": "Procedimento Comum Cível",
    "assunto": "Empréstimo consignado fraudulento",
    "valor_causa": 30000.00
  }'
```

**Explicação dos campos:**

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `fatos` | Narrativa do que aconteceu | "O autor celebrou contrato..." |
| `questoes` | Perguntas jurídicas a responder | "Houve fraude?" |
| `pedidos` | O que o autor está pedindo | "Danos morais de R$ 10.000" |
| `classe` | Tipo de processo | "Procedimento Comum Cível" |
| `assunto` | Tema principal | "Empréstimo fraudulento" |
| `valor_causa` | Valor em reais | 30000.00 |

### Passo 3: Acompanhar a Execução

1. Volte ao n8n Cloud no navegador
2. O painel lateral direito mostrará o **progresso**:
   ```
   ✓ Webhook: Recebe FIRAC
   ✓ Gemini Router
   ✓ Set Context Buffer
   → AI Agent: Bancário (executando...)
   ```

3. Aguarde a conclusão (~30 segundos)

4. Ao final, você verá:
   ```
   Success in 28.5s
   ```

### Passo 4: Analisar os Resultados

Clique em cada nó para ver os dados:

**1. No "Set Context Buffer":**
```json
{
  "classificacao": {
    "agente": "agent_BANCARIO",
    "categoria": "BANCARIO",
    "confianca": 0.98
  }
}
```

**2. No "Respond: Success":**
```json
{
  "success": true,
  "minuta": {
    "conteudo": "I - RELATÓRIO\n\nTrata-se de ação...",
    "palavras": 450
  },
  "qualidade": {
    "score": 87,
    "aprovado": true
  }
}
```

---

## Parte 3: Usando os Casos de Teste Prontos

O projeto inclui casos de teste prontos em `/test_cases/`.

### Estrutura das Pastas

```
test_cases/
├── bancario/
│   ├── caso_01_emprestimo_consignado.json
│   ├── caso_02_cartao_clonado.json
│   └── ...
├── consumidor/
│   ├── caso_01_negativacao.json
│   └── ...
├── execucao/
├── locacao/
├── possessorias/
└── generico/
```

### Executando um Caso Específico

**No Windows (PowerShell):**

```powershell
# Leia o arquivo JSON
$caso = Get-Content "test_cases/bancario/caso_01_emprestimo_consignado.json" | ConvertFrom-Json

# Envie para o webhook
$body = @{
    fatos = $caso.fatos
    questoes = $caso.questoes
    pedidos = $caso.pedidos
    classe = $caso.classe
    assunto = $caso.assunto
    valor_causa = $caso.valor_causa
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://lexintel.app.n8n.cloud/webhook-test/lex-intelligentia-agentes" `
    -Method Post -Body $body -ContentType "application/json"
```

**No Linux/Mac (Bash):**

```bash
# Envie diretamente o conteúdo do arquivo
cat test_cases/bancario/caso_01_emprestimo_consignado.json | \
  curl -X POST https://lexintel.app.n8n.cloud/webhook-test/lex-intelligentia-agentes \
    -H "Content-Type: application/json" \
    -d @-
```

### Executando Todos os Testes Automaticamente

```bash
# Navegue até a pasta do projeto
cd /mnt/c/projetos-2026/superagents-judge/test_cases

# Execute o script de testes
node run_production_tests.js
```

O script irá:
1. Carregar todos os casos de teste
2. Enviar cada um para o webhook
3. Validar as respostas
4. Gerar um relatório

---

## Parte 4: Interpretando os Resultados

### Classificação do Router

O Gemini Router classifica casos nas seguintes categorias:

| Categoria | Agente | Exemplos |
|-----------|--------|----------|
| BANCARIO | agent_BANCARIO | Empréstimos, cartões, fraudes bancárias |
| CONSUMIDOR | agent_CONSUMIDOR | CDC, negativação, vícios de produto |
| EXECUCAO | agent_EXECUCAO | Títulos extrajudiciais, cheques |
| LOCACAO | agent_LOCACAO | Despejo, renovatória |
| POSSESSORIAS | agent_POSSESSORIAS | Reintegração, manutenção de posse |
| GENERICO | agent_GENERICO | Casos não classificados |

### Níveis de Confiança

| Confiança | Significado | Ação |
|-----------|-------------|------|
| ≥ 0.95 | Excelente | Classificação confiável |
| 0.85 - 0.94 | Bom | Verificar se faz sentido |
| 0.70 - 0.84 | Moderado | Revisar classificação |
| < 0.70 | Baixo | Provavelmente incorreto |

### Score de Qualidade

| Score | Classificação | Risco CNJ |
|-------|---------------|-----------|
| ≥ 85 | Aprovado | BAIXO |
| 70 - 84 | Condicional | MÉDIO |
| < 70 | Reprovado | ALTO |

### Estrutura da Minuta

Toda minuta deve conter:

```
I - RELATÓRIO
  [Resumo do caso e pedidos]

II - FUNDAMENTAÇÃO
  [Análise jurídica e precedentes]

III - DISPOSITIVO
  [Decisão: PROCEDENTE/IMPROCEDENTE/PARCIALMENTE PROCEDENTE]
```

---

## Parte 5: Solução de Problemas

### Erro: "Webhook not registered"

```json
{"code":404,"message":"The requested webhook is not registered"}
```

**Causa:** O workflow não está em modo de teste.

**Solução:**
1. Abra o workflow no n8n
2. Clique em "Execute workflow"
3. Tente novamente

### Erro: "Router fallback to generic"

```json
{
  "classificacao": {
    "agente": "agent_generico",
    "confianca": 0.3,
    "router_status": "fallback"
  }
}
```

**Causa:** O Gemini Router não conseguiu classificar o caso.

**Possíveis razões:**
- Resposta truncada por MAX_TOKENS
- Caso muito complexo ou ambíguo
- Erro temporário na API do Gemini

**Solução:**
- Tente novamente (pode ser erro temporário)
- Verifique se o caso tem informações suficientes
- Reporte ao administrador se persistir

### Erro: Timeout

**Causa:** O processo está demorando mais que o esperado.

**Solução:**
- Aguarde até 2 minutos
- O Claude pode demorar em casos complexos
- Verifique a conexão de internet

### Erro: "Invalid JSON response"

**Causa:** A resposta do servidor não é JSON válido.

**Solução:**
- Verifique se o webhook URL está correto
- Confirme que o workflow está ativo
- Verifique os logs no n8n

---

## Parte 6: Boas Práticas

### Ao Criar Casos de Teste

1. **Seja específico nos fatos**
   - ❌ "Houve problema com o banco"
   - ✅ "O autor teve R$ 5.000 descontados indevidamente em 15/01/2025"

2. **Inclua valores monetários**
   - Sempre mencione valores específicos quando relevante

3. **Mencione datas**
   - Facilita a análise temporal do caso

4. **Identifique as partes**
   - Autor, réu, fiador, etc.

### Ao Analisar Resultados

1. **Verifique a classificação primeiro**
   - O agente correto foi selecionado?

2. **Confira a estrutura da minuta**
   - Tem I/II/III?
   - Tem dispositivo claro?

3. **Procure marcadores [REVISAR]**
   - Indicam pontos que precisam atenção humana

4. **Valide o risco CNJ**
   - ALTO sempre requer revisão manual

---

## Parte 7: Comandos Úteis

### Verificar Status do Webhook

```bash
# Teste simples de conectividade
curl -I https://lexintel.app.n8n.cloud/webhook-test/lex-intelligentia-agentes
```

### Enviar Caso Mínimo

```bash
curl -X POST https://lexintel.app.n8n.cloud/webhook-test/lex-intelligentia-agentes \
  -H "Content-Type: application/json" \
  -d '{
    "fatos": "Teste simples",
    "questoes": "Teste?",
    "pedidos": "Teste",
    "classe": "Teste",
    "assunto": "Teste"
  }'
```

### Ver Resposta Formatada

```bash
# Usando jq para formatar JSON (precisa instalar: apt install jq)
curl -s -X POST https://lexintel.app.n8n.cloud/webhook-test/lex-intelligentia-agentes \
  -H "Content-Type: application/json" \
  -d '{"fatos":"...","questoes":"...","pedidos":"...","classe":"...","assunto":"..."}' \
  | jq '.'
```

---

## Glossário

| Termo | Significado |
|-------|-------------|
| **Webhook** | Endpoint HTTP que recebe dados |
| **Router** | Componente que classifica e direciona |
| **Agente** | IA especializada em um tipo de caso |
| **FIRAC** | Facts, Issues, Rules, Application, Conclusion |
| **QA** | Quality Assurance (controle de qualidade) |
| **CNJ 615** | Resolução do CNJ sobre IA no Judiciário |
| **n8n** | Plataforma de automação (lê-se "n-eight-n") |

---

## Próximos Passos

Depois de dominar o básico:

1. **Explore os diferentes agentes** - Teste casos de cada categoria
2. **Analise as minutas geradas** - Compare com minutas reais
3. **Estude os prompts** - Veja como os agentes são instruídos
4. **Contribua com casos** - Adicione novos casos de teste

---

*Tutorial criado em 2026-01-19 | Lex Intelligentia v2.1.1*
