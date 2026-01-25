# Próximos Passos - Validação de Agentes

**Data:** 2026-01-19
**Status:** Em andamento

---

## Fase 1: Validação com Casos Sintéticos ✅ CONCLUÍDO

- [x] Criar framework de validação (`agent_validator.js`)
- [x] Testar todos os 11 agentes
- [x] Validar estrutura FIRAC (100% passou)
- [x] Criar pasta para processos reais

### Resultados
| Agente | Score | Status |
|--------|-------|--------|
| Bancário | 104% | ✅ |
| Consumidor | 105% | ✅ |
| Execução | 89% | ✅ |
| Locação | 95% | ✅ |
| Possessórias | 95% | ✅ |
| Saúde Cobertura | 105% | ✅ |
| Saúde Contratual | 105% | ✅ |
| Trânsito | 95% | ✅ |
| Usucapião | 89% | ✅ |
| Incorporação | 105% | ✅ |
| Genérico | 95% | ✅ |

---

## Fase 2: Validação com Processos Reais ✅ CONCLUÍDO

### 2.1 Upload de PDFs ✅
- [x] Coletar PDFs de processos reais (de C:\Processos 2a Vara)
- [x] Organizar por categoria em `test_cases/processos_reais/`
- [x] 13 processos em 7 categorias

**PDFs por categoria:**
- bancario: 4
- consumidor: 1
- execucao: 2
- possessorias: 2
- saude_cobertura: 1
- transito: 1
- generico: 2

### 2.2 Extração de Dados ✅ CONCLUÍDO
- [x] Criar script de extração de PDFs (`pdf_extractor.js`)
- [x] Extrair: fatos, questões, pedidos, classe, assunto
- [x] Gerar JSON para cada processo

```bash
# Extrair dados de um PDF específico
node scripts/pdf_extractor.js bancario

# Extrair todos os PDFs
node scripts/pdf_extractor.js --all
```

### 2.3 Testes com Processos Reais ✅
- [x] Executar validação com processos reais
- [x] 9 testes executados com sucesso (média 98%)
- [ ] Comparar minuta gerada com decisão real (se disponível)
- [ ] Identificar gaps nos prompts

```bash
# Testar um agente com processos reais
node scripts/agent_validator.js bancario --real

# Testar todos os agentes com processos reais
node scripts/agent_validator.js --all --real
```

**Resultados parciais (2026-01-19):**
| Agente | Score |
|--------|-------|
| Bancário (4 casos) | 95-105% ✅ |
| Consumidor | 105% ✅ |
| Execução | 89% ✅ |
| Possessórias | 95% ✅ |
| Saúde Cobertura | 105% ✅ |
| Trânsito | 84% ✅ |

---

## Fase 3: Iteração e Melhoria dos Prompts

### 3.1 Correções Identificadas
- [ ] Bancário: Adicionar referência explícita às Súmulas 297, 382, 539, 603
- [ ] Consumidor: Reforçar Súmula 302 STJ para planos de saúde
- [ ] Execução: Melhorar citação de artigos 784, 786, 921 CPC
- [ ] Usucapião: Detalhar prazos por modalidade

### 3.2 Expansão de Casos de Teste
- [ ] Bancário: Adicionar casos de portabilidade, refinanciamento
- [ ] Consumidor: Casos de e-commerce, delivery
- [ ] Saúde: Casos de urgência/emergência, transplantes
- [ ] Trânsito: Casos com múltiplos veículos

---

## Fase 4: Integração no n8n

### 4.1 Preparação
- [ ] Exportar prompts validados
- [ ] Documentar configurações de cada agente
- [ ] Preparar template de AI Agent node

### 4.2 Configuração no n8n Cloud
- [ ] Recriar AI Agent nodes manualmente
- [ ] Configurar Anthropic Chat Model
- [ ] Conectar ao Switch de roteamento

### 4.3 Testes de Integração
- [ ] Testar webhook de produção
- [ ] Validar fluxo completo (Webhook → Router → Agent → Response)
- [ ] Verificar audit logs

---

## Fase 5: Deploy e Monitoramento

### 5.1 Deploy
- [ ] Ativar workflow em produção
- [ ] Configurar alertas de erro
- [ ] Documentar procedimentos de rollback

### 5.2 Monitoramento
- [ ] Implementar métricas de qualidade
- [ ] Criar dashboard de acompanhamento
- [ ] Definir SLAs de resposta

### 5.3 Feedback Loop
- [ ] Coletar feedback dos usuários (juízes/assessores)
- [ ] Identificar casos problemáticos
- [ ] Iterar prompts continuamente

---

## Comandos Úteis

```bash
# Testar um agente específico (casos sintéticos)
node scripts/agent_validator.js bancario

# Testar todos os agentes (casos sintéticos)
node scripts/agent_validator.js --all

# Extrair dados de PDFs de processos reais
node scripts/pdf_extractor.js --all

# Testar com processos reais
node scripts/agent_validator.js --all --real

# Ver resultados
cat test_cases/agent_validation_results/validation_*.json | jq '.summary'
```

---

## Métricas de Sucesso

| Métrica | Meta | Atual |
|---------|------|-------|
| Score médio | ≥90% | 101% ✅ |
| Estrutura FIRAC | 100% | 100% ✅ |
| Súmulas corretas | ≥80% | ~60% ⚠️ |
| Tempo de resposta | <60s | ~30s ✅ |
| Casos de teste | ≥50 | 19 ⚠️ |

---

*Lex Intelligentia Judiciário v2.3 - Plano de Validação*
