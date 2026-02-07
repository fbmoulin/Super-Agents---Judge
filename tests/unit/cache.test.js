// tests/unit/cache.test.js
const { generateCacheKey, getTTL, CACHE_PREFIX, createCacheClient, getCachedResult, setCachedResult } = require('../../lib/cache');

describe('Cache Module', () => {
  describe('generateCacheKey', () => {
    test('generates deterministic key from input', () => {
      const input = {
        fatos: 'O autor celebrou contrato de empréstimo',
        questoes: 'Existência de vício de consentimento',
        pedidos: 'Declaração de nulidade',
        classe: 'Procedimento Comum Cível',
        assunto: 'Empréstimo consignado'
      };
      const key1 = generateCacheKey(input);
      const key2 = generateCacheKey(input);
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^lex:v2\.7:[a-f0-9]{16}$/);
    });

    test('generates different keys for different inputs', () => {
      const input1 = { fatos: 'caso A', questoes: '', pedidos: '', classe: '', assunto: '' };
      const input2 = { fatos: 'caso B', questoes: '', pedidos: '', classe: '', assunto: '' };
      expect(generateCacheKey(input1)).not.toBe(generateCacheKey(input2));
    });

    test('normalizes whitespace in inputs', () => {
      const input1 = { fatos: 'caso  com   espaços', questoes: '', pedidos: '', classe: '', assunto: '' };
      const input2 = { fatos: 'caso com espaços', questoes: '', pedidos: '', classe: '', assunto: '' };
      expect(generateCacheKey(input1)).toBe(generateCacheKey(input2));
    });
  });

  describe('getTTL', () => {
    test('returns 7 days for high confidence (>=0.90)', () => {
      expect(getTTL(0.95)).toBe(604800);
      expect(getTTL(0.90)).toBe(604800);
    });

    test('returns 1 day for medium confidence (>=0.70)', () => {
      expect(getTTL(0.85)).toBe(86400);
      expect(getTTL(0.70)).toBe(86400);
    });

    test('returns 0 for low confidence (<0.70)', () => {
      expect(getTTL(0.5)).toBe(0);
      expect(getTTL(0)).toBe(0);
    });
  });

  describe('CACHE_PREFIX', () => {
    test('exports correct prefix', () => {
      expect(CACHE_PREFIX).toBe('lex:v2.7:');
    });
  });
});

describe('Redis Client Wrapper', () => {
  describe('createCacheClient', () => {
    test('returns object with get, set, quit methods', () => {
      const client = createCacheClient({ mock: true });
      expect(client).toHaveProperty('get');
      expect(client).toHaveProperty('set');
      expect(client).toHaveProperty('quit');
    });
  });

  describe('getCachedResult (mock)', () => {
    test('returns null for cache miss', async () => {
      const client = createCacheClient({ mock: true });
      const result = await getCachedResult(client, 'lex:v2.7:nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('setCachedResult (mock)', () => {
    test('stores and retrieves cached result', async () => {
      const client = createCacheClient({ mock: true });
      const key = 'lex:v2.7:testkey1234';
      const data = { minuta: 'I - RELATORIO...', score: 95 };

      await setCachedResult(client, key, data, 86400);
      const result = await getCachedResult(client, key);
      expect(result).toEqual(data);
    });

    test('does not cache when TTL is 0', async () => {
      const client = createCacheClient({ mock: true });
      const key = 'lex:v2.7:nottl';
      await setCachedResult(client, key, { minuta: 'test' }, 0);
      const result = await getCachedResult(client, key);
      expect(result).toBeNull();
    });
  });
});
