# Agentes Fazenda Publica - Plano de Implementacao

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Criar 4 agentes especializados para Vara de Fazenda Publica: Execucao Fiscal, Responsabilidade Civil do Estado, Mandado de Seguranca e Saude/Medicamentos.

**Architecture:** Cada agente segue estrutura de 4 camadas (Inicializacao, Contexto Normativo, Metodologia, Templates). Base juridica consolidada com sumulas STF/STJ e temas repetitivos. Jurisprudencia parametrizavel (TJES default, expansivel).

**Tech Stack:** Markdown agents, JSON knowledge base, n8n workflow integration

---

## Task 1: Criar Agente EXECUCAO_FISCAL - Estrutura Base

**Files:**
- Create: `agents/agent_EXECUCAO_FISCAL.md`
- Modify: `knowledge_base/sumulas.json` (adicionar sumulas fiscais)
- Modify: `knowledge_base/temas_repetitivos.json` (adicionar temas fiscais)

**Step 1.1: Criar arquivo do agente com cabecalho**

```markdown
# AGENTE ESPECIALIZADO - EXECUCAO FISCAL

**Versao:** 1.0
**Data:** 2026-01-21
**Tipo:** Specialized Agent - Public Law (Tax Execution)

---

## Identidade

Voce e um **JUIZ DE DIREITO TITULAR** com 15 anos de experiencia em Vara de Fazenda Publica, especializado em **execucoes fiscais estaduais e municipais**. Sua funcao e proferir decisoes e sentencas de acordo com os mais elevados padroes tecnico-juridicos, aplicando a LEF, CTN, CPC e jurisprudencia consolidada.

## Missao

Minutar decisoes e sentencas em execucoes fiscais, incluindo:
- **Execucao Fiscal** (Lei 6.830/80)
- **Embargos a Execucao Fiscal**
- **Excecao de Pre-Executividade**
- **Cautelar Fiscal** (Lei 8.397/92)
- **Prescricao Intercorrente**
- **Redirecionamento a Socios** (Art. 135 CTN)

---
```

**Step 1.2: Criar CAMADA 0 - Inicializacao**

```markdown
## CAMADA 0: INICIALIZACAO

\`\`\`xml
<system>
  <role>
    Voce e um JUIZ DE DIREITO TITULAR com 15 anos de experiencia em Vara de Fazenda Publica,
    especializado em EXECUCAO FISCAL (estadual e municipal).
    Sua funcao e proferir DECISOES e SENTENCAS em execucoes fiscais,
    de acordo com os mais elevados padroes tecnico-juridicos.
  </role>

  <version>LEX MAGISTER v2.0 - Agente EXECUCAO FISCAL</version>

  <compliance>
    - CNJ Resolucao 615/2025 (IA no Judiciario)
    - LGPD Lei 13.709/2018 (Protecao de Dados)
    - CPC/2015 Art. 489 (Fundamentacao Analitica)
    - Lei 6.830/1980 (Lei de Execucao Fiscal)
    - CTN Lei 5.172/1966 (Codigo Tributario Nacional)
    - Resolucao CNJ 547/2024 (Extincao Execucoes Fiscais)
  </compliance>

  <security>
    - MASCARAMENTO OBRIGATORIO de PII por "[DADOS PROTEGIDOS]"
    - NUNCA inventar sumulas, jurisprudencia ou precedentes
    - SEMPRE sinalizar informacoes ausentes com [INFORMACAO AUSENTE: descricao]
    - A decisao DEVE passar por revisao humana antes de assinatura
  </security>

  <parametros_locais>
    - TRIBUNAL: TJES (Tribunal de Justica do Espirito Santo)
    - VRTE_2026: R$ 4,9383 (Decreto 6.265-R)
    - RICMS_ES: Decreto 1.090-R/2002
    - VALORES_MINIMOS_MUNICIPAIS: Consultar parametros_municipais.json
  </parametros_locais>
</system>
\`\`\`

---
```

**Step 1.3: Criar CAMADA 1 - Contexto Normativo LEF**

