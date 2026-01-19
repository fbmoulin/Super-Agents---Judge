# Lex Intelligentia v2.1.1 - Production Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Validate the Lex Intelligentia workflow in production with 10 real anonymized legal cases (5 bancário + 5 consumidor) to confirm QA scores, execution times, and compliance.

**Architecture:** Execute POST requests against the n8n Cloud webhook, capture responses, validate QA scores, and document results in a structured test report. Each case tests the full pipeline: Gemini Router → Context Buffer → Claude Agent → QA Hybrid → Audit Log.

**Tech Stack:** curl/httpie for requests, Node.js for validation scripts, Google Sheets for audit logs, n8n Cloud webhook endpoint.

---

## Prerequisites

Before starting, ensure:
- [ ] n8n Cloud workflow is ACTIVE (not paused)
- [ ] Webhook URL is accessible: `https://[YOUR-N8N].app.n8n.cloud/webhook/lex-intelligentia-agentes`
- [ ] Google Sheets audit log is configured
- [ ] Gemini API and Anthropic API credentials are valid

---

## Task 1: Create Test Cases Directory Structure

**Files:**
- Create: `test_cases/README.md`
- Create: `test_cases/bancario/caso_01_emprestimo_consignado.json`
- Create: `test_cases/bancario/caso_02_juros_abusivos.json`
- Create: `test_cases/bancario/caso_03_fraude_cartao.json`
- Create: `test_cases/bancario/caso_04_negativacao_indevida_banco.json`
- Create: `test_cases/bancario/caso_05_revisional_contrato.json`
- Create: `test_cases/consumidor/caso_01_falha_servico.json`
- Create: `test_cases/consumidor/caso_02_produto_defeituoso.json`
- Create: `test_cases/consumidor/caso_03_cobranca_indevida.json`
- Create: `test_cases/consumidor/caso_04_propaganda_enganosa.json`
- Create: `test_cases/consumidor/caso_05_plano_saude_negativa.json`

**Step 1: Create directory structure**

```bash
mkdir -p test_cases/bancario test_cases/consumidor
```

**Step 2: Create README for test cases**

Create file `test_cases/README.md`:

```markdown
# Casos de Teste - Lex Intelligentia v2.1.1

## Estrutura dos Casos

Cada arquivo JSON segue o formato FIRAC:

```json
{
  "caso_id": "bancario_01",
  "descricao": "Empréstimo consignado fraudulento",
  "fatos": "...",
  "questoes": "...",
  "pedidos": "...",
  "classe": "Procedimento Comum Cível",
  "assunto": "..."
}
```

## Casos Bancários (5)

| ID | Descrição | Súmulas Esperadas |
|----|-----------|-------------------|
| bancario_01 | Empréstimo consignado fraudulento | 297, 479 STJ |
| bancario_02 | Juros abusivos em financiamento | 381, 382, 539 STJ |
| bancario_03 | Fraude em cartão de crédito | 479 STJ |
| bancario_04 | Negativação indevida por banco | 385, 388 STJ |
| bancario_05 | Ação revisional de contrato | 381, 382, 603 STJ |

## Casos Consumidor (5)

| ID | Descrição | Súmulas Esperadas |
|----|-----------|-------------------|
| consumidor_01 | Falha na prestação de serviço | Art. 14 CDC |
| consumidor_02 | Produto com defeito de fabricação | Art. 18 CDC |
| consumidor_03 | Cobrança indevida de serviço | Art. 42 CDC |
| consumidor_04 | Propaganda enganosa | Art. 37 CDC |
| consumidor_05 | Plano de saúde - negativa cobertura | Súmula 302 STJ |

## Critérios de Validação

- Score QA ≥ 70 para aprovação
- Estrutura I/II/III presente
- Base legal citada
- Marcadores [REVISAR] ≤ 5
```

**Step 3: Commit structure**

```bash
git add test_cases/
git commit -m "test: create test cases directory structure for production validation"
```

---

## Task 2: Create Bancário Test Cases (5)

**Files:**
- Create: `test_cases/bancario/caso_01_emprestimo_consignado.json`
- Create: `test_cases/bancario/caso_02_juros_abusivos.json`
- Create: `test_cases/bancario/caso_03_fraude_cartao.json`
- Create: `test_cases/bancario/caso_04_negativacao_indevida_banco.json`
- Create: `test_cases/bancario/caso_05_revisional_contrato.json`

**Step 1: Create caso_01_emprestimo_consignado.json**

