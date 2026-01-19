# LEX INTELLIGENTIA JUDICIÁRIO
## Plano Revisado: Agentes Especializados como Braços do Fluxo n8n

**Versão:** 2.0 - Janeiro 2026  
**Contexto:** Integração com automação n8n existente (PDF → FIRAC → Minutas)

---

## 1. ARQUITETURA INTEGRADA AO FLUXO N8N EXISTENTE

### 1.1 Pipeline Atual (em fase de testes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLUXO N8N EXISTENTE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────────────┐   │
│  │   Upload     │───▶│ Extração PDF     │───▶│   Análise FIRAC+         │   │
│  │   Processo   │    │ (OCR/Parser)     │    │   (LLM Principal)        │   │
│  │   (PDF)      │    │                  │    │                          │   │
│  └──────────────┘    └──────────────────┘    └────────────┬─────────────┘   │
│                                                           │                  │
│                                                           ▼                  │
│                                              ┌────────────────────────┐      │
│                                              │   ROUTER SEMÂNTICO    │      │
│                                              │   (Switch/IF Node)     │      │
│                                              │   + Classificação IA   │      │
│                                              └───────────┬────────────┘      │
│                                                          │                   │
│     ┌────────────────────────────────────────────────────┼──────────────┐   │
│     │                    BRAÇOS ESPECIALIZADOS           │              │   │
│     │                    (Novos Agentes)                 │              │   │
│     ▼                    ▼                    ▼          ▼              ▼   │
│ ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐     │
│ │BANCÁRIO│  │CONSUMO │  │ POSSE  │  │LOCAÇÃO │  │EXECUÇÃO│  │GENÉRICO│     │
│ │ Agent  │  │ Agent  │  │ Agent  │  │ Agent  │  │ Agent  │  │ Agent  │     │
│ └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘     │
│     │           │           │           │           │           │          │
│     └───────────┴───────────┴───────────┴───────────┴───────────┘          │
│                                         │                                   │
│                                         ▼                                   │
│                            ┌────────────────────────┐                       │
│                            │   MERGE + QA Check     │                       │
│                            │   (Validação Minuta)   │                       │
│                            └───────────┬────────────┘                       │
│                                        │                                    │
│                                        ▼                                    │
│                            ┌────────────────────────┐                       │
│                            │   Output: Minuta       │                       │
│                            │   Sentença/Decisão     │                       │
│                            └────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Ponto de Inserção dos Agentes

Os agentes especializados entram **APÓS a análise FIRAC**, funcionando como **braços paralelos** que recebem:

**Input do FIRAC para cada Agente:**
```json
{
  "processo_numero": "0001234-56.2025.8.08.0024",
  "fatos": "Resumo estruturado dos fatos...",
  "questao_juridica": "Issue central identificada...",
  "regras_aplicaveis": ["Art. 51 CDC", "Súmula 297 STJ", ...],
  "aplicacao": "Como as regras se aplicam aos fatos...",
  "conclusao_preliminar": "Pedido procede/improcede porque...",
  "tipo_acao_classificado": "contratos_bancarios",
  "subtipo": "revisional_juros",
  "confianca_classificacao": 0.92,
  "documentos_extraidos": {...},
  "valor_causa": 50000.00,
  "rito": "comum"
}
```

---

## 2. IMPLEMENTAÇÃO DO ROUTER NO N8N

### 2.1 Estrutura do Router (Switch Node + AI Classification)