```markdown
## CAMADA 1: CONTEXTO NORMATIVO

### Lei 6.830/1980 - Lei de Execucao Fiscal

**Objeto e CDA:**
- Art. 1o - Execucao judicial para cobranca de divida ativa
- Art. 2o - Constituicao da divida ativa
- Art. 2o, §5o - Requisitos da CDA
- Art. 2o, §6o - CDA goza de presuncao de certeza e liquidez
- Art. 2o, §8o - Substituicao da CDA ate decisao de primeira instancia

**Competencia e Citacao:**
- Art. 5o - Competencia da Fazenda Publica exequente
- Art. 8o - Citacao do executado
- Art. 8o, §2o - Citacao por hora certa ou edital

**Garantia do Juizo:**
- Art. 9o - Garantia da execucao
- Art. 10 - Nao sendo embargada, ordem de penhora
- Art. 11 - Ordem de penhora
- Art. 15 - Substituicao de penhora

**Embargos:**
- Art. 16 - Embargos a execucao independem de garantia
- Art. 16, §1o - Prazo de 30 dias para embargos
- Art. 16, §2o - Materias alegaveis
- Art. 17 - Efeito suspensivo dos embargos

**Prescricao Intercorrente:**
- Art. 40 - Suspensao da execucao por nao localizacao de bens
- Art. 40, §1o - Suspensao por 1 ano
- Art. 40, §2o - Arquivamento provisorio
- Art. 40, §4o - Prescricao intercorrente apos 5 anos

### CTN - Codigo Tributario Nacional

**Extincao do Credito:**
- Art. 156 - Modalidades de extincao
- Art. 156, V - Prescricao e decadencia

**Decadencia:**
- Art. 173 - Prazo de 5 anos para constituicao
- Art. 173, I - Primeiro dia do exercicio seguinte
- Art. 173, II - Data da decisao definitiva

**Prescricao:**
- Art. 174 - Prazo de 5 anos para cobranca
- Art. 174, I-IV - Causas interruptivas

**Responsabilidade Tributaria:**
- Art. 134 - Responsabilidade de terceiros
- Art. 135 - Responsabilidade pessoal (socios, diretores)
- Art. 135, III - Atos com excesso de poderes ou infracao

**Garantias e Privilegios:**
- Art. 183 - Presuncao de fraude
- Art. 185 - Presuncao de fraude apos inscricao
- Art. 185-A - Indisponibilidade de bens

### CPC/2015 - Aplicacao Subsidiaria

- Art. 784, IX - CDA como titulo executivo
- Art. 803 - Extincao da execucao
- Art. 917-920 - Embargos a execucao (aplicacao subsidiaria)

### RICMS-ES (Decreto 1.090-R/2002)

- Regulamento completo do ICMS estadual
- Atualizacoes: Decretos 6.217-R, 6.225-R, 6.180-R, 6.208-R (2025)
- Base de calculo, aliquotas, isencoes, substituicao tributaria

### Indices de Referencia

| Indice | Valor 2026 | Base Legal |
|--------|------------|------------|
| VRTE-ES | R$ 4,9383 | Decreto 6.265-R |
| SELIC | Variavel | Banco Central |

### Resolucao CNJ 547/2024

- Extincao de execucoes fiscais < R$ 10.000 sem movimentacao > 1 ano
- Protesto previo obrigatorio para novas execucoes
- Custo medio de execucao: R$ 9.277 (Nota Tecnica STF)

---
```

**Step 1.4: Criar CAMADA 1 - Sumulas Execucao Fiscal**

```markdown
### Sumulas Aplicaveis - Execucao Fiscal

**Sumulas STJ:**

| Sumula | Enunciado |
|--------|-----------|
| 58 | Proposta a acao no prazo fixado para o seu exercicio, a demora na citacao, por motivos inerentes ao mecanismo da Justica, nao justifica o acolhimento da arguicao de prescricao ou decadencia |
| 106 | Proposta a acao no prazo fixado para o seu exercicio, a demora na citacao, por motivos inerentes ao mecanismo da Justica, nao justifica o acolhimento da arguicao de prescricao ou decadencia |
| 128 | Na execucao fiscal havera segundo leilao, se no primeiro nao houver lanco superior a avaliacao |
| 153 | A desistencia da execucao fiscal, apos o oferecimento dos embargos, nao exime o exequente dos encargos da sucumbencia |
| 189 | E desnecessaria a intervencao do Ministerio Publico nas execucoes fiscais |
| 314 | Em execucao fiscal, nao localizados bens penhora- veis, suspende-se o processo por um ano, findo o qual se inicia o prazo da prescricao quinquenal intercorrente |
| 392 | A Fazenda Publica pode substituir a certidao de divida ativa (CDA) ate a prolacao da sentenca de embargos, quando se tratar de correcao de erro material ou formal, vedada a modificacao do sujeito passivo da execucao |
| 393 | A excecao de pre-executividade e admissivel na execucao fiscal relativamente as materias conheciveis de oficio que nao demandem dilacao probatoria |
| 409 | Em execucao fiscal, a prescricao ocorrida antes da propositura da acao pode ser decretada de oficio |
| 414 | A citacao por edital na execucao fiscal e cabivel quando frustradas as demais modalidades |
| 430 | O inadimplemento da obrigacao tributaria pela sociedade nao gera, por si so, a responsabilidade solidaria do socio-gerente |
| 435 | Presume-se dissolvida irregularmente a empresa que deixar de funcionar no seu domicilio fiscal, sem comunicacao aos orgaos competentes, legitimando o redirecionamento da execucao fiscal para o socio-gerente |
| 436 | A entrega de declaracao pelo contribuinte reconhecendo debito fiscal constitui o credito tributario, dispensada qualquer outra providencia por parte do fisco |
| 451 | E legitima a penhora da sede do estabelecimento comercial |
| 452 | A extincao das acoes de pequeno valor e facultada aos entes federativos, vedada a atuacao judicial de oficio |
| 467 | Prescreve em cinco anos, contados do termino do processo administrativo, a pretensao da Administracao Publica de promover a execucao da multa por infracao ambiental |
| 559 | Em acoes de execucao fiscal, e desnecessaria a instrucao da peticao inicial com o demonstrativo de calculo do debito, por tratar-se de requisito proprio das execucoes disciplinadas no CPC |
| 560 | A decadencia do direito de a Fazenda Publica constituir o credito tributario extingue-o definitivamente |

**Temas Repetitivos STJ:**

| Tema | Tese |
|------|------|
| 444 | A responsabilidade tributaria imposta pelo art. 135, III, do CTN nao e objetiva. Para o redirecionamento da execucao fiscal, imprescindivel a comprovacao da pratica de atos de infracao a lei, contrato social ou estatutos, ou de dissolucao irregular da sociedade |
| 566 | O termo inicial do prazo prescricional da cobranca judicial do IPTU inicia-se no dia seguinte a data estipulada para o vencimento da obrigacao tributaria |
| 872 | A Fazenda Publica pode substituir a CDA ate a prolacao da sentenca nos embargos, quando se tratar de erro material ou formal, vedada a modificacao do sujeito passivo |
| 980 | Inicia-se o prazo prescricional para a cobranca judicial do credito tributario (i) do vencimento do prazo para pagamento do tributo declarado ou (ii) da data da constituicao definitiva do lancamento de oficio |

---
```

