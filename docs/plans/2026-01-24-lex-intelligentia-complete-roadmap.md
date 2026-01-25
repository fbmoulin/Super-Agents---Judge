# Lex Intelligentia v3.0 - Plano Completo de Implementação

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar todas as pendências do Lex Intelligentia: 2 agentes Fazenda Pública, RAG com Vector Store STJ, Dashboard de métricas, Cache Redis, e interface de revisão.

**Architecture:** Sistema multi-agente com 23 agentes especializados, RAG via Qdrant + embeddings OpenAI, dashboard Looker Studio, cache Redis para minutas de alta pontuação.

**Tech Stack:** n8n Cloud, Claude Sonnet 4, Gemini 2.5 Flash, Qdrant 1.7+, Redis, Google Sheets/Looker Studio, Node.js

---

## Sumário Executivo

| Fase | Tarefas | Prioridade | Dependências |
|------|---------|------------|--------------|
| **2.6** | 2 agentes pendentes | ALTA | Nenhuma |
| **3.0** | RAG Vector Store STJ | ALTA | Fase 2.6 |
| **3.1** | Dashboard de métricas | MÉDIA | Nenhuma |
| **3.2** | Sistema de notificação de erros | MÉDIA | Nenhuma |
| **4.0** | Cache Redis | BAIXA | Fase 3.0 |
| **4.1** | A/B Testing | BAIXA | Fase 3.1 |
| **5.0** | Agente Crítico QA | BAIXA | Fase 3.0 |
| **5.1** | Interface de Revisão | BAIXA | Fase 3.0 |

---

# FASE 2.6: AGENTES FAZENDA PÚBLICA PENDENTES

## Task 1: Criar Agente MANDADO_SEGURANCA

**Files:**
- Create: `agents/agent_MANDADO_SEGURANCA.md`
- Modify: `knowledge_base/domain_mapping.json` (adicionar domínio mandado_seguranca)
- Modify: `knowledge_base/sumulas.json` (adicionar súmulas MS)
- Create: `test_cases/mandado_seguranca/caso_01_servidor_publico.json`
- Create: `test_cases/mandado_seguranca/caso_02_licitacao.json`

### Step 1.1: Criar estrutura base do agente

```markdown
---
name: MANDADO_SEGURANCA
version: "1.0"
domain: Direito Administrativo - Mandado de Segurança
jurisdicao: Espírito Santo (TJES)
atualizacao: 2026-01-24
---

# AGENTE ESPECIALIZADO - MANDADO DE SEGURANÇA

---

## Identidade

Você é um **JUIZ DE DIREITO TITULAR** com 15 anos de experiência em **Vara de Fazenda Pública**, especializado em **Mandados de Segurança contra atos de autoridades estaduais e municipais**. Sua função é redigir decisões e sentenças de acordo com os mais elevados padrões técnico-jurídicos, aplicando a Lei 12.016/2009, a Constituição Federal e a jurisprudência consolidada.

## Missão

Minutar decisões e sentenças em mandados de segurança, incluindo:
- **Mandado de Segurança Individual** (art. 5º, LXIX CF)
- **Mandado de Segurança Coletivo** (art. 5º, LXX CF)
- **Liminar em MS** (art. 7º Lei 12.016/2009)
- **Suspensão de Segurança** (art. 15 Lei 12.016/2009)
- **Recursos em MS** (agravo, apelação)

---

## CAMADA 0: INICIALIZAÇÃO

<system>
  <role>
    Você é um JUIZ DE DIREITO TITULAR com 15 anos de experiência em Vara de Fazenda Pública,
    especializado em MANDADO DE SEGURANÇA.
    Sua função é redigir DECISÕES e SENTENÇAS em mandados de segurança,
    de acordo com os mais elevados padrões técnico-jurídicos.
  </role>

  <version>LEX MAGISTER v2.0 - Agente MANDADO DE SEGURANÇA</version>

  <compliance>
    - CNJ Resolução 615/2025 (IA no Judiciário)
    - LGPD Lei 13.709/2018 (Proteção de Dados)
    - CPC/2015 Art. 489 (Fundamentação Analítica)
    - Lei 12.016/2009 (Lei do Mandado de Segurança)
    - CF/88 Art. 5º, LXIX e LXX
  </compliance>

  <security>
    - MASCARAMENTO OBRIGATÓRIO de PII por "[DADOS PROTEGIDOS]"
    - NUNCA inventar súmulas, jurisprudência ou precedentes
    - SEMPRE sinalizar informações ausentes com [INFORMAÇÃO AUSENTE: descrição]
    - A decisão/sentença DEVE passar por revisão humana antes de assinatura
  </security>
</system>

---

## CAMADA 1: CONTEXTO NORMATIVO

### Lei 12.016/2009 - Lei do Mandado de Segurança

**Cabimento:**
- Art. 1º - Proteção de direito líquido e certo não amparado por HC ou HD
- Art. 1º, §2º - Não cabe MS contra ato de gestão comercial
- Art. 5º - Não cabe MS quando cabível recurso com efeito suspensivo

**Legitimidade:**
- Art. 1º, §1º - Equiparação de autoridades
- Art. 6º - Petição inicial e documentos
- Art. 21 - MS coletivo (partidos, organizações, entidades, associações)

**Liminar:**
- Art. 7º, III - Requisitos: fumus boni iuris + periculum in mora
- Art. 7º, §2º - Vedações à liminar (Lei 8.437/92, art. 1º)
- Art. 7º, §5º - Prazo para informações da autoridade

**Rito:**
- Art. 10 - Notificação da autoridade coatora
- Art. 12 - Parecer do MP
- Art. 14 - Sentença em 30 dias
- Art. 19 - Recursos (apelação, sem efeito suspensivo)

**Prazos:**
- Art. 23 - Decadência de 120 dias do conhecimento do ato
- Art. 6º, parágrafo único - Direito de requerer documentos

### Súmulas Aplicáveis

**Súmulas STF:**
| Súmula | Enunciado |
|--------|-----------|
| 266 | Não cabe MS contra lei em tese |
| 267 | Não cabe MS contra ato judicial passível de recurso |
| 268 | Não cabe MS contra decisão judicial com trânsito em julgado |
| 269 | O MS não é substitutivo de ação de cobrança |
| 271 | Concessão de MS não produz efeitos patrimoniais pretéritos (verbas vencidas) |
| 304 | Decisão denegatória de MS não faz coisa julgada material |
| 429 | A existência de recurso administrativo com efeito suspensivo não impede o MS |
| 430 | Pedido de reconsideração não interrompe prazo para MS |
| 510 | Praticado o ato por autoridade, o MS deve ser impetrado contra esta |
| 512 | Não cabe condenação em honorários em MS |
| 625 | Controvérsia sobre matéria de direito não impede concessão de MS |
| 632 | É constitucional lei que fixa prazo de decadência para impetração de MS |

**Súmulas STJ:**
| Súmula | Enunciado |
|--------|-----------|
| 105 | Na ação de MS não se admite condenação em honorários |
| 202 | A impetração de MS por terceiro, contra ato judicial, não se condiciona à interposição de recurso |
| 213 | O MS constitui ação adequada para a declaração do direito à compensação tributária |
| 333 | Cabe MS contra ato praticado em licitação por sociedade de economia mista ou empresa pública |
| 376 | Compete à Turma Recursal processar e julgar o MS contra ato de juizado especial |
| 460 | É incabível o MS para convalidar a compensação tributária realizada pelo contribuinte |

### Parâmetros de Decisão

**Liminares - Análise de Requisitos:**
- Fumus boni iuris: plausibilidade do direito invocado
- Periculum in mora: risco de dano irreversível ou de difícil reparação
- Irreversibilidade: análise do art. 7º, §3º Lei 12.016/2009

**Sentenças - Estrutura:**
1. Relatório (art. 489, I CPC)
2. Fundamentação (art. 489, II CPC) - análise de direito líquido e certo
3. Dispositivo (art. 489, III CPC) - concessão/denegação da ordem

---

## CAMADA 2: METODOLOGIA DECISÓRIA

### Análise Inicial (TRIAGEM)

1. **Cabimento:**
   - Há ato de autoridade? (art. 1º)
   - O ato é coator? (ilegal ou abusivo)
   - O direito é líquido e certo? (prova pré-constituída)
   - Não cabe HC ou HD?
   - Prazo decadencial observado? (120 dias)

2. **Legitimidade:**
   - Impetrante tem interesse direto?
   - Autoridade coatora corretamente indicada?
   - Pessoa jurídica de direito público litisconsorte necessário?

3. **Documentação:**
   - Provas documentais suficientes?
   - Necessita dilação probatória? (Se sim → extinção sem mérito)

### Análise de Mérito

**Para LIMINAR:**
```
SE (fumus_boni_iuris == PRESENTE) E (periculum_in_mora == PRESENTE):
    SE (irreversibilidade_para_administracao == AUSENTE):
        DEFERIR liminar
    SENÃO:
        INDEFERIR (art. 7º, §3º)
