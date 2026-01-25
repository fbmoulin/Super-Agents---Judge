# Framework de Engenharia de Prompts Jurídicos

**Versão:** 1.0
**Data:** 2026-01-19
**Baseado em:** Análise de 11 templates + pesquisa state-of-the-art 2026

---

## 1. Fundamentos Teóricos

### 1.1 Arquiteturas de Raciocínio Legal

| Técnica | Descrição | Aplicação |
|---------|-----------|-----------|
| **IRAC** | Issue, Rule, Application, Conclusion | Estruturação básica de argumentação |
| **FIRAC** | Facts, Issue, Rule, Application, Conclusion | Adição de fatos ao IRAC |
| **Chain of Logic (CoL)** | Decomposição de regras em elementos, avaliação independente, recomposição lógica | Subsunção complexa |
| **Chain of Reference (CoR)** | Raciocínio com referências explícitas a fontes | Fundamentação jurisprudencial |
| **Legal Syllogism** | Premissa maior (norma) + Premissa menor (fatos) = Conclusão | Silogismo judicial |

### 1.2 Compliance CNJ 615/2025

Todo prompt jurídico deve contemplar:

- **Transparência**: Outputs explicáveis e rastreáveis
- **Supervisão Humana**: Sempre indicar necessidade de revisão
- **Auditabilidade**: Estrutura que permita verificação
- **Classificação de Risco**: Identificar nível de impacto da decisão
- **Mascaramento LGPD**: Proteção de dados pessoais por padrão

---

## 2. Estrutura Canônica de Prompts Jurídicos

### 2.1 Camadas Arquiteturais

```
┌─────────────────────────────────────────────────────────┐
│ CAMADA 0: INICIALIZAÇÃO (Zero-Trust)                    │
│ - Papel/Persona do agente                               │
│ - Timestamp e versionamento                             │
│ - Protocolos de segurança (LGPD, CNJ)                   │
├─────────────────────────────────────────────────────────┤
│ CAMADA 1: CONTEXTO NORMATIVO                            │
│ - Base legal aplicável (CC, CPC, leis especiais)        │
│ - Súmulas vinculantes e persuasivas                     │
│ - Temas repetitivos STJ/STF                             │
│ - Resoluções administrativas (ANS, BACEN, CMN)          │
├─────────────────────────────────────────────────────────┤
│ CAMADA 2: METODOLOGIA DE ANÁLISE                        │
│ - Framework de raciocínio (FIRAC, 5-Camadas, Bifásico)  │
│ - Regras de fundamentação (Art. 489 CPC)                │
│ - Estrutura mínima por questão                          │
├─────────────────────────────────────────────────────────┤
│ CAMADA 3: TEMPLATES DE SAÍDA                            │
│ - Estrutura do documento (Relatório, Fundamentação,     │
│   Dispositivo)                                          │
│ - Exemplos de redação por seção                         │
│ - Formatação e estilo                                   │
├─────────────────────────────────────────────────────────┤
│ CAMADA 4: CONTROLE DE QUALIDADE                         │
│ - Checklist de validação                                │
│ - Vedações explícitas (Art. 489, §1º)                   │
│ - Critérios de completude                               │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Padrão XML para Claude

```xml
<system>
  <role>PAPEL DO AGENTE COM EXPERTISE ESPECÍFICA</role>
  <version>VERSÃO DO PROMPT</version>
  <compliance>CNJ 615/2025, LGPD</compliance>
</system>

<context>
  <legal_base>
    <statutes>LEIS APLICÁVEIS</statutes>
    <precedents>SÚMULAS E TEMAS</precedents>
    <regulations>RESOLUÇÕES</regulations>
  </legal_base>
  <jurisdiction>COMPETÊNCIA E RITO</jurisdiction>
</context>

<methodology>
  <framework>MÉTODO DE ANÁLISE</framework>
  <rules>REGRAS DE FUNDAMENTAÇÃO</rules>
  <structure>ESTRUTURA MÍNIMA</structure>
</methodology>

<output>
  <format>FORMATO DO DOCUMENTO</format>
  <sections>SEÇÕES OBRIGATÓRIAS</sections>
  <examples>EXEMPLOS DE REDAÇÃO</examples>
</output>

<quality>
  <checklist>ITENS DE VERIFICAÇÃO</checklist>
  <prohibitions>VEDAÇÕES</prohibitions>
</quality>

<input>
  {{DADOS DO CASO}}