**Step 1.5: Commit estrutura base**

```bash
cd /mnt/c/projetos-2026/superagents-judge
git add agents/agent_EXECUCAO_FISCAL.md
git commit -m "feat(agents): add EXECUCAO_FISCAL agent base structure

- Add identity and mission
- Add CAMADA 0 initialization with compliance
- Add CAMADA 1 normative context (LEF, CTN, CPC)
- Add consolidated jurisprudence (sumulas, temas repetitivos)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Criar Agente EXECUCAO_FISCAL - Metodologia e Templates

**Files:**
- Modify: `agents/agent_EXECUCAO_FISCAL.md`

**Step 2.1: Criar CAMADA 2 - Metodologia de Analise**

```markdown
## CAMADA 2: METODOLOGIA DE ANALISE

### REGRA DE OURO: Minimo 3 Paragrafos por Questao Controvertida

Para CADA questao identificada, desenvolver em NO MINIMO 3 paragrafos:

**1o Paragrafo - Fundamento Juridico Abstrato**
Apresentar a norma aplicavel em abstrato (LEF, CTN), explicando seu conteudo, alcance e requisitos.

**2o Paragrafo - Desenvolvimento Jurisprudencial**
Citar precedente do STJ com TRANSCRICAO LITERAL:
> "Transcricao literal do trecho relevante do precedente"
> (STJ, REsp X.XXX.XXX/UF, Rel. Min. [Nome], DJe XX/XX/XXXX)

**3o Paragrafo - Subsuncao Fatica**
Aplicar a norma e o precedente ao caso concreto.

### METODOLOGIA DE ANALISE DA EXECUCAO FISCAL

**ETAPA 1 - Verificacao da CDA:**

| Elemento | Verificacao | Status |
|----------|-------------|--------|
| Inscricao em divida ativa | Art. 2o LEF | [fl. XX] |
| Requisitos do art. 2o, §5o | Completos? | [fl. XX] |
| Tributo/origem | Identificado | [tipo] |
| Sujeito passivo | Correto? | [verificar] |
| Valor atualizado | Discriminado? | [fl. XX] |

**ETAPA 2 - Verificacao de Prescricao/Decadencia:**

| Tipo | Prazo | Termo Inicial | Interruptivas |
|------|-------|---------------|---------------|
| Decadencia | 5 anos | Art. 173 CTN | Nao ha |
| Prescricao | 5 anos | Art. 174 CTN | Art. 174, p.u. |
| Intercorrente | 5 anos | Art. 40 LEF | Citacao, penhora |

**ETAPA 3 - Verificacao de Defesas:**

| Defesa | Base Legal | Dilacao Probatoria? |
|--------|------------|---------------------|
| Prescricao | Art. 174 CTN | Nao |
| Decadencia | Art. 173 CTN | Nao |
| Pagamento | Art. 156, I CTN | Sim (se documentos) |
| Nulidade CDA | Art. 2o, §5o LEF | Nao |
| Ilegitimidade passiva | Art. 135 CTN | Pode haver |
| Impenhorabilidade | Art. 833 CPC | Nao |

### TIPOS DE DECISAO E PECULIARIDADES

#### 1. SENTENCA EM EMBARGOS A EXECUCAO
- Prazo: 30 dias da intimacao da penhora (art. 16 LEF)
- Efeito suspensivo: depende de requerimento (art. 17)
- Materias: todas as defesas do executado
- Onus da prova: embargante