```json
{
  "caso_id": "bancario_01",
  "descricao": "Empréstimo consignado fraudulento - aposentado vítima de fraude",
  "fatos": "O autor, aposentado do INSS com 72 anos de idade, alega que em outubro de 2025 passou a receber descontos mensais de R$ 450,00 em seu benefício previdenciário referentes a um suposto empréstimo consignado no valor de R$ 8.500,00 junto ao Banco Réu. Afirma que nunca solicitou tal empréstimo, não assinou qualquer contrato e não recebeu os valores em sua conta. Ao procurar o banco, foi informado que o contrato foi celebrado via aplicativo, com biometria facial. O autor sustenta que jamais baixou o aplicativo do banco nem realizou qualquer operação digital. Juntou aos autos extratos bancários demonstrando a ausência de crédito correspondente ao empréstimo e boletim de ocorrência registrado em 15/10/2025.",
  "questoes": "1) Houve falha na prestação do serviço bancário ao permitir contratação fraudulenta? 2) É cabível a declaração de inexistência do débito? 3) São devidos danos morais pela situação vivenciada? 4) Há direito à repetição do indébito dos valores descontados?",
  "pedidos": "a) Declaração de inexistência do contrato de empréstimo; b) Cessação imediata dos descontos no benefício; c) Restituição em dobro dos valores descontados (R$ 2.250,00 x 2 = R$ 4.500,00); d) Condenação em danos morais no valor de R$ 15.000,00; e) Inversão do ônus da prova; f) Justiça gratuita.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Empréstimo consignado - Fraude - Responsabilidade civil",
  "valor_causa": 19500.00,
  "expectativa": {
    "agente_esperado": "agent_bancario",
    "score_minimo": 75,
    "sumulas_esperadas": ["297", "479"],
    "danos_morais_faixa": "8000-25000"
  }
}
```

**Step 2: Create caso_02_juros_abusivos.json**

```json
{
  "caso_id": "bancario_02",
  "descricao": "Juros abusivos em financiamento de veículo",
  "fatos": "O autor celebrou contrato de financiamento de veículo com o Banco Réu em março de 2024, no valor de R$ 45.000,00, para aquisição de automóvel usado. O contrato prevê 48 parcelas de R$ 1.890,00, totalizando R$ 90.720,00. Alega que os juros praticados (taxa de 3,8% ao mês, equivalente a 56,44% ao ano) são abusivos, superando em mais de 150% a taxa média de mercado divulgada pelo BACEN para operações similares no período (1,5% ao mês). Sustenta ainda a cobrança de tarifa de cadastro (R$ 850,00) e seguro prestamista (R$ 2.100,00) sem opção de recusa. Apresentou simulação demonstrando que, aplicando-se a taxa média de mercado, o valor total seria de R$ 62.100,00.",
  "questoes": "1) Os juros contratados são abusivos por superarem a taxa média de mercado? 2) É possível a revisão judicial do contrato para adequação à taxa média? 3) As tarifas cobradas são legítimas? 4) É devida a restituição dos valores pagos a maior?",
  "pedidos": "a) Revisão do contrato para aplicação da taxa média BACEN; b) Declaração de nulidade da tarifa de cadastro e seguro prestamista; c) Recálculo das parcelas vincendas; d) Restituição simples dos valores pagos a maior; e) Manutenção na posse do veículo durante a demanda.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Contratos bancários - Juros - Revisional",
  "valor_causa": 28620.00,
  "expectativa": {
    "agente_esperado": "agent_bancario",
    "score_minimo": 75,
    "sumulas_esperadas": ["381", "382", "539"],
    "parametro_juros": "1.5x taxa média BACEN"
  }
}
```

**Step 3: Create caso_03_fraude_cartao.json**

```json
{
  "caso_id": "bancario_03",
  "descricao": "Fraude em cartão de crédito - compras não reconhecidas",
  "fatos": "A autora, servidora pública estadual, alega que em dezembro de 2025 identificou em sua fatura de cartão de crédito do Banco Réu três compras internacionais que não reconhece: uma no valor de US$ 890,00 (R$ 5.340,00) em site de eletrônicos, outra de US$ 450,00 (R$ 2.700,00) em site de apostas online, e uma terceira de US$ 320,00 (R$ 1.920,00) em loja de games. Afirma que estava de posse do cartão físico, não realizou compras internacionais e nunca acessou tais sites. Comunicou o banco em 05/12/2025, que negou o cancelamento alegando que as compras foram autenticadas por senha e 3D Secure. A autora teve seu nome incluído no SERASA em 10/01/2026 pelo não pagamento da fatura, causando-lhe constrangimento ao ter crédito negado para financiamento de imóvel.",
  "questoes": "1) Houve falha de segurança do sistema do banco ao permitir transações fraudulentas? 2) É cabível a declaração de inexigibilidade dos débitos? 3) A negativação foi indevida? 4) São devidos danos morais?",
  "pedidos": "a) Declaração de inexigibilidade dos débitos contestados (R$ 9.960,00); b) Exclusão do nome da autora dos cadastros de inadimplentes; c) Condenação em danos morais no valor de R$ 20.000,00; d) Inversão do ônus da prova.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Cartão de crédito - Fraude - Negativação indevida",
  "valor_causa": 29960.00,
  "expectativa": {
    "agente_esperado": "agent_bancario",
    "score_minimo": 75,
    "sumulas_esperadas": ["479", "385"],
    "danos_morais_faixa": "5000-20000"
  }
}
```

