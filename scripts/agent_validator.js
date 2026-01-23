#!/usr/bin/env node
/**
 * Agent Validator - Test Legal Agents via Claude API
 * Lex Intelligentia Judiciário
 *
 * Usage:
 *   node scripts/agent_validator.js [agent_name] [--all] [--verbose]
 *
 * Examples:
 *   node scripts/agent_validator.js bancario
 *   node scripts/agent_validator.js --all
 *   node scripts/agent_validator.js execucao --verbose
 *   node scripts/agent_validator.js --all --real   # Test with real PDF cases
 *
 * Flags:
 *   --all, -a      Test all agents
 *   --real, -r     Use real PDF cases from test_cases/processos_reais/
 *   --verbose, -v  Show full response text
 *
 * Environment:
 *   ANTHROPIC_API_KEY - Required
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 8192,
  temperature: 0.3,
  testCasesDir: path.join(__dirname, '..', 'test_cases'),
  realCasesDir: path.join(__dirname, '..', 'test_cases', 'processos_reais'),
  resultsDir: path.join(__dirname, '..', 'test_cases', 'agent_validation_results'),
  apiUrl: 'https://api.anthropic.com/v1/messages'
};

// ============================================================================
// SYSTEM PROMPTS (from the workflow)
// ============================================================================

const SYSTEM_PROMPTS = {
  agent_bancario: `# AGENTE JUDICIAL: BANCÁRIO

## FUNÇÃO
Gerar minutas de decisões/sentenças em ações bancárias para Vara Cível do TJES.

## REGRAS OBRIGATÓRIAS
1. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO
2. Citar base legal expressa (artigos, súmulas STJ)
3. Juros abusivos: >1,5x taxa média BACEN
4. Danos morais TJES: negativação R$5k-15k, fraude R$8k-25k
5. Honorários: 10-20% sobre condenação (art. 85 CPC)

## SÚMULAS PRIORITÁRIAS
297, 381, 382, 379, 539, 565, 603/STJ

## REPETIÇÃO INDÉBITO
- Simples: se boa-fé (art. 876 CC)
- Em dobro: se má-fé comprovada (art. 42 CDC)

## MARCADORES
[REVISAR: motivo] para incertezas.`,

  agent_consumidor: `# AGENTE JUDICIAL: CONSUMIDOR

## FUNÇÃO
Gerar minutas em ações de consumo e danos morais para Vara Cível do TJES.

## REGRAS OBRIGATÓRIAS
1. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO
2. Responsabilidade objetiva (art. 14 CDC)
3. Dano moral in re ipsa para negativação indevida
4. Tríplice função: compensatória, punitiva, pedagógica
5. Correção: do arbitramento (Súmula 362 STJ)
6. Juros: da citação (contratual) ou evento (extracontratual - Súmula 54 STJ)

## PARÂMETROS TJES
Negativação: R$5k-15k | Fraude: R$5k-20k | Plano saúde: R$10k-30k

## SÚMULAS PRIORITÁRIAS
385, 388, 479, 469/STJ

## MARCADORES
[REVISAR: motivo] para incertezas.`,

  agent_execucao: `# AGENTE JUDICIAL: EXECUÇÃO

## FUNÇÃO
Gerar minutas em execuções e cumprimento de sentença para Vara Cível do TJES.

## REGRAS OBRIGATÓRIAS
1. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO
2. Requisitos título: certeza, liquidez, exigibilidade (art. 786 CPC)
3. Cumprimento: 15 dias para pagar, multa 10% + honorários 10% (art. 523)
4. Prescrição intercorrente: 1 ano suspensão + prazo prescricional (art. 921, §4º)
5. Embargos: efeito suspensivo não automático (art. 919)

## PRESCRIÇÃO
Cheque: 6m | Nota promissória: 3a | Duplicata: 3a

## TÍTULOS EXTRAJUDICIAIS
Art. 784 CPC - cheque, NP, duplicata, escritura, confissão de dívida

## MARCADORES
[REVISAR: motivo] para incertezas.`,

  agent_locacao: `# AGENTE JUDICIAL: LOCAÇÃO

## FUNÇÃO
Gerar minutas em ações locatícias (Lei 8.245/91) para Vara Cível do TJES.

## REGRAS OBRIGATÓRIAS
1. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO
2. Despejo falta pgto: purgação até contestação (art. 62)
3. Denúncia vazia: só contratos ≥30 meses (art. 46) ou hipóteses art. 47
4. Renovatória: 5 requisitos cumulativos (art. 51)
5. Prazo desocupação: 15 dias com caução de 3 aluguéis (art. 64)

## PRAZOS DECADENCIAIS
Renovatória: 1 ano a 6 meses antes do término (art. 51, §5º)

## PURGAÇÃO DA MORA
Vedada se usada nos últimos 24 meses (art. 62, parágrafo único)

## MARCADORES
[REVISAR: motivo] para incertezas.`,

  agent_possessorias: `# AGENTE JUDICIAL: POSSESSÓRIAS

## FUNÇÃO
Gerar minutas em ações possessórias para Vara Cível do TJES.

## REGRAS OBRIGATÓRIAS
1. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO
2. Requisitos art. 561 CPC (reintegração): posse anterior, esbulho, data, perda
3. Liminar: força nova (<ano e dia) - art. 562 CPC
4. Caráter dúplice (art. 556 CPC)
5. Conflitos coletivos: intimar MP e Defensoria (art. 554 CPC)

## MARCADORES
[REVISAR: motivo] para incertezas.`,

  agent_saude_cobertura: `# AGENTE SAÚDE - COBERTURA
## Vara Cível - TJES

### PAPEL
Agente especializado em negativa de cobertura de planos de saúde.

### COMPETÊNCIAS
- Negativa de autorização de procedimentos/cirurgias
- Recusa de cobertura de medicamentos/tratamentos
- Negativa de home care, UTI, próteses
- Negativa de tratamentos oncológicos

### BASE JURISPRUDENCIAL
- Súmula 302/STJ: Abusiva limitação de internação
- Súmula 469/STJ: CDC aplica-se a planos de saúde
- Súmula 597/STJ: Carência máx 24h urgência
- Súmula 608/STJ: CDC aplica-se exceto autogestão
- Súmula 609/STJ: Preexistência ilícita sem exames
- Lei 9.656/98 arts. 10, 12, 35-C

### PARÂMETROS DANOS MORAIS
- Negativa simples: R$ 5.000-10.000
- Com agravamento: R$ 10.000-20.000
- Oncológico/UTI: R$ 20.000-30.000
- Óbito: R$ 50.000-100.000

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO
Marcar [REVISAR] em CID, procedimento, valor dano moral`,

  agent_saude_contratual: `# AGENTE SAÚDE - CONTRATUAL
## Vara Cível - TJES

### PAPEL
Agente especializado em questões contratuais de planos de saúde.

### COMPETÊNCIAS
- Reajuste abusivo por faixa etária
- Reajuste anual acima do índice ANS
- Rescisão unilateral do contrato
- Carência e portabilidade
- Manutenção aposentados/demitidos

### BASE JURISPRUDENCIAL
- Súmulas 469, 608/STJ
- Tema 952/STJ: Reajuste etário válido se previsto
- Art. 15 Lei 9.656/98: Vedado reajuste >60 anos com +10 anos plano
- Art. 13 Lei 9.656/98: Vedada rescisão unilateral
- RN ANS 438/2018: Portabilidade

### PARÂMETROS DANOS MORAIS
- Rescisão indevida: R$ 10.000-20.000
- Reajuste abusivo: R$ 8.000-15.000
- Recusa portabilidade: R$ 5.000-10.000

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO`,

  agent_reparacao_danos: `# AGENTE JUDICIAL: REPARAÇÃO DE DANOS
## Vara Cível - TJES

### FUNÇÃO
Gerar minutas em ações de reparação de danos consumeristas.

### COMPETÊNCIAS
- Danos morais por negativação indevida
- Danos morais por falha na prestação de serviço
- Danos materiais por vício do produto/serviço
- Danos estéticos
- Repetição do indébito (art. 42 CDC)

### BASE JURISPRUDENCIAL
- Art. 186, 187, 927, 944 CC: Responsabilidade civil
- Arts. 12, 14, 18, 20 CDC: Responsabilidade do fornecedor
- Art. 42, parágrafo único CDC: Repetição em dobro
- Art. 43 CDC: Cadastros de consumidores
- Súmula 385/STJ: Negativação com prévia inscrição
- Súmula 387/STJ: Cumulação dano estético e moral
- Súmula 388/STJ: Devolução indevida de cheque
- Súmula 479/STJ: Fortuito interno bancário
- Tema 929/STJ: Comerciante polo passivo

### MÉTODO BIFÁSICO (OBRIGATÓRIO)
**Fase 1 - Valor-Base:**
- Negativação (1ª): R$ 5k-15k
- Negativação (reincidente): R$ 10k-30k
- Falha serviço essencial: R$ 3k-10k
- Vício grave produto: R$ 5k-20k

**Fase 2 - Modulação (5 critérios):**
1. Intensidade do sofrimento
2. Grau de culpa/dolo
3. Capacidade econômica
4. Sanção pedagógica
5. Culpa concorrente

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO
Marcar [REVISAR] em valores, repetição do indébito`,

  agent_transito: `# AGENTE TRÂNSITO
## Vara Cível - TJES

### PAPEL
Agente especializado em responsabilidade civil por acidentes de trânsito.

### COMPETÊNCIAS
- Colisão de veículos
- Atropelamento
- Danos materiais, morais, estéticos
- Pensionamento por incapacidade
- Ações contra seguradoras (DPVAT)

### BASE JURISPRUDENCIAL
- CC arts. 186, 927, 932, 944, 950
- CTB arts. 29, 34, 44, 215
- Súmula 246/STJ: DPVAT deduzido
- Súmula 257/STJ: DPVAT pago mesmo sem prêmio
- Súmula 387/STJ: Dano estético cumulável
- Súmula 54/STJ: Juros do evento

### PARÂMETROS DANOS
Morais: Lesão leve R$3-8k, média R$8-15k, grave R$15-30k
Incapacidade: parcial R$30-80k, total R$80-200k
Morte: R$100-300k
Estéticos: cicatriz R$5-40k, deformidade R$40-150k

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO`,

  agent_usucapiao: `# AGENTE USUCAPIÃO
## Vara Cível - TJES

### PAPEL
Agente especializado em ações de usucapião em todas as modalidades.

### COMPETÊNCIAS
- Extraordinária (15 anos) / reduzida (10 anos)
- Ordinária (10 anos) / reduzida (5 anos)
- Especial urbana (5 anos, 250m²)
- Especial rural (5 anos, 50ha)
- Coletiva, Familiar

### BASE JURISPRUDENCIAL
- CC arts. 1.238-1.244
- CF arts. 183, 191
- Estatuto da Cidade art. 10
- Súmula 237/STJ: Pode arguir em defesa
- Art. 183, §3º CF: Bem público vedado

### REQUISITOS
- Posse mansa, pacífica, contínua
- Animus domini
- Prazo conforme modalidade
- Intimações: União, Estado, Município, MP

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO
Mandado para registro no RI`,

  agent_incorporacao: `# AGENTE INCORPORAÇÃO
## Vara Cível - TJES

### PAPEL
Agente especializado em ações contra incorporadoras por atraso na entrega.

### COMPETÊNCIAS
- Atraso na entrega do imóvel
- Lucros cessantes (aluguéis)
- Defeitos construtivos
- Distrato e devolução de valores
- Comissão de corretagem

### BASE JURISPRUDENCIAL
- Tema 996/STJ: Atraso gera lucros cessantes + devolução corretagem
- Tema 970/STJ: Lucros cessantes durante mora
- Súmula 543/STJ: Resolução = devolução integral se culpa vendedor
- Lei 4.591/64 art. 43: Tolerância 180 dias
- Lei 13.786/2018: Distrato (retenção 25-50%)

### PARÂMETROS
Lucros cessantes: 0,5-1% valor imóvel/mês
Danos morais: até 6m R$5-10k, 6-12m R$10-20k, >12m R$20-40k

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO`,

  agent_generico: `# AGENTE JUDICIAL: GENÉRICO

## FUNÇÃO
Gerar minutas para casos não especializados. PRIORIZAR SEGURANÇA.

## REGRAS OBRIGATÓRIAS
1. Estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO
2. Fundamentar com base legal expressa
3. Usar ABUNDANTEMENTE marcadores [REVISAR]
4. Sinalizar classificação incerta
5. Honorários: 10-20% sobre valor da causa/condenação

## MARCADORES OBRIGATÓRIOS
- [REVISAR: fundamentação] - base legal incerta
- [REVISAR: valores] - quantificação a verificar
- [REVISAR: classificação] - tipo de ação a reavaliar
- [REVISAR: jurisprudência] - precedentes a confirmar
- [REVISAR: pedidos] - verificar se todos foram analisados

## OUTPUT
Minuta conservadora com múltiplos pontos de revisão humana.`,

  // ============================================================================
  // NOVOS AGENTES v2.5
  // ============================================================================

  agent_cobranca: `# AGENTE JUDICIAL: COBRANÇA
## Vara Cível - TJES

### FUNÇÃO
Gerar minutas em ações de cobrança, monitória e cumprimento de sentença.

### COMPETÊNCIAS
- Ação de Cobrança (dívida líquida)
- Ação Monitória (documento sem força executiva)
- Cumprimento de Sentença (título judicial)
- Embargos ao Cumprimento de Sentença
- Cobrança de Honorários Advocatícios

### BASE JURISPRUDENCIAL
- Art. 389-406 CC: Inadimplemento e mora
- Art. 421-476 CC: Contratos
- Art. 700-702 CPC: Ação monitória
- Art. 513-538 CPC: Cumprimento de sentença
- Súmula 54/STJ: Juros do evento danoso
- Súmula 362/STJ: Correção do arbitramento
- Súmula 379/STJ: Juros moratórios 1% a.m.
- Súmula 382/STJ: Juros >12% não é abusivo
- Súmula 530/STJ: Taxa média de mercado

### PRESCRIÇÃO
- Dívidas líquidas: 5 anos (art. 206, §5º CC)
- Aluguéis: 3 anos
- Honorários: 2 anos

### PARÂMETROS TJES
- Honorários: 10-20% sobre valor da condenação
- Correção: IPCA-E ou SELIC (Tema 1368)
- Juros: 1% a.m. ou SELIC (vedada cumulação)

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO
Marcar [REVISAR] em cálculos, valores e prescrição`,

  agent_divorcio: `# AGENTE JUDICIAL: DIVÓRCIO
## Vara de Família - TJES

### FUNÇÃO
Gerar minutas em ações de divórcio e dissolução de união estável.

### COMPETÊNCIAS
- Divórcio Litigioso (com ou sem partilha)
- Divórcio Consensual (homologação)
- Dissolução de União Estável
- Partilha de Bens (comunhão parcial/universal/separação)
- Alteração de Nome

### BASE JURISPRUDENCIAL
- Art. 226, §6º CF: Divórcio direto (EC 66/2010)
- Art. 1.571-1.590 CC: Dissolução do casamento
- Art. 1.639-1.688 CC: Regimes de bens
- Art. 1.723-1.727 CC: União estável
- Art. 731-734 CPC: Procedimento consensual
- Súmula 197/STJ: Divórcio sem prévia partilha
- Súmula 377/STF: Aquestos na separação legal
- Súmula 380/STF: Sociedade de fato entre concubinos

### PRINCÍPIOS
1. Liberdade - Ninguém é obrigado a permanecer casado
2. Igualdade entre cônjuges - Art. 226, §5º CF
3. Melhor interesse da criança (se houver filhos)
4. Autonomia da vontade

### PARÂMETROS
- Comunhão parcial: aquestos partilhados 50/50
- Bens particulares: excluídos da partilha
- União estável: comunhão parcial (art. 1.725 CC)

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO
Marcar [REVISAR] em regime de bens, patrimônio, filhos`,

  agent_inventario: `# AGENTE JUDICIAL: INVENTÁRIO
## Vara de Família/Sucessões - TJES

### FUNÇÃO
Gerar minutas em inventários, arrolamentos e partilhas.

### COMPETÊNCIAS
- Inventário Judicial (procedimento comum)
- Arrolamento Sumário (capazes e concordes)
- Arrolamento Comum (maiores, com discordância)
- Sobrepartilha (bens omitidos)
- Alvará Judicial (levantamento de valores)
- Colação de Bens

### BASE JURISPRUDENCIAL
- Art. 1.784-1.856 CC: Direito das sucessões
- Art. 1.829 CC: Ordem de vocação hereditária
- Art. 1.845-1.848 CC: Herdeiros necessários e legítima
- Art. 2.002-2.005 CC: Colação
- Art. 610-673 CPC: Inventário e partilha
- Art. 659-666 CPC: Arrolamento
- Súmula 112/STF: ITCMD na abertura da sucessão
- Súmula 331/STF: ITCMD na morte presumida
- Súmula 542/STF: Multa por atraso é constitucional

### ORDEM DE VOCAÇÃO (Art. 1.829 CC)
I - Descendentes + cônjuge
II - Ascendentes + cônjuge
III - Cônjuge sobrevivente
IV - Colaterais até 4º grau

### PARÂMETROS
- Prazo abertura: 2 meses do óbito (art. 610 CPC)
- Legítima: 50% aos herdeiros necessários
- ITCMD: verificar alíquota estadual

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO
Marcar [REVISAR] em monte-mor, quinhões, ITCMD`,

  agent_seguros: `# AGENTE JUDICIAL: SEGUROS
## Vara Cível - TJES

### FUNÇÃO
Gerar minutas em ações envolvendo contratos de seguro.

### COMPETÊNCIAS
- Cobrança de Indenização Securitária
- Seguro de Vida (pagamento ao beneficiário)
- Seguro de Veículo (furto, roubo, colisão)
- Seguro Residencial/Empresarial
- Seguro de Responsabilidade Civil
- Regulação de Sinistro
- Nulidade de Cláusula abusiva

### BASE JURISPRUDENCIAL
- Art. 757-802 CC: Contrato de seguro
- Art. 765 CC: Boa-fé e veracidade
- Art. 766 CC: Declarações falsas
- Art. 771 CC: Comunicação do sinistro
- Art. 778-783 CC: Seguro de dano
- Art. 789-802 CC: Seguro de pessoa
- Súmula 101/STJ: Prescrição 1 ano (seguro em grupo)
- Súmula 402/STJ: Danos morais incluídos
- Súmula 465/STJ: Transferência de veículo
- Súmula 537/STJ: Denunciação da lide
- Súmula 610/STJ: Suicídio (2 anos de carência)

### PRAZOS
- Regulação: 30 dias (Circular SUSEP 256)
- Prescrição: 1 ano da ciência do sinistro
- Carência suicídio: 2 anos

### PARÂMETROS TJES
- Valor veículo: Tabela FIPE como referência
- Danos morais por recusa indevida: R$5k-15k
- Danos morais com agravamento: R$10k-25k

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO
Marcar [REVISAR] em valor de mercado, cobertura, carência`,

  // ============================================================================
  // NOVOS AGENTES v2.5 - FASE 1 (FAMÍLIA)
  // ============================================================================

  agent_alimentos: `# AGENTE JUDICIAL: ALIMENTOS
## Vara de Família - TJES

### FUNÇÃO
Gerar minutas em ações de alimentos (pedido, revisão, exoneração, oferta).

### COMPETÊNCIAS
- Ação de Alimentos (pedido inicial)
- Revisional de Alimentos (majoração/redução)
- Exoneratória de Alimentos (cessação do dever)
- Execução de Alimentos (cumprimento de sentença)
- Oferta de Alimentos

### BASE JURISPRUDENCIAL
- Art. 227, 229 CF: Dever de assistência
- Art. 1.694-1.710 CC: Direito a alimentos
- Art. 1.699 CC: Revisão por mudança de situação
- Art. 1.708 CC: Cessação do dever alimentar
- Lei 5.478/68: Lei de Alimentos
- ECA Lei 8.069/90: Prioridade absoluta
- Súmula 309/STJ: Prisão civil - 3 prestações
- Súmula 336/STJ: Pensão previdenciária e renúncia
- Súmula 358/STJ: Maioridade não extingue automaticamente
- Súmula 594/STJ: MP tem legitimidade ativa
- Súmula 596/STJ: Avós - obrigação complementar
- Súmula 621/STJ: Efeitos retroagem à citação

### BINÔMIO NECESSIDADE x POSSIBILIDADE
- Parâmetro: 15% a 33% dos rendimentos
- Empregado CLT: % sobre salário bruto menos IRPF/INSS
- Autônomo: valor em salários mínimos
- Desemprego: conversão para salários mínimos

### PARÂMETROS TJES
- Alimentos para menor: presunção de necessidade
- Alimentos para maior: necessidade comprovada
- Data de vencimento: até dia 10 de cada mês

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO
Marcar [REVISAR] em rendimentos não comprovados, necessidades especiais`,

  agent_guarda: `# AGENTE JUDICIAL: GUARDA
## Vara de Família - TJES

### FUNÇÃO
Gerar minutas em ações de regulamentação de guarda e visitas.

### COMPETÊNCIAS
- Regulamentação de Guarda (compartilhada ou unilateral)
- Modificação de Guarda (alteração de regime)
- Guarda c/c Regulamentação de Visitas
- Busca e Apreensão de Menor (restituição)

### BASE JURISPRUDENCIAL
- Art. 227 CF: Proteção integral
- Art. 1.583-1.590 CC: Guarda de filhos
- Art. 1.584, §2º CC: Guarda compartilhada como REGRA
- Art. 1.589 CC: Direito de visitas
- ECA Lei 8.069/90: Melhor interesse
- Lei 11.698/08: Guarda compartilhada
- Lei 13.058/14: Guarda compartilhada obrigatória
- Lei 12.318/10: Alienação parental
- Súmula 383/STJ: Competência - domicílio do guardião

### PRINCÍPIOS FUNDAMENTAIS
1. MELHOR INTERESSE DA CRIANÇA (superior)
2. Proteção integral
3. Convivência familiar
4. Igualdade entre genitores

### MODALIDADES
- COMPARTILHADA: REGRA mesmo sem consenso
- UNILATERAL: EXCEÇÃO - apenas se:
  * Um genitor declara não querer
  * Situação de risco comprovada
  * Impossibilidade geográfica absoluta

### REGIME DE CONVIVÊNCIA (sugestão padrão)
- Fins de semana alternados
- Férias divididas 50/50
- Natal/Réveillon alternados
- Dia dos Pais/Mães com respectivo genitor

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO
Marcar [REVISAR] em estudo psicossocial, alienação parental`,

  // Novos agentes v2.5 - Fase 2 (Família/Saúde)
  agent_paternidade: `# AGENTE JUDICIAL: PATERNIDADE
## Vara de Família - TJES

### FUNÇÃO
Gerar minutas em ações de investigação e negatória de paternidade.

### COMPETÊNCIAS
- Investigação de Paternidade (com ou sem alimentos)
- Negatória de Paternidade (impugnação)
- Anulação de Registro Civil (erro ou falsidade)
- Reconhecimento de Paternidade Socioafetiva

### BASE JURISPRUDENCIAL
- Art. 226, §6º CF: Igualdade dos filhos
- Art. 227, §6º CF: Proibição de designações discriminatórias
- Art. 1.593-1.614 CC: Filiação
- Art. 1.597 CC: Presunção pater is est
- Art. 1.601 CC: Imprescritibilidade da negatória
- Lei 8.560/92: Investigação de paternidade
- Art. 27 ECA: Direito personalíssimo
- Súmula 149/STF: Imprescritibilidade da investigação
- Súmula 277/STJ: Alimentos desde a citação
- Súmula 301/STJ: Recusa ao DNA = presunção relativa
- Tema 622/STF: Multiparentalidade

### METODOLOGIA DNA
- Inclusão (>99,99%): Paternidade PROVADA
- Exclusão (0%): Paternidade AFASTADA
- Recusa injustificada: Presunção relativa (Súmula 301)

### PATERNIDADE SOCIOAFETIVA
Requisitos: posse do estado de filho, tractatus, fama, durabilidade.
Tema 622/STF: Coexistência com paternidade biológica.

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO
Marcar [REVISAR] em resultado DNA, socioafetividade, alimentos`,

  agent_execucao_fiscal: `# AGENTE JUDICIAL: EXECUÇÃO FISCAL
## Vara de Fazenda Pública - TJES

### FUNÇÃO
Gerar minutas de decisões e sentenças em execuções fiscais estaduais e municipais.

### COMPETÊNCIAS
- Execução Fiscal (Lei 6.830/80)
- Embargos à Execução Fiscal
- Exceção de Pré-Executividade
- Prescrição Intercorrente (Art. 40 LEF)
- Redirecionamento a Sócios (Art. 135 CTN)
- Cautelar Fiscal (Lei 8.397/92)

### BASE JURISPRUDENCIAL
- Lei 6.830/80: Arts. 1º, 2º, 8º, 16, 40
- CTN: Arts. 156, 173, 174, 135
- CPC: Arts. 784, 803, 917-920
- Súmula 314/STJ: Prescrição intercorrente
- Súmula 392/STJ: Substituição CDA
- Súmula 393/STJ: Exceção de pré-executividade
- Súmula 430/STJ: Inadimplemento não gera redirecionamento
- Súmula 435/STJ: Dissolução irregular
- Tema 444/STJ: Prescrição intercorrente automática
- Tema 566/STJ: Termo inicial prescrição intercorrente

### PARÂMETROS
- VRTE-ES 2026: R$ 4,9383
- CNJ 547/2024: Extinção < R$ 10.000 sem movimentação > 1 ano

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO`,

  agent_resp_civil_estado: `# AGENTE JUDICIAL: RESPONSABILIDADE CIVIL DO ESTADO
## Vara de Fazenda Pública - TJES

### FUNÇÃO
Gerar minutas em ações indenizatórias contra entes públicos.

### COMPETÊNCIAS
- Responsabilidade Objetiva (atos comissivos)
- Responsabilidade Subjetiva (omissões)
- Atos Jurisdicionais (Art. 5º, LXXV CF)
- Atos Legislativos
- Obras Públicas
- Ação Regressiva contra agente

### BASE JURISPRUDENCIAL
- Art. 37, §6º CF: Responsabilidade objetiva
- Art. 5º, V e X CF: Danos morais
- Art. 43 CC: PJ de direito público
- Arts. 186, 927, 944, 950 CC: Responsabilidade civil
- Súmula 37/STJ: Cumulação material e moral
- Súmula 54/STJ: Juros do evento
- Súmula 362/STJ: Correção do arbitramento
- Súmula 387/STJ: Dano estético cumulável
- Tema 940/STF: Morte de detento
- Tema 366/STJ: Omissão subjetiva
- Tema 698/STJ: Prescrição 5 anos

### PARÂMETROS DANOS MORAIS
- Morte: R$ 100k-500k
- Lesão grave: R$ 50k-200k
- Prisão indevida: R$ 50k-300k/ano
- Erro médico: R$ 80k-300k

### ESTRUTURA
I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO`
};

// ============================================================================
// AGENT TO DIRECTORY MAPPING
// ============================================================================

const AGENT_DIRS = {
  agent_bancario: 'bancario',
  agent_consumidor: 'consumidor',
  agent_execucao: 'execucao',
  agent_locacao: 'locacao',
  agent_possessorias: 'possessorias',
  agent_saude_cobertura: 'saude_cobertura',
  agent_saude_contratual: 'saude_contratual',
  agent_reparacao_danos: 'reparacao_danos',
  agent_transito: 'transito',
  agent_usucapiao: 'usucapiao',
  agent_incorporacao: 'incorporacao',
  agent_generico: 'generico',
  // Novos agentes v2.5
  agent_cobranca: 'cobranca',
  agent_divorcio: 'divorcio',
  agent_inventario: 'inventario',
  agent_seguros: 'seguros',
  // Novos agentes v2.5 - Fase 1 (Família)
  agent_alimentos: 'alimentos',
  agent_guarda: 'guarda',
  // Novos agentes v2.5 - Fase 2 (Família/Saúde)
  agent_paternidade: 'paternidade',
  // Novos agentes Fazenda Pública
  agent_execucao_fiscal: 'execucao_fiscal',
  agent_resp_civil_estado: 'resp_civil_estado'
};

// ============================================================================
// VALIDATION CRITERIA
// ============================================================================

const VALIDATION_CRITERIA = {
  // Structure checks
  hasRelatorio: {
    name: 'Relatório (I)',
    regex: /I\s*[-–—]\s*RELAT[ÓO]RIO|RELAT[ÓO]RIO|^I\s*[.-]/im,
    weight: 15
  },
  hasFundamentacao: {
    name: 'Fundamentação (II)',
    regex: /II\s*[-–—]\s*FUNDAMENTA[ÇC][ÃA]O|FUNDAMENTA[ÇC][ÃA]O|^II\s*[.-]/im,
    weight: 15
  },
  hasDispositivo: {
    name: 'Dispositivo (III)',
    regex: /III\s*[-–—]\s*DISPOSITIVO|DISPOSITIVO|^III\s*[.-]/im,
    weight: 15
  },

  // Legal content
  hasLegalBasis: {
    name: 'Base Legal',
    regex: /art(?:igo)?\.?\s*\d+|Lei\s*(?:n[ºo°]?\s*)?\d+|CC|CPC|CDC|CF/i,
    weight: 10
  },
  hasSumula: {
    name: 'Súmulas STJ/STF',
    regex: /[Ss][úu]mula\s*(?:n[ºo°]?\s*)?\d+/,
    weight: 10
  },
  hasJurisprudence: {
    name: 'Jurisprudência',
    regex: /STJ|STF|TJES|TJ[A-Z]{2}|REsp|AgRg|precedent/i,
    weight: 5
  },

  // Decision elements
  hasDecision: {
    name: 'Decisão Clara',
    regex: /JULGO\s*(IM)?PROCEDENTE|CONDENO|DECLARO|DETERMINO|DEFIRO|INDEFIRO/i,
    weight: 10
  },
  hasHonorarios: {
    name: 'Honorários',
    regex: /honor[áa]rios|art(?:igo)?\.?\s*85/i,
    weight: 5
  },
  hasCustas: {
    name: 'Custas Processuais',
    regex: /custas|despesas\s*processuais/i,
    weight: 5
  },

  // Quality markers
  hasReviewMarkers: {
    name: 'Marcadores [REVISAR]',
    regex: /\[REVISAR[^\]]*\]/,
    weight: 5,
    optional: true
  },
  hasMonetaryValues: {
    name: 'Valores Monetários',
    regex: /R\$\s*[\d.,]+/,
    weight: 5
  }
};

// ============================================================================
// API CALL FUNCTION
// ============================================================================

async function callClaude(systemPrompt, userMessage) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }

  const requestBody = JSON.stringify({
    model: CONFIG.model,
    max_tokens: CONFIG.maxTokens,
    temperature: CONFIG.temperature,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userMessage }
    ]
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(requestBody);
    req.end();
  });
}

// ============================================================================
// VALIDATION FUNCTION
// ============================================================================

function validateMinuta(minuta, testCase) {
  const results = {
    totalScore: 0,
    maxScore: 0,
    checks: [],
    summary: {}
  };

  // Run each validation check
  for (const [key, criteria] of Object.entries(VALIDATION_CRITERIA)) {
    const passed = criteria.regex.test(minuta);
    const score = passed ? criteria.weight : 0;

    results.checks.push({
      name: criteria.name,
      passed,
      score,
      maxScore: criteria.weight,
      optional: criteria.optional || false
    });

    if (!criteria.optional) {
      results.maxScore += criteria.weight;
    }
    results.totalScore += score;
  }

  // Calculate percentage
  results.percentage = Math.round((results.totalScore / results.maxScore) * 100);

  // Check expected súmulas if provided
  if (testCase.expectativa?.sumulas_esperadas) {
    const expectedSumulas = testCase.expectativa.sumulas_esperadas;
    const foundSumulas = [];
    const missingSumulas = [];

    for (const sumula of expectedSumulas) {
      const regex = new RegExp(`[Ss][úu]mula\\s*(?:n[ºo°]?\\s*)?${sumula}`, 'i');
      if (regex.test(minuta)) {
        foundSumulas.push(sumula);
      } else {
        missingSumulas.push(sumula);
      }
    }

    results.summary.expectedSumulas = {
      found: foundSumulas,
      missing: missingSumulas,
      percentage: Math.round((foundSumulas.length / expectedSumulas.length) * 100)
    };
  }

  // Word count
  results.summary.wordCount = minuta.split(/\s+/).length;

  // Structure analysis
  results.summary.structure = {
    hasRelatorio: VALIDATION_CRITERIA.hasRelatorio.regex.test(minuta),
    hasFundamentacao: VALIDATION_CRITERIA.hasFundamentacao.regex.test(minuta),
    hasDispositivo: VALIDATION_CRITERIA.hasDispositivo.regex.test(minuta)
  };

  return results;
}

// ============================================================================
// BUILD USER MESSAGE
// ============================================================================

function buildUserMessage(testCase) {
  return `## PROCESSO

**Classe:** ${testCase.classe || 'Não informada'}
**Assunto:** ${testCase.assunto || 'Não informado'}
**Valor da Causa:** ${testCase.valor_causa ? 'R$ ' + Number(testCase.valor_causa).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : 'Não informado'}

---

## ANÁLISE FIRAC

### FATOS
${testCase.fatos || '[Não fornecido]'}

### QUESTÕES JURÍDICAS
${testCase.questoes || '[Não fornecido]'}

### PEDIDOS
${testCase.pedidos || '[Não fornecido]'}

---

## TAREFA

Gere a **minuta completa de sentença/decisão** para este caso.

**Siga rigorosamente a estrutura:**
- I - RELATÓRIO (síntese objetiva)
- II - FUNDAMENTAÇÃO (preliminares + mérito + jurisprudência)
- III - DISPOSITIVO (julgamento + sucumbência)

**Use marcadores [REVISAR: motivo] para qualquer ponto de incerteza.**`;
}

// ============================================================================
// TEST SINGLE AGENT
// ============================================================================

async function testAgent(agentName, verbose = false, useRealCases = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🤖 Testing Agent: ${agentName}${useRealCases ? ' (PROCESSOS REAIS)' : ''}`);
  console.log('='.repeat(60));

  const systemPrompt = SYSTEM_PROMPTS[agentName];
  if (!systemPrompt) {
    console.error(`❌ Unknown agent: ${agentName}`);
    return null;
  }

  const dirName = AGENT_DIRS[agentName];
  const testDir = useRealCases
    ? path.join(CONFIG.realCasesDir, dirName)
    : path.join(CONFIG.testCasesDir, dirName);

  if (!fs.existsSync(testDir)) {
    if (useRealCases) {
      console.log(`⚠️  No real cases directory for ${agentName}, skipping...`);
      return [];
    }
    console.error(`❌ Test directory not found: ${testDir}`);
    return null;
  }

  const testFiles = fs.readdirSync(testDir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(testDir, f));

  if (testFiles.length === 0) {
    if (useRealCases) {
      console.log(`⚠️  No real cases found for ${agentName}, skipping...`);
      return [];
    }
    console.error(`❌ No test cases found in ${testDir}`);
    return null;
  }

  console.log(`📂 Found ${testFiles.length} ${useRealCases ? 'real case' : 'test case'}(s)`);

  const results = [];

  for (const testFile of testFiles) {
    const testCase = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    console.log(`\n📋 Test: ${testCase.caso_id} - ${testCase.descricao}`);

    const userMessage = buildUserMessage(testCase);

    try {
      const startTime = Date.now();
      console.log('   ⏳ Calling Claude API...');

      const response = await callClaude(systemPrompt, userMessage);
      const endTime = Date.now();

      const minuta = response.content[0]?.text || '';
      const validation = validateMinuta(minuta, testCase);

      const result = {
        testCase: testCase.caso_id,
        descricao: testCase.descricao,
        agente: agentName,
        success: true,
        executionTime: endTime - startTime,
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
        validation,
        minuta: verbose ? minuta : minuta.substring(0, 500) + '...'
      };

      results.push(result);

      // Print summary
      const scoreEmoji = validation.percentage >= 75 ? '✅' : validation.percentage >= 50 ? '⚠️' : '❌';
      console.log(`   ${scoreEmoji} Score: ${validation.percentage}% (${validation.totalScore}/${validation.maxScore})`);
      console.log(`   📊 Words: ${validation.summary.wordCount}`);
      console.log(`   ⏱️  Time: ${result.executionTime}ms`);
      console.log(`   💰 Tokens: ${result.inputTokens} in / ${result.outputTokens} out`);

      if (validation.summary.expectedSumulas) {
        const s = validation.summary.expectedSumulas;
        console.log(`   📜 Súmulas: ${s.found.length}/${s.found.length + s.missing.length} (${s.percentage}%)`);
        if (s.missing.length > 0) {
          console.log(`      Missing: ${s.missing.join(', ')}`);
        }
      }

      // Print structure
      const struct = validation.summary.structure;
      console.log(`   📝 Structure: R:${struct.hasRelatorio ? '✓' : '✗'} F:${struct.hasFundamentacao ? '✓' : '✗'} D:${struct.hasDispositivo ? '✓' : '✗'}`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        testCase: testCase.caso_id,
        descricao: testCase.descricao,
        agente: agentName,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const testAll = args.includes('--all') || args.includes('-a');
  const useRealCases = args.includes('--real') || args.includes('-r');

  console.log('🏛️  Lex Intelligentia - Agent Validator');
  console.log('========================================\n');

  if (useRealCases) {
    console.log('📂 Modo: PROCESSOS REAIS\n');
  }

  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable not set');
    console.log('\nUsage:');
    console.log('  export ANTHROPIC_API_KEY=sk-ant-...');
    console.log('  node scripts/agent_validator.js bancario');
    process.exit(1);
  }

  // Ensure results directory exists
  if (!fs.existsSync(CONFIG.resultsDir)) {
    fs.mkdirSync(CONFIG.resultsDir, { recursive: true });
  }

  let agentsToTest = [];

  if (testAll) {
    agentsToTest = Object.keys(SYSTEM_PROMPTS);
  } else {
    const agentArg = args.find(a => !a.startsWith('-'));
    if (agentArg) {
      const normalizedAgent = agentArg.startsWith('agent_') ? agentArg : `agent_${agentArg}`;
      if (SYSTEM_PROMPTS[normalizedAgent]) {
        agentsToTest = [normalizedAgent];
      } else {
        console.error(`❌ Unknown agent: ${agentArg}`);
        console.log('\nAvailable agents:');
        Object.keys(AGENT_DIRS).forEach(a => console.log(`  - ${a.replace('agent_', '')}`));
        process.exit(1);
      }
    } else {
      console.log('Usage:');
      console.log('  node scripts/agent_validator.js <agent_name>');
      console.log('  node scripts/agent_validator.js --all');
      console.log('  node scripts/agent_validator.js --all --real  (processos reais)');
      console.log('\nFlags:');
      console.log('  --all, -a      Test all agents');
      console.log('  --real, -r     Use real PDF cases');
      console.log('  --verbose, -v  Show full response');
      console.log('\nAvailable agents:');
      Object.keys(AGENT_DIRS).forEach(a => console.log(`  - ${a.replace('agent_', '')}`));
      process.exit(0);
    }
  }

  console.log(`📋 Testing ${agentsToTest.length} agent(s): ${agentsToTest.map(a => a.replace('agent_', '')).join(', ')}`);

  const allResults = [];
  const summary = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    avgScore: 0,
    byAgent: {}
  };

  for (const agent of agentsToTest) {
    const results = await testAgent(agent, verbose, useRealCases);
    if (results && results.length > 0) {
      allResults.push(...results);

      const agentSummary = {
        tests: results.length,
        passed: results.filter(r => r.success && r.validation?.percentage >= 75).length,
        avgScore: Math.round(results.filter(r => r.success).reduce((sum, r) => sum + (r.validation?.percentage || 0), 0) / results.filter(r => r.success).length) || 0
      };

      summary.byAgent[agent] = agentSummary;
      summary.totalTests += agentSummary.tests;
      summary.passed += agentSummary.passed;
    }
  }

  summary.failed = summary.totalTests - summary.passed;
  summary.avgScore = Math.round(allResults.filter(r => r.success).reduce((sum, r) => sum + (r.validation?.percentage || 0), 0) / allResults.filter(r => r.success).length) || 0;

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const resultsFile = path.join(CONFIG.resultsDir, `validation_${timestamp}.json`);

  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary,
    results: allResults
  }, null, 2));

  // Print final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nTotal Tests: ${summary.totalTests}`);
  console.log(`Passed (≥75%): ${summary.passed}`);
  console.log(`Failed (<75%): ${summary.failed}`);
  console.log(`Average Score: ${summary.avgScore}%`);
  console.log('\nBy Agent:');

  for (const [agent, stats] of Object.entries(summary.byAgent)) {
    const emoji = stats.avgScore >= 75 ? '✅' : stats.avgScore >= 50 ? '⚠️' : '❌';
    console.log(`  ${emoji} ${agent.replace('agent_', '').padEnd(20)} Score: ${stats.avgScore}% (${stats.passed}/${stats.tests} passed)`);
  }

  console.log(`\n💾 Results saved to: ${resultsFile}`);
}

main().catch(console.error);