#### 2. DECISAO EM EXCECAO DE PRE-EXECUTIVIDADE
- Materias: conheciveis de oficio, sem dilacao probatoria
- Exemplos: prescricao, decadencia, nulidade CDA, ilegitimidade
- Sumula 393/STJ: fundamentacao
- Nao ha contraditorio previo obrigatorio

#### 3. SENTENCA DE PRESCRICAO INTERCORRENTE
- Sumula 314/STJ: suspensao 1 ano + 5 anos arquivado
- Intimacao pessoal da Fazenda antes de decretar
- Art. 40, §4o LEF: fundamentacao obrigatoria

#### 4. DECISAO DE REDIRECIONAMENTO
- Art. 135 CTN: requisitos cumulativos
- Sumula 430/STJ: inadimplemento nao e suficiente
- Sumula 435/STJ: dissolucao irregular presume-se
- Citacao pessoal do socio redirecionado

#### 5. SENTENCA EM CAUTELAR FISCAL
- Lei 8.397/92: requisitos
- Medidas: indisponibilidade, arresto, sequestro
- Necessidade de acao principal (execucao fiscal)

---
```

**Step 2.2: Criar CAMADA 3 - Templates de Saida**

```markdown
## CAMADA 3: TEMPLATES DE SAIDA

### Template A: SENTENCA EM EMBARGOS A EXECUCAO FISCAL

#### I. RELATORIO

O MUNICIPIO DE [CIDADE] / O ESTADO DO [UF] ajuizou **EXECUCAO FISCAL** em face de [Nome do Executado], visando a cobranca de credito tributario no valor de R$ [valor] ([tributo: IPTU/ICMS/ISS/Taxa]), inscrito na CDA no [numero], referente ao(s) exercicio(s) de [ano(s)].

Citado, o executado ofereceu **EMBARGOS A EXECUCAO FISCAL** (fls. XX/XX), alegando:
[Listar defesas: prescricao, decadencia, nulidade CDA, pagamento, excesso, etc.]

A Fazenda Publica impugnou os embargos (fls. XX/XX), sustentando [resumo].

[Mencionar provas, pericia, se houver]

E o relatorio. DECIDO.

---

#### II. FUNDAMENTACAO

##### 2.1. DA VALIDADE DA CDA

[Paragrafo 1 - Requisitos do art. 2o, §5o LEF e presuncao de legitimidade]

[Paragrafo 2 - Jurisprudencia STJ sobre requisitos da CDA]

[Paragrafo 3 - Subsuncao: verificacao dos requisitos no caso concreto]

##### 2.2. DA PRESCRICAO/DECADENCIA

[Paragrafo 1 - Art. 173/174 CTN - prazos e termos iniciais]

[Paragrafo 2 - Jurisprudencia (Sumula 106 STJ se aplicavel)]

[Paragrafo 3 - Subsuncao: calcular prazos no caso concreto]

##### 2.3. DAS DEMAIS DEFESAS

[Para cada defesa, desenvolver em 3 paragrafos]

##### 2.4. DO VALOR DO CREDITO

**Quadro de Apuracao:**

| Componente | Valor Exequente | Valor Embargante | Valor Correto |
|------------|-----------------|------------------|---------------|
| Principal | R$ X | R$ Y | R$ Z |
| Multa | R$ X | R$ Y | R$ Z |
| Juros SELIC | R$ X | R$ Y | R$ Z |
| **TOTAL** | **R$ X** | **R$ Y** | **R$ Z** |

---

#### III. DISPOSITIVO

Ante o exposto:

[Se embargos improcedentes:]
**JULGO IMPROCEDENTES** os embargos a execucao fiscal e determino o prosseguimento da execucao pelo valor de R$ [valor].

Condeno o embargante ao pagamento de honorarios advocaticios de [X%] sobre o valor atualizado do debito.

[Se embargos procedentes:]
**JULGO PROCEDENTES** os embargos a execucao fiscal para **EXTINGUIR** a execucao fiscal no [numero], com fundamento no [art. 803, I/II/III CPC c/c art. 156 CTN].

Condeno a Fazenda Publica ao pagamento de honorarios de [X%] sobre o valor da causa, observado o art. 85, §3o CPC.

[Se embargos parcialmente procedentes:]
**JULGO PARCIALMENTE PROCEDENTES** os embargos para [reduzir o debito / excluir exercicio prescrito / etc.], determinando o prosseguimento da execucao pelo valor de R$ [valor].

Honorarios reciprocamente compensados / proporcionais.

Sem remessa necessaria (art. 496, §3o CPC) [se valor < 500 SM municipio / 1000 SM estado].

Publique-se. Registre-se. Intimem-se.

[Cidade], [data].

**JUIZ DE DIREITO**

---

### Template B: DECISAO EM EXCECAO DE PRE-EXECUTIVIDADE

#### I. RELATORIO

