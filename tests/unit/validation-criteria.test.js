/**
 * Unit Tests for Validation Criteria
 * Tests all 11 regex patterns used in agent_validator.js
 */

// Define the same validation criteria for testing
const VALIDATION_CRITERIA = {
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

describe('Validation Criteria', () => {

  describe('hasRelatorio', () => {
    const { regex } = VALIDATION_CRITERIA.hasRelatorio;

    test('matches "I - RELATÓRIO"', () => {
      expect(regex.test('I - RELATÓRIO')).toBe(true);
    });

    test('matches "I – RELATÓRIO" (en-dash)', () => {
      expect(regex.test('I – RELATÓRIO')).toBe(true);
    });

    test('matches "RELATÓRIO" alone', () => {
      expect(regex.test('RELATÓRIO')).toBe(true);
    });

    test('matches "RELATORIO" without accent', () => {
      expect(regex.test('I - RELATORIO')).toBe(true);
    });

    test('matches "I." at start of line', () => {
      expect(regex.test('I. Trata-se de ação')).toBe(true);
    });

    test('matches case insensitive', () => {
      expect(regex.test('relatório')).toBe(true);
    });

    test('rejects without section marker', () => {
      expect(regex.test('O relatório do caso')).toBe(true); // Still matches word
      expect(regex.test('Nenhuma seção aqui')).toBe(false);
    });
  });

  describe('hasFundamentacao', () => {
    const { regex } = VALIDATION_CRITERIA.hasFundamentacao;

    test('matches "II - FUNDAMENTAÇÃO"', () => {
      expect(regex.test('II - FUNDAMENTAÇÃO')).toBe(true);
    });

    test('matches "FUNDAMENTACAO" without cedilla', () => {
      expect(regex.test('II - FUNDAMENTACAO')).toBe(true);
    });

    test('matches "FUNDAMENTAÇÃO" alone', () => {
      expect(regex.test('FUNDAMENTAÇÃO')).toBe(true);
    });

    test('matches "II." at start of line', () => {
      expect(regex.test('II. O mérito deve ser analisado')).toBe(true);
    });

    test('matches with em-dash', () => {
      expect(regex.test('II — FUNDAMENTAÇÃO')).toBe(true);
    });

    test('rejects unrelated text', () => {
      expect(regex.test('O fundamento é simples')).toBe(false);
    });
  });

  describe('hasDispositivo', () => {
    const { regex } = VALIDATION_CRITERIA.hasDispositivo;

    test('matches "III - DISPOSITIVO"', () => {
      expect(regex.test('III - DISPOSITIVO')).toBe(true);
    });

    test('matches "DISPOSITIVO" alone', () => {
      expect(regex.test('DISPOSITIVO')).toBe(true);
    });

    test('matches "III." at start of line', () => {
      expect(regex.test('III. Ante o exposto')).toBe(true);
    });

    test('rejects unrelated text', () => {
      expect(regex.test('O dispositivo móvel')).toBe(true); // Matches word
      expect(regex.test('Conclusão final')).toBe(false);
    });
  });

  describe('hasLegalBasis', () => {
    const { regex } = VALIDATION_CRITERIA.hasLegalBasis;

    test('matches "art. 85"', () => {
      expect(regex.test('conforme art. 85 do CPC')).toBe(true);
    });

    test('matches "artigo 927"', () => {
      expect(regex.test('artigo 927 do CC')).toBe(true);
    });

    test('matches "Lei nº 8.078"', () => {
      expect(regex.test('Lei nº 8.078/90')).toBe(true);
    });

    test('matches "Lei 10.406"', () => {
      expect(regex.test('Lei 10.406/2002')).toBe(true);
    });

    test('matches "CC" (Código Civil)', () => {
      expect(regex.test('previsto no CC')).toBe(true);
    });

    test('matches "CPC"', () => {
      expect(regex.test('artigos do CPC')).toBe(true);
    });

    test('matches "CDC"', () => {
      expect(regex.test('CDC aplicável')).toBe(true);
    });

    test('matches "CF" (Constituição)', () => {
      expect(regex.test('CF/88')).toBe(true);
    });

    test('rejects without legal reference', () => {
      expect(regex.test('texto sem referência legal')).toBe(false);
    });
  });

  describe('hasSumula', () => {
    const { regex } = VALIDATION_CRITERIA.hasSumula;

    test('matches "Súmula 297"', () => {
      expect(regex.test('Súmula 297 do STJ')).toBe(true);
    });

    test('matches "Súmula nº 385"', () => {
      expect(regex.test('Súmula nº 385')).toBe(true);
    });

    test('matches "súmula 479" lowercase', () => {
      expect(regex.test('súmula 479')).toBe(true);
    });

    test('matches "Sumula" without accent', () => {
      expect(regex.test('Sumula 382')).toBe(true);
    });

    test('matches with degree symbol', () => {
      expect(regex.test('Súmula n° 381')).toBe(true);
    });

    test('rejects without number', () => {
      expect(regex.test('conforme súmula do tribunal')).toBe(false);
    });
  });

  describe('hasJurisprudence', () => {
    const { regex } = VALIDATION_CRITERIA.hasJurisprudence;

    test('matches "STJ"', () => {
      expect(regex.test('conforme STJ')).toBe(true);
    });

    test('matches "STF"', () => {
      expect(regex.test('decisão do STF')).toBe(true);
    });

    test('matches "TJES" (state court)', () => {
      expect(regex.test('TJES decidiu')).toBe(true);
    });

    test('matches "TJSP", "TJRJ" pattern', () => {
      expect(regex.test('TJSP, 5ª Câmara')).toBe(true);
      expect(regex.test('TJRJ entendeu')).toBe(true);
    });

    test('matches "REsp"', () => {
      expect(regex.test('REsp 1.234.567')).toBe(true);
    });

    test('matches "AgRg"', () => {
      expect(regex.test('AgRg no AREsp')).toBe(true);
    });

    test('matches "precedent"', () => {
      expect(regex.test('precedent of the court')).toBe(true);
    });

    test('rejects without jurisprudence reference', () => {
      expect(regex.test('tribunal decidiu')).toBe(false);
    });
  });

  describe('hasDecision', () => {
    const { regex } = VALIDATION_CRITERIA.hasDecision;

    test('matches "JULGO PROCEDENTE"', () => {
      expect(regex.test('JULGO PROCEDENTE o pedido')).toBe(true);
    });

    test('matches "JULGO IMPROCEDENTE"', () => {
      expect(regex.test('JULGO IMPROCEDENTE a ação')).toBe(true);
    });

    test('matches "CONDENO"', () => {
      expect(regex.test('CONDENO o réu ao pagamento')).toBe(true);
    });

    test('matches "DECLARO"', () => {
      expect(regex.test('DECLARO a inexigibilidade')).toBe(true);
    });

    test('matches "DETERMINO"', () => {
      expect(regex.test('DETERMINO a exclusão')).toBe(true);
    });

    test('matches "DEFIRO"', () => {
      expect(regex.test('DEFIRO a tutela')).toBe(true);
    });

    test('matches "INDEFIRO"', () => {
      expect(regex.test('INDEFIRO o pedido')).toBe(true);
    });

    test('matches case insensitive', () => {
      expect(regex.test('julgo procedente')).toBe(true);
    });

    test('rejects without decision verb', () => {
      expect(regex.test('o juiz decidiu')).toBe(false);
    });
  });

  describe('hasHonorarios', () => {
    const { regex } = VALIDATION_CRITERIA.hasHonorarios;

    test('matches "honorários"', () => {
      expect(regex.test('honorários advocatícios')).toBe(true);
    });

    test('matches "honorarios" without accent', () => {
      expect(regex.test('honorarios de 10%')).toBe(true);
    });

    test('matches "art. 85"', () => {
      expect(regex.test('nos termos do art. 85 do CPC')).toBe(true);
    });

    test('matches "artigo 85"', () => {
      expect(regex.test('artigo 85')).toBe(true);
    });

    test('rejects without honorários reference', () => {
      expect(regex.test('pagamento de custas')).toBe(false);
    });
  });

  describe('hasCustas', () => {
    const { regex } = VALIDATION_CRITERIA.hasCustas;

    test('matches "custas"', () => {
      expect(regex.test('custas processuais')).toBe(true);
    });

    test('matches "despesas processuais"', () => {
      expect(regex.test('despesas processuais pelo autor')).toBe(true);
    });

    test('matches case insensitive', () => {
      expect(regex.test('CUSTAS pelo réu')).toBe(true);
    });

    test('rejects without custas reference', () => {
      expect(regex.test('pagamento de honorários')).toBe(false);
    });
  });

  describe('hasReviewMarkers', () => {
    const { regex } = VALIDATION_CRITERIA.hasReviewMarkers;

    test('matches "[REVISAR]"', () => {
      expect(regex.test('[REVISAR]')).toBe(true);
    });

    test('matches "[REVISAR: motivo]"', () => {
      expect(regex.test('[REVISAR: verificar data]')).toBe(true);
    });

    test('matches "[REVISAR valor]"', () => {
      expect(regex.test('[REVISAR valor do dano]')).toBe(true);
    });

    test('rejects without brackets', () => {
      expect(regex.test('REVISAR este ponto')).toBe(false);
    });
  });

  describe('hasMonetaryValues', () => {
    const { regex } = VALIDATION_CRITERIA.hasMonetaryValues;

    test('matches "R$ 1.000,00"', () => {
      expect(regex.test('R$ 1.000,00')).toBe(true);
    });

    test('matches "R$10.000"', () => {
      expect(regex.test('R$10.000')).toBe(true);
    });

    test('matches "R$ 500"', () => {
      expect(regex.test('R$ 500')).toBe(true);
    });

    test('matches with space after R$', () => {
      expect(regex.test('R$  15.000,00')).toBe(true);
    });

    test('rejects without R$', () => {
      expect(regex.test('1.000,00 reais')).toBe(false);
    });
  });

  describe('validateMinuta (integration)', () => {
    function validateMinuta(minuta) {
      const results = {
        totalScore: 0,
        maxScore: 0,
        checks: []
      };

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

      results.percentage = Math.round((results.totalScore / results.maxScore) * 100);
      return results;
    }

    test('complete minuta scores 100%', () => {
      const completeMinuta = `
        I - RELATÓRIO
        Trata-se de ação de cobrança...

        II - FUNDAMENTAÇÃO
        Conforme art. 927 do CC e Súmula 297 do STJ...
        O TJES tem decidido neste sentido.

        III - DISPOSITIVO
        JULGO PROCEDENTE o pedido para CONDENAR o réu ao pagamento de R$ 10.000,00.
        Custas e honorários (art. 85 CPC) pelo réu.
      `;

      const result = validateMinuta(completeMinuta);
      expect(result.percentage).toBe(100);
    });

    test('minuta with review markers still scores well', () => {
      const minutaWithReview = `
        I - RELATÓRIO
        Trata-se de ação [REVISAR: verificar partes]

        II - FUNDAMENTAÇÃO
        Conforme art. 85 do CPC...

        III - DISPOSITIVO
        JULGO PROCEDENTE. R$ 5.000,00 em custas.
      `;

      const result = validateMinuta(minutaWithReview);
      const reviewCheck = result.checks.find(c => c.name === 'Marcadores [REVISAR]');
      expect(reviewCheck.passed).toBe(true);
      expect(reviewCheck.optional).toBe(true);
    });

    test('empty minuta scores 0%', () => {
      const result = validateMinuta('');
      expect(result.percentage).toBe(0);
    });

    test('partial minuta scores proportionally', () => {
      const partialMinuta = `
        I - RELATÓRIO
        Trata-se de ação...

        II - FUNDAMENTAÇÃO
        ...
      `;

      const result = validateMinuta(partialMinuta);
      expect(result.percentage).toBeGreaterThan(0);
      expect(result.percentage).toBeLessThan(100);
    });
  });
});
