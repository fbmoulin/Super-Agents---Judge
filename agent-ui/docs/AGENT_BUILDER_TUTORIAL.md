# Agent Builder & Sandbox - Tutorial Completo

Guia passo a passo para executar e utilizar o sistema de criação de agentes judiciais.

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação](#instalação)
3. [Configuração](#configuração)
4. [Executando o Aplicativo](#executando-o-aplicativo)
5. [Guia de Uso](#guia-de-uso)
6. [Fluxo Completo](#fluxo-completo)
7. [Solução de Problemas](#solução-de-problemas)

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18.x ou superior
- **npm**, **yarn**, **pnpm** ou **bun** (gerenciador de pacotes)
- **Chave de API da Anthropic** (para geração de agentes e testes)

### Verificar Node.js

```bash
node --version
# Deve retornar v18.x.x ou superior
```

### Obter Chave da API Anthropic

1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. Crie uma conta ou faça login
3. Vá em **API Keys** e crie uma nova chave
4. Copie a chave (formato: `sk-ant-api03-...`)

---

## Instalação

### 1. Navegar até o diretório do projeto

```bash
cd /caminho/para/superagents-judge/agent-ui
```

### 2. Instalar dependências

```bash
# Usando npm
npm install

# Ou usando pnpm (recomendado)
pnpm install

# Ou usando yarn
yarn install

# Ou usando bun
bun install
```

---

## Configuração

### 1. Criar arquivo de variáveis de ambiente

Crie um arquivo `.env.local` na raiz do diretório `agent-ui`:

```bash
# No diretório agent-ui
touch .env.local
```

### 2. Adicionar a chave da API

Edite o arquivo `.env.local` e adicione:

```env
# Chave da API Anthropic (obrigatório para geração e testes)
ANTHROPIC_API_KEY=sk-ant-api03-sua-chave-aqui

# Opcional: URL do endpoint do agent-os
NEXT_PUBLIC_OS_URL=http://localhost:8000
```

### 3. Verificar configuração

A estrutura do diretório deve ficar assim:

```
agent-ui/
├── .env.local          # ← Arquivo de configuração
├── package.json
├── src/
│   ├── app/
│   │   ├── builder/    # ← Páginas do Agent Builder
│   │   └── api/        # ← APIs do sistema
│   ├── components/
│   │   ├── builder/    # ← Componentes do editor
│   │   └── sandbox/    # ← Componentes do sandbox
│   ├── store/
│   │   └── builder-store.ts
│   └── types/
│       └── agent-builder.ts
└── ...
```

---

## Executando o Aplicativo

### 1. Iniciar o servidor de desenvolvimento

```bash
npm run dev
# ou
pnpm dev
# ou
yarn dev
# ou
bun dev
```

### 2. Acessar o aplicativo

Abra o navegador e acesse:

```
http://localhost:3000/builder
```

Você verá a interface do Agent Builder.

---

## Guia de Uso

### Tela Principal do Builder

```
┌─────────────────────────────────────────────────────────────┐
│  ← Voltar                    Agent Builder    [Importar] [+Novo] │
├───────────────────┬─────────────────────────────────────────┤
│                   │                                         │
│  Lista de Agentes │         Editor / Gerador                │
│                   │                                         │
│  ┌─────────────┐  │  ┌─────────────────────────────────┐   │
│  │ Agente 1    │  │  │                                 │   │
│  │ Score: 85   │  │  │    [Informações] [Regras]       │   │
│  └─────────────┘  │  │    [Súmulas] [Base Legal]       │   │
│                   │  │    [Parâmetros]                 │   │
│  ┌─────────────┐  │  │                                 │   │
│  │ Agente 2    │  │  │    Conteúdo da aba ativa        │   │
│  │ Score: 72   │  │  │                                 │   │
│  └─────────────┘  │  └─────────────────────────────────┘   │
│                   │                                         │
└───────────────────┴─────────────────────────────────────────┘
```

### Funcionalidades Principais

#### 1. Criar Novo Agente com IA

1. Clique em **"+ Novo Agente"**
2. Digite o tema (ex: "Direito Ambiental")
3. Opcionalmente, adicione contexto adicional
4. Clique em **"Gerar Agente com IA"**
5. A IA irá propor:
   - Título e função
   - 5-8 regras específicas
   - Súmulas relevantes
   - Base legal
   - Parâmetros de valores

#### 2. Editar Agente

O editor possui 5 abas:

| Aba | Descrição |
|-----|-----------|
| **Informações** | Título, função, tags, versão |
| **Regras** | Lista de regras com drag-and-drop |
| **Súmulas** | Seleção de súmulas STJ/STF |
| **Base Legal** | Leis e artigos aplicáveis |
| **Parâmetros** | Faixas de valores (danos morais, multas) |

#### 3. Preview do Prompt

- Clique no botão **"Preview"** no canto superior
- Visualize o prompt completo que será enviado ao modelo
- Veja estatísticas (palavras, caracteres, contagens)

#### 4. Testar no Sandbox

1. Clique em **"Testar"** ou navegue para `/builder/{agentId}/sandbox`
2. Insira um caso de teste:
   - **Fatos**: Descrição do caso
   - **Questões**: Pontos jurídicos a analisar
   - **Pedidos**: O que o autor pede
3. Clique em **"Executar Teste"**
4. Veja a minuta gerada e as métricas de qualidade

#### 5. Métricas de Qualidade

O sistema calcula automaticamente:

| Critério | Pontos | O que verifica |
|----------|--------|----------------|
| Estrutura | 0-45 | I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO |
| Citações | 0-30 | Base legal, súmulas, jurisprudência |
| Raciocínio | 0-25 | Decisão clara, honorários, extensão |

**Classificação de Risco:**
- 🟢 85-100: BAIXO (produção)
- 🟡 70-84: MÉDIO (revisão recomendada)
- 🟠 50-69: ALTO (revisão obrigatória)
- 🔴 <50: CRÍTICO (reescrever)

#### 6. Exportar Agente

Três opções disponíveis:
- **JSON**: Arquivo completo para backup/importação
- **Markdown**: Documentação legível
- **Clipboard**: Copia JSON para área de transferência

#### 7. Salvar em Produção

Quando o agente atingir score >= 75:
1. Clique em **"Salvar em Produção"**
2. O agente será adicionado a `config/prompts/system_prompts.json`

---

## Fluxo Completo

### Exemplo: Criar Agente de Direito Ambiental

```
1. CRIAR
   └── Clique "+ Novo Agente"
   └── Digite: "Direito Ambiental"
   └── Contexto: "Ações civis públicas, danos ambientais"
   └── Clique "Gerar Agente com IA"

2. REVISAR
   └── Aba "Informações": Ajuste título se necessário
   └── Aba "Regras": Adicione/remova regras
   └── Aba "Súmulas": Selecione 629, 623, etc.
   └── Aba "Base Legal": Adicione Lei 9.605/98
   └── Aba "Parâmetros": Defina faixas de danos

3. TESTAR
   └── Clique "Testar"
   └── Insira caso: empresa desmatou área protegida
   └── Execute o teste
   └── Analise score e problemas

4. ITERAR
   └── Score < 75? Ajuste regras/súmulas
   └── Execute novos testes
   └── Compare com versões anteriores

5. APROVAR
   └── Score >= 85? Clique "Salvar em Produção"
   └── Agente disponível no sistema principal
```

---

## Solução de Problemas

### Erro: "API key not configured"

**Causa:** A chave da API não foi configurada.

**Solução:**
1. Verifique se o arquivo `.env.local` existe
2. Confirme que contém `ANTHROPIC_API_KEY=sk-ant-...`
3. Reinicie o servidor de desenvolvimento

### Erro: "Failed to generate agent"

**Causa:** Problema na comunicação com a API Anthropic.

**Solução:**
1. Verifique sua conexão com a internet
2. Confirme que a chave da API é válida
3. Verifique se você tem créditos na conta Anthropic

### Agente não aparece na lista

**Causa:** O agente pode não ter sido salvo corretamente.

**Solução:**
1. Os rascunhos são salvos automaticamente no localStorage
2. Limpar o localStorage remove todos os rascunhos
3. Use "Exportar JSON" para backup antes de limpar

### Score muito baixo

**Causas comuns:**
- Falta de estrutura I/II/III na minuta gerada
- Súmulas não citadas
- Base legal não referenciada

**Solução:**
1. Revise as regras do agente
2. Adicione regras específicas sobre estrutura
3. Inclua súmulas relevantes para o tema

### Erro ao salvar em produção

**Causa:** Problema de permissão ou caminho do arquivo.

**Solução:**
1. Verifique se o arquivo `config/prompts/system_prompts.json` existe
2. Confirme permissões de escrita no diretório
3. Verifique os logs do servidor para mais detalhes

---

## Comandos Úteis

```bash
# Iniciar desenvolvimento
npm run dev

# Verificar tipos TypeScript
npm run typecheck

# Lint do código
npm run lint

# Build de produção
npm run build

# Iniciar produção
npm run start
```

---

## Estrutura de URLs

| URL | Descrição |
|-----|-----------|
| `/builder` | Página principal do builder |
| `/builder/{agentId}` | Editar agente específico |
| `/builder/{agentId}/sandbox` | Sandbox de testes |

---

## APIs Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/builder/generate` | POST | Gerar agente via IA |
| `/api/sandbox/test` | POST | Executar teste |
| `/api/sandbox/compare` | POST | Comparar dois agentes |
| `/api/agents/commit` | POST | Salvar em produção |
| `/api/agents/commit` | GET | Listar agentes em produção |

---

## Próximos Passos

Após dominar o básico:

1. **Crie agentes para diferentes áreas** do direito
2. **Compare agentes** para encontrar a melhor configuração
3. **Exporte e compartilhe** definições com a equipe
4. **Integre ao fluxo principal** do sistema Lex Intelligentia

---

## Suporte

Em caso de dúvidas ou problemas:
- Verifique os logs do console do navegador (F12)
- Consulte os logs do servidor no terminal
- Revise este tutorial

---

*Tutorial criado para o sistema Lex Intelligentia - Agent Builder v1.0*