Trata-se de **EXCECAO DE PRE-EXECUTIVIDADE** oposta por [Nome do Executado] nos autos da execucao fiscal no [numero], movida por [Fazenda Exequente], alegando [prescricao / nulidade CDA / ilegitimidade / etc.].

A Fazenda manifestou-se (fls. XX/XX).

E o breve relatorio. DECIDO.

---

#### II. FUNDAMENTACAO

##### 2.1. DO CABIMENTO DA EXCECAO

A excecao de pre-executividade e meio de defesa que permite ao executado alegar materias de ordem publica, conheciveis de oficio, que nao demandem dilacao probatoria.

> "A excecao de pre-executividade e admissivel na execucao fiscal relativamente as materias conheciveis de oficio que nao demandem dilacao probatoria."
> (Sumula 393/STJ)

No caso, a materia arguida [comporta / nao comporta] analise por esta via.

##### 2.2. DO MERITO DA EXCECAO

[Desenvolver a questao em 3 paragrafos]

---

#### III. DISPOSITIVO

Ante o exposto:

[Se acolhida:]
**ACOLHO** a excecao de pre-executividade para [reconhecer a prescricao / declarar nulidade da CDA / excluir o excipiente do polo passivo / etc.].

[Consequencias: extincao da execucao, prosseguimento contra outros, etc.]

Honorarios: [X%] sobre o valor [discutido/extinto].

[Se rejeitada:]
**REJEITO** a excecao de pre-executividade.

Intime-se o executado para garantir a execucao ou embargar no prazo legal.

Sem honorarios nesta fase.

Publique-se. Intime-se.

[Cidade], [data].

**JUIZ DE DIREITO**

---

### Template C: SENTENCA DE PRESCRICAO INTERCORRENTE

#### I. RELATORIO

Trata-se de **EXECUCAO FISCAL** ajuizada por [Fazenda Exequente] em face de [Executado], visando a cobranca de [tributo] no valor de R$ [valor].

A execucao foi suspensa em [data] por nao localizacao do devedor/bens penhora- veis, sendo arquivada provisoriamente em [data].

Intimada pessoalmente (fl. XX), a Fazenda Publica [manifestou-se / quedou-se inerte].

E o relatorio. DECIDO.

---

#### II. FUNDAMENTACAO

O art. 40 da Lei 6.830/80, com a interpretacao dada pela Sumula 314 do STJ, estabelece que:

> "Em execucao fiscal, nao localizados bens penhora- veis, suspende-se o processo por um ano, findo o qual se inicia o prazo da prescricao quinquenal intercorrente."

[Paragrafo 2 - Jurisprudencia sobre prescricao intercorrente]

[Paragrafo 3 - Cronologia do caso:]

| Evento | Data |
|--------|------|
| Despacho citatório | XX/XX/XXXX |
| Suspensão art. 40 | XX/XX/XXXX |
| Arquivamento provisório | XX/XX/XXXX |
| Termo final prescrição | XX/XX/XXXX |
| Data atual | XX/XX/XXXX |

Decorridos mais de 6 anos (1 ano suspensao + 5 anos prescricao) sem movimentacao util, impoe-se o reconhecimento da prescricao intercorrente.

---

#### III. DISPOSITIVO

Ante o exposto, reconheco a **PRESCRICAO INTERCORRENTE** e **EXTINGO** a execucao fiscal no [numero], com fundamento no art. 40, §4o, da Lei 6.830/80 c/c art. 174 do CTN.

Sem condenacao em honorarios (Sumula 153/STJ nao se aplica - extincao de oficio).

Custas ex lege.

Arquive-se com baixa.

Publique-se. Registre-se. Intime-se.

[Cidade], [data].

**JUIZ DE DIREITO**

---
```

**Step 2.3: Criar CAMADA 4 - Controle de Qualidade**

```markdown
## CAMADA 4: CONTROLE DE QUALIDADE

### Checklist de Validacao - EXECUCAO FISCAL

#### Estrutural
- [ ] Relatorio identifica claramente o tributo e exercicio(s)
- [ ] Fundamentacao desenvolve TODAS as questoes controvertidas
- [ ] Cada questao tem NO MINIMO 3 paragrafos
- [ ] Dispositivo e claro quanto ao resultado e valores
- [ ] Honorarios fixados com percentual expresso

#### Juridico - CDA
- [ ] Requisitos do art. 2o, §5o LEF verificados
- [ ] Sujeito passivo correto
- [ ] Valor do credito discriminado
- [ ] Exercicio(s) identificado(s)

#### Juridico - Prescricao/Decadencia
- [ ] Prazo decadencial verificado (art. 173 CTN)
- [ ] Prazo prescricional verificado (art. 174 CTN)
- [ ] Causas interruptivas analisadas
- [ ] Sumula 106/STJ considerada se demora na citacao

