/**
 * Unit Tests for Config Module
 */

const config = require('../../config');

describe('Config Module', () => {
  describe('settings', () => {
    test('should have metadata with version', () => {
      expect(config.settings).toBeDefined();
      expect(config.settings.metadata).toBeDefined();
      expect(config.settings.metadata.version).toBe('2.6.0');
    });

    test('should have API configuration', () => {
      expect(config.settings.api).toBeDefined();
      expect(config.settings.api.anthropic).toBeDefined();
      expect(config.settings.api.gemini).toBeDefined();
    });

    test('should have validation configuration', () => {
      expect(config.settings.validation).toBeDefined();
      expect(config.settings.validation.threshold).toBe(75);
    });
  });

  describe('getAgentNames', () => {
    test('should return array of agent names', () => {
      const agents = config.getAgentNames();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    test('should include core agents', () => {
      const agents = config.getAgentNames();
      expect(agents).toContain('BANCARIO');
      expect(agents).toContain('CONSUMIDOR');
      expect(agents).toContain('EXECUCAO');
      expect(agents).toContain('GENERICO');
    });

    test('should include v2.6 agents', () => {
      const agents = config.getAgentNames();
      expect(agents).toContain('EXECUCAO_FISCAL');
      expect(agents).toContain('RESP_CIVIL_ESTADO');
    });

    test('should include fazenda publica agents', () => {
      const agents = config.getAgentNames();
      expect(agents).toContain('MANDADO_SEGURANCA');
      expect(agents).toContain('SAUDE_MEDICAMENTOS');
    });

    test('should have 23 agents total', () => {
      const agents = config.getAgentNames();
      expect(agents.length).toBe(23);
    });
  });

  describe('getPrompt', () => {
    test('should return prompt for valid agent', () => {
      const prompt = config.getPrompt('BANCARIO');
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100);
    });

    test('should include agent title', () => {
      const prompt = config.getPrompt('BANCARIO');
      expect(prompt).toContain('BANCÁRIO');
    });

    test('should include structure section', () => {
      const prompt = config.getPrompt('CONSUMIDOR');
      expect(prompt).toContain('ESTRUTURA');
      expect(prompt).toContain('RELATÓRIO');
      expect(prompt).toContain('FUNDAMENTAÇÃO');
      expect(prompt).toContain('DISPOSITIVO');
    });

    test('should fallback to GENERICO for unknown agent', () => {
      const prompt = config.getPrompt('UNKNOWN_AGENT');
      expect(prompt).toContain('GENÉRICO');
    });
  });

  describe('getMinimalPrompt', () => {
    test('should return shorter prompt than getPrompt', () => {
      const full = config.getPrompt('BANCARIO');
      const minimal = config.getMinimalPrompt('BANCARIO');

      expect(minimal.length).toBeLessThan(full.length);
    });

    test('should include key information', () => {
      const prompt = config.getMinimalPrompt('CONSUMIDOR');
      expect(prompt).toContain('CONSUMIDOR');
      expect(prompt).toContain('ESTRUTURA');
    });

    test('should instruct not to use REVISAR markers', () => {
      const prompt = config.getMinimalPrompt('BANCARIO');
      expect(prompt).toContain('NUNCA use [REVISAR]');
    });
  });

  describe('getApiConfig', () => {
    test('should return Anthropic config', () => {
      const apiConfig = config.getApiConfig('anthropic');
      expect(apiConfig).toBeDefined();
      expect(apiConfig.model).toBeDefined();
      expect(apiConfig.maxTokens).toBeDefined();
    });

    test('should return Gemini config', () => {
      const apiConfig = config.getApiConfig('gemini');
      expect(apiConfig).toBeDefined();
      expect(apiConfig.model).toBeDefined();
    });

    test('should return empty object for unknown provider', () => {
      const apiConfig = config.getApiConfig('unknown');
      expect(apiConfig).toEqual({});
    });
  });

  describe('getValidationConfig', () => {
    test('should return validation settings', () => {
      const validationConfig = config.getValidationConfig();
      expect(validationConfig).toBeDefined();
      expect(validationConfig.threshold).toBeDefined();
      expect(validationConfig.targetScore).toBeDefined();
    });
  });
});
