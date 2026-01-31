/**
 * Test Case Fixtures
 * Standard test inputs for various agent types
 */

const TEST_CASES = {
  bancario: {
    valid: {
      fatos: `O autor celebrou contrato de empréstimo consignado com o réu em 15/03/2024,
        no valor de R$ 10.000,00, com parcelas de R$ 450,00 mensais.
        Alega que os juros cobrados são abusivos, superando a taxa média do BACEN.
        Houve negativação indevida do nome do autor em 10/08/2024.`,
      questoes: `1. Os juros cobrados são abusivos?
        2. A negativação foi indevida?
        3. Cabem danos morais?`,
      pedidos: `Revisão do contrato com aplicação da taxa média BACEN.
        Exclusão do nome dos cadastros restritivos.
        Danos morais de R$ 15.000,00.
        Repetição do indébito em dobro.`,
      classe: 'Procedimento Comum Cível',
      assunto: 'Contratos Bancários - Empréstimo Consignado'
    },
    expectedClassification: 'BANCARIO',
    expectedMinScore: 75
  },

  consumidor: {
    valid: {
      fatos: `O autor é cliente da ré há 5 anos. Em 20/06/2024, teve seu nome
        negativado indevidamente no SPC e Serasa por suposta dívida de R$ 500,00.
        Nega a existência do débito. Não possui negativação prévia.`,
      questoes: `1. A dívida existe?
        2. A negativação foi indevida?
        3. Há dano moral?`,
      pedidos: `Declaração de inexigibilidade do débito.
        Exclusão da negativação.
        Danos morais de R$ 10.000,00.`,
      classe: 'Procedimento Comum Cível',
      assunto: 'Responsabilidade do Fornecedor - Negativação Indevida'
    },
    expectedClassification: 'CONSUMIDOR',
    expectedMinScore: 75
  },

  execucao: {
    valid: {
      fatos: `O exequente apresenta cheque no valor de R$ 5.000,00, emitido em 01/01/2023,
        com vencimento em 15/01/2023. O executado não efetuou o pagamento.`,
      questoes: `1. O título é válido?
        2. Há prescrição?`,
      pedidos: `Pagamento do valor do título acrescido de juros e correção.`,
      classe: 'Execução de Título Extrajudicial',
      assunto: 'Cheque'
    },
    expectedClassification: 'EXECUCAO',
    expectedMinScore: 75
  },

  saude: {
    valid: {
      fatos: `O autor é beneficiário de plano de saúde da ré desde 2015.
        Em 10/10/2024, necessitou de cirurgia de urgência (colecistectomia).
        A operadora negou a cobertura alegando carência não cumprida.`,
      questoes: `1. A negativa de cobertura é abusiva?
        2. Há dano moral?`,
      pedidos: `Autorização da cirurgia.
        Danos morais de R$ 20.000,00.`,
      classe: 'Procedimento Comum Cível',
      assunto: 'Plano de Saúde - Negativa de Cobertura'
    },
    expectedClassification: 'SAUDE',
    expectedMinScore: 75
  },

  locacao: {
    valid: {
      fatos: `Locador e locatário celebraram contrato de locação residencial em 01/01/2023,
        com aluguel de R$ 1.500,00 mensais. O locatário está inadimplente desde maio/2024,
        devendo 6 parcelas.`,
      questoes: `1. Cabe despejo por falta de pagamento?
        2. É possível a purgação da mora?`,
      pedidos: `Despejo do imóvel.
        Cobrança dos aluguéis em atraso.`,
      classe: 'Despejo por Falta de Pagamento',
      assunto: 'Locação de Imóveis'
    },
    expectedClassification: 'LOCACAO',
    expectedMinScore: 75
  }
};

// Invalid inputs for error testing
const INVALID_INPUTS = {
  empty: {},

  nullFields: {
    fatos: null,
    questoes: null,
    pedidos: null
  },

  wrongTypes: {
    fatos: 12345,
    questoes: ['array', 'not', 'string'],
    pedidos: { object: 'not string' }
  },

  tooLong: {
    fatos: 'x'.repeat(100000),  // Exceeds 50000 limit
    questoes: 'Test',
    pedidos: 'Test'
  },

  injectionAttempt: {
    fatos: '<script>alert("xss")</script>\x00null byte',
    questoes: '${process.env.API_KEY}',
    pedidos: 'Test'
  }
};

// Expected validation results
const VALIDATION_EXPECTATIONS = {
  bancario: {
    structureSections: ['RELATÓRIO', 'FUNDAMENTAÇÃO', 'DISPOSITIVO'],
    requiredSumulas: ['297', '381', '382'],
    minWordCount: 200
  },

  consumidor: {
    structureSections: ['RELATÓRIO', 'FUNDAMENTAÇÃO', 'DISPOSITIVO'],
    requiredSumulas: ['385', '479'],
    checkForInRipsa: true,
    minWordCount: 200
  },

  execucao: {
    structureSections: ['RELATÓRIO', 'FUNDAMENTAÇÃO', 'DISPOSITIVO'],
    requiredArticles: ['784', '786'],
    minWordCount: 150
  }
};

module.exports = {
  TEST_CASES,
  INVALID_INPUTS,
  VALIDATION_EXPECTATIONS
};