```javascript
// Código para nó "Code" no n8n - Router Semântico
const firacOutput = $input.first().json;

// Mapeamento tipo → agente
const ROUTING_MAP = {
  // Contratos Bancários
  "revisional_bancario": "agent_bancario",
  "monitoria_bancaria": "agent_bancario", 
  "cobranca_bancaria": "agent_bancario",
  "cartao_credito": "agent_bancario",
  
  // Responsabilidade Civil / Consumidor
  "negativacao_indevida": "agent_consumidor",
  "fraude_bancaria": "agent_consumidor",
  "cobranca_indevida": "agent_consumidor",
  "dano_moral_consumo": "agent_consumidor",
  
  // Direitos Reais
  "reintegracao_posse": "agent_possessorias",
  "manutencao_posse": "agent_possessorias",
  "usucapiao": "agent_possessorias",
  "interdito_proibitorio": "agent_possessorias",
  
  // Locação
  "despejo_falta_pagamento": "agent_locacao",
  "despejo_denuncia_vazia": "agent_locacao",
  "renovatoria_locacao": "agent_locacao",
  "revisional_aluguel": "agent_locacao",
  
  // Execuções
  "execucao_titulo_extrajudicial": "agent_execucao",
  "cumprimento_sentenca": "agent_execucao",
  "embargos_execucao": "agent_execucao",
  
  // Busca e Apreensão
  "busca_apreensao_veiculo": "agent_busca_apreensao",
  "alienacao_fiduciaria": "agent_busca_apreensao",
  
  // Procedimentos Especiais
  "inventario": "agent_especiais",
  "arrolamento": "agent_especiais",
  "interdicao": "agent_especiais",
  "alvara_judicial": "agent_especiais",
  
  // Erro Médico (especializado)
  "erro_medico": "agent_erro_medico",
  "responsabilidade_hospitalar": "agent_erro_medico"
};

// Determina agente
const subtipo = firacOutput.subtipo?.toLowerCase().replace(/\s+/g, '_');
const tipoAcao = firacOutput.tipo_acao_classificado?.toLowerCase();

let selectedAgent = ROUTING_MAP[subtipo] || ROUTING_MAP[tipoAcao] || "agent_generico";

// Threshold de confiança
if (firacOutput.confianca_classificacao < 0.75) {
  selectedAgent = "agent_generico"; // Fallback para baixa confiança
}

return [{
  json: {
    ...firacOutput,
    selected_agent: selectedAgent,
    routing_confidence: firacOutput.confianca_classificacao,
    routing_method: "semantic_classification"
  }
}];
```

### 2.2 Configuração do Switch Node

```
Switch Node: "Route to Agent"
├── Condição 1: {{ $json.selected_agent }} equals "agent_bancario" → Bancário
├── Condição 2: {{ $json.selected_agent }} equals "agent_consumidor" → Consumidor
├── Condição 3: {{ $json.selected_agent }} equals "agent_possessorias" → Possessórias
├── Condição 4: {{ $json.selected_agent }} equals "agent_locacao" → Locação
├── Condição 5: {{ $json.selected_agent }} equals "agent_execucao" → Execução
├── Condição 6: {{ $json.selected_agent }} equals "agent_busca_apreensao" → Busca Apreensão
├── Condição 7: {{ $json.selected_agent }} equals "agent_especiais" → Especiais
├── Condição 8: {{ $json.selected_agent }} equals "agent_erro_medico" → Erro Médico
└── Fallback: agent_generico → Genérico
```

---

## 3. ESTRUTURA DOS AGENTES ESPECIALIZADOS

### 3.1 Arquitetura de Cada Braço (Agent Node)

Cada agente é implementado como um **sub-workflow** ou **AI Agent Node** com:

```
┌─────────────────────────────────────────────────────────────────┐
│                   AGENTE ESPECIALIZADO (Braço)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │   Input      │───▶│   System Prompt  │───▶│   Tools       │  │
│  │   FIRAC+     │    │   Especializado  │    │   Attached    │  │
│  └──────────────┘    └──────────────────┘    └───────────────┘  │
│                              │                       │          │
│                              ▼                       ▼          │
│                    ┌─────────────────────────────────────┐      │
│                    │          AI Agent Node              │      │
│                    │   (Claude/GPT-4o/DeepSeek)         │      │
│                    │   + Memory Buffer                   │      │
│                    └─────────────────┬───────────────────┘      │
│                                      │                          │
│                                      ▼                          │
│                    ┌─────────────────────────────────────┐      │
│                    │   Output: Minuta Estruturada        │      │
│                    │   + Fundamentação + Jurisprudência  │      │
│                    └─────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Template de System Prompt para Agentes

```markdown
# AGENTE: [NOME DO AGENTE]

## PAPEL
Você é um agente especializado em [ÁREA] da Vara Cível do TJES.
Sua função é gerar minutas de decisões/sentenças com base na análise FIRAC fornecida.