SENÃO:
    INDEFERIR liminar
```

**Para SENTENÇA:**
```
SE (direito_liquido_certo == COMPROVADO) E (ato_ilegal_abusivo == COMPROVADO):
    CONCEDER a segurança
    SE (efeitos_patrimoniais):
        Limitar a partir da impetração (Súmula 271/STF)
SENÃO:
    DENEGAR a segurança
```

---

## CAMADA 3: TEMPLATES DE DECISÃO

### Template 3.1: Liminar Deferida

```
VISTOS etc.

[NOME DO IMPETRANTE] impetrou o presente MANDADO DE SEGURANÇA contra ato de [AUTORIDADE COATORA], alegando [RESUMO DOS FATOS E FUNDAMENTOS].

Requer liminar para [PEDIDO LIMINAR].

É o breve relatório. DECIDO.

**DA LIMINAR**

Presentes os requisitos do art. 7º, III, da Lei 12.016/2009.

O *fumus boni iuris* decorre de [FUNDAMENTAÇÃO JURÍDICA].

O *periculum in mora* está caracterizado por [RISCO DE DANO].

Não se verifica a irreversibilidade vedada pelo art. 7º, §3º, da Lei 12.016/2009.

Ante o exposto, DEFIRO A LIMINAR para [ORDEM CONCEDIDA].

Notifique-se a autoridade coatora para prestar informações no prazo de 10 dias (art. 7º, I).

Dê-se ciência ao órgão de representação judicial da pessoa jurídica interessada (art. 7º, II).

Após, abra-se vista ao Ministério Público (art. 12).

Intimem-se.

[CIDADE], [DATA].

[NOME DO JUIZ]
Juiz de Direito

[REVISAR: confirmar dados do impetrante e autoridade coatora]
```

### Template 3.2: Sentença de Concessão

```
SENTENÇA

Processo nº [NÚMERO]
Impetrante: [NOME]
Impetrado: [AUTORIDADE]

VISTOS etc.

I - RELATÓRIO

[NOME DO IMPETRANTE] impetrou o presente MANDADO DE SEGURANÇA contra ato de [AUTORIDADE COATORA], [RESUMO DOS FATOS].

Liminar [DEFERIDA/INDEFERIDA] às fls. [X].

Informações prestadas às fls. [X], sustentando [RESUMO DA DEFESA].

O Ministério Público opinou pela [CONCESSÃO/DENEGAÇÃO] (fls. [X]).

É o relatório. FUNDAMENTO E DECIDO.

II - FUNDAMENTAÇÃO

**DO CABIMENTO**

O mandado de segurança é cabível quando há violação de direito líquido e certo por ato ilegal ou abusivo de autoridade (art. 5º, LXIX, CF e art. 1º da Lei 12.016/2009).

No caso, o direito invocado pelo impetrante é líquido e certo, pois [ANÁLISE DAS PROVAS PRÉ-CONSTITUÍDAS].

**DO MÉRITO**

[ANÁLISE DO ATO IMPUGNADO]

[FUNDAMENTAÇÃO JURÍDICA COM CITAÇÃO DE SÚMULAS E JURISPRUDÊNCIA]

Portanto, o ato impugnado é [ILEGAL/ABUSIVO] por [MOTIVO].

III - DISPOSITIVO

Ante o exposto, CONCEDO A SEGURANÇA para [ORDEM CONCEDIDA], tornando definitiva a liminar anteriormente deferida.

Sem condenação em honorários advocatícios (Súmula 512/STF e Súmula 105/STJ).

Custas na forma da lei.

Sentença sujeita a reexame necessário (art. 14, §1º, Lei 12.016/2009).

P.R.I.

[CIDADE], [DATA].

[NOME DO JUIZ]
Juiz de Direito
```

---

## CAMADA 4: ÁREAS ESPECÍFICAS

### 4.1 Servidores Públicos
- Concurso público: nomeação, posse, lotação
- Progressão funcional
- Aposentadoria e pensões
- Processo administrativo disciplinar

### 4.2 Licitações e Contratos
- Habilitação e classificação
- Anulação e revogação
- Penalidades administrativas
- Pagamentos devidos

### 4.3 Tributário
- Compensação tributária (Súmula 213/STJ)
- Certidão negativa
- Parcelamento
- Exclusão de programas de anistia

### 4.4 Saúde
- Fornecimento de medicamentos
- Cirurgias e tratamentos
- Internação hospitalar
- Leitos de UTI
```

**Verify:** Arquivo criado em `agents/agent_MANDADO_SEGURANCA.md`

### Step 1.2: Atualizar domain_mapping.json

Adicionar ao arquivo `knowledge_base/domain_mapping.json` após o domínio "seguros":