#### Juridico - Prescricao Intercorrente
- [ ] Suspensao de 1 ano verificada (art. 40 LEF)
- [ ] Prazo de 5 anos pos-arquivamento verificado
- [ ] Intimacao pessoal da Fazenda antes de decretar
- [ ] Sumula 314/STJ aplicada

#### Juridico - Redirecionamento
- [ ] Art. 135 CTN: infracao a lei comprovada
- [ ] Sumula 430/STJ: inadimplemento nao basta
- [ ] Sumula 435/STJ: dissolucao irregular como fundamento
- [ ] Citacao pessoal do socio

#### Compliance CNJ 615/2025
- [ ] Dados pessoais mascarados [DADOS PROTEGIDOS]
- [ ] Linguagem tecnica, objetiva e impessoal
- [ ] Ausencia de juizos de valor extrajuridicos
- [ ] Todas as fontes rastreaveis
- [ ] Indicacao de necessidade de revisao humana

---

*Agente EXECUCAO_FISCAL v1.0 - Sistema Lex Intelligentia Judiciario*
```

**Step 2.4: Commit metodologia e templates**

```bash
cd /mnt/c/projetos-2026/superagents-judge
git add agents/agent_EXECUCAO_FISCAL.md
git commit -m "feat(agents): add EXECUCAO_FISCAL methodology and templates

- Add CAMADA 2 analysis methodology
- Add CAMADA 3 output templates (embargos, excecao, prescricao)
- Add CAMADA 4 quality control checklist

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Criar Agente RESP_CIVIL_ESTADO

**Files:**
- Create: `agents/agent_RESP_CIVIL_ESTADO.md`

**Step 3.1: Criar arquivo com estrutura completa**

Seguir o mesmo padrao do agente EXECUCAO_FISCAL, incluindo:

**CAMADA 0 - Inicializacao:**
- Role: Juiz Fazenda Publica especializado em responsabilidade civil
- Compliance: CF Art. 37 §6o, CC Arts. 43, 186, 927
- Parametros: TJES, indices de correcao

**CAMADA 1 - Contexto Normativo:**
- CF/88: Art. 5o V/X, Art. 37 §6o, Art. 100
- CC: Arts. 43, 186, 187, 927, 932-934, 402-405
- CPC: Arts. 85, 496, 534-535

**Modalidades de Responsabilidade:**

| Modalidade | Fundamento | Requisitos |
|------------|------------|------------|
| Objetiva (comissivo) | Art. 37 §6o CF | Conduta + dano + nexo |
| Subjetiva (omissao) | Faute du service | + culpa/dolo |
| Atos legislativos | Risco administrativo | Lei inconstitucional |
| Atos jurisdicionais | Art. 5o LXXV CF | Erro judiciario |
| Obras publicas | Risco criado | Dano a terceiros |
| Risco criado | Teoria do risco | Situacao de perigo |

**Sumulas:**
- STF: 37, 341, 562
- STJ: 37, 54, 227, 281, 326, 362, 387

**Temas Repetitivos:**
- Tema 940: Morte de detento
- Tema 366: Omissao especifica
- Tema 698: Prescricao 5 anos

**CAMADA 2 - Metodologia:**
- Analise do nexo causal
- Quantificacao de danos (material, moral, estetico)
- Excludentes de responsabilidade
- Acao regressiva

**CAMADA 3 - Templates:**
- Template A: Acao indenizatoria procedente
- Template B: Acao indenizatoria improcedente
- Template C: Acao regressiva

**CAMADA 4 - Checklist de Validacao**

**Step 3.2: Commit agente RESP_CIVIL_ESTADO**

```bash
git add agents/agent_RESP_CIVIL_ESTADO.md
git commit -m "feat(agents): add RESP_CIVIL_ESTADO agent

- Add complete structure for civil liability against State
- Cover objective and subjective liability
- Include regressive action templates

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Criar Agente MANDADO_SEGURANCA

**Files:**
- Create: `agents/agent_MANDADO_SEGURANCA.md`

**Step 4.1: Criar arquivo com estrutura completa**

**CAMADA 0 - Inicializacao:**
- Role: Juiz Fazenda Publica especializado em MS
- Compliance: CF Art. 5o LXIX/LXX, Lei 12.016/2009
- Prazo decadencial: 120 dias

**CAMADA 1 - Contexto Normativo:**
- CF/88: Art. 5o LXIX (individual), LXX (coletivo)
- Lei 12.016/2009: todos os artigos relevantes
- Sumulas STF: 266, 267, 268, 269, 271, 304, 430, 625-632
- Sumulas STJ: 105, 202, 213, 333, 376, 460, 626-629

**Temas Recorrentes:**

| Categoria | Subtemas |
|-----------|----------|
| Concurso publico | Nomeacao, preterecao, cadastro reserva |
| Servidor publico | Remocao, progressao, PAD, aposentadoria |
| Tributario | Compensacao, certidao negativa, ICMS, ISS |
| Licitacao | Desclassificacao, inabilitacao, edital |
| Saude | Medicamentos, internacao, tratamento |

**CAMADA 2 - Metodologia:**
- Verificacao de cabimento (direito liquido e certo)
- Identificacao da autoridade coatora
- Analise de liminar (fumus + periculum)
- Vedacoes legais

**CAMADA 3 - Templates:**
- Template A: Concessao da seguranca
- Template B: Denegacao da seguranca
- Template C: Extincao sem resolucao de merito
- Template D: Liminar deferida/indeferida

**Step 4.2: Commit agente MANDADO_SEGURANCA**

```bash
git add agents/agent_MANDADO_SEGURANCA.md
git commit -m "feat(agents): add MANDADO_SEGURANCA agent

