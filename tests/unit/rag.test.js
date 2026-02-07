const { buildRAGQuery, formatPrecedentsForPrompt, extractLegalTerms } = require('../../lib/rag');

describe('RAG Module', () => {
  describe('extractLegalTerms', () => {
    test('extracts súmula references', () => {
      const text = 'Conforme Súmula 297 do STJ e Súmula 382 do STJ';
      const terms = extractLegalTerms(text);
      expect(terms).toContain('súmula 297');
      expect(terms).toContain('súmula 382');
    });

    test('extracts article references', () => {
      const text = 'Art. 784 do CPC e art. 927 do CC';
      const terms = extractLegalTerms(text);
      expect(terms).toContain('art. 784 cpc');
      expect(terms).toContain('art. 927 cc');
    });

    test('extracts tema references', () => {
      const text = 'Tema Repetitivo 1368 do STJ';
      const terms = extractLegalTerms(text);
      expect(terms).toContain('tema 1368');
    });

    test('returns empty array for text without legal terms', () => {
      const terms = extractLegalTerms('texto comum sem referências legais');
      expect(terms).toEqual([]);
    });
  });

  describe('buildRAGQuery', () => {
    test('builds query object from case input', () => {
      const input = {
        fatos: 'Empréstimo consignado fraudulento',
        questoes: 'Vício de consentimento',
        pedidos: 'Declaração de nulidade',
        domain: 'bancario'
      };
      const query = buildRAGQuery(input);
      expect(query).toHaveProperty('text');
      expect(query).toHaveProperty('domain', 'bancario');
      expect(query).toHaveProperty('legalTerms');
      expect(query.text).toContain('Empréstimo');
    });
  });

  describe('formatPrecedentsForPrompt', () => {
    test('formats precedents as markdown context', () => {
      const precedents = [
        { type: 'Sumula', numero: 297, tribunal: 'STJ', texto: 'O CDC é aplicável às instituições financeiras' },
        { type: 'Tema', numero: 952, tribunal: 'STJ', texto: 'Tese sobre contratos bancários' }
      ];
      const result = formatPrecedentsForPrompt(precedents);
      expect(result).toContain('Súmula 297/STJ');
      expect(result).toContain('Tema 952/STJ');
      expect(result).toContain('CDC é aplicável');
    });

    test('returns empty string for no precedents', () => {
      expect(formatPrecedentsForPrompt([])).toBe('');
      expect(formatPrecedentsForPrompt(null)).toBe('');
    });

    test('limits output to maxTokens', () => {
      const longPrecedents = Array.from({ length: 50 }, (_, i) => ({
        type: 'Sumula',
        numero: i,
        tribunal: 'STJ',
        texto: 'A'.repeat(500)
      }));
      const result = formatPrecedentsForPrompt(longPrecedents, { maxTokens: 1000 });
      expect(result.length).toBeLessThan(5000);
    });
  });
});