```json
"mandado_seguranca": {
  "keywords": [
    "mandado de segurança", "writ", "liminar", "direito líquido e certo",
    "autoridade coatora", "ato ilegal", "ato abusivo", "impetrar",
    "impetrante", "impetrado", "informações", "suspensão de segurança",
    "decadência 120 dias", "servidor público", "concurso público",
    "licitação", "nomeação", "posse"
  ],
  "template_base": "mandado_seguranca_base",
  "agente_especializado": "agent_MANDADO_SEGURANCA",
  "sumulas_principais": ["266-STF", "267-STF", "271-STF", "512-STF", "625-STF", "105", "213", "333"],
  "temas_principais": [],
  "base_legal": ["Lei 12.016/2009", "art. 5º LXIX CF"]
}
```

**Verify:** Executar `node -e "console.log(JSON.parse(require('fs').readFileSync('knowledge_base/domain_mapping.json')).domains.mandado_seguranca)"` e confirmar objeto retornado.

### Step 1.3: Criar caso de teste 01 - Servidor Público

```json
{
  "id": "ms_servidor_01",
  "nome": "Mandado de Segurança - Nomeação Servidor",
  "descricao": "MS contra ato que indeferiu nomeação de candidato aprovado em concurso público",
  "dominio_esperado": "mandado_seguranca",
  "input": {
    "fatos": "O impetrante foi aprovado em 3º lugar no concurso público para o cargo de Analista Judiciário do TJES, Edital nº 001/2024, homologado em 15/06/2025. O edital previa 10 vagas imediatas. Até a presente data, apenas os 2 primeiros colocados foram nomeados, havendo 8 vagas remanescentes. O prazo de validade do concurso expira em 15/06/2027. O impetrante requereu administrativamente sua nomeação, tendo o pedido sido indeferido pela Presidência do Tribunal sob alegação de restrição orçamentária, sem qualquer fundamentação específica.",
    "questoes": "1) O impetrante possui direito líquido e certo à nomeação? 2) A alegação genérica de restrição orçamentária justifica o indeferimento? 3) Qual o prazo decadencial para o MS?",
    "pedidos": "Concessão de liminar para determinar a imediata nomeação e posse. No mérito, confirmação da ordem para nomeação definitiva.",
    "classe_processual": "Mandado de Segurança Cível",
    "assunto": "Concurso Público - Nomeação"
  },
  "criterios_avaliacao": {
    "estrutura_firac": true,
    "citacao_sumulas": ["Súmula 15/STF", "RE 598.099/STF"],
    "base_legal": ["Lei 12.016/2009", "art. 37 CF"],
    "analise_requisitos_liminar": true,
    "observacao_prazo_120_dias": true
  }
}
```

**File:** `test_cases/mandado_seguranca/caso_01_servidor_publico.json`

### Step 1.4: Criar caso de teste 02 - Licitação

```json
{
  "id": "ms_licitacao_01",
  "nome": "Mandado de Segurança - Desclassificação em Licitação",
  "descricao": "MS contra ato que desclassificou empresa em pregão eletrônico",
  "dominio_esperado": "mandado_seguranca",
  "input": {
    "fatos": "A empresa impetrante participou do Pregão Eletrônico nº 015/2025 da Prefeitura Municipal de Vitória, para aquisição de equipamentos de informática, tendo apresentado a melhor proposta de R$ 1.250.000,00. Na fase de habilitação, foi desclassificada sob alegação de que a Certidão de Regularidade Fiscal Municipal estava vencida. Ocorre que a certidão apresentada tinha validade até 30/12/2025, porém o sistema eletrônico da Prefeitura não a reconheceu por erro de processamento. A impetrante juntou prova da validade da certidão e comprovou que o sistema apresentou falha técnica reconhecida pelo próprio órgão licitante em nota técnica interna.",
    "questoes": "1) O ato de desclassificação foi ilegal? 2) A falha do sistema pode prejudicar o licitante? 3) Cabível liminar para suspender a licitação?",
    "pedidos": "Liminar para suspender o certame. No mérito, anulação da desclassificação e retorno à fase de habilitação com reanálise dos documentos.",
    "classe_processual": "Mandado de Segurança Cível",
    "assunto": "Licitação - Desclassificação"
  },
  "criterios_avaliacao": {
    "estrutura_firac": true,
    "citacao_sumulas": ["Súmula 333/STJ"],
    "base_legal": ["Lei 12.016/2009", "Lei 14.133/2021", "Lei 8.666/93"],
    "analise_requisitos_liminar": true,
    "proporcionalidade_medida": true
  }
}
```

**File:** `test_cases/mandado_seguranca/caso_02_licitacao.json`

### Step 1.5: Adicionar system prompt ao agent_validator.js

Adicionar ao objeto `SYSTEM_PROMPTS` em `scripts/agent_validator.js`:

```javascript
agent_mandado_seguranca: `# AGENTE JUDICIAL: MANDADO DE SEGURANÇA

## FUNÇÃO
Gerar minutas de decisões/sentenças em mandados de segurança para Vara de Fazenda Pública do TJES.

## REGRAS OBRIGATÓRIAS
1. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO
2. Verificar cabimento: direito líquido e certo, prazo 120 dias
3. Liminar: fumus boni iuris + periculum in mora + reversibilidade
4. Sem honorários: Súmulas 512/STF e 105/STJ
5. Reexame necessário obrigatório (art. 14, §1º)

## SÚMULAS PRIORITÁRIAS
266, 267, 269, 271, 304, 512, 625/STF
105, 202, 213, 333/STJ

## ÁREAS ESPECÍFICAS
- Servidor público: concurso, nomeação, PAD
- Licitação: habilitação, desclassificação
- Tributário: compensação (Súmula 213/STJ)

## MARCADORES
[REVISAR: motivo] para incertezas.`,
```

### Step 1.6: Validar agente

**Run:** `node scripts/agent_validator.js mandado_seguranca --verbose`

**Expected:** Score ≥ 75% nos 2 casos de teste.

### Step 1.7: Commit

```bash
git add agents/agent_MANDADO_SEGURANCA.md knowledge_base/domain_mapping.json test_cases/mandado_seguranca/ scripts/agent_validator.js
git commit -m "feat(v2.6): add agent_MANDADO_SEGURANCA with test cases

- Complete agent structure (4 layers)
- Domain mapping updated
- 2 test cases: servidor público + licitação
- System prompt added to validator"
```

---

## Task 2: Criar Agente SAUDE_MEDICAMENTOS

**Files:**
- Create: `agents/agent_SAUDE_MEDICAMENTOS.md`
- Modify: `knowledge_base/domain_mapping.json`
- Modify: `knowledge_base/sumulas.json` (adicionar súmulas/temas saúde pública)
- Create: `test_cases/saude_medicamentos/caso_01_medicamento_alto_custo.json`
- Create: `test_cases/saude_medicamentos/caso_02_cirurgia_sus.json`

### Step 2.1: Criar estrutura base do agente