</input>
```

---

## 3. Padrões Identificados nos Templates

### 3.1 Regra de Ouro: Fundamentação em 3 Parágrafos

Toda questão controvertida DEVE ser desenvolvida em no mínimo 3 parágrafos:

| Parágrafo | Conteúdo | Função |
|-----------|----------|--------|
| **1º** | Fundamento jurídico abstrato | Premissa maior (norma) |
| **2º** | Desenvolvimento jurisprudencial com citação literal | Autoridade e precedente |
| **3º** | Subsunção aos fatos do caso | Premissa menor → Conclusão |

### 3.2 Metodologia 5-Camadas (Saúde/Complexos)

Para cada ponto controvertido:

1. **Delimitação**: Identificar a controvérsia específica
2. **Fundamentação Normativa**: Base legal aplicável
3. **Jurisprudência Vinculante**: Tema/Súmula com transcrição literal
4. **Subsunção Fática**: Aplicação ao caso concreto
5. **Conclusão Parcial**: Resultado daquele ponto

### 3.3 Método Bifásico (Danos Morais)

Derivado da jurisprudência STJ:

**Fase 1 - Base:**
- Consultar faixas de valores por tipo de dano
- Estabelecer valor-base dentro da faixa

**Fase 2 - Modulação (5 critérios):**
1. Intensidade do sofrimento
2. Grau de culpa do ofensor
3. Disparidade econômica entre as partes
4. Necessidade de sanção pedagógica
5. Concorrência de culpa da vítima

### 3.4 Tabelas Estruturadas Obrigatórias

#### Súmulas Aplicáveis
```markdown
| Súmula | Tribunal | Enunciado | Aplicação |
|--------|----------|-----------|-----------|
| 297 | STJ | "O CDC é aplicável às instituições financeiras" | Contratos bancários |
```

#### Prazos Prescricionais
```markdown
| Pretensão | Prazo | Fundamento | Marco Inicial |
|-----------|-------|------------|---------------|
| Repetição de indébito | 10 anos | Art. 205 CC | Data do pagamento |
```

#### Temas Repetitivos
```markdown
| Tema | Tribunal | Tese Vinculante |
|------|----------|-----------------|
| 1.368 | STJ | "A taxa SELIC engloba juros e correção monetária..." |
```

---

## 4. Técnicas Avançadas Claude 2026

### 4.1 Structured Outputs com JSON Schema

```python
# Usar strict: true para garantir compliance
tool_definition = {
    "name": "generate_sentence",
    "strict": True,
    "input_schema": {
        "type": "object",
        "properties": {
            "relatorio": {"type": "string"},
            "fundamentacao": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "questao": {"type": "string"},
                        "fundamento_legal": {"type": "string"},
                        "jurisprudencia": {"type": "string"},
                        "subsuncao": {"type": "string"},
                        "conclusao_parcial": {"type": "string"}
                    },
                    "required": ["questao", "fundamento_legal", "subsuncao"]
                }
            },
            "dispositivo": {"type": "string"},
            "honorarios": {"type": "object"}
        },
        "required": ["relatorio", "fundamentacao", "dispositivo"]
    }
}
```

### 4.2 Multishot Prompting (3-5 exemplos)

Para cada tipo de documento, incluir exemplos de:
- Caso procedente típico
- Caso improcedente típico
- Caso com peculiaridade processual
- (Opcional) Caso com danos morais
- (Opcional) Caso com tutela de urgência

### 4.3 Chain of Thought Legal

```xml
<thinking>
1. IDENTIFICAÇÃO: Qual a natureza da demanda?
2. PARTES: Quem são os litigantes e suas qualidades?
3. PEDIDOS: O que se pleiteia?
4. CAUSA DE PEDIR: Qual o fundamento fático-jurídico?
5. DEFESA: Quais as teses defensivas?
6. PROVAS: O que foi demonstrado?
7. DIREITO: Qual a norma aplicável?
8. PRECEDENTES: Há súmula ou tema vinculante?
9. SUBSUNÇÃO: Os fatos se enquadram na norma?
10. CONCLUSÃO: Procedência ou improcedência?
</thinking>
```

---

## 5. Vedações (Art. 489, §1º CPC)

Todo prompt DEVE incluir seção de vedações:

```markdown
## VEDAÇÕES ABSOLUTAS

Não se considera fundamentada decisão que:

❌ I - Se limita à indicação, reprodução ou paráfrase de ato normativo,
   sem explicar sua relação com a causa ou questão decidida

❌ II - Emprega conceitos jurídicos indeterminados sem explicar o motivo
   concreto de sua incidência no caso

❌ III - Invoca motivos que se prestariam a justificar qualquer outra decisão