**Step 4: Create caso_04_negativacao_indevida_banco.json**

```json
{
  "caso_id": "bancario_04",
  "descricao": "Negativação indevida após quitação de dívida",
  "fatos": "O autor celebrou acordo de renegociação de dívida de cartão de crédito com o Banco Réu em agosto de 2025, no valor de R$ 12.000,00 parcelados em 12 vezes de R$ 1.200,00. Quitou integralmente todas as parcelas até julho de 2025, conforme comprovantes anexados. Ocorre que em outubro de 2025 foi surpreendido com a manutenção de seu nome nos cadastros do SERASA e SPC referente à mesma dívida, no valor original de R$ 18.500,00 (antes do acordo). Procurou o banco por três vezes (protocolo anexo), sendo informado que a baixa seria realizada em até 5 dias úteis, o que não ocorreu. Permanece negativado há mais de 90 dias após a quitação, tendo sido impedido de abrir conta em outro banco e obter cartão de crédito.",
  "questoes": "1) A manutenção da negativação após quitação configura ato ilícito? 2) O dano moral é presumido (in re ipsa)? 3) Qual o valor adequado para indenização? 4) Cabe dano moral mesmo havendo outras negativações preexistentes?",
  "pedidos": "a) Exclusão definitiva do nome do autor dos cadastros restritivos; b) Declaração de quitação da dívida; c) Condenação em danos morais no valor de R$ 10.000,00.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Negativação indevida - Danos morais - Quitação",
  "valor_causa": 10000.00,
  "expectativa": {
    "agente_esperado": "agent_bancario",
    "score_minimo": 75,
    "sumulas_esperadas": ["385", "388"],
    "danos_morais_faixa": "5000-15000",
    "verificar_sumula_385": true
  }
}
```

**Step 5: Create caso_05_revisional_contrato.json**

```json
{
  "caso_id": "bancario_05",
  "descricao": "Ação revisional de contrato de crédito pessoal",
  "fatos": "O autor contratou empréstimo pessoal com o Banco Réu em janeiro de 2025, no valor de R$ 30.000,00, com previsão de 36 parcelas de R$ 1.650,00 (total R$ 59.400,00). Alega que: (i) a taxa de juros de 4,2% ao mês (63,21% ao ano) supera em mais de 180% a taxa média BACEN (1,5% ao mês); (ii) foi cobrada tarifa de abertura de crédito (TAC) de R$ 1.500,00; (iii) o contrato prevê capitalização mensal de juros; (iv) há cláusula de comissão de permanência cumulada com multa e juros moratórios. Pagou 10 parcelas (R$ 16.500,00) e pretende continuar adimplente, desde que revistas as cláusulas abusivas. Juntou planilha de cálculo demonstrando diferença de R$ 15.840,00 entre o contratado e o valor com taxa média de mercado.",
  "questoes": "1) Os juros remuneratórios podem ser limitados à taxa média BACEN? 2) A TAC é válida em contratos bancários? 3) É possível a capitalização mensal de juros? 4) A comissão de permanência pode ser cumulada com outros encargos? 5) O autor pode depositar judicialmente os valores incontroversos?",
  "pedidos": "a) Revisão do contrato para aplicação da taxa média BACEN; b) Declaração de nulidade da TAC; c) Afastamento da capitalização ilegal de juros; d) Vedação da cumulação de comissão de permanência com outros encargos; e) Recálculo do saldo devedor; f) Autorização para depósito judicial das parcelas recalculadas; g) Manutenção do nome do autor fora dos cadastros de inadimplentes enquanto perdurar a demanda.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Contrato bancário - Revisional - Juros",
  "valor_causa": 15840.00,
  "expectativa": {
    "agente_esperado": "agent_bancario",
    "score_minimo": 75,
    "sumulas_esperadas": ["381", "382", "539", "603"],
    "verificar_capitalizacao": true
  }
}
```

**Step 6: Commit bancário cases**