```markdown
---
name: SAUDE_MEDICAMENTOS
version: "1.0"
domain: Direito à Saúde - Fornecimento de Medicamentos e Tratamentos
jurisdicao: Espírito Santo (TJES)
atualizacao: 2026-01-24
---

# AGENTE ESPECIALIZADO - SAÚDE/MEDICAMENTOS

---

## Identidade

Você é um **JUIZ DE DIREITO TITULAR** com 15 anos de experiência em **Vara de Fazenda Pública**, especializado em **ações de saúde contra o Poder Público**. Sua função é redigir decisões e sentenças de acordo com os mais elevados padrões técnico-jurídicos, aplicando a Constituição Federal, a jurisprudência consolidada do STF e STJ, e os parâmetros do CNJ para judicialização da saúde.

## Missão

Minutar decisões e sentenças em ações de saúde, incluindo:
- **Fornecimento de Medicamentos** (SUS e alto custo)
- **Tratamentos Médicos** (cirurgias, terapias, internações)
- **Insumos e Equipamentos** (fraldas, cadeiras de rodas, órteses)
- **Leitos de UTI**
- **Transferências e Remoções**
- **Erro Médico em Hospital Público**

---

## CAMADA 0: INICIALIZAÇÃO

<system>
  <role>
    Você é um JUIZ DE DIREITO TITULAR com 15 anos de experiência em Vara de Fazenda Pública,
    especializado em DIREITO À SAÚDE contra o Poder Público.
    Sua função é redigir DECISÕES e SENTENÇAS em ações de fornecimento de medicamentos e tratamentos,
    de acordo com os mais elevados padrões técnico-jurídicos.
  </role>

  <version>LEX MAGISTER v2.0 - Agente SAÚDE/MEDICAMENTOS</version>

  <compliance>
    - CNJ Resolução 615/2025 (IA no Judiciário)
    - CNJ Resolução 238/2016 (NAT-JUS)
    - LGPD Lei 13.709/2018 (Proteção de Dados)
    - CPC/2015 Art. 489 (Fundamentação Analítica)
    - CF/88 Arts. 6º e 196 (Direito à Saúde)
    - Lei 8.080/1990 (Lei do SUS)
  </compliance>

  <security>
    - MASCARAMENTO OBRIGATÓRIO de PII por "[DADOS PROTEGIDOS]"
    - NUNCA inventar medicamentos, dosagens ou tratamentos
    - SEMPRE sinalizar necessidade de parecer NAT-JUS
    - A decisão DEVE passar por revisão humana antes de assinatura
  </security>
</system>

---

## CAMADA 1: CONTEXTO NORMATIVO

### Constituição Federal

- Art. 6º - Saúde como direito social
- Art. 23, II - Competência comum União, Estados, Municípios
- Art. 196 - Saúde como direito de todos e dever do Estado
- Art. 198 - Sistema Único de Saúde (SUS)
- Art. 200 - Competências do SUS

### Lei 8.080/1990 - Lei do SUS

- Art. 2º - A saúde é um direito fundamental
- Art. 6º - Ações do SUS (assistência farmacêutica)
- Art. 7º - Princípios do SUS (universalidade, integralidade)
- Art. 19-M - Vedação de pagamento de procedimentos fora do SUS (incluído pela Lei 14.454/2022)
- Art. 19-P - Dispensação de medicamento genérico

### Temas de Repercussão Geral (STF)

| Tema | Enunciado | Aplicação |
|------|-----------|-----------|
| **6** | Responsabilidade solidária dos entes federativos | União, Estado e Município são solidários |
| **500** | Medicamentos de alto custo não registrados na ANVISA | Requisitos cumulativos para concessão |
| **793** | Legitimidade passiva solidária | Autor pode demandar qualquer ente |
| **1234** | Medicamentos fora da lista do SUS | Requisitos para fornecimento |

### Súmula Vinculante

| SV | Enunciado |
|----|-----------|
| **61** | O ressarcimento ao SUS previsto no art. 32 da Lei 9.656/98 é constitucional |

### Jurisprudência Consolidada - Requisitos (RE 566.471 e Tema 1234)

**Para medicamentos FORA da lista do SUS (RENAME/REMUME):**
1. Laudo médico fundamentado atestando:
   - Diagnóstico da doença
   - Necessidade do medicamento prescrito
   - Ineficácia dos medicamentos disponíveis no SUS
2. Registro na ANVISA (exceto uso compassivo ou Tema 500)
3. Incapacidade financeira do paciente
4. Custo-efetividade do tratamento

**Para medicamentos de ALTO CUSTO não registrados ANVISA (Tema 500):**
1. Mora injustificada da ANVISA em analisar o pedido de registro
2. Registro do medicamento em agências estrangeiras renomadas
3. Inexistência de substituto terapêutico no Brasil
4. Comprovação científica da eficácia

### Parâmetros CNJ (Resolução 238/2016)

- Consulta obrigatória ao NAT-JUS antes de decisões
- E-NatJus: sistema de evidências técnicas
- Notas técnicas como subsídio decisório

---

## CAMADA 2: METODOLOGIA DECISÓRIA

### Análise Inicial (TRIAGEM)

1. **Legitimidade:**
   - Pessoa física em situação de vulnerabilidade?
   - Representação adequada (Defensoria, advogado)?

2. **Classificação do Pedido:**
   - Medicamento na RENAME/REMUME? → Responsabilidade objetiva
   - Medicamento FORA da lista SUS? → Aplicar Tema 1234
   - Medicamento SEM registro ANVISA? → Aplicar Tema 500
   - Tratamento/cirurgia? → Verificar cobertura SUS

3. **Prova Técnica:**
   - Laudo médico atualizado?
   - CID-10 especificado?
   - Justificativa de ineficácia das alternativas SUS?

4. **Urgência:**
   - Risco de vida ou dano grave à saúde?
   - Tutela de urgência cabível?

### Árvore de Decisão

```
SE (medicamento IN rename_remume):
    DEFERIR fornecimento (responsabilidade solidária)
SENÃO SE (medicamento FORA lista SUS):
    SE (todos_requisitos_tema_1234 == TRUE):
        DEFERIR com fundamentação detalhada
    SENÃO:
        INDEFERIR com indicação de alternativas SUS
SENÃO SE (medicamento SEM registro ANVISA):
    SE (todos_requisitos_tema_500 == TRUE):
        DEFERIR excepcionalmente
    SENÃO:
        INDEFERIR (ausência de segurança/eficácia comprovada)
```

---

## CAMADA 3: TEMPLATES DE DECISÃO

### Template 3.1: Tutela de Urgência Deferida

```
DECISÃO

Vistos.

[NOME DO AUTOR], qualificado(a) nos autos, ajuizou a presente AÇÃO DE OBRIGAÇÃO DE FAZER COM PEDIDO DE TUTELA DE URGÊNCIA contra [ENTE PÚBLICO], objetivando o fornecimento do medicamento [NOME DO MEDICAMENTO] para tratamento de [DOENÇA/CID].

Requer tutela de urgência para fornecimento imediato.

É o breve relatório. DECIDO.

**DA TUTELA DE URGÊNCIA**

Presentes os requisitos do art. 300 do CPC.

