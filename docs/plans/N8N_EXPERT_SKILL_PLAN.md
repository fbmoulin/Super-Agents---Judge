# Plano: Skill n8n-expert

**Data:** 2026-01-19
**Versão:** 1.0
**Autor:** Kai (AI Assistant)

---

## 1. Objetivo

Criar uma skill especializada em **n8n workflow automation** que possa:
- Diagnosticar e corrigir erros de workflows
- Migrar workflows entre versões do n8n
- Criar workflows otimizados com AI Agents (LangChain)
- Aplicar best practices de produção

---

## 2. Escopo da Skill

### 2.1 Triggers (Quando Ativar)

```
/n8n [subcommand] [args]
```

| Trigger | Descrição |
|---------|-----------|
| `n8n debug` | Diagnosticar erros de workflow |
| `n8n migrate` | Migrar workflow para nova versão |
| `n8n create` | Criar novo workflow |
| `n8n optimize` | Otimizar workflow existente |
| `n8n validate` | Validar JSON de workflow |

### 2.2 Capacidades

1. **Diagnóstico de Erros**
   - "could not find property option"
   - Version mismatch entre nodes
   - Credential issues
   - Webhook registration failures

2. **Migração de Versões**
   - n8n 1.x → 2.0 breaking changes
   - Start node → Manual Trigger/Execute Workflow Trigger
   - AI Agent node version upgrades (1.7 → 3.x)
   - Switch node schema updates

3. **Criação de Workflows**
   - Templates para casos comuns
   - AI Agent workflows com LangChain
   - Error handling patterns
   - Webhook + Response patterns

4. **Otimização**
   - Modular design com sub-workflows
   - Error handling centralizado
   - Rate limiting e caching
   - Credential management

---

## 3. Knowledge Base

### 3.1 Documentação Oficial (URLs para WebFetch)

| Recurso | URL |
|---------|-----|
| Release Notes | https://docs.n8n.io/release-notes/ |
| Breaking Changes 2.0 | https://docs.n8n.io/2-0-breaking-changes/ |
| Migration Tool | https://docs.n8n.io/migration-tool-v2/ |
| Node Types | https://docs.n8n.io/integrations/builtin/node-types/ |
| Core Nodes | https://docs.n8n.io/integrations/builtin/core-nodes/ |
| AI Agent Node | https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/ |
| Tools Agent | https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/tools-agent/ |
| LangChain Concepts | https://docs.n8n.io/advanced-ai/langchain/langchain-n8n/ |
| API Reference | https://docs.n8n.io/api/api-reference/ |
| Best Practices | https://docs.n8n.io/user-management/best-practices/ |
| Workflows | https://docs.n8n.io/workflows/ |

### 3.2 Conhecimento Embutido

#### n8n 2.0 Breaking Changes (Dezembro 2025)

```yaml
removed_nodes:
  - Start Node → Manual Trigger ou Execute Workflow Trigger

security_defaults:
  - N8N_BLOCK_ENV_ACCESS_IN_NODE: true
  - N8N_RESTRICT_FILE_ACCESS_TO: ~/.n8n-files
  - N8N_GIT_NODE_DISABLE_BARE_REPOS: true
  - ExecuteCommand: disabled by default
  - LocalFileTrigger: disabled by default

database:
  - MySQL/MariaDB: NOT SUPPORTED
  - SQLite legacy driver: REMOVED
  - Required: PostgreSQL or SQLite (pooling)

subworkflows:
  - Execute Workflow now returns actual result (not input passthrough)

publishing:
  - Activate/Deactivate → Publish/Unpublish
```

#### Node Type Versions (Janeiro 2026)

```yaml
ai_agent:
  current: 3.x
  deprecated: 1.7, 2.2
  note: Delete and re-add node to upgrade

switch:
  current: 3.2
  compatible: true

http_request:
  current: 4.2
  compatible: true

webhook:
  current: 2
  compatible: true

google_sheets:
  current: 4.5
  compatible: true

anthropic_chat_model:
  current: 1.3+
  note: Check Responses API compatibility
```

#### Common Errors

```yaml
could_not_find_property_option:
  causes:
    - typeVersion mismatch
    - AI-generated workflow with outdated schema
    - Node created via API with wrong version
  solutions:
    - Delete node and re-add from menu
    - Recreate workflow in updated n8n instance
    - Update typeVersion in JSON (risky)

webhook_not_registered:
  causes:
    - Workflow not activated
    - Test mode requires manual execution
  solutions:
    - Click "Execute workflow" for test mode
    - Enable workflow toggle for production

model_not_supported:
  causes:
    - AI Agent node v2.2 with v3+ models
    - "Use Responses API" incompatibility
  solutions:
    - Disable "Use Responses API"
    - Delete and re-add AI Agent node
```