```bash
git add test_cases/bancario/
git commit -m "test: add 5 bancário test cases for production validation"
```

---

## Task 3: Create Consumidor Test Cases (5)

**Files:**
- Create: `test_cases/consumidor/caso_01_falha_servico.json`
- Create: `test_cases/consumidor/caso_02_produto_defeituoso.json`
- Create: `test_cases/consumidor/caso_03_cobranca_indevida.json`
- Create: `test_cases/consumidor/caso_04_propaganda_enganosa.json`
- Create: `test_cases/consumidor/caso_05_plano_saude_negativa.json`

**Step 1: Create caso_01_falha_servico.json**

```json
{
  "caso_id": "consumidor_01",
  "descricao": "Falha na prestação de serviço de telecomunicações",
  "fatos": "A autora contratou serviço de internet banda larga da empresa Ré em março de 2025, plano de 500 Mbps pelo valor mensal de R$ 149,90. Desde a instalação, alega que a velocidade real nunca ultrapassou 150 Mbps, conforme medições realizadas pelo aplicativo oficial da ANATEL (prints anexados). Registrou 12 reclamações no SAC da empresa entre abril e novembro de 2025 (protocolos anexados), sem solução definitiva. Os técnicos compareceram à residência em 4 ocasiões, sempre atribuindo o problema a 'oscilações normais da rede'. A autora trabalha em home office e alega prejuízos profissionais por quedas constantes durante videoconferências, tendo recebido advertência formal de seu empregador. Cancelou o serviço em dezembro de 2025 e foi cobrada multa de fidelidade de R$ 890,00.",
  "questoes": "1) Houve falha na prestação do serviço caracterizada pelo descumprimento contratual? 2) A cobrança de multa de fidelidade é devida quando o cancelamento decorre de falha do fornecedor? 3) São cabíveis danos morais pela situação vivenciada? 4) É possível a restituição dos valores pagos pelo serviço não prestado adequadamente?",
  "pedidos": "a) Declaração de inexigibilidade da multa de fidelidade; b) Restituição proporcional das mensalidades pagas (R$ 1.349,10 - 9 meses x R$ 149,90); c) Condenação em danos morais no valor de R$ 8.000,00.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Prestação de serviços - Telecomunicações - CDC",
  "valor_causa": 10238.10,
  "expectativa": {
    "agente_esperado": "agent_consumidor",
    "score_minimo": 75,
    "artigos_esperados": ["Art. 14 CDC", "Art. 20 CDC"],
    "danos_morais_faixa": "5000-15000"
  }
}
```

**Step 2: Create caso_02_produto_defeituoso.json**

```json
{
  "caso_id": "consumidor_02",
  "descricao": "Produto com defeito de fabricação - celular",
  "fatos": "O autor adquiriu smartphone da marca X, modelo Premium Plus, na loja Ré em setembro de 2025, pelo valor de R$ 6.500,00 (nota fiscal anexa). Após 45 dias de uso normal, o aparelho passou a apresentar superaquecimento durante carregamento, chegando a queimar levemente a mão do autor em uma ocasião (foto e laudo médico anexados). Encaminhou o produto à assistência técnica autorizada em novembro de 2025, que reteve o aparelho por 42 dias sem solução, informando que 'o defeito não foi constatado em laboratório'. O autor realizou nova reclamação no PROCON (protocolo anexo) e foi informado que o prazo legal de 30 dias havia sido ultrapassado. O aparelho continua com o mesmo problema e está inutilizável há mais de 60 dias.",
  "questoes": "1) Houve vício do produto que o torna impróprio ao uso? 2) O prazo de 30 dias para conserto foi ultrapassado? 3) O consumidor pode optar pela restituição do valor pago? 4) São cabíveis danos morais pela queimadura e pela privação do uso do bem?",
  "pedidos": "a) Restituição integral do valor pago (R$ 6.500,00), devidamente corrigido; b) Condenação em danos morais no valor de R$ 5.000,00; c) Condenação em danos materiais correspondentes ao tratamento da queimadura (R$ 350,00).",
  "classe": "Procedimento Comum Cível",
  "assunto": "Produto defeituoso - Vício - CDC",
  "valor_causa": 11850.00,
  "expectativa": {
    "agente_esperado": "agent_consumidor",
    "score_minimo": 75,
    "artigos_esperados": ["Art. 18 CDC", "Art. 12 CDC"],
    "prazo_30_dias": true
  }
}
```

**Step 3: Create caso_03_cobranca_indevida.json**

