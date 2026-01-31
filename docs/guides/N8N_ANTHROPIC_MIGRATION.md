# Guia de Migração: n8n OpenAI → Anthropic

**Data:** 2026-01-31
**Versão:** 1.0
**Status:** Em Execução

---

## Resumo

Migração dos nodes OpenAI Model para Anthropic Chat Model no workflow Lex Intelligentia v2.6.

## Pré-requisitos

1. **Credencial Anthropic** configurada no n8n Cloud
2. **API Key Anthropic** válida (verificar em console.anthropic.com)
3. **Modelo:** `claude-sonnet-4-20250514`

---

## Nodes para Migração

### Agentes Core (6 nodes)

| Node Atual | Node Target | Agente |
|------------|-------------|--------|
| OpenAI: Bancário | Anthropic: Bancário | agent_BANCARIO |
| OpenAI: Consumidor | Anthropic: Consumidor | agent_CONSUMIDOR |
| OpenAI: Execução | Anthropic: Execução | agent_EXECUCAO |
| OpenAI: Locação | Anthropic: Locação | agent_LOCACAO |
| OpenAI: Possessórias | Anthropic: Possessórias | agent_POSSESSORIAS |
| OpenAI: Genérico | Anthropic: Genérico | agent_GENERICO |

### Agentes Saúde (3 nodes)

| Node Atual | Node Target | Agente |
|------------|-------------|--------|
| OpenAI: Saúde Cobertura | Anthropic: Saúde Cobertura | agent_SAUDE_COBERTURA |
| OpenAI: Saúde Contratual | Anthropic: Saúde Contratual | agent_SAUDE_CONTRATUAL |
| OpenAI: Saúde Medicamentos | Anthropic: Saúde Medicamentos | agent_SAUDE_MEDICAMENTOS |

### Agentes Família (5 nodes)

| Node Atual | Node Target | Agente |
|------------|-------------|--------|
| OpenAI: Alimentos | Anthropic: Alimentos | agent_ALIMENTOS |
| OpenAI: Guarda | Anthropic: Guarda | agent_GUARDA |
| OpenAI: Paternidade | Anthropic: Paternidade | agent_PATERNIDADE |
| OpenAI: Divórcio | Anthropic: Divórcio | agent_DIVORCIO |
| OpenAI: Inventário | Anthropic: Inventário | agent_INVENTARIO |

### Agentes Especializados (4 nodes)

| Node Atual | Node Target | Agente |
|------------|-------------|--------|
| OpenAI: Trânsito | Anthropic: Trânsito | agent_TRANSITO |
| OpenAI: Usucapião | Anthropic: Usucapião | agent_USUCAPIAO |
| OpenAI: Incorporação | Anthropic: Incorporação | agent_INCORPORACAO |
| OpenAI: Seguros | Anthropic: Seguros | agent_SEGUROS |

### Agentes Fazenda Pública (3 nodes)

| Node Atual | Node Target | Agente |
|------------|-------------|--------|
| OpenAI: Execução Fiscal | Anthropic: Execução Fiscal | agent_EXECUCAO_FISCAL |
| OpenAI: Resp. Civil Estado | Anthropic: Resp. Civil Estado | agent_RESP_CIVIL_ESTADO |
| OpenAI: Mandado Segurança | Anthropic: Mandado Segurança | agent_MANDADO_SEGURANCA |

**Total: 21 nodes**

---

## Configuração do Node Anthropic

### Parâmetros Base

```json
{
  "model": "claude-sonnet-4-20250514",
  "maxTokens": 8192,
  "temperature": 0.3,
  "topP": 0.9
}
```

### Credencial

1. Acessar n8n Cloud → Settings → Credentials
2. Create New → Anthropic
3. Inserir API Key
4. Testar conexão

---

## Checklist de Migração

### Fase 1: Preparação
- [ ] Backup do workflow atual
- [ ] Criar credencial Anthropic no n8n
- [ ] Testar credencial com request simples

### Fase 2: Migração
- [ ] Substituir nodes OpenAI → Anthropic (1 por vez)
- [ ] Manter system prompt inalterado
- [ ] Verificar conexões de input/output

### Fase 3: Validação
- [ ] Testar webhook com caso bancário
- [ ] Testar webhook com caso consumidor
- [ ] Verificar QA score mantido (≥90)
- [ ] Verificar latência aceitável (<30s)

### Fase 4: Deploy
- [ ] Publicar workflow atualizado
- [ ] Monitorar primeiras 10 execuções
- [ ] Documentar quaisquer issues

---

## Rollback

Em caso de problemas:

1. Acessar n8n Cloud → Workflows
2. Selecionar workflow
3. Version History → Restore versão anterior
4. Publicar versão restaurada

---

## Troubleshooting

### Erro 401 - Unauthorized
- Verificar API key no console Anthropic
- Regenerar key se necessário
- Atualizar credencial no n8n

### Erro 429 - Rate Limit
- Implementar retry com backoff
- Verificar limites do plano Anthropic
- Considerar upgrade se necessário

### Timeout
- Aumentar timeout no node (120s recomendado)
- Verificar complexidade do prompt
- Considerar reduzir maxTokens

---

## Pós-Migração

1. Atualizar CLAUDE.md com novo status
2. Registrar em audit log
3. Comunicar equipe sobre mudança
4. Monitorar métricas por 7 dias

---

*Documento criado em 2026-01-31 | Sprint 1 - Critical Path*
