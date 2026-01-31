/**
 * Unit Tests for Security Module
 */

const { security } = require('../../config');
const { INVALID_INPUTS } = require('../fixtures/test-cases');

describe('Security Module', () => {
  describe('validateInput', () => {
    test('should accept valid input', () => {
      const input = {
        fatos: 'Fatos do caso',
        questoes: 'Questões a resolver',
        pedidos: 'Pedidos do autor'
      };

      const result = security.validateInput(input);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.fatos).toBe('Fatos do caso');
    });

    test('should handle nested body object', () => {
      const input = {
        body: {
          fatos: 'Fatos',
          questoes: 'Questões',
          pedidos: 'Pedidos'
        }
      };

      const result = security.validateInput(input);
      expect(result.valid).toBe(true);
    });

    test('should reject empty input', () => {
      const result = security.validateInput(INVALID_INPUTS.empty);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should reject wrong types', () => {
      const result = security.validateInput(INVALID_INPUTS.wrongTypes);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('must be a string'))).toBe(true);
    });

    test('should reject input exceeding length limits', () => {
      const result = security.validateInput(INVALID_INPUTS.tooLong);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum length'))).toBe(true);
    });

    test('should require at least one field', () => {
      const input = { classe: 'Procedimento Comum' };
      const result = security.validateInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one of fatos, questoes, or pedidos is required');
    });
  });

  describe('sanitizeText', () => {
    test('should remove null bytes', () => {
      const input = 'text\x00with\x00nulls';
      const result = security.sanitizeText(input);
      expect(result).not.toContain('\x00');
      expect(result).toBe('textwithnulls');
    });

    test('should normalize line endings', () => {
      const input = 'line1\r\nline2\rline3';
      const result = security.sanitizeText(input);
      expect(result).toBe('line1\nline2\nline3');
    });

    test('should remove control characters', () => {
      const input = 'text\x07bell\x1Bescape';
      const result = security.sanitizeText(input);
      expect(result).toBe('textbellescape');
    });

    test('should limit excessive newlines', () => {
      const input = 'para1\n\n\n\n\n\n\npara2';
      const result = security.sanitizeText(input);
      expect(result).toBe('para1\n\n\npara2');
    });

    test('should trim whitespace', () => {
      const input = '   text   ';
      const result = security.sanitizeText(input);
      expect(result).toBe('text');
    });

    test('should handle empty input', () => {
      expect(security.sanitizeText('')).toBe('');
      expect(security.sanitizeText(null)).toBe('');
      expect(security.sanitizeText(undefined)).toBe('');
    });
  });

  describe('createAuditEntry', () => {
    test('should create valid audit entry', () => {
      const entry = security.createAuditEntry({
        operacao: 'GERACAO_MINUTA',
        agente: 'agent_bancario',
        inputHash: 'abc123',
        outputHash: 'def456',
        confianca: 0.95,
        scoreQA: 87,
        tempoExecucaoMs: 4500
      });

      expect(entry.audit_id).toMatch(/^LEX-\d+-[a-z0-9]+$/);
      expect(entry.timestamp).toBeDefined();
      expect(entry.operacao).toBe('GERACAO_MINUTA');
      expect(entry.agente).toBe('agent_bancario');
      expect(entry.requer_revisao_humana).toBe(true);
    });

    test('should calculate risk correctly', () => {
      // BAIXO risk
      const baixo = security.createAuditEntry({
        confianca: 0.90,
        scoreQA: 90
      });
      expect(baixo.classificacao_risco).toBe('BAIXO');

      // MEDIO risk
      const medio = security.createAuditEntry({
        confianca: 0.70,
        scoreQA: 75
      });
      expect(medio.classificacao_risco).toBe('MEDIO');

      // ALTO risk
      const alto = security.createAuditEntry({
        confianca: 0.50,
        scoreQA: 60
      });
      expect(alto.classificacao_risco).toBe('ALTO');
    });
  });

  describe('anonymizeIP', () => {
    test('should anonymize IPv4', () => {
      const result = security.anonymizeIP('192.168.1.100');
      expect(result).toBe('192.168.x.x');
    });

    test('should handle unknown input', () => {
      expect(security.anonymizeIP(null)).toBe('unknown');
      expect(security.anonymizeIP(undefined)).toBe('unknown');
      expect(security.anonymizeIP('')).toBe('unknown');
    });

    test('should handle non-IPv4 format', () => {
      const result = security.anonymizeIP('not-an-ip');
      expect(result).toBe('anonymized');
    });
  });

  describe('RATE_LIMITS', () => {
    test('should have per-IP limits', () => {
      expect(security.RATE_LIMITS.perIP).toBeDefined();
      expect(security.RATE_LIMITS.perIP.requests).toBe(60);
      expect(security.RATE_LIMITS.perIP.windowMs).toBe(60000);
    });

    test('should have global limits', () => {
      expect(security.RATE_LIMITS.global).toBeDefined();
      expect(security.RATE_LIMITS.global.requestsPerSecond).toBeDefined();
    });
  });

  describe('SECURITY_HEADERS', () => {
    test('should have required security headers', () => {
      expect(security.SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
      expect(security.SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
      expect(security.SECURITY_HEADERS['Strict-Transport-Security']).toBeDefined();
    });
  });
});