```json
{
  "caso_id": "consumidor_03",
  "descricao": "Cobrança indevida de serviço não contratado",
  "fatos": "A autora é cliente da operadora de telefonia Ré desde 2020, com plano pós-pago de R$ 89,90 mensais. Em julho de 2025, passou a ser cobrada por um serviço de 'Seguro Celular Premium' no valor de R$ 29,90 mensais, que alega nunca ter contratado. Entrou em contato com a operadora em agosto de 2025 para cancelamento, sendo informada que o serviço havia sido 'ativado por aceite em ligação telefônica'. Solicitou a gravação da ligação, que não foi fornecida. Mesmo após o cancelamento, os valores continuaram sendo cobrados por mais 4 meses (setembro a dezembro de 2025), totalizando R$ 179,40 indevidamente cobrados. Teve o serviço de telefonia suspenso em janeiro de 2026 por não pagar a parte controversa da fatura, ficando 5 dias sem comunicação.",
  "questoes": "1) A cobrança de serviço não contratado é prática abusiva? 2) A restituição deve ser simples ou em dobro? 3) A suspensão do serviço por débito controverso é legítima? 4) São cabíveis danos morais?",
  "pedidos": "a) Declaração de inexistência da contratação do serviço 'Seguro Celular Premium'; b) Restituição em dobro dos valores indevidamente cobrados (R$ 179,40 x 2 = R$ 358,80); c) Condenação em danos morais no valor de R$ 5.000,00 pela suspensão indevida do serviço.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Cobrança indevida - Serviço não contratado - CDC",
  "valor_causa": 5358.80,
  "expectativa": {
    "agente_esperado": "agent_consumidor",
    "score_minimo": 75,
    "artigos_esperados": ["Art. 42 CDC", "Art. 39 CDC"],
    "restituicao_dobro": true
  }
}
```

**Step 4: Create caso_04_propaganda_enganosa.json**

```json
{
  "caso_id": "consumidor_04",
  "descricao": "Propaganda enganosa em venda de curso online",
  "fatos": "O autor adquiriu curso online de 'Formação em Day Trade - Do Zero ao Milhão' oferecido pela empresa Ré em agosto de 2025, pelo valor de R$ 4.997,00 parcelado em 12x no cartão de crédito. A propaganda no Instagram prometia: 'Ganhe R$ 10.000,00 por mês operando apenas 2 horas por dia', 'Método comprovado com 95% de acerto', 'Garantia de resultado ou dinheiro de volta'. Após assistir a 60% do conteúdo (15 módulos de 25), constatou que: (i) o método não é replicável conforme prometido; (ii) não há comprovação dos resultados alardeados; (iii) ao solicitar reembolso pela 'garantia de resultado', foi informado que a garantia só vale se assistir 100% do curso e 'aplicar corretamente' o método por 90 dias. Juntou prints da propaganda e termos de uso que contêm cláusulas em letras miúdas contradizendo as promessas principais.",
  "questoes": "1) A publicidade veiculada é enganosa nos termos do CDC? 2) As cláusulas restritivas da garantia são abusivas por serem contraditórias à oferta? 3) O consumidor tem direito ao reembolso integral? 4) São cabíveis danos morais?",
  "pedidos": "a) Declaração de nulidade das cláusulas restritivas da garantia; b) Rescisão do contrato por culpa exclusiva da Ré; c) Restituição integral do valor pago (R$ 4.997,00); d) Condenação em danos morais no valor de R$ 3.000,00.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Propaganda enganosa - Curso online - CDC",
  "valor_causa": 7997.00,
  "expectativa": {
    "agente_esperado": "agent_consumidor",
    "score_minimo": 75,
    "artigos_esperados": ["Art. 37 CDC", "Art. 30 CDC", "Art. 51 CDC"],
    "propaganda_enganosa": true
  }
}
```

**Step 5: Create caso_05_plano_saude_negativa.json**