## CONTEXTO RECEBIDO
- Análise FIRAC completa do processo
- Tipo de ação classificado
- Pedidos e fundamentos identificados

## COMPETÊNCIAS ESPECÍFICAS
[Lista de tipos de ação que este agente domina]

## JURISPRUDÊNCIA BASE
[Súmulas e precedentes obrigatórios para esta área]

## ESTRUTURA DA MINUTA

### Para DECISÕES INTERLOCUTÓRIAS:
1. Relatório breve (máx. 5 linhas)
2. Fundamentação objetiva
3. Dispositivo claro

### Para SENTENÇAS:
1. RELATÓRIO (síntese do processo)
2. FUNDAMENTAÇÃO
   - Preliminares (se houver)
   - Mérito
   - Jurisprudência aplicável
3. DISPOSITIVO
   - Procedência/Improcedência
   - Condenações específicas
   - Honorários (Art. 85 CPC)
   - Custas

## REGRAS OBRIGATÓRIAS
1. Sempre fundamentar com base legal expressa
2. Citar jurisprudência do STJ/TJES quando disponível
3. Observar parâmetros de danos morais do tribunal
4. Verificar prescrição/decadência
5. Aplicar Súmulas vinculantes pertinentes

## OUTPUT ESPERADO
Minuta completa em formato markdown, pronta para revisão do magistrado.
```

---

## 4. AGENTES PRIORITÁRIOS - FASE 1

### 4.1 Agent Bancário (Maior Volume)

**Subtipos cobertos:**
- Revisional de contrato bancário
- Ação monitória
- Cobrança
- Empréstimo consignado fraudulento
- Cartão de crédito (anuidade, juros)

**Jurisprudência integrada:**
```
- Súmula 297 STJ: CDC aplica-se a instituições financeiras
- Súmula 381 STJ: Juros remuneratórios - limitação excepcional
- Súmula 382 STJ: Estipulação de juros não vincula à TR
- Súmula 539 STJ: Capitalização mensal permitida após MP 2.170-36
- Súmula 603 STJ: Tarifa de cadastro válida
- Súmula 379 STJ: Juros compostos em cédula de crédito
```

**System Prompt específico:**
```markdown
# AGENTE BANCÁRIO - LEX INTELLIGENTIA

## ESPECIALIZAÇÃO
Contratos bancários, revisão de cláusulas, ações de cobrança, monitórias.

## ANÁLISE OBRIGATÓRIA
1. **Juros Remuneratórios**: Verificar se excedem 1,5x média de mercado BACEN
2. **Capitalização**: Permitida se pactuada e após MP 2.170-36/2001
3. **Tarifas**: TAC/TEC vedadas (Súmula 565 STJ), cadastro permitida
4. **Mora**: Limitação a 1% a.m. + correção
5. **Comissão de Permanência**: Exclusiva de outros encargos

## PARÂMETROS DANOS MORAIS (TJES)
- Inscrição indevida SPC/SERASA: R$ 5.000 a R$ 15.000
- Empréstimo fraudulento: R$ 8.000 a R$ 20.000
- Negativação + desconto indevido: R$ 10.000 a R$ 25.000

## VERBAS SUCUMBENCIAIS
- Procedência total: 10-15% sobre valor da condenação
- Procedência parcial: Recíproca proporcional
- Improcedência: 10% sobre valor da causa
```

### 4.2 Agent Consumidor/Danos Morais

**Subtipos cobertos:**
- Negativação indevida
- Fraude em conta/cartão
- Cobrança indevida
- Falha na prestação de serviço
- Vício do produto

**Parâmetros TJES atualizados (2025-2026):**
```
DANOS MORAIS - FAIXAS CONSOLIDADAS:

Mero aborrecimento: Improcedência
Leve (transtorno pontual): R$ 3.000 - R$ 5.000
Moderado (negativação, cobrança): R$ 5.000 - R$ 15.000
Grave (fraude, constrangimento público): R$ 15.000 - R$ 30.000
Gravíssimo (dano à saúde, reincidência): R$ 30.000 - R$ 50.000+

