# Agentes Especializados - Direito de Familia e Consumidor

**Versao:** 1.0
**Data:** 2026-01-19
**Sistema:** Lex Intelligentia Judiciario v2.4

---

## Visao Geral

Este documento descreve os 4 novos agentes especializados adicionados na versao 2.4:

| Agente | Dominio | Arquivo |
|--------|---------|---------|
| agent_REPARACAO_DANOS | Danos consumeristas | `agents/agent_REPARACAO_DANOS.md` |
| agent_ALIMENTOS | Acoes de alimentos | `agents/agent_ALIMENTOS.md` |
| agent_PATERNIDADE | Investigacao/negatoria | `agents/agent_PATERNIDADE.md` |
| agent_GUARDA | Regulamentacao de guarda | `agents/agent_GUARDA.md` |

---

## 1. agent_REPARACAO_DANOS

### Escopo
Acoes de reparacao de danos em relacoes de consumo.

### Tipos de Acao Cobertos
- Danos morais por negativacao indevida (SPC/Serasa)
- Danos morais por falha na prestacao de servico
- Danos materiais por vicio do produto
- Danos esteticos
- Lucros cessantes
- Cobranca indevida (art. 42, paragrafo unico CDC)

### Base Legal Principal
| Legislacao | Artigos |
|------------|---------|
| CDC (Lei 8.078/90) | Arts. 2, 3, 6, 12, 14, 18, 20, 42, 43 |
| Codigo Civil | Arts. 186, 187, 927, 944 |

### Sumulas Aplicaveis
| Sumula | Tribunal | Tema |
|--------|----------|------|
| 385 | STJ | Negativacao com inscricao preexistente |
| 387 | STJ | Cumulacao dano estetico + moral |
| 388 | STJ | Devolucao indevida de cheque |
| 403 | STJ | Publicacao nao autorizada de imagem |
| 479 | STJ | Responsabilidade objetiva banco por fraude |

### Temas Repetitivos
| Tema | Tese |
|------|------|
| 929 | Legitimidade do comerciante por fato do produto |

### Metodologia Especifica
- **Metodo Bifasico** para quantificacao de danos morais
- **Tabela de valores** por tipo de dano (negativacao, falha servico, vicio)
- **Repeticao do indebito**: exige ma-fe (STJ)

### Keywords para Router
```
negativacao, SPC, Serasa, cobranca indevida, falha servico, vicio produto,
dano estetico, indenizacao, repeticao indebito, devolucao dobro, CDC
```

---

## 2. agent_ALIMENTOS

### Escopo
Todas as acoes envolvendo obrigacao alimentar.

### Tipos de Acao Cobertos
- **Acao de Alimentos** (pedido inicial)
- **Revisional de Alimentos** (aumento ou reducao)
- **Exoneratoria de Alimentos** (cessacao do dever)
- **Execucao de Alimentos** (cumprimento de sentenca)
- **Oferta de Alimentos**

### Base Legal Principal
| Legislacao | Artigos |
|------------|---------|
| Codigo Civil | Arts. 1.694 a 1.710 |
| Lei de Alimentos | Lei 5.478/68 |
| CPC | Art. 528 (execucao) |
| ECA | Arts. 4, 22 |
| CF/88 | Arts. 227, 229 |

### Sumulas Aplicaveis
| Sumula | Tribunal | Tema |
|--------|----------|------|
| 309 | STJ | Prisao civil: 3 prestacoes anteriores |
| 336 | STJ | Renuncia e pensao previdenciaria |
| 358 | STJ | Maioridade nao extingue automaticamente |
| 594 | STJ | Legitimidade do MP para alimentos |
| 596 | STJ | Obrigacao dos avos e subsidiaria |
| 621 | STJ | Retroatividade a citacao |

### Metodologia Especifica
- **Binomio Necessidade x Possibilidade**
- **Tabela de necessidades** (alimentacao, educacao, saude, etc.)
- **Tabela de possibilidades** (rendimentos liquidos)
- **Parametro de 30%** dos rendimentos (15-33% conforme caso)

### Formulas de Fixacao
```
EMPREGADO CLT:
  X% dos rendimentos brutos, incidentes sobre salario, ferias,
  13o salario, horas extras, excluidos IRPF e INSS

AUTONOMO:
  X salarios minimos nacionais vigentes
```

### Keywords para Router
```
alimentos, pensao alimenticia, alimentando, alimentante, binomio,
necessidade, possibilidade, revisional, exoneratoria, oferta,
execucao alimentos, prisao civil
```

---

## 3. agent_PATERNIDADE

### Escopo
Acoes de estado envolvendo filiacao.

### Tipos de Acao Cobertos
- **Investigacao de Paternidade** (com ou sem cumulacao de alimentos)
- **Negatoria de Paternidade** (impugnacao)
- **Anulacao de Registro Civil** (erro ou falsidade)
- **Reconhecimento de Paternidade Socioafetiva**

### Base Legal Principal
| Legislacao | Artigos |
|------------|---------|
| Codigo Civil | Arts. 1.593 a 1.617 |
| Lei 8.560/92 | Investigacao de paternidade |
| ECA | Art. 26, 27 |
| CF/88 | Arts. 226, 227 |

### Sumulas Aplicaveis
| Sumula | Tribunal | Tema |
|--------|----------|------|
| 149 | STF | Imprescritibilidade da investigacao |
| 277 | STJ | Alimentos desde a citacao |
| 301 | STJ | Recusa ao DNA = presuncao de paternidade |