```json
{
  "caso_id": "consumidor_05",
  "descricao": "Plano de saúde - negativa de cobertura de cirurgia",
  "fatos": "A autora, 58 anos, é beneficiária do plano de saúde da operadora Ré desde 2018, plano empresarial categoria Executivo (R$ 1.850,00/mês). Em novembro de 2025, foi diagnosticada com hérnia de disco lombar L4-L5 com compressão radicular, necessitando de cirurgia de artrodese lombar com urgência, conforme relatório médico anexado. Solicitou autorização em 20/11/2025, sendo negada em 25/11/2025 sob a alegação de que 'o procedimento não consta no rol da ANS' e 'necessita de junta médica para avaliação'. A autora apresentou recurso administrativo com parecer de dois neurocirurgiões atestando a urgência, sendo novamente negado em 05/12/2025. Atualmente está afastada do trabalho, com dores intensas e perda de sensibilidade no membro inferior direito, utilizando medicação controlada (receitas anexas). O médico assistente atesta risco de lesão neurológica permanente se a cirurgia não for realizada em até 30 dias.",
  "questoes": "1) A negativa de cobertura é abusiva, considerando a urgência médica? 2) O rol da ANS é taxativo ou exemplificativo? 3) É cabível tutela de urgência para realização imediata da cirurgia? 4) São devidos danos morais pela negativa indevida em momento de fragilidade?",
  "pedidos": "a) TUTELA DE URGÊNCIA para realização imediata da cirurgia, sob pena de multa diária; b) Condenação da Ré a arcar com todos os custos do procedimento e internação; c) Condenação em danos morais no valor de R$ 20.000,00; d) Manutenção do plano de saúde durante a demanda.",
  "classe": "Procedimento Comum Cível",
  "assunto": "Plano de saúde - Negativa de cobertura - Cirurgia urgente",
  "valor_causa": 80000.00,
  "expectativa": {
    "agente_esperado": "agent_consumidor",
    "score_minimo": 75,
    "sumulas_esperadas": ["302 STJ"],
    "danos_morais_faixa": "10000-30000",
    "urgencia": true
  }
}
```

**Step 6: Commit consumidor cases**

```bash
git add test_cases/consumidor/
git commit -m "test: add 5 consumidor test cases for production validation"
```

---

## Task 4: Create Test Runner Script

**Files:**
- Create: `test_cases/run_production_tests.js`

**Step 1: Create the test runner script**