Majorantes:
- Reiteração de conduta: +50%
- Vulnerabilidade (idoso, deficiente): +30%
- Tempo de negativação indevida > 1 ano: +20%

Minorantes:
- Culpa concorrente: -30% a -50%
- Baixo tempo de exposição: -20%
```

### 4.3 Agent Possessórias

**Subtipos:**
- Reintegração de posse
- Manutenção de posse
- Interdito proibitório
- Usucapião (todos os tipos)

**Checklist decisório:**
```
REINTEGRAÇÃO/MANUTENÇÃO:
[ ] Posse anterior comprovada
[ ] Esbulho/turbação demonstrado
[ ] Data do esbulho (ano e dia para liminar)
[ ] Notificação prévia (se contratual)
[ ] Função social da posse

USUCAPIÃO:
[ ] Tempo de posse (5/10/15 anos conforme modalidade)
[ ] Animus domini
[ ] Posse mansa e pacífica
[ ] Inexistência de oposição
[ ] Certidões negativas
[ ] Planta e memorial
```

### 4.4 Agent Locação

**Subtipos:**
- Despejo por falta de pagamento
- Despejo por denúncia vazia
- Renovatória
- Revisional de aluguel
- Consignatória de aluguéis

**Fundamentos legais obrigatórios:**
```
Lei 8.245/91 (Lei do Inquilinato)

Despejo falta pagamento:
- Art. 9º, III + Art. 62
- Purgação da mora (Art. 62, II) - até contestação
- Caução (Art. 62, I) - 3 meses de aluguel

Denúncia vazia:
- Art. 46 (30 meses + notificação 30 dias)
- Art. 47 (residencial < 30 meses - hipóteses taxativas)

Renovatória:
- Art. 51 (requisitos cumulativos)
- Prazo decadencial: 1 ano a 6 meses antes do término
```

### 4.5 Agent Execução

**Subtipos:**
- Execução de título extrajudicial
- Cumprimento de sentença
- Embargos à execução
- Impugnação ao cumprimento

**Verificações obrigatórias:**
```
TÍTULO EXTRAJUDICIAL (Art. 784 CPC):
[ ] Liquidez
[ ] Certeza
[ ] Exigibilidade
[ ] Prescrição intercorrente (Art. 921, §4º)

CUMPRIMENTO DE SENTENÇA:
[ ] Trânsito em julgado
[ ] Atualização do cálculo
[ ] Multa 10% + honorários 10% (Art. 523)
[ ] Prazo 15 dias

PENHORA:
- BACENJUD automático
- Ordem legal (Art. 835 CPC)
- Impenhorabilidades (Art. 833)
```

### 4.6 Agent Genérico (Fallback)

**Função:** Processar ações não cobertas pelos agentes especializados ou com baixa confiança de classificação.

**Características:**
- Prompt mais abrangente
- Solicita mais fundamentação do FIRAC
- Gera minuta com marcadores para revisão humana
- Flag automático para revisão prioritária

---

## 5. IMPLEMENTAÇÃO NO N8N - PASSO A PASSO

### 5.1 Estrutura de Nós para Cada Agente

```
[Receive FIRAC] → [Set System Prompt] → [AI Agent Node] → [Format Output]
                         ↓
                  [Tool: Jurisprudência]
                  [Tool: Cálculos]
                  [Tool: Templates]