---

## 4. Fluxo de Trabalho

### 4.1 Debug Flow

```
1. Receber mensagem de erro
2. Classificar tipo de erro
3. WebSearch para issues recentes no GitHub/Community
4. WebFetch documentação relevante
5. Analisar workflow JSON (se fornecido)
6. Identificar nodes problemáticos
7. Propor solução específica
8. Gerar código/instruções de correção
```

### 4.2 Migration Flow

```
1. Ler workflow JSON atual
2. Identificar versão de origem
3. WebFetch breaking changes
4. Mapear nodes que precisam atualização
5. Gerar lista de ações necessárias
6. Opcional: Gerar JSON atualizado (quando possível)
7. Fornecer instruções de teste
```

### 4.3 Create Flow

```
1. Entender requisitos do usuário
2. Selecionar template apropriado
3. WebFetch documentação dos nodes necessários
4. Gerar estrutura do workflow
5. Adicionar error handling
6. Validar JSON
7. Fornecer instruções de deploy
```

---

## 5. Estrutura da Skill

```
skills/
└── n8n-expert/
    ├── SKILL.md              # Definição principal
    ├── knowledge/
    │   ├── breaking-changes.md
    │   ├── node-versions.md
    │   ├── common-errors.md
    │   └── templates/
    │       ├── webhook-response.json
    │       ├── ai-agent-basic.json
    │       └── error-handler.json
    └── examples/
        ├── debug-session.md
        └── migration-session.md
```

---

## 6. SKILL.md Template

```markdown
---
name: n8n-expert
description: Especialista em n8n workflow automation. USE WHEN debugging workflows, migrating between versions, creating new workflows, or optimizing existing automations.
---

# n8n Expert Skill

## Triggers
- User mentions n8n, workflow automation, or workflow errors
- JSON workflow files are referenced
- Import/export errors occur
- AI Agent node issues
- Version migration needs

## Behavioral Flow

### 1. Classify Request
- Debug: Error messages, failures, unexpected behavior
- Migrate: Version upgrades, breaking changes
- Create: New workflow requirements
- Optimize: Performance, reliability, maintainability

### 2. Research
- WebSearch: n8n GitHub issues, community posts
- WebFetch: Official documentation
- Read: Local workflow JSON files

### 3. Analyze
- Parse workflow JSON structure
- Identify node types and versions
- Map dependencies and connections
- Detect potential issues

### 4. Solve
- Provide specific, actionable solutions
- Include code/JSON when applicable
- Reference official documentation
- Offer alternative approaches

## MCP Integration
- **WebSearch**: GitHub issues, community forums
- **WebFetch**: n8n documentation
- **Read/Write**: Workflow JSON files
- **Sequential MCP**: Complex multi-step migrations

## Key Knowledge Areas
- n8n 2.0 breaking changes
- AI Agent/LangChain integration
- Node typeVersion compatibility
- Error patterns and solutions
- Best practices for production

## Output Standards
- Clear diagnosis of issues
- Step-by-step solutions
- JSON code blocks when relevant
- Links to official documentation
```

---

## 7. Próximos Passos

1. **Criar estrutura de diretórios**
   ```bash
   mkdir -p ~/.claude/skills/n8n-expert/knowledge/templates
   mkdir -p ~/.claude/skills/n8n-expert/examples
   ```

2. **Criar SKILL.md**
   - Implementar definição completa

3. **Popular knowledge base**
   - Copiar breaking changes
   - Documentar node versions
   - Criar templates de workflow

4. **Testar skill**
   - Debug de workflow com erro
   - Migração v1.x → v2.0
   - Criação de workflow AI Agent

---

## 8. Referências

### Documentação Oficial
- [n8n Docs](https://docs.n8n.io/)
- [n8n API Reference](https://docs.n8n.io/api/api-reference/)
- [n8n Breaking Changes 2.0](https://docs.n8n.io/2-0-breaking-changes/)
- [n8n Release Notes](https://docs.n8n.io/release-notes/)

### Comunidade
- [n8n Community Forum](https://community.n8n.io/)
- [n8n GitHub Issues](https://github.com/n8n-io/n8n/issues)

### Artigos
- [Seven n8n Workflow Best Practices 2026](https://michaelitoback.com/n8n-workflow-best-practices/)
- [n8n AI Agents Tutorial](https://skywork.ai/blog/agent/n8n-ai-agents-tutorial-create-smart-automations-with-langchain/)

---

*Plano criado em 2026-01-19 | Lex Intelligentia Project*