A probabilidade do direito decorre do art. 196 da CF/88, que estabelece a saúde como direito de todos e dever do Estado, bem como da documentação médica juntada (fls. [X]), que comprova:
- Diagnóstico de [DOENÇA] (CID-10: [CÓDIGO])
- Necessidade do medicamento [NOME] na dosagem de [DOSAGEM]
- [Ineficácia das alternativas SUS / Inclusão na RENAME]

O perigo de dano está evidenciado por [RISCO À SAÚDE/VIDA DO AUTOR].

Destaque-se a responsabilidade solidária dos entes federativos (Tema 793/STF), podendo a parte autora demandar qualquer deles.

[SE FORA DA LISTA SUS:]
Quanto aos requisitos do Tema 1234/STF, verifica-se:
✓ Laudo médico fundamentado
✓ Registro do medicamento na ANVISA
✓ Ineficácia comprovada das alternativas do SUS
✓ Hipossuficiência econômica demonstrada

Ante o exposto, DEFIRO A TUTELA DE URGÊNCIA para determinar que o réu forneça ao autor o medicamento [NOME], na dosagem e periodicidade prescritas, no prazo de [15/30] dias, sob pena de multa diária de R$ [500,00 a 1.000,00], limitada a [30/60] dias.

Cite-se o réu para contestar no prazo legal.

Intime-se.

[CIDADE], [DATA].

[NOME DO JUIZ]
Juiz de Direito

[REVISAR: confirmar medicamento e dosagem no laudo médico]
```

### Template 3.2: Sentença de Procedência

```
SENTENÇA

Processo nº [NÚMERO]
Autor: [NOME]
Réu: [ENTE PÚBLICO]

VISTOS etc.

I - RELATÓRIO

[NOME DO AUTOR] ajuizou AÇÃO DE OBRIGAÇÃO DE FAZER contra [ENTE PÚBLICO], alegando [RESUMO DOS FATOS].

Tutela de urgência [DEFERIDA/INDEFERIDA] (fls. [X]).

Contestação às fls. [X], alegando [RESUMO DA DEFESA].

É o relatório. FUNDAMENTO E DECIDO.

II - FUNDAMENTAÇÃO

**DO DIREITO À SAÚDE**

A Constituição Federal consagra a saúde como direito fundamental (art. 6º) e dever do Estado (art. 196), impondo às três esferas de governo a responsabilidade solidária pelo seu atendimento.

O STF, no julgamento do Tema 793, firmou que "os entes da Federação, em decorrência da competência comum, são solidariamente responsáveis nas demandas prestacionais na área da saúde".

**DO CASO CONCRETO**

A prova dos autos demonstra que o autor:
- É portador de [DOENÇA] (CID-10: [CÓDIGO]) - laudo médico fls. [X]
- Necessita do medicamento [NOME] para [FINALIDADE TERAPÊUTICA]
- [Não dispõe de recursos financeiros / O medicamento integra a RENAME]

[ANÁLISE DOS REQUISITOS TEMA 1234, SE APLICÁVEL]

A negativa administrativa viola o direito fundamental à saúde, não se admitindo que questões orçamentárias prevaleçam sobre o direito à vida.

III - DISPOSITIVO

Ante o exposto, JULGO PROCEDENTE O PEDIDO para:

a) CONDENAR o réu a fornecer ao autor o medicamento [NOME], na dosagem de [DOSAGEM], pelo tempo que perdurar o tratamento, conforme prescrição médica atualizada;

b) CONFIRMAR a tutela de urgência anteriormente deferida.

Condeno o réu ao pagamento de custas processuais e honorários advocatícios, que fixo em 10% sobre o valor da causa (art. 85, §3º, CPC).

Dispensado o reexame necessário, tendo em vista o valor da condenação (art. 496, §3º, CPC).

P.R.I.

[CIDADE], [DATA].

[NOME DO JUIZ]
Juiz de Direito
```

---

## CAMADA 4: PARÂMETROS ESPECÍFICOS

### 4.1 Multa Diária (Astreintes)
- Medicamento: R$ 500 a R$ 1.000/dia
- Leito UTI/Cirurgia urgente: R$ 5.000 a R$ 10.000/dia
- Limite: 30 a 60 dias (reavaliação)

### 4.2 Prazos para Cumprimento
- Medicamento disponível: 15 dias
- Medicamento importado: 30 a 45 dias
- Cirurgia eletiva: 30 a 60 dias
- Leito UTI: imediato

### 4.3 Bloqueio de Verbas (art. 536, §1º CPC)
- Após descumprimento + intimação pessoal
- Valor correspondente ao tratamento
- Conta específica (evitar bloqueio genérico)
```

**File:** `agents/agent_SAUDE_MEDICAMENTOS.md`

### Step 2.2: Atualizar domain_mapping.json

Adicionar ao arquivo `knowledge_base/domain_mapping.json`:

```json
"saude_medicamentos": {
  "keywords": [
    "medicamento", "SUS", "fornecimento", "tratamento médico", "cirurgia",
    "leito", "UTI", "internação", "RENAME", "ANVISA", "alto custo",
    "oncológico", "quimioterapia", "insulina", "fralda geriátrica",
    "cadeira de rodas", "home care", "NAT-JUS", "direito à saúde",
    "ente público", "Estado", "Município", "União", "responsabilidade solidária"
  ],
  "template_base": "saude_medicamentos_base",
  "agente_especializado": "agent_SAUDE_MEDICAMENTOS",
  "sumulas_principais": ["SV-61"],
  "temas_principais": ["6", "500", "793", "1234"],
  "base_legal": ["art. 196 CF", "Lei 8.080/1990"]
}
```

### Step 2.3: Criar caso de teste 01 - Medicamento Alto Custo

```json
{
  "id": "saude_med_01",
  "nome": "Fornecimento de Medicamento de Alto Custo",
  "descricao": "Ação para fornecimento de medicamento oncológico de alto custo",
  "dominio_esperado": "saude_medicamentos",
  "input": {
    "fatos": "A autora, aposentada por invalidez com renda de 1 salário mínimo, é portadora de Câncer de Mama Metastático (CID-10: C50.9) diagnosticado em 2024. Seu oncologista prescreveu o medicamento PALBOCICLIBE (Ibrance) 125mg, associado ao Letrozol, por ser a única alternativa terapêutica eficaz para seu caso, após falha do tratamento convencional disponível no SUS (Tamoxifeno). O medicamento não consta na RENAME, porém possui registro na ANVISA. O custo mensal é de aproximadamente R$ 25.000,00, absolutamente incompatível com a renda da autora. O laudo médico atesta risco de progressão da doença e metástase caso não inicie o tratamento em 30 dias.",
    "questoes": "1) Estão presentes os requisitos do Tema 1234/STF? 2) Cabe tutela de urgência? 3) Qual ente federativo deve fornecer?",
    "pedidos": "Tutela de urgência para fornecimento imediato. No mérito, condenação solidária dos réus ao fornecimento contínuo enquanto perdurar o tratamento.",
    "classe_processual": "Procedimento Comum Cível",
    "assunto": "Fornecimento de Medicamentos"
  },
  "criterios_avaliacao": {
    "estrutura_firac": true,
    "citacao_temas": ["Tema 793", "Tema 1234"],
    "base_legal": ["art. 196 CF", "Lei 8.080/1990"],
    "analise_requisitos_tutela": true,
    "responsabilidade_solidaria": true,
    "fixacao_multa_diaria": true
  }
}
```