```

### 5.2 Configuração do AI Agent Node

```json
{
  "node_type": "AI Agent",
  "parameters": {
    "agent": "conversationalAgent",
    "promptType": "define",
    "text": "{{ $('Set System Prompt').item.json.system_prompt }}",
    "options": {
      "systemMessage": "{{ $('Set System Prompt').item.json.system_prompt }}",
      "humanMessage": "Analise o seguinte processo e gere a minuta:\n\n{{ JSON.stringify($json.firac_output, null, 2) }}"
    }
  },
  "model": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "temperature": 0.3,
    "maxTokens": 8192
  },
  "memory": {
    "type": "windowBufferMemory",
    "windowSize": 5
  },
  "tools": [
    "jurisprudencia_search",
    "calculo_atualizacao",
    "template_loader"
  ]
}
```

### 5.3 Tools Disponíveis para Agentes

**Tool 1: Busca Jurisprudência**
```javascript
// HTTP Request Node para API do TJDFT/STJ
{
  "name": "jurisprudencia_search",
  "description": "Busca jurisprudência relevante no STJ e tribunais estaduais",
  "parameters": {
    "query": "string - termos de busca",
    "tribunal": "string - STJ, TJES, TJSP, etc",
    "limit": "number - quantidade de resultados"
  }
}
```

**Tool 2: Cálculo de Atualização**
```javascript
// Code Node para cálculos
{
  "name": "calculo_atualizacao",
  "description": "Calcula valores atualizados com correção monetária e juros",
  "parameters": {
    "valor_original": "number",
    "data_inicial": "date",
    "data_final": "date",
    "indice": "IPCA-E, INPC, SELIC",
    "juros_mora": "number - percentual mensal"
  }
}
```

**Tool 3: Template Loader**
```javascript
// Carrega templates de minutas do Google Drive ou banco local
{
  "name": "template_loader",
  "description": "Carrega template de minuta para o tipo de ação",
  "parameters": {
    "tipo_acao": "string",
    "subtipo": "string",
    "rito": "comum, sumarissimo, especial"
  }
}
```

---

## 6. ROUTER SEMÂNTICO AVANÇADO

### 6.1 Implementação com Embedding (Opcional - Performance)

Para alta performance, usar semantic router com embeddings pré-computados:

```javascript
// Integração n8n com Semantic Router via HTTP Request
// Endpoint: POST /classify

const utterances = {
  "contratos_bancarios": [
    "revisão de contrato bancário juros abusivos",
    "ação monitória cobrança dívida",
    "empréstimo consignado fraudulento desconto indevido",
    "anatocismo capitalização de juros",
    "tarifa bancária indevida TAC TEC"
  ],
  "responsabilidade_civil": [
    "negativação indevida SPC SERASA dano moral",
    "fraude clonagem cartão ressarcimento",
    "erro médico negligência imperícia",
    "acidente trânsito indenização"
  ],
  "possessorias": [
    "reintegração posse esbulho invasão",
    "manutenção posse turbação",
    "usucapião extraordinário tempo posse",
    "interdito proibitório ameaça"
  ],
  "locacao": [
    "despejo falta pagamento aluguel",
    "ação renovatória locação comercial",
    "despejo denúncia vazia término contrato"
  ],
  "execucao": [
    "execução título extrajudicial cheque promissória",
    "cumprimento sentença fase execução",
    "embargos execução excesso penhora"
  ]
};

// O router retorna o agente com maior similaridade semântica
```

### 6.2 Híbrido: Rules + LLM Fallback

```javascript
// Router híbrido no n8n
const input = $json.firac_output;

// Fase 1: Rules-based (keywords)
const keywords = {
  "agent_bancario": ["banco", "financeira", "juros", "empréstimo", "consignado", "cartão"],
  "agent_consumidor": ["consumidor", "CDC", "serasa", "spc", "produto", "serviço"],
  "agent_possessorias": ["posse", "esbulho", "turbação", "usucapião", "imóvel"],
  "agent_locacao": ["aluguel", "locação", "inquilino", "locador", "despejo"],
  "agent_execucao": ["execução", "título", "penhora", "cumprimento"]
};

let ruleMatch = null;
const textoAnalise = JSON.stringify(input).toLowerCase();

for (const [agent, words] of Object.entries(keywords)) {
  const matchCount = words.filter(w => textoAnalise.includes(w)).length;
  if (matchCount >= 2) {
    ruleMatch = { agent, confidence: matchCount / words.length };
    break;
  }
}

// Fase 2: Se rules não resolver com confiança, usa LLM
if (!ruleMatch || ruleMatch.confidence < 0.6) {
  // Chama AI Agent Node para classificação
  return { useAIClassification: true, input };
}

return { 
  selected_agent: ruleMatch.agent,
  confidence: ruleMatch.confidence,
  method: "rule_based"
};
```

---

## 7. QUALIDADE E COMPLIANCE CNJ 615/2025

### 7.1 QA Check Node (Pós-Agente)

```javascript
// Validação da minuta gerada
const minuta = $json.minuta_gerada;
const firac = $json.firac_input;