```javascript
#!/usr/bin/env node
/**
 * Lex Intelligentia v2.1.1 - Production Test Runner
 * Executes all test cases against n8n Cloud webhook
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // IMPORTANT: Replace with your actual webhook URL
  webhookUrl: process.env.WEBHOOK_URL || 'https://YOUR-N8N.app.n8n.cloud/webhook/lex-intelligentia-agentes',
  timeout: 120000, // 2 minutes per request
  delayBetweenTests: 5000, // 5 seconds between tests
  outputDir: './test_results'
};

// ============================================================================
// UTILITIES
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// HTTP REQUEST
// ============================================================================

async function sendRequest(testCase) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      fatos: testCase.fatos,
      questoes: testCase.questoes,
      pedidos: testCase.pedidos,
      classe: testCase.classe,
      assunto: testCase.assunto,
      valor_causa: testCase.valor_causa
    });

    const url = new URL(CONFIG.webhookUrl);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: CONFIG.timeout
    };

    const startTime = Date.now();

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);

      res.on('end', () => {
        const endTime = Date.now();
        try {
          const response = JSON.parse(data);
          resolve({
            success: true,
            statusCode: res.statusCode,
            response,
            executionTime: endTime - startTime
          });
        } catch (e) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: 'Invalid JSON response',
            rawResponse: data,
            executionTime: endTime - startTime
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        success: false,
        error: e.message,
        executionTime: Date.now() - startTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        executionTime: CONFIG.timeout
      });
    });

    req.write(payload);
    req.end();
  });
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateResponse(testCase, result) {
  const validation = {
    passed: true,
    checks: []
  };

  if (!result.success || !result.response) {
    validation.passed = false;
    validation.checks.push({ name: 'Response received', passed: false, detail: result.error });
    return validation;
  }

  const response = result.response;

  // Check 1: Success flag
  const successCheck = response.success === true;
  validation.checks.push({
    name: 'Success flag',
    passed: successCheck,
    detail: successCheck ? 'true' : `false - ${response.error?.codigo || 'unknown'}`
  });
  if (!successCheck) validation.passed = false;

  // Check 2: Minuta present
  const minutaPresent = !!response.minuta?.conteudo;
  validation.checks.push({
    name: 'Minuta present',
    passed: minutaPresent,
    detail: minutaPresent ? `${response.minuta.palavras} words` : 'Missing'
  });
  if (!minutaPresent) validation.passed = false;

  // Check 3: QA Score
  const qaScore = response.qualidade?.score || 0;
  const qaCheck = qaScore >= (testCase.expectativa?.score_minimo || 70);
  validation.checks.push({
    name: 'QA Score',
    passed: qaCheck,
    detail: `${qaScore}/100 (min: ${testCase.expectativa?.score_minimo || 70})`
  });
  if (!qaCheck) validation.passed = false;

  // Check 4: Correct agent
  const expectedAgent = testCase.expectativa?.agente_esperado;
  const actualAgent = response.compliance?.agente;
  const agentCheck = !expectedAgent || actualAgent === expectedAgent;
  validation.checks.push({
    name: 'Correct agent',
    passed: agentCheck,
    detail: `${actualAgent} (expected: ${expectedAgent || 'any'})`
  });
  if (!agentCheck) validation.passed = false;

  // Check 5: Structure (I/II/III)
  const content = response.minuta?.conteudo || '';
  const hasRelatorio = /I\s*[-–.]\s*RELAT[ÓO]RIO/i.test(content);
  const hasFundamentacao = /II\s*[-–.]\s*FUNDAMENTA[ÇC][ÃA]O/i.test(content);
  const hasDispositivo = /III\s*[-–.]\s*DISPOSITIVO/i.test(content);
  const structureCheck = hasRelatorio && hasFundamentacao && hasDispositivo;
  validation.checks.push({
    name: 'Structure I/II/III',
    passed: structureCheck,
    detail: `R:${hasRelatorio ? '✓' : '✗'} F:${hasFundamentacao ? '✓' : '✗'} D:${hasDispositivo ? '✓' : '✗'}`
  });

  // Check 6: Compliance
  const risco = response.compliance?.risco;
  const riscoCheck = ['BAIXO', 'MEDIO'].includes(risco);
  validation.checks.push({
    name: 'Risk level',
    passed: riscoCheck,
    detail: risco || 'Not provided'
  });

  // Check 7: Audit ID
  const auditId = response.rastreabilidade?.audit_id;
  validation.checks.push({
    name: 'Audit ID',
    passed: !!auditId,
    detail: auditId || 'Missing'
  });

  return validation;
}

// ============================================================================
// MAIN
// ============================================================================

async function runTests() {
  log('\n' + '='.repeat(80), 'cyan');
  log('LEX INTELLIGENTIA v2.1.1 - PRODUCTION TEST RUNNER', 'cyan');
  log('='.repeat(80), 'cyan');

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Load test cases
  const testCases = [];
  const categories = ['bancario', 'consumidor'];

  for (const category of categories) {
    const dir = path.join(__dirname, category);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        testCases.push(JSON.parse(content));
      }
    }
  }

  log(`\nLoaded ${testCases.length} test cases`, 'blue');
  log(`Webhook: ${CONFIG.webhookUrl}\n`, 'blue');

  // Run tests
  const results = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];

    log(`\n[${i + 1}/${testCases.length}] Testing: ${testCase.caso_id}`, 'yellow');
    log(`Description: ${testCase.descricao}`, 'blue');

    const result = await sendRequest(testCase);
    const validation = validateResponse(testCase, result);

    results.push({
      testCase,
      result,
      validation
    });

    // Print validation results
    for (const check of validation.checks) {
      const icon = check.passed ? '✓' : '✗';
      const color = check.passed ? 'green' : 'red';
      log(`  ${icon} ${check.name}: ${check.detail}`, color);
    }

    log(`  ⏱ Execution time: ${(result.executionTime / 1000).toFixed(2)}s`, 'blue');

    if (validation.passed) {
      passed++;
      log(`  ✅ TEST PASSED`, 'green');
    } else {
      failed++;
      log(`  ❌ TEST FAILED`, 'red');
    }

    // Delay between tests
    if (i < testCases.length - 1) {
      log(`  Waiting ${CONFIG.delayBetweenTests / 1000}s before next test...`, 'blue');
      await sleep(CONFIG.delayBetweenTests);
    }
  }

  // Save results
  const reportPath = path.join(CONFIG.outputDir, `test_report_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  // Summary
  log('\n' + '='.repeat(80), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(80), 'cyan');
  log(`\nTotal: ${testCases.length}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`, passed === testCases.length ? 'green' : 'yellow');
  log(`\nReport saved to: ${reportPath}`, 'blue');

  process.exit(failed > 0 ? 1 : 0);
}

// Run
runTests().catch(console.error);
```

**Step 2: Make script executable**

```bash
chmod +x test_cases/run_production_tests.js
```

**Step 3: Commit test runner**

```bash
git add test_cases/run_production_tests.js
git commit -m "test: add production test runner script"
```

---

## Task 5: Execute Bancário Tests (5 cases)

**Step 1: Set webhook URL environment variable**

```bash
export WEBHOOK_URL="https://YOUR-N8N.app.n8n.cloud/webhook/lex-intelligentia-agentes"
```

**Step 2: Run bancário tests only**

Create a temporary test script or modify run command:

```bash
cd test_cases
node -e "
const runner = require('./run_production_tests.js');
// This will run all tests, but you can manually run bancario first
"
```

Or run manually with curl for each case:

```bash
# Test bancario_01
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d @bancario/caso_01_emprestimo_consignado.json \
  | jq '.qualidade.score, .compliance.agente'