### Temas Repetitivos
| Tema | Tribunal | Tese |
|------|----------|------|
| 622 | STF | Multiparentalidade (coexistencia biologica + socioafetiva) |
| 932 | STJ | Imprescritibilidade do estado de filiacao |

### Metodologia Especifica

**Analise do DNA:**
| Resultado | Consequencia |
|-----------|--------------|
| Inclusao (>99,99%) | Paternidade PROVADA |
| Exclusao (0%) | Paternidade AFASTADA |
| Recusa injustificada | Presuncao relativa (Sumula 301) |

**Paternidade Socioafetiva - Requisitos:**
1. Posse do estado de filho
2. Tratamento como filho (tractatus)
3. Reputacao publica (fama)
4. Duracao no tempo

### Keywords para Router
```
investigacao paternidade, negatoria, DNA, exame genetico, filiacao,
reconhecimento, paternidade socioafetiva, multiparentalidade,
registro civil, pater is est
```

---

## 4. agent_GUARDA

### Escopo
Regulamentacao do exercicio do poder familiar.

### Tipos de Acao Cobertos
- **Regulamentacao de Guarda** (unilateral ou compartilhada)
- **Modificacao de Guarda** (alteracao do regime)
- **Guarda c/c Regulamentacao de Visitas**
- **Busca e Apreensao de Menor** (restituicao)

### Base Legal Principal
| Legislacao | Artigos |
|------------|---------|
| Codigo Civil | Arts. 1.583 a 1.590 |
| Lei 13.058/14 | Guarda compartilhada obrigatoria |
| Lei 12.318/10 | Alienacao parental |
| ECA | Arts. 3, 4, 6, 33, 35 |

### Sumulas Aplicaveis
| Sumula | Tribunal | Tema |
|--------|----------|------|
| 383 | STJ | Competencia: foro do detentor da guarda |

### Metodologia Especifica

**Modalidades de Guarda:**

| Tipo | Quando Aplicar | Base Legal |
|------|----------------|------------|
| **Compartilhada** | REGRA - ambos aptos | Art. 1.584, §2o CC |
| **Unilateral** | EXCECAO - situacao de risco | Art. 1.583, §2o CC |

**Criterios para Guarda Unilateral (art. 1.583, §2o):**
1. Afetividade com o menor
2. Saude fisica e mental
3. Seguranca do menor
4. Disponibilidade de tempo
5. Ambiente familiar adequado

**Regime de Visitas Padrao:**
| Periodo | Sugestao |
|---------|----------|
| Fins de semana | Alternados (sexta 18h a domingo 19h) |
| Ferias escolares | Metade para cada genitor |
| Datas comemorativas | Alternadas anualmente |
| Dia dos Pais/Maes | Com o respectivo genitor |

**Alienacao Parental - Consequencias (art. 6o Lei 12.318/10):**
1. Advertencia
2. Ampliacao do regime de convivencia
3. Multa
4. Inversao da guarda
5. Suspensao da autoridade parental

### Keywords para Router
```
guarda, guarda compartilhada, guarda unilateral, regulamentacao,
modificacao guarda, visitas, convivencia familiar, alienacao parental,
melhor interesse crianca, poder familiar
```

---

## Integracao com Knowledge Base

### Novos Dominios Adicionados
```json
{
  "reparacao_danos": { "agente": "agent_REPARACAO_DANOS" },
  "alimentos": { "agente": "agent_ALIMENTOS" },
  "paternidade": { "agente": "agent_PATERNIDADE" },
  "guarda": { "agente": "agent_GUARDA" }
}
```

### Sumulas Adicionadas (sumulas.json)
- STJ: 277, 301, 309, 336, 358, 383, 385, 387, 388, 403, 479, 594, 596, 621
- STF: 149

### Temas Adicionados (temas_repetitivos.json)
- 622: Multiparentalidade
- 929: Responsabilidade comerciante
- 932: Imprescritibilidade investigacao paternidade

---

## Checklist de Qualidade por Agente

### agent_REPARACAO_DANOS
- [ ] CDC aplicado (arts. 2o, 3o)
- [ ] Responsabilidade objetiva fundamentada
- [ ] Metodo bifasico para danos morais
- [ ] Sumula 385 verificada (inscricao preexistente)
- [ ] Repeticao do indebito: ma-fe analisada

### agent_ALIMENTOS
- [ ] Binomio necessidade x possibilidade demonstrado
- [ ] Tabelas de necessidades/possibilidades preenchidas
- [ ] Percentual justificado (15-33%)
- [ ] Forma de pagamento definida (CLT vs autonomo)
- [ ] Retroatividade a citacao (Sumula 621)

### agent_PATERNIDADE
- [ ] DNA analisado com metodologia clara
- [ ] Paternidade socioafetiva considerada
- [ ] Tema 622 (multiparentalidade) avaliado
- [ ] Mandado de averbacao determinado
- [ ] Alimentos desde citacao (Sumula 277)

### agent_GUARDA
- [ ] Guarda compartilhada como regra avaliada
- [ ] Melhor interesse da crianca fundamentado
- [ ] Estudo psicossocial analisado
- [ ] Regime de visitas detalhado
- [ ] Alienacao parental investigada

---

## Uso no Router

O Gemini Router identifica o dominio baseado nas keywords e direciona para o agente especializado:

```javascript
// Exemplo de classificacao
{
  "dominio_identificado": "alimentos",
  "confianca": 0.95,
  "keywords_extraidas": ["pensao", "alimenticia", "menor", "necessidade"]
}
// -> Direciona para agent_ALIMENTOS
```

---

*Documentacao v2.4 - Sistema Lex Intelligentia Judiciario*
