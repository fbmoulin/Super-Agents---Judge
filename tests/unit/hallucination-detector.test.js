// tests/unit/hallucination-detector.test.js
const {
  extractCitations,
  validateSumulaCitation,
  validateTemaCitation,
  detectHallucinations
} = require('../../lib/hallucination-detector');

describe('Hallucination Detector', () => {
  describe('extractCitations', () => {
    test('extracts "Sumula 297 do STJ" format', () => {
      const text = 'Conforme a Sumula 297 do STJ, o CDC e aplicavel as instituicoes financeiras.';
      const result = extractCitations(text);
      expect(result.sumulas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ numero: '297', tribunal: 'STJ' })
        ])
      );
    });

    test('extracts "Sumula 297/STJ" slash format', () => {
      const text = 'Nos termos da Sumula 297/STJ, aplica-se o CDC.';
      const result = extractCitations(text);
      expect(result.sumulas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ numero: '297', tribunal: 'STJ' })
        ])
      );
    });

    test('extracts "Sumula n. 362 do STJ" and "Sumula n\u00ba 149 do STF" formats', () => {
      const text = 'Aplicando a Sumula n. 362 do STJ e a Sumula n\u00ba 149 do STF ao caso concreto.';
      const result = extractCitations(text);
      expect(result.sumulas).toHaveLength(2);
      expect(result.sumulas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ numero: '362', tribunal: 'STJ' }),
          expect.objectContaining({ numero: '149', tribunal: 'STF' })
        ])
      );
    });

    test('extracts tema repetitivo citations', () => {
      const text = 'O STJ fixou tese no Tema Repetitivo 952, consolidando o entendimento sobre reajuste por faixa etaria.';
      const result = extractCitations(text);
      expect(result.temas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ numero: '952' })
        ])
      );
    });

    test('extracts artigo citations', () => {
      const text = 'Com fundamento no art. 37 da Constituicao Federal e no artigo 5o do CDC.';
      const result = extractCitations(text);
      expect(result.artigos.length).toBeGreaterThanOrEqual(1);
      expect(result.artigos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ numero: '37' })
        ])
      );
    });

    test('returns empty arrays when no citations found', () => {
      const text = 'Este texto nao contem nenhuma referencia juridica especifica.';
      const result = extractCitations(text);
      expect(result.sumulas).toEqual([]);
      expect(result.temas).toEqual([]);
      expect(result.artigos).toEqual([]);
    });
  });

  describe('validateSumulaCitation', () => {
    test('validates an existing STJ sumula (297) as valid', () => {
      const result = validateSumulaCitation('297', 'STJ');
      expect(result.valid).toBe(true);
      expect(result.texto).toContain('Consumidor');
    });

    test('detects sumula not found (fabricated number 9999)', () => {
      const result = validateSumulaCitation('9999', 'STJ');
      expect(result.valid).toBe(false);
      expect(result.issue).toBe('SUMULA_NAO_ENCONTRADA');
      expect(result.severity).toBe('HIGH');
    });

    test('detects wrong tribunal - sumula 340 cited as STJ when it also exists in STF with different text', () => {
      // Sumula 340 exists in both STJ and STF with different texts
      // STJ 340: "No contrato de abertura de credito em conta corrente..."
      // STF 340: "Desde a vigencia do Codigo Civil, os bens dominicais..."
      const resultSTJ = validateSumulaCitation('340', 'STJ');
      expect(resultSTJ.valid).toBe(true);
      expect(resultSTJ.texto).toContain('conta corrente');

      const resultSTF = validateSumulaCitation('340', 'STF');
      expect(resultSTF.valid).toBe(true);
      expect(resultSTF.texto).toContain('dominicais');
    });

    test('detects wrong tribunal - sumula only exists in STF but cited as STJ', () => {
      // Sumula 149 exists only in STF
      const result = validateSumulaCitation('149', 'STJ');
      expect(result.valid).toBe(false);
      expect(result.issue).toBe('TRIBUNAL_INCORRETO');
      expect(result.severity).toBe('MEDIUM');
      expect(result.tribunalCorreto).toBe('STF');
    });
  });

  describe('validateTemaCitation', () => {
    test('validates an existing tema (952 - reajuste plano de saude) as valid', () => {
      const result = validateTemaCitation('952');
      expect(result.valid).toBe(true);
      expect(result.tese).toContain('reajuste');
      expect(result.tribunal).toBe('STJ');
    });

    test('detects fabricated tema (numero 99999)', () => {
      const result = validateTemaCitation('99999');
      expect(result.valid).toBe(false);
      expect(result.issue).toBe('TEMA_NAO_ENCONTRADO');
      expect(result.severity).toBe('HIGH');
    });

    test('validates tema 1368 (taxa SELIC) as valid', () => {
      const result = validateTemaCitation('1368');
      expect(result.valid).toBe(true);
      expect(result.tese).toContain('Selic');
    });
  });

  describe('detectHallucinations', () => {
    test('returns clean result for text with valid citations', () => {
      const text = 'Conforme a Sumula 297 do STJ, o CDC e aplicavel. O Tema Repetitivo 952 do STJ consolida este entendimento.';
      const result = detectHallucinations(text);
      expect(result.hallucinated).toBe(false);
      expect(result.issues).toEqual([]);
      expect(result.citationsChecked).toBeGreaterThanOrEqual(2);
      expect(result.issuesCount).toBe(0);
    });

    test('detects hallucinated sumula', () => {
      const text = 'A Sumula 8888 do STJ determina que o devedor deve pagar em dobro.';
      const result = detectHallucinations(text);
      expect(result.hallucinated).toBe(true);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'SUMULA_NAO_ENCONTRADA',
            severity: 'HIGH',
            numero: '8888'
          })
        ])
      );
      expect(result.issuesCount).toBe(1);
    });

    test('detects wrong tribunal attribution', () => {
      // Sumula 473 exists in STF, not STJ
      const text = 'A Sumula 473 do STJ permite a autotutela.';
      const result = detectHallucinations(text);
      expect(result.hallucinated).toBe(true);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'TRIBUNAL_INCORRETO',
            severity: 'MEDIUM'
          })
        ])
      );
    });

    test('detects hallucinated tema repetitivo', () => {
      const text = 'O Tema Repetitivo 77777 consolida o entendimento sobre o assunto.';
      const result = detectHallucinations(text);
      expect(result.hallucinated).toBe(true);
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'TEMA_NAO_ENCONTRADO',
            severity: 'HIGH',
            numero: '77777'
          })
        ])
      );
    });

    test('detects multiple issues in a single text', () => {
      const text = 'A Sumula 9999 do STJ e o Tema Repetitivo 88888 fundamentam a decisao. Ainda, a Sumula 149 do STJ reforça.';
      const result = detectHallucinations(text);
      expect(result.hallucinated).toBe(true);
      expect(result.issuesCount).toBe(3);
      expect(result.citationsChecked).toBeGreaterThanOrEqual(3);

      const types = result.issues.map(i => i.type);
      expect(types).toContain('SUMULA_NAO_ENCONTRADA');
      expect(types).toContain('TEMA_NAO_ENCONTRADO');
      expect(types).toContain('TRIBUNAL_INCORRETO');
    });

    test('returns clean result for text with no citations', () => {
      const text = 'O autor narra que celebrou contrato de emprestimo com o requerido.';
      const result = detectHallucinations(text);
      expect(result.hallucinated).toBe(false);
      expect(result.issues).toEqual([]);
      expect(result.citationsChecked).toBe(0);
      expect(result.issuesCount).toBe(0);
    });
  });
});