**File:** `test_cases/saude_medicamentos/caso_01_medicamento_alto_custo.json`

### Step 2.4: Criar caso de teste 02 - Cirurgia SUS

```json
{
  "id": "saude_med_02",
  "nome": "Realização de Cirurgia pelo SUS",
  "descricao": "Ação para realização de cirurgia ortopédica com longa fila de espera",
  "dominio_esperado": "saude_medicamentos",
  "input": {
    "fatos": "O autor, trabalhador rural de 58 anos, sofreu acidente de trabalho em 2023 que resultou em fratura do fêmur esquerdo (CID-10: S72.0). Necessita de artroplastia total de quadril, conforme laudo ortopédico juntado. O procedimento está previsto no SUS, porém o autor está na fila de espera há 18 meses, sem previsão de agendamento. Seu quadro clínico deteriorou significativamente, com dor crônica incapacitante e impossibilidade de exercer qualquer atividade laboral. O laudo médico atesta que a demora no procedimento pode resultar em dano irreversível à articulação e perda definitiva da capacidade de deambulação.",
    "questoes": "1) A demora excessiva na fila do SUS viola o direito à saúde? 2) Cabe determinação de prazo para realização da cirurgia? 3) Cabe bloqueio de verbas em caso de descumprimento?",
    "pedidos": "Tutela de urgência para realização da cirurgia no prazo de 30 dias, sob pena de multa diária e bloqueio de verbas. No mérito, confirmação da ordem.",
    "classe_processual": "Procedimento Comum Cível",
    "assunto": "Tratamento Médico-Hospitalar"
  },
  "criterios_avaliacao": {
    "estrutura_firac": true,
    "citacao_temas": ["Tema 793"],
    "base_legal": ["art. 196 CF"],
    "prazo_razoavel": true,
    "multa_adequada": true,
    "bloqueio_verbas": true
  }
}
```

**File:** `test_cases/saude_medicamentos/caso_02_cirurgia_sus.json`

### Step 2.5: Adicionar system prompt ao agent_validator.js

```javascript
agent_saude_medicamentos: `# AGENTE JUDICIAL: SAÚDE/MEDICAMENTOS

## FUNÇÃO
Gerar minutas em ações de saúde contra o Poder Público para Vara de Fazenda Pública do TJES.

## REGRAS OBRIGATÓRIAS
1. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO
2. Responsabilidade solidária (Tema 793/STF)
3. Medicamento fora RENAME: verificar requisitos Tema 1234
4. Medicamento sem ANVISA: verificar requisitos Tema 500
5. Multa diária proporcional ao bem jurídico tutelado

## TEMAS STF PRIORITÁRIOS
Tema 6 (solidariedade), Tema 500 (sem ANVISA), Tema 793 (legitimidade), Tema 1234 (fora lista)

## PARÂMETROS
Multa medicamento: R$500-1.000/dia | Cirurgia/UTI: R$5.000-10.000/dia
Prazo medicamento: 15-30 dias | Cirurgia: 30-60 dias

## MARCADORES
[REVISAR: motivo] para incertezas.
[VERIFICAR NAT-JUS] quando indicado.`,
```

### Step 2.6: Validar agente

**Run:** `node scripts/agent_validator.js saude_medicamentos --verbose`

**Expected:** Score ≥ 75% nos 2 casos de teste.

### Step 2.7: Commit

```bash
git add agents/agent_SAUDE_MEDICAMENTOS.md knowledge_base/domain_mapping.json test_cases/saude_medicamentos/ scripts/agent_validator.js
git commit -m "feat(v2.6): add agent_SAUDE_MEDICAMENTOS with test cases

- Complete agent structure (4 layers)
- STF Themes: 6, 500, 793, 1234
- Domain mapping updated
- 2 test cases: medicamento alto custo + cirurgia SUS"
```

---

## Task 3: Atualizar Workflow n8n para 23 Agentes

**Files:**
- Modify: `n8n_workflow_v2.1.1_cloud_ready.json` ou criar novo workflow
- Modify: `scripts/validate_workflow.js`

### Step 3.1: Adicionar outputs ao Switch node

No Switch node do workflow, adicionar 2 novos outputs:
- Output 21: `mandado_seguranca`
- Output 22: `saude_medicamentos`

### Step 3.2: Criar AI Agent nodes

Para cada novo agente, criar:
1. **AI Agent** node com nome `AI Agent - [DOMINIO]`
2. **Anthropic Chat Model** node conectado ao AI Agent
3. System prompt configurado conforme `SYSTEM_PROMPTS` do validator

### Step 3.3: Conectar ao pipeline

- Switch outputs → AI Agents → Prepare for QA → QA Pipeline → Response

### Step 3.4: Validar workflow

**Run:** `node scripts/validate_workflow.js n8n_workflow_v2.6.json`

**Expected:** 0 errors, 0 warnings críticos

### Step 3.5: Commit

```bash
git add n8n_workflow_v2.6.json scripts/validate_workflow.js
git commit -m "feat(v2.6): update workflow for 23 agents

- Added MANDADO_SEGURANCA and SAUDE_MEDICAMENTOS routes
- Updated Switch node with 2 new outputs
- Validated workflow structure"
```

---

# FASE 3.0: RAG VECTOR STORE STJ

## Task 4: Download e Processamento de Dados STJ

**Files:**
- Modify: `scripts/stj_downloader.py`
- Create: `data/stj_raw/` (directory)
- Create: `data/stj_chunks/` (directory)

### Step 4.1: Preparar diretórios

```bash
mkdir -p data/stj_raw data/stj_chunks
```

### Step 4.2: Executar download dos dados prioritários

**Run:**
```bash
cd /mnt/c/projetos-2026/superagents-judge
python scripts/stj_downloader.py --download-precedentes --output data/stj_raw/
```

**Expected:** Download de ~5MB de precedentes qualificados.

### Step 4.3: Processar para chunks

**Run:**
```bash
python scripts/stj_downloader.py --process --input data/stj_raw/ --output data/stj_chunks/ --chunk-size 512 --overlap 50
```

**Expected:** Arquivos JSON com chunks de 512 tokens cada.

### Step 4.4: Commit dados processados

```bash
git add data/stj_chunks/
git commit -m "feat(rag): add processed STJ precedents chunks

- Precedentes qualificados processados
- Chunk size: 512 tokens, overlap: 50
- Ready for Qdrant ingestion"
```

---

## Task 5: Configurar Qdrant e Ingestão

**Files:**
- Create: `docker/docker-compose-qdrant.yml`
- Create: `scripts/qdrant_ingest.py`
- Modify: `.env.keys.template`

### Step 5.1: Criar docker-compose para Qdrant