❌ IV - Não enfrenta todos os argumentos deduzidos no processo capazes de,
   em tese, infirmar a conclusão adotada

❌ V - Se limita a invocar precedente ou enunciado de súmula, sem identificar
   seus fundamentos determinantes nem demonstrar ajuste ao caso

❌ VI - Deixa de seguir enunciado de súmula, jurisprudência ou precedente
   invocado pela parte, sem demonstrar distinção ou superação
```

---

## 6. Checklist de Qualidade

### 6.1 Estrutural
- [ ] Relatório completo com síntese da lide
- [ ] Fundamentação com 3+ parágrafos por questão
- [ ] Dispositivo claro e específico
- [ ] Honorários devidamente fixados

### 6.2 Jurídico
- [ ] Todas as teses das partes enfrentadas
- [ ] Súmulas citadas com número e transcrição
- [ ] Temas repetitivos aplicados corretamente
- [ ] Base legal com artigos específicos

### 6.3 Processual
- [ ] Verificação de prescrição/decadência
- [ ] Análise de preliminares
- [ ] Sucumbência corretamente atribuída
- [ ] Comando registral (se aplicável)

### 6.4 Compliance
- [ ] Dados pessoais mascarados (LGPD)
- [ ] Linguagem técnica e impessoal
- [ ] Ausência de juízo de valor extrajurídico
- [ ] Rastreabilidade das fontes

---

## 7. Padrões de Estilo

### 7.1 Vocabulário Técnico

| Evitar | Preferir |
|--------|----------|
| "O réu está errado" | "A conduta do réu não encontra amparo legal" |
| "É óbvio que" | "Resta evidenciado que" |
| "Sempre" / "Nunca" | "Via de regra" / "Em princípio" |
| "Eu acho que" | "Data maxima venia" / "Salvo melhor juízo" |

### 7.2 Conectivos Jurídicos

- **Introdução**: "Trata-se de", "Cuida-se de", "Versa o presente feito sobre"
- **Transição**: "Nessa senda", "Sob tal enfoque", "Em arremate"
- **Conclusão**: "Diante do exposto", "Ante o quadro fático-jurídico", "Ex positis"
- **Citação**: "Nesse sentido", "Conforme iterativa jurisprudência", "In verbis"

### 7.3 Estruturas Sintáticas

Preferir períodos complexos com subordinação demonstrando domínio técnico:

```
"A pretensão autoral, fundada na alegada abusividade dos encargos
contratuais, esbarra na consolidada orientação jurisprudencial do
Superior Tribunal de Justiça, segundo a qual a estipulação de juros
remuneratórios superiores a 12% ao ano, por si só, não indica abusividade,
sendo necessária a demonstração de desproporção excessiva em relação à
taxa média de mercado divulgada pelo BACEN."
```

---

## 8. Aplicação por Domínio

### 8.1 Bancário
- Tema 1.368 (SELIC)
- Súmulas 297, 382, 539, 541, 30
- Resoluções CMN/BACEN
- Método bifásico para danos

### 8.2 Saúde Suplementar
- Súmulas 302, 469, 597, 608, 609
- Tema 952 (reajuste etário)
- Lei 9.656/98 e Resoluções ANS
- Rol exemplificativo (Lei 14.454/22)

### 8.3 Imobiliário
- Temas 970, 996
- Súmula 543
- Lei 4.591/64
- Tolerância 180 dias

### 8.4 Trânsito
- Arts. 186, 927 CC
- Art. 37, §6º CF
- CTB Lei 9.503/97
- Tabela de danos por gravidade

### 8.5 Usucapião
- Art. 1.238 CC
- Tema 985 STJ
- Súmula 340 STF
- REsp 1.361.226/MG

---

## 9. Referências

### Pesquisa Acadêmica
- [Chain of Reference Prompting](https://blog.genlaw.org/CameraReady/37.pdf)
- [Chain of Logic - LearnPrompting](https://learnprompting.org/docs/advanced/decomposition/chain-of-logic)
- [LegalGPT Multi-Agent Framework](https://dl.acm.org/doi/10.1007/978-981-97-5678-0_3)
- [Legal Knowledge Generation](https://link.springer.com/chapter/10.1007/978-3-032-06326-7_2)

### Documentação Técnica
- [Claude Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Anthropic Structured Output Guide](https://towardsdatascience.com/hands-on-with-anthropics-new-structured-output-capabilities/)

### Normativo
- CPC/2015, especialmente Art. 489
- CNJ Resolução 615/2025
- LGPD Lei 13.709/2018

---

*Framework sintetizado em 2026-01-19 para o projeto Lex Intelligentia Judiciário v2.2*
