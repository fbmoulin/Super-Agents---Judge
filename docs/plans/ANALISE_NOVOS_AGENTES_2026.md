# Analise de Novos Agentes Especializados - Lex Intelligentia v2.5

**Data:** 2026-01-20
**Versao Atual:** 2.4 (15 agentes)
**Objetivo:** Identificar e priorizar candidatos para novos agentes especializados

---

## 1. Metodologia de Pesquisa

### Fontes Consultadas
- [CNJ Justica em Numeros 2025](https://www.cnj.jus.br/pesquisas-judiciarias/justica-em-numeros/)
- [Painel Grandes Litigantes CNJ](https://www.cnj.jus.br)
- [Recomendacao CNJ 159/2024](https://atos.cnj.jus.br/atos/detalhar/5822) - Litigancia predatoria
- [TJES Centro de Inteligencia](https://www.tjes.jus.br/centro-de-inteligencia-do-poder-judiciario-estadual-vai-promover-solucoes-para-o-excesso-de-demandas-judiciais/)
- Relatorio Justica em Numeros 2023/2024/2025

### Criterios de Priorizacao
1. Volume de processos (dados CNJ)
2. Complexidade tecnico-juridica
3. Padronizacao possivel (templates)
4. Demanda especifica para vara civel
5. Gap com agentes existentes

---

## 2. Diagnostico Atual

### Agentes Existentes (15 - v2.4)

| # | Agente | Dominio | Volume Est. | Status |
|---|--------|---------|-------------|--------|
| 1 | agent_BANCARIO | Contratos bancarios | 35-40% | Validado |
| 2 | agent_CONSUMIDOR | Relacoes de consumo | 25-30% | Validado |
| 3 | agent_EXECUCAO | Execucoes civeis | 15-20% | Issue |
| 4 | agent_LOCACAO | Lei 8.245/91 | 8-12% | Validado |
| 5 | agent_POSSESSORIAS | Reintegracao/manutencao | 5-8% | Validado |
| 6 | agent_SAUDE_COBERTURA | Planos saude - cobertura | 15% | Pendente |
| 7 | agent_SAUDE_CONTRATUAL | Planos saude - contrato | 10% | Pendente |
| 8 | agent_TRANSITO | Acidentes de transito | 12% | Pendente |
| 9 | agent_USUCAPIAO | Prescricao aquisitiva | 5% | Pendente |
| 10 | agent_INCORPORACAO | Imoveis na planta | 8% | Pendente |
| 11 | agent_GENERICO | Fallback | ~5% | Validado |
| 12 | agent_REPARACAO_DANOS | Danos consumeristas | 12% | Novo v2.4 |
| 13 | agent_ALIMENTOS | Pensao alimenticia | 8% | Novo v2.4 |
| 14 | agent_PATERNIDADE | Investigacao/negatoria | 3% | Novo v2.4 |
| 15 | agent_GUARDA | Regulamentacao guarda | 3% | Novo v2.4 |

### Dominios Mapeados sem Agente Dedicado

| Dominio | Agente Atual | Gap |
|---------|--------------|-----|
| responsabilidade_civil | agent_GENERICO | ALTO |
| obrigacional | agent_GENERICO | ALTO |
| direitos_reais | agent_GENERICO | MEDIO |
| administrativo | agent_GENERICO | BAIXO (vara civel) |
| processual | agent_GENERICO | BAIXO |

---

## 3. Dados CNJ - Assuntos Mais Demandados

### Justica Estadual - 1o Grau (2024)

| Assunto | Volume | Observacao |
|---------|--------|------------|
| Obrigacoes/Especies de Contratos | ~1.945.000 | Cobranca, monitoria |
| Responsabilidade Civil/Dano Moral | ~1.761.000 | Indenizacoes |
| Familia/Alimentos | ~853.000 | Coberto v2.4 |
| Direito do Consumidor (JECs) | ~1.235.000 | Parcialmente coberto |
| Execucoes Fiscais | ~18.000.000 | Fazenda publica |

### Maiores Litigantes (Polo Passivo)

1. Caixa Economica Federal - 15,5%
2. INSS - 12,7%
3. Banco Bradesco - 2,5%
4. Instituicoes financeiras em geral
5. Operadoras de telefonia
6. Seguradoras

### Litigancia Predatoria (Recomendacao 159/2024)

Prejuizo estimado: **R$ 10,7 bilhoes/ano** concentrado em:
- Direito do Consumidor (Responsabilidade/Dano Moral)
- Direito Civil (Obrigacoes/Contratos)

---

## 4. Candidatos para Novos Agentes

### PRIORIDADE ALTA

#### 4.1 agent_DIVORCIO
**Volume Estimado:** 8-12% das acoes de familia
**Tipos de Acao:**
- Divorcio litigioso
- Divorcio consensual
- Dissolucao de uniao estavel
- Partilha de bens

**Base Legal:**
- Arts. 1.571 a 1.590 CC
- Art. 226, §6o CF
- Lei 11.441/2007 (extrajudicial)
- Arts. 731 a 734 CPC

**Justificativa:** Alto volume, padronizacao possivel, complementa os novos agentes de familia (Alimentos, Guarda, Paternidade).

---

#### 4.2 agent_INVENTARIO
**Volume Estimado:** 5-8%
**Tipos de Acao:**
- Inventario judicial
- Arrolamento sumario
- Arrolamento comum
- Sobrepartilha
- Alvara judicial

**Base Legal:**
- Arts. 1.784 a 1.856 CC (sucessoes)
- Arts. 610 a 673 CPC
- Lei 11.441/2007 (extrajudicial)

**Justificativa:** Demanda constante, regras bem definidas, padronizacao de calculo de quinhoes.

---

#### 4.3 agent_COBRANCA
**Volume Estimado:** 15-20% (altissimo)
**Tipos de Acao:**
- Acao de cobranca
- Acao monitoria
- Cumprimento de sentenca (titulo judicial)

**Base Legal:**
- Arts. 389 a 420 CC
- Arts. 700 a 702 CPC (monitoria)
- Arts. 513 a 538 CPC (cumprimento)

**Justificativa:** Representa o maior volume de processos na categoria "Obrigacoes/Contratos" (~2 milhoes). Alta padronizacao possivel.

---

### PRIORIDADE MEDIA

#### 4.4 agent_SEGUROS
**Volume Estimado:** 5-8%
**Tipos de Acao:**
- Seguro de vida
- Seguro de veiculo
- Seguro residencial
- Recusa de indenizacao
- Regulacao de sinistro

**Base Legal:**
- Arts. 757 a 802 CC
- Sumulas 101, 402, 537/STJ

**Justificativa:** Seguradoras sao grandes litigantes, jurisprudencia consolidada.

---

#### 4.5 agent_CONDOMINIO
**Volume Estimado:** 3-5%
**Tipos de Acao:**
- Cobranca de taxas condominiais
- Anulacao de assembleia
- Danos por infiltracao
- Disputas de vizinhanca

**Base Legal:**
- Arts. 1.331 a 1.358 CC
- Lei 4.591/64
- Sumulas 478, 480/STJ

**Justificativa:** Volume significativo, regras especificas, padronizacao de cobrancas.

---

#### 4.6 agent_RESPONSABILIDADE_CIVIL
**Volume Estimado:** 10-15%
**Tipos de Acao:**
- Acidentes em geral (nao de transito)
- Responsabilidade profissional (medico, advogado)
- Responsabilidade do Estado
- Erro medico

**Base Legal:**
- Arts. 186, 187, 927 a 954 CC
- Art. 37, §6o CF (Estado)
- Temas 940, 1062 STJ

**Justificativa:** Dominio ja mapeado mas usa agent_GENERICO. Alto volume de dano moral/material.

---

### PRIORIDADE BAIXA

#### 4.7 agent_DIREITOS_REAIS
**Volume Estimado:** 2-4%
**Tipos de Acao:**
- Servidao de passagem
- Direitos de vizinhanca
- Demarcacao/divisao
- Nunciacao de obra nova
- Danos por construcao

**Base Legal:**
- Arts. 1.196 a 1.510 CC
- Art. 1.277 a 1.313 CC (vizinhanca)

**Justificativa:** Volume menor, mas casos complexos que exigem fundamentacao especifica.

---

## 5. Matriz de Priorizacao

| Agente | Volume | Complexidade | Padronizacao | Demanda | Score |
|--------|--------|--------------|--------------|---------|-------|
| agent_COBRANCA | 5 | 2 | 5 | 5 | **17** |
| agent_DIVORCIO | 4 | 3 | 4 | 5 | **16** |
| agent_INVENTARIO | 3 | 4 | 4 | 4 | **15** |
| agent_RESPONSABILIDADE_CIVIL | 4 | 4 | 3 | 4 | **15** |
| agent_SEGUROS | 3 | 3 | 4 | 4 | **14** |
| agent_CONDOMINIO | 2 | 2 | 4 | 4 | **12** |
| agent_DIREITOS_REAIS | 2 | 4 | 3 | 2 | **11** |

**Escala:** 1 (baixo) a 5 (alto)

---

## 6. Recomendacao de Implementacao

### Fase v2.5 (Proxima Release)

**Agentes Recomendados (4):**
1. **agent_COBRANCA** - Score 17 (ALTA prioridade)
2. **agent_DIVORCIO** - Score 16 (ALTA prioridade)
3. **agent_INVENTARIO** - Score 15 (ALTA prioridade)
4. **agent_SEGUROS** - Score 14 (MEDIA prioridade)

**Justificativa:** Estes 4 agentes cobrem os maiores gaps identificados e complementam a cobertura de direito de familia iniciada na v2.4.

### Fase v2.6 (Release Futura)

**Agentes Recomendados (3):**
1. **agent_RESPONSABILIDADE_CIVIL** - Refinar o dominio existente
2. **agent_CONDOMINIO** - Volume crescente
3. **agent_DIREITOS_REAIS** - Casos especializados

---

## 7. Estimativa de Cobertura

### Atual (v2.4)
- **15 agentes**
- **17 dominios mapeados**
- **Cobertura estimada:** 75-80% das demandas civeis

### Projetada (v2.5)
- **19 agentes** (+4)
- **21 dominios mapeados** (+4)
- **Cobertura estimada:** 90-95% das demandas civeis

### Projetada (v2.6)
- **22 agentes** (+3)
- **24 dominios mapeados** (+3)
- **Cobertura estimada:** 95-98% das demandas civeis

---

## 8. Proximos Passos

1. [ ] Validar priorizacao com stakeholders
2. [ ] Criar templates para 4 novos agentes v2.5
3. [ ] Atualizar knowledge_base (sumulas, temas)
4. [ ] Atualizar domain_mapping.json
5. [ ] Testar com casos reais
6. [ ] Documentar metodologias especificas

---

## 9. Referencias

- [CNJ Justica em Numeros 2025](https://www.cnj.jus.br/pesquisas-judiciarias/justica-em-numeros/)
- [Recomendacao CNJ 159/2024](https://atos.cnj.jus.br/atos/detalhar/5822)
- [TJES Centro de Inteligencia](https://www.tjes.jus.br/)
- [Painel Grandes Litigantes CNJ](https://portal.trt12.jus.br/noticias/cnj-divulga-painel-com-20-maiores-litigantes-da-justica-federal-estadual-e-do-trabalho)

---

*Documento gerado em 2026-01-20 | Lex Intelligentia Judiciario v2.4*