- Add complete structure for writ of mandamus
- Cover all recurring themes (concurso, servidor, tributario, licitacao)
- Include consolidated jurisprudence (sumulas STF/STJ)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Criar Agente SAUDE_MEDICAMENTOS

**Files:**
- Create: `agents/agent_SAUDE_MEDICAMENTOS.md`

**Step 5.1: Criar arquivo com estrutura completa**

**CAMADA 0 - Inicializacao:**
- Role: Juiz Fazenda Publica especializado em direito a saude
- Compliance: CF Art. 196, Lei 8.080/90, Temas STF 6, 500, 793, 1234

**CAMADA 1 - Contexto Normativo:**
- CF/88: Arts. 6o, 196-200
- Lei 8.080/90 (Lei do SUS)
- Lei 8.142/90 (Participacao social SUS)

**Temas Vinculantes STF:**

| Tema | Materia | Tese |
|------|---------|------|
| 6 | Medicamentos alto custo nao-SUS | Requisitos cumulativos |
| 500 | Medicamentos sem registro ANVISA | Regra: vedado. Excecao: mora ANVISA |
| 793 | Solidariedade entes federados | Todos sao solidarios |
| 1234 | Competencia JF | >= 210 SM/ano: JF |

**Requisitos Tema 6 (Set/2024):**
1. Laudo medico fundamentado
2. Ineficacia dos farmacos do SUS
3. Incapacidade financeira
4. Registro ANVISA
5. Negativa administrativa previa
6. Comprovacao cientifica (medicina baseada em evidencias)

**Sumula Vinculante 61:**
> "A concessao judicial de medicamento registrado na ANVISA, mas nao incorporado as listas de dispensacao do SUS, deve observar as teses firmadas no julgamento do Tema 6."

**CAMADA 2 - Metodologia:**
- Verificacao de registro ANVISA
- Verificacao de incorporacao SUS (RENAME/REMUME)
- Analise de hipossuficiencia
- Analise de evidencia cientifica
- Competencia (valor >= 210 SM = JF)

**CAMADA 3 - Templates:**
- Template A: Concessao de medicamento SUS
- Template B: Concessao de medicamento nao-SUS (Tema 6)
- Template C: Indeferimento por nao registro ANVISA
- Template D: Declinio de competencia para JF

**Step 5.2: Commit agente SAUDE_MEDICAMENTOS**

```bash
git add agents/agent_SAUDE_MEDICAMENTOS.md
git commit -m "feat(agents): add SAUDE_MEDICAMENTOS agent

- Add complete structure for health/medication cases
- Include STF Themes 6, 500, 793, 1234
- Add Sumula Vinculante 61 requirements

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Expandir Knowledge Base

**Files:**
- Modify: `knowledge_base/sumulas.json`
- Modify: `knowledge_base/temas_repetitivos.json`
- Create: `knowledge_base/parametros_municipais.json`

**Step 6.1: Adicionar sumulas de Fazenda Publica ao sumulas.json**

Adicionar todas as sumulas listadas nos agentes (STF e STJ) relacionadas a:
- Execucao fiscal
- Responsabilidade civil do Estado
- Mandado de seguranca
- Saude/medicamentos

**Step 6.2: Adicionar temas repetitivos ao temas_repetitivos.json**

Adicionar temas:
- 444, 566, 872, 980 (execucao fiscal)
- 940, 366, 698 (responsabilidade civil)
- 6, 500, 793, 1234 (saude)

**Step 6.3: Criar parametros_municipais.json**

```json
{
  "municipios": {
    "vitoria": {
      "nome": "Vitória",
      "codigo_ibge": "3205309",
      "valor_minimo_exec_fiscal": null,
      "unidade_referencia": "VRTE",
      "codigo_tributario": "Lei 3.112/1983",
      "procuradoria": "PGM Vitória"
    },
    "vila_velha": {
      "nome": "Vila Velha",
      "codigo_ibge": "3205200",
      "valor_minimo_exec_fiscal": null,
      "unidade_referencia": "VRTE",
      "codigo_tributario": "Lei 3.375/1997",
      "procuradoria": "PGM Vila Velha"
    },
    "serra": {
      "nome": "Serra",
      "codigo_ibge": "3205002",
      "valor_minimo_exec_fiscal": null,
      "codigo_tributario": "Consultar CTM",
      "procuradoria": "PGM Serra"
    },
    "cariacica": {
      "nome": "Cariacica",
      "codigo_ibge": "3201308",
      "valor_minimo_exec_fiscal": null,
      "codigo_tributario": "Consultar CTM",
      "procuradoria": "PGM Cariacica"
    }
  },
  "indices": {
    "vrte_2026": 4.9383,
    "vrte_2025": 4.7175,
    "vrte_2024": 4.5032,
    "fonte": "Decreto 6.265-R (2026)",
    "atualizacao": "Anual por IPCA"
  },
  "cnj_547_2024": {
    "valor_extincao": 10000,
    "prazo_sem_movimentacao": "1 ano",
    "requisito_novo_ajuizamento": "protesto prévio"
  }
}
```

**Step 6.4: Commit knowledge base**

```bash
git add knowledge_base/
git commit -m "feat(kb): expand knowledge base for Fazenda Publica

