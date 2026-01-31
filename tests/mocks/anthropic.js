/**
 * Mock for Anthropic API responses
 */

const MOCK_RESPONSES = {
  bancario: {
    content: [
      {
        type: 'text',
        text: `SENTENÇA

I - RELATÓRIO

Trata-se de ação revisional de contrato bancário movida por AUTOR em face de RÉU (Instituição Financeira), na qual se pretende a revisão de cláusulas contratuais abusivas.

II - FUNDAMENTAÇÃO

A relação entre as partes é de consumo, aplicando-se o CDC (Súmula 297/STJ). Conforme Súmula 382/STJ, a capitalização de juros é permitida desde que expressamente pactuada.

Quanto aos juros remuneratórios, a Súmula 539/STJ estabelece que não se limitam a 12% ao ano. Todavia, verificando-se taxa superior a 1,5x a média do BACEN, configura-se abusividade.

III - DISPOSITIVO

Ante o exposto, JULGO PARCIALMENTE PROCEDENTES os pedidos para:
a) Declarar abusiva a taxa de juros praticada;
b) Determinar a revisão do contrato com aplicação da taxa média BACEN;
c) Condenar a ré à restituição simples dos valores cobrados indevidamente.

Condeno a ré ao pagamento de custas e honorários advocatícios de 10% sobre o valor da condenação (art. 85 CPC).

P.R.I.`
      }
    ],
    model: 'claude-sonnet-4-20250514',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 500,
      output_tokens: 350
    }
  },

  consumidor: {
    content: [
      {
        type: 'text',
        text: `SENTENÇA

I - RELATÓRIO

CONSUMIDOR/AUTOR ajuizou a presente ação em face de FORNECEDOR/RÉU, alegando negativação indevida de seu nome nos órgãos de proteção ao crédito.

II - FUNDAMENTAÇÃO

Aplica-se o CDC à relação (art. 2º e 3º). A responsabilidade do fornecedor é objetiva (art. 14 CDC), independendo de culpa.

Conforme Súmula 385/STJ, não se verifica negativação prévia. O dano moral é in re ipsa, decorrendo automaticamente da negativação indevida (Súmula 479/STJ).

Quanto ao quantum, considerando os parâmetros do TJES (R$ 5.000-15.000 para negativação), arbitro em R$ 10.000,00.

III - DISPOSITIVO

Julgo PROCEDENTES os pedidos para:
a) Declarar inexigível o débito;
b) Determinar a exclusão do nome do autor dos cadastros restritivos;
c) Condenar a ré ao pagamento de R$ 10.000,00 a título de danos morais.

Correção monetária do arbitramento (Súmula 362/STJ) e juros de 1% a.m. da citação.

P.R.I.`
      }
    ],
    model: 'claude-sonnet-4-20250514',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 450,
      output_tokens: 320
    }
  },

  generico: {
    content: [
      {
        type: 'text',
        text: `SENTENÇA

I - RELATÓRIO

[REVISAR: partes] ajuizou ação em face de [REVISAR: réu].

II - FUNDAMENTAÇÃO

[REVISAR: fundamentação] - base legal a confirmar.

III - DISPOSITIVO

[REVISAR: dispositivo] - verificar pedidos.

P.R.I.`
      }
    ],
    model: 'claude-sonnet-4-20250514',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 200,
      output_tokens: 100
    }
  }
};

/**
 * Create mock Anthropic API response
 * @param {string} agentType - Type of agent (bancario, consumidor, etc.)
 * @returns {object} Mock API response
 */
function createMockResponse(agentType = 'generico') {
  const response = MOCK_RESPONSES[agentType] || MOCK_RESPONSES.generico;
  return {
    id: `msg_mock_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    ...response
  };
}

/**
 * Mock the https module for Anthropic API calls
 */
function mockAnthropicAPI(mockResponse) {
  const https = require('https');
  const originalRequest = https.request;

  https.request = jest.fn((options, callback) => {
    const mockReq = {
      write: jest.fn(),
      end: jest.fn(() => {
        const mockRes = {
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          on: (event, handler) => {
            if (event === 'data') {
              handler(JSON.stringify(mockResponse || createMockResponse()));
            }
            if (event === 'end') {
              handler();
            }
          }
        };
        callback(mockRes);
      }),
      on: jest.fn()
    };
    return mockReq;
  });

  return () => {
    https.request = originalRequest;
  };
}

module.exports = {
  MOCK_RESPONSES,
  createMockResponse,
  mockAnthropicAPI
};