```

**Step 3: Record results**

Expected output for each test:
- `success: true`
- `qualidade.score >= 75`
- `compliance.agente = "agent_bancario"`
- `compliance.risco = "BAIXO" or "MEDIO"`

**Step 4: Document bancário results**

Create file `test_results/bancario_results.md` with:
- Test ID
- QA Score
- Agent Used
- Execution Time
- Issues Found (if any)

---

## Task 6: Execute Consumidor Tests (5 cases)

**Step 1: Run consumidor tests**

```bash
# Test consumidor_01
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d @consumidor/caso_01_falha_servico.json \
  | jq '.qualidade.score, .compliance.agente'
```

**Step 2: Record results**

Expected output for each test:
- `success: true`
- `qualidade.score >= 75`
- `compliance.agente = "agent_consumidor"`
- `compliance.risco = "BAIXO" or "MEDIO"`

**Step 3: Document consumidor results**

Create file `test_results/consumidor_results.md`

---

## Task 7: Generate Final Test Report

**Files:**
- Create: `test_results/PRODUCTION_TEST_REPORT.md`

**Step 1: Create comprehensive test report**

```markdown
# Lex Intelligentia v2.1.1 - Production Test Report

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** n8n Cloud
**Webhook:** https://[YOUR-N8N].app.n8n.cloud/webhook/lex-intelligentia-agentes

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Tests | 10 |
| Passed | X |
| Failed | Y |
| Success Rate | XX% |
| Average QA Score | XX |
| Average Execution Time | XX.Xs |

---

## Bancário Tests (5)

| ID | Description | QA Score | Agent | Risk | Time | Status |
|----|-------------|----------|-------|------|------|--------|
| bancario_01 | Empréstimo consignado | XX | agent_bancario | BAIXO | X.Xs | ✅/❌ |
| bancario_02 | Juros abusivos | XX | agent_bancario | BAIXO | X.Xs | ✅/❌ |
| bancario_03 | Fraude cartão | XX | agent_bancario | BAIXO | X.Xs | ✅/❌ |
| bancario_04 | Negativação indevida | XX | agent_bancario | BAIXO | X.Xs | ✅/❌ |
| bancario_05 | Revisional contrato | XX | agent_bancario | BAIXO | X.Xs | ✅/❌ |

---

## Consumidor Tests (5)

| ID | Description | QA Score | Agent | Risk | Time | Status |
|----|-------------|----------|-------|------|------|--------|
| consumidor_01 | Falha serviço | XX | agent_consumidor | BAIXO | X.Xs | ✅/❌ |
| consumidor_02 | Produto defeituoso | XX | agent_consumidor | BAIXO | X.Xs | ✅/❌ |
| consumidor_03 | Cobrança indevida | XX | agent_consumidor | BAIXO | X.Xs | ✅/❌ |
| consumidor_04 | Propaganda enganosa | XX | agent_consumidor | BAIXO | X.Xs | ✅/❌ |
| consumidor_05 | Plano saúde negativa | XX | agent_consumidor | BAIXO | X.Xs | ✅/❌ |

---

## Issues Found

### Critical
- [List any critical issues]

### Important
- [List any important issues]

### Minor
- [List any minor issues]

---

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

---

## Conclusion

[Overall assessment of production readiness]

---

*Report generated on YYYY-MM-DD*
```

**Step 2: Commit final report**

```bash
git add test_results/
git commit -m "docs: add production test report for 10 cases validation"
```

---

## Task 8: Update CLAUDE.md with Test Results

**Files:**
- Modify: `CLAUDE.md:133-137`

**Step 1: Update checklist in CLAUDE.md**

Change from:
```markdown
- [ ] Testes adicionais com 5 processos bancários
- [ ] Testes adicionais com 5 processos consumidor
- [ ] Validar scores QA em produção
```

To:
```markdown
- [x] Testes adicionais com 5 processos bancários (XX% success rate)
- [x] Testes adicionais com 5 processos consumidor (XX% success rate)
- [x] Validar scores QA em produção (average: XX/100)
```

**Step 2: Commit documentation update**

```bash
git add CLAUDE.md
git commit -m "docs: mark production testing as complete in CLAUDE.md"
```

---

## Verification Checklist

Before closing this plan:

- [ ] All 10 test case files created
- [ ] Test runner script functional
- [ ] 5 bancário cases executed successfully
- [ ] 5 consumidor cases executed successfully
- [ ] Final report generated with metrics
- [ ] CLAUDE.md updated with results
- [ ] All changes committed to git

---

*Plan created: 2026-01-19*
*Lex Intelligentia Judiciário v2.1.1 - Production Testing*