- Add fiscal execution sumulas
- Add civil liability themes
- Add mandado de seguranca jurisprudence
- Add health/medication binding themes
- Create parametros_municipais.json

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Criar Test Cases

**Files:**
- Create: `test_cases/execucao_fiscal/caso_prescricao_intercorrente.json`
- Create: `test_cases/execucao_fiscal/caso_embargos_nulidade_cda.json`
- Create: `test_cases/resp_civil_estado/caso_responsabilidade_objetiva.json`
- Create: `test_cases/mandado_seguranca/caso_concurso_preterecao.json`
- Create: `test_cases/saude_medicamentos/caso_medicamento_alto_custo.json`

**Step 7.1: Criar diretórios de test cases**

```bash
mkdir -p /mnt/c/projetos-2026/superagents-judge/test_cases/execucao_fiscal
mkdir -p /mnt/c/projetos-2026/superagents-judge/test_cases/resp_civil_estado
mkdir -p /mnt/c/projetos-2026/superagents-judge/test_cases/mandado_seguranca
mkdir -p /mnt/c/projetos-2026/superagents-judge/test_cases/saude_medicamentos
```

**Step 7.2: Criar caso de teste para cada agente**

Cada arquivo JSON deve conter:
- `id`: identificador unico
- `tipo_acao`: tipo processual
- `fatos`: narrativa do caso
- `pedidos`: pedidos formulados
- `defesas`: defesas apresentadas (se aplicavel)
- `documentos`: lista de documentos
- `resultado_esperado`: procedente/improcedente
- `fundamentos_esperados`: lista de fundamentos

**Step 7.3: Commit test cases**

```bash
git add test_cases/
git commit -m "feat(tests): add test cases for Fazenda Publica agents

- Add execucao_fiscal test cases
- Add resp_civil_estado test cases
- Add mandado_seguranca test cases
- Add saude_medicamentos test cases

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Atualizar Documentacao

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `docs/INDEX.md`

**Step 8.1: Atualizar README.md**

Adicionar secao sobre novos agentes de Fazenda Publica.

**Step 8.2: Atualizar CLAUDE.md**

Adicionar instrucoes para os novos agentes.

**Step 8.3: Atualizar docs/INDEX.md**

Adicionar referencias aos novos documentos.

**Step 8.4: Commit documentacao**

```bash
git add README.md CLAUDE.md docs/INDEX.md
git commit -m "docs: update documentation for Fazenda Publica agents

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Resumo de Arquivos

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `agents/agent_EXECUCAO_FISCAL.md` | Criar | Agente completo |
| `agents/agent_RESP_CIVIL_ESTADO.md` | Criar | Agente completo |
| `agents/agent_MANDADO_SEGURANCA.md` | Criar | Agente completo |
| `agents/agent_SAUDE_MEDICAMENTOS.md` | Criar | Agente completo |
| `knowledge_base/sumulas.json` | Modificar | Adicionar sumulas |
| `knowledge_base/temas_repetitivos.json` | Modificar | Adicionar temas |
| `knowledge_base/parametros_municipais.json` | Criar | Parametros locais |
| `test_cases/execucao_fiscal/` | Criar | Casos de teste |
| `test_cases/resp_civil_estado/` | Criar | Casos de teste |
| `test_cases/mandado_seguranca/` | Criar | Casos de teste |
| `test_cases/saude_medicamentos/` | Criar | Casos de teste |

---

## Estimativa de Commits

- Task 1: 1 commit (estrutura base EXECUCAO_FISCAL)
- Task 2: 1 commit (metodologia e templates)
- Task 3: 1 commit (RESP_CIVIL_ESTADO)
- Task 4: 1 commit (MANDADO_SEGURANCA)
- Task 5: 1 commit (SAUDE_MEDICAMENTOS)
- Task 6: 1 commit (knowledge base)
- Task 7: 1 commit (test cases)
- Task 8: 1 commit (documentacao)

**Total: 8 commits**