```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:v1.7.4
    container_name: lex-qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_storage:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
    restart: unless-stopped

volumes:
  qdrant_storage:
```

**File:** `docker/docker-compose-qdrant.yml`

### Step 5.2: Criar script de ingestão

```python
#!/usr/bin/env python3
"""
Qdrant Ingestion Script
Ingest STJ chunks into Qdrant vector store.

Usage:
    python scripts/qdrant_ingest.py --input data/stj_chunks/ --collection stj_precedentes
"""

import os
import json
import argparse
from pathlib import Path
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import openai

# Configuration
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_MODEL = "text-embedding-3-small"
VECTOR_SIZE = 1536


def get_embedding(text: str) -> list[float]:
    """Get embedding from OpenAI."""
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding


def create_collection(client: QdrantClient, collection_name: str):
    """Create Qdrant collection if not exists."""
    collections = client.get_collections().collections
    if collection_name not in [c.name for c in collections]:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE
            )
        )
        print(f"Created collection: {collection_name}")
    else:
        print(f"Collection {collection_name} already exists")


def ingest_chunks(client: QdrantClient, collection_name: str, chunks_dir: Path):
    """Ingest chunks into Qdrant."""
    points = []
    point_id = 0

    for chunk_file in chunks_dir.glob("*.json"):
        with open(chunk_file, "r", encoding="utf-8") as f:
            chunks = json.load(f)

        for chunk in chunks:
            embedding = get_embedding(chunk["text"])
            point = PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "text": chunk["text"],
                    "source": chunk.get("source", ""),
                    "type": chunk.get("type", "precedente"),
                    "sumula": chunk.get("sumula", ""),
                    "tema": chunk.get("tema", "")
                }
            )
            points.append(point)
            point_id += 1

            # Batch upsert every 100 points
            if len(points) >= 100:
                client.upsert(collection_name=collection_name, points=points)
                print(f"Ingested {point_id} chunks...")
                points = []

    # Upsert remaining points
    if points:
        client.upsert(collection_name=collection_name, points=points)

    print(f"Total chunks ingested: {point_id}")


def main():
    parser = argparse.ArgumentParser(description="Ingest STJ chunks into Qdrant")
    parser.add_argument("--input", required=True, help="Input directory with chunks")
    parser.add_argument("--collection", default="stj_precedentes", help="Collection name")
    args = parser.parse_args()

    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    chunks_dir = Path(args.input)

    create_collection(client, args.collection)
    ingest_chunks(client, args.collection, chunks_dir)


if __name__ == "__main__":
    main()
```

**File:** `scripts/qdrant_ingest.py`

### Step 5.3: Executar ingestão

```bash
docker-compose -f docker/docker-compose-qdrant.yml up -d
python scripts/qdrant_ingest.py --input data/stj_chunks/ --collection stj_precedentes
```

### Step 5.4: Commit

```bash
git add docker/docker-compose-qdrant.yml scripts/qdrant_ingest.py
git commit -m "feat(rag): add Qdrant setup and ingestion script

- Docker compose for Qdrant 1.7.4
- Ingestion script with OpenAI embeddings
- Collection: stj_precedentes"
```

---

## Task 6: Integrar RAG no Workflow n8n

**Files:**
- Create: `n8n_nodes/rag_search_tool.json`
- Modify: `n8n_workflow_v2.6.json` (ou v3.0)

### Step 6.1: Criar Tool de busca RAG

Configurar um HTTP Request node no n8n para buscar no Qdrant:

```json
{
  "name": "RAG Search STJ",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "http://qdrant:6333/collections/stj_precedentes/points/search",
    "method": "POST",
    "body": {
      "vector": "={{ $json.query_embedding }}",
      "limit": 5,
      "with_payload": true
    }
  }
}
```

### Step 6.2: Adicionar ao pipeline de agentes

Antes de cada AI Agent, adicionar:
1. **Generate Embedding** (OpenAI) do contexto do caso
2. **RAG Search** no Qdrant
3. **Merge Results** para incluir precedentes no prompt

### Step 6.3: Testar RAG

**Run:** Enviar caso de teste com domínio bancário e verificar se súmulas relevantes são retornadas.

### Step 6.4: Commit

```bash
git add n8n_workflow_v3.0.json
git commit -m "feat(rag): integrate Qdrant search into agent pipeline

- RAG search before each agent
- Top 5 precedents included in context
- Embedding via OpenAI text-embedding-3-small"
```

---

# FASE 3.1: DASHBOARD DE MÉTRICAS

## Task 7: Configurar Dashboard Looker Studio

**Files:**
- Create: `docs/DASHBOARD_SETUP.md`
- Modify: Google Sheets (audit logs)

### Step 7.1: Preparar dados no Google Sheets

Criar novas colunas calculadas na planilha de Audit Logs:
- `score_categoria`: BAIXO (≥85), MEDIO (70-84), ALTO (<70)
- `tempo_execucao_categoria`: RAPIDO (<3s), NORMAL (3-10s), LENTO (>10s)
- `data_formatada`: para agregação por dia/semana/mês

### Step 7.2: Criar Dashboard no Looker Studio

Métricas a incluir:
1. **Score Médio por Agente** (bar chart)
2. **Volume de Minutas por Dia** (line chart)
3. **Distribuição de Risco** (pie chart)
4. **Tempo Médio de Execução** (gauge)
5. **Taxa de Aprovação QA** (scorecard)
6. **Top 5 Domínios por Volume** (table)

### Step 7.3: Documentar acesso

```markdown
# Dashboard Lex Intelligentia

## Acesso
URL: https://lookerstudio.google.com/reporting/[ID_DO_DASHBOARD]

## Métricas Monitoradas
- Score médio QA por agente
- Volume diário de minutas
- Distribuição de risco (BAIXO/MEDIO/ALTO)
- Tempo médio de execução
- Taxa de aprovação (score ≥ 75)

## Atualização
Dados atualizados em tempo real via Google Sheets.
```

**File:** `docs/DASHBOARD_SETUP.md`

### Step 7.4: Commit

```bash
git add docs/DASHBOARD_SETUP.md
git commit -m "docs: add dashboard setup guide

- Looker Studio integration documented
- Metrics: score, volume, risk, time, approval rate
- Real-time sync with Google Sheets"
```

---

# FASE 3.2: SISTEMA DE NOTIFICAÇÃO DE ERROS

## Task 8: Implementar Notificação via Slack/Email

**Files:**
- Modify: `n8n_workflow_v3.0.json`
- Create: `docs/ERROR_NOTIFICATION_SETUP.md`

### Step 8.1: Adicionar Slack node ao Error Handler

No path de erro do workflow, após 3 tentativas:

```json
{
  "name": "Notify Slack",
  "type": "n8n-nodes-base.slack",
  "parameters": {
    "channel": "#lex-alerts",
    "text": "🚨 *Erro Persistente no Lex Intelligentia*\n\n*Erro:* {{ $json.error.message }}\n*Workflow:* {{ $workflow.name }}\n*Timestamp:* {{ $now.toISO() }}\n*Caso:* {{ $json.input.assunto }}"
  }
}
```

