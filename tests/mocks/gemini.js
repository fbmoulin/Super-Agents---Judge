/**
 * Mock for Gemini API responses
 */

const MOCK_ROUTER_RESPONSES = {
  bancario: {
    candidates: [{
      content: {
        parts: [{
          text: '{"area": "BANCARIO", "confianca": 0.95}'
        }]
      },
      finishReason: 'STOP'
    }],
    usageMetadata: {
      promptTokenCount: 100,
      candidatesTokenCount: 20,
      totalTokenCount: 120
    }
  },

  consumidor: {
    candidates: [{
      content: {
        parts: [{
          text: '{"area": "CONSUMIDOR", "confianca": 0.92}'
        }]
      },
      finishReason: 'STOP'
    }],
    usageMetadata: {
      promptTokenCount: 100,
      candidatesTokenCount: 20,
      totalTokenCount: 120
    }
  },

  execucao: {
    candidates: [{
      content: {
        parts: [{
          text: '{"area": "EXECUCAO", "confianca": 0.88}'
        }]
      },
      finishReason: 'STOP'
    }],
    usageMetadata: {
      promptTokenCount: 100,
      candidatesTokenCount: 20,
      totalTokenCount: 120
    }
  },

  generico: {
    candidates: [{
      content: {
        parts: [{
          text: '{"area": "GENERICO", "confianca": 0.45}'
        }]
      },
      finishReason: 'STOP'
    }],
    usageMetadata: {
      promptTokenCount: 100,
      candidatesTokenCount: 20,
      totalTokenCount: 120
    }
  }
};

const MOCK_EVALUATION_RESPONSES = {
  good: {
    candidates: [{
      content: {
        parts: [{
          text: JSON.stringify({
            estrutura: 95,
            juridico: 90,
            utilidade: 88,
            problemas: [],
            sugestoes: ['Considerar adicionar referência a precedente específico']
          })
        }]
      },
      finishReason: 'STOP'
    }]
  },

  medium: {
    candidates: [{
      content: {
        parts: [{
          text: JSON.stringify({
            estrutura: 85,
            juridico: 75,
            utilidade: 70,
            problemas: ['Faltam algumas súmulas importantes'],
            sugestoes: ['Adicionar Súmula 297/STJ', 'Detalhar fundamentação']
          })
        }]
      },
      finishReason: 'STOP'
    }]
  },

  poor: {
    candidates: [{
      content: {
        parts: [{
          text: JSON.stringify({
            estrutura: 50,
            juridico: 40,
            utilidade: 30,
            problemas: [
              'Estrutura incompleta',
              'Falta fundamentação jurídica',
              'Muitos marcadores [REVISAR]'
            ],
            sugestoes: [
              'Adicionar seção de fundamentação',
              'Citar base legal',
              'Completar dispositivo'
            ]
          })
        }]
      },
      finishReason: 'STOP'
    }]
  }
};

/**
 * Create mock router response
 * @param {string} area - Expected area classification
 * @returns {object} Mock Gemini router response
 */
function createMockRouterResponse(area = 'generico') {
  return MOCK_ROUTER_RESPONSES[area.toLowerCase()] || MOCK_ROUTER_RESPONSES.generico;
}

/**
 * Create mock evaluation response
 * @param {string} quality - 'good', 'medium', or 'poor'
 * @returns {object} Mock Gemini evaluation response
 */
function createMockEvaluationResponse(quality = 'good') {
  return MOCK_EVALUATION_RESPONSES[quality] || MOCK_EVALUATION_RESPONSES.good;
}

/**
 * Mock the @google/generative-ai module
 */
function createMockGeminiClient(mockResponses = {}) {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockImplementation(() => ({
        generateContent: jest.fn().mockImplementation(async (params) => {
          // Determine response type based on prompt content
          const promptText = JSON.stringify(params);

          if (promptText.includes('Classifique')) {
            // Router request
            const area = mockResponses.routerArea || 'bancario';
            return {
              response: {
                text: () => JSON.stringify({ area: area.toUpperCase(), confianca: 0.95 })
              }
            };
          }

          if (promptText.includes('avaliador') || promptText.includes('AVALIAR')) {
            // Evaluation request
            const quality = mockResponses.evaluationQuality || 'good';
            const evalResponse = MOCK_EVALUATION_RESPONSES[quality];
            return {
              response: {
                text: () => evalResponse.candidates[0].content.parts[0].text
              }
            };
          }

          // Default response
          return {
            response: {
              text: () => '{"area": "GENERICO", "confianca": 0.5}'
            }
          };
        })
      }))
    }))
  };
}

module.exports = {
  MOCK_ROUTER_RESPONSES,
  MOCK_EVALUATION_RESPONSES,
  createMockRouterResponse,
  createMockEvaluationResponse,
  createMockGeminiClient
};