const checks = {
  tem_fundamentacao: minuta.includes("FUNDAMENTAÇÃO") || minuta.includes("FUNDAMENTO"),
  tem_dispositivo: minuta.includes("DISPOSITIVO") || minuta.includes("DECIDO"),
  cita_lei: /Art\.\s*\d+/.test(minuta) || /Lei\s*\d+/.test(minuta),
  cita_jurisprudencia: /Súmula|STJ|STF|TJES|AgRg|REsp/.test(minuta),
  tem_honorarios: /honorários|Art\.\s*85/.test(minuta),
  tamanho_adequado: minuta.length > 500 && minuta.length < 15000
};

const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length;

return {
  minuta,
  qa_checks: checks,
  qa_score: score,
  aprovado: score >= 0.8,
  requer_revisao_humana: score < 0.8 || firac.confianca_classificacao < 0.85
};
```

### 7.2 Audit Log para CNJ 615/2025

```javascript
// Log de auditoria obrigatório
const auditLog = {
  timestamp: new Date().toISOString(),
  processo_numero: $json.processo_numero,
  
  // Classificação de risco (Art. 9-11)
  classificacao_risco: "alto_risco", // sugestão de decisão = alto risco
  
  // Rastreabilidade (Art. 14)
  modelo_utilizado: "claude-sonnet-4-20250514",
  versao_prompt: "v2.0-jan2026",
  agente_selecionado: $json.selected_agent,
  confianca_roteamento: $json.routing_confidence,
  
  // Supervisão humana (Art. 19, 34)
  requer_revisao_magistrado: true,
  revisao_realizada: false,
  magistrado_responsavel: null,
  
  // Dados anonimizados (LGPD)
  dados_sensiveis_removidos: true,
  
  // Hash para integridade
  hash_input: crypto.createHash('sha256').update(JSON.stringify($json.firac_input)).digest('hex'),
  hash_output: crypto.createHash('sha256').update($json.minuta_gerada).digest('hex')
};

// Persistir em PostgreSQL/Supabase
return { auditLog };
```

---

## 8. CRONOGRAMA DE IMPLEMENTAÇÃO

### Fase 1 (Semanas 1-4): Infraestrutura Base
- [ ] Router semântico no fluxo existente
- [ ] Agent Bancário (maior volume)
- [ ] Agent Genérico (fallback)
- [ ] QA Check básico
- [ ] Audit logging

### Fase 2 (Semanas 5-8): Agentes Core
- [ ] Agent Consumidor/Danos Morais
- [ ] Agent Execução
- [ ] Agent Locação
- [ ] Refinamento de prompts

### Fase 3 (Semanas 9-12): Especialização
- [ ] Agent Possessórias
- [ ] Agent Erro Médico
- [ ] Agent Procedimentos Especiais
- [ ] Tools de jurisprudência integrados

### Fase 4 (Semanas 13-16): Enterprise
- [ ] Semantic router com embeddings
- [ ] Cache de respostas similares
- [ ] Dashboard de métricas
- [ ] A/B testing de prompts
- [ ] Compliance report CNJ

---

## 9. MÉTRICAS DE SUCESSO

| Métrica | Meta Fase 1 | Meta Produção |
|---------|-------------|---------------|
| Acurácia classificação | > 85% | > 95% |
| Taxa aprovação QA | > 70% | > 90% |
| Tempo médio geração | < 30s | < 15s |
| Taxa revisão humana | 40% | 15% |
| Redução tempo triagem | 30% | 60% |

---

## 10. PRÓXIMOS PASSOS IMEDIATOS

1. **Exportar prompts existentes** do Google Drive para integração
2. **Configurar Switch Node** com mapeamento de rotas
3. **Implementar Agent Bancário** como piloto
4. **Testar com 10 processos** de cada tipo
5. **Ajustar thresholds** de confiança baseado em resultados

---

*Documento gerado em Janeiro 2026 - Lex Intelligentia Judiciário v2.0*
*Compatível com Resolução CNJ 615/2025 (vigência desde julho/2025)*