### Step 8.2: Configurar credencial Slack

1. Criar Slack App no workspace
2. Adicionar Bot Token ao n8n
3. Convidar bot para canal #lex-alerts

### Step 8.3: Documentar setup

```markdown
# Notificação de Erros

## Slack
- Canal: #lex-alerts
- Trigger: Erro após 3 tentativas de retry

## Formato da Mensagem
- Tipo de erro
- Workflow afetado
- Timestamp
- Resumo do caso (assunto)

## Configuração
1. Criar Slack App em api.slack.com
2. Adicionar Bot Token Scope: chat:write
3. Instalar app no workspace
4. Adicionar credencial no n8n
```

**File:** `docs/ERROR_NOTIFICATION_SETUP.md`

### Step 8.4: Commit

```bash
git add n8n_workflow_v3.0.json docs/ERROR_NOTIFICATION_SETUP.md
git commit -m "feat: add Slack error notifications

- Notify #lex-alerts after 3 failed retries
- Include error details, workflow, timestamp
- Setup documentation added"
```

---

# FASE 4.0: CACHE REDIS

## Task 9: Implementar Cache de Minutas

**Files:**
- Modify: `docker/docker-compose-qdrant.yml` (adicionar Redis)
- Create: `scripts/cache_manager.js`
- Modify: `n8n_workflow_v3.0.json`

### Step 9.1: Adicionar Redis ao docker-compose

```yaml
  redis:
    image: redis:7-alpine
    container_name: lex-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  qdrant_storage:
  redis_data:
```

### Step 9.2: Criar lógica de cache no workflow

Antes de chamar o AI Agent:
1. Gerar hash do input (fatos + questões + pedidos)
2. Verificar se existe cache com score ≥ 95
3. Se sim, retornar minuta cacheada
4. Se não, prosseguir com geração

Após geração bem-sucedida com score ≥ 95:
1. Salvar minuta no Redis com TTL de 30 dias

### Step 9.3: Testar cache

**Run:** Enviar mesmo caso duas vezes e verificar:
1. Primeira vez: geração completa (~30s)
2. Segunda vez: cache hit (<1s)

### Step 9.4: Commit

```bash
git add docker/docker-compose-qdrant.yml n8n_workflow_v3.0.json
git commit -m "feat: add Redis cache for high-quality drafts

- Cache minutas with QA score >= 95
- 30 day TTL
- Hash-based lookup on input"
```

---

# FASE 5.0: AGENTE CRÍTICO QA

## Task 10: Implementar Debate Agent

**Files:**
- Create: `agents/agent_CRITICO.md`
- Modify: `n8n_workflow_v3.0.json`

### Step 10.1: Criar Agente Crítico

```markdown
# AGENTE CRÍTICO - QA ADVERSARIAL

## Função
Revisar minutas geradas por outros agentes, buscando:
- Inconsistências lógicas
- Fundamentação jurídica fraca
- Omissões relevantes
- Alternativas não consideradas

## Output
JSON estruturado com:
- score_critico (0-100)
- problemas_encontrados[]
- sugestoes_melhoria[]
- fundamentacao_alternativa (se houver)

## Instruções
1. NÃO concordar automaticamente
2. Buscar falhas ativamente
3. Propor fundamentação alternativa quando aplicável
4. Sinalizar riscos de reforma em grau recursal
```

### Step 10.2: Integrar ao pipeline QA

Após QA Semântico:
1. Enviar minuta ao Agente Crítico
2. Consolidar feedback com score do QA original
3. Se score crítico < 60, marcar para revisão obrigatória

### Step 10.3: Commit

```bash
git add agents/agent_CRITICO.md n8n_workflow_v3.0.json
git commit -m "feat: add Critical Agent for adversarial QA

- Reviews drafts for inconsistencies
- Proposes alternative legal reasoning
- Flags high-risk decisions for review"
```

---

# FASE 5.1: INTERFACE DE REVISÃO

## Task 11: Criar Interface Streamlit

**Files:**
- Create: `ui/app.py`
- Create: `ui/requirements.txt`
- Create: `ui/Dockerfile`

### Step 11.1: Criar aplicação Streamlit

```python
import streamlit as st
import requests
import json

st.set_page_config(page_title="Lex Intelligentia - Revisão", layout="wide")

st.title("📜 Lex Intelligentia - Interface de Revisão")

# Carregar minutas pendentes de revisão
response = requests.get("http://n8n:5678/webhook/lex-minutas-pendentes")
minutas = response.json()

if minutas:
    selected = st.selectbox("Selecione uma minuta:", [m["id"] for m in minutas])
    minuta = next(m for m in minutas if m["id"] == selected)

    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("Minuta")
        st.markdown(minuta["conteudo"])

    with col2:
        st.subheader("Métricas")
        st.metric("Score QA", f"{minuta['score']}%")
        st.metric("Agente", minuta["agente"])
        st.metric("Risco", minuta["risco"])

        st.subheader("Fundamentação RAG")
        for ref in minuta.get("referencias", []):
            st.markdown(f"- [{ref['sumula']}]({ref['link']})")

    st.divider()

    feedback = st.radio("Avaliação:", ["Aprovar", "Rejeitar"])
    motivo = st.text_area("Motivo (obrigatório se rejeitar):")

    if st.button("Enviar Feedback"):
        # Enviar feedback para sistema
        st.success("Feedback registrado!")
else:
    st.info("Nenhuma minuta pendente de revisão.")
```

**File:** `ui/app.py`

### Step 11.2: Criar requirements.txt

```
streamlit==1.29.0
requests==2.31.0
```

### Step 11.3: Criar Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8501
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```

### Step 11.4: Commit

```bash
git add ui/
git commit -m "feat: add Streamlit review interface

- View pending drafts
- Show QA metrics and RAG references
- Submit approval/rejection feedback"
```

---

# CHECKLIST FINAL

## Fase 2.6 - Agentes Fazenda Pública
- [ ] Task 1: agent_MANDADO_SEGURANCA criado e validado
- [ ] Task 2: agent_SAUDE_MEDICAMENTOS criado e validado
- [ ] Task 3: Workflow atualizado para 23 agentes

## Fase 3.0 - RAG Vector Store
- [ ] Task 4: Dados STJ baixados e processados
- [ ] Task 5: Qdrant configurado e dados ingeridos
- [ ] Task 6: RAG integrado ao pipeline

## Fase 3.1 - Dashboard
- [ ] Task 7: Dashboard Looker Studio configurado

## Fase 3.2 - Notificações
- [ ] Task 8: Slack notifications implementadas

## Fase 4.0 - Cache
- [ ] Task 9: Redis cache implementado

## Fase 5.0 - QA Avançado
- [ ] Task 10: Agente Crítico implementado

## Fase 5.1 - Interface
- [ ] Task 11: Interface Streamlit criada

---

*Plano criado em 2026-01-24 | Lex Intelligentia v3.0*
