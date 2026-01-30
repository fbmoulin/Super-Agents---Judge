/**
 * Security Utilities for Lex Intelligentia
 * Input validation, sanitization, and security helpers
 */

// =============================================================================
// INPUT VALIDATION
// =============================================================================

const LIMITS = {
  // Maximum text lengths (characters)
  fatos: 50000,      // ~10 pages of text
  questoes: 10000,   // ~2 pages
  pedidos: 10000,    // ~2 pages
  classe: 500,
  assunto: 500,

  // Request limits
  maxRequestSize: 100000,  // 100KB total
  maxFieldCount: 20
};

/**
 * Validate and sanitize webhook input
 * @param {object} input - Raw webhook input
 * @returns {{ valid: boolean, data?: object, errors?: string[] }}
 */
function validateInput(input) {
  const errors = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Input must be an object'] };
  }

  // Extract body if nested
  const data = input.body || input;

  // Check required fields
  if (!data.fatos && !data.questoes && !data.pedidos) {
    errors.push('At least one of fatos, questoes, or pedidos is required');
  }

  // Validate and sanitize each field
  const sanitized = {};

  for (const [field, maxLength] of Object.entries(LIMITS)) {
    if (field === 'maxRequestSize' || field === 'maxFieldCount') continue;

    if (data[field]) {
      // Type check
      if (typeof data[field] !== 'string') {
        errors.push(`${field} must be a string`);
        continue;
      }

      // Length check
      if (data[field].length > maxLength) {
        errors.push(`${field} exceeds maximum length of ${maxLength} characters`);
        continue;
      }

      // Sanitize: remove potential injection patterns
      sanitized[field] = sanitizeText(data[field]);
    }
  }

  // Check total request size
  const totalSize = JSON.stringify(sanitized).length;
  if (totalSize > LIMITS.maxRequestSize) {
    errors.push(`Total request size exceeds ${LIMITS.maxRequestSize} bytes`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: sanitized };
}

/**
 * Sanitize text to prevent injection attacks
 * @param {string} text - Input text
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
  if (!text) return '';

  return text
    // Remove null bytes
    .replace(/\0/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim excessive whitespace
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

// =============================================================================
// RATE LIMITING (Configuration for n8n implementation)
// =============================================================================

/**
 * Rate limiting configuration for n8n webhook
 *
 * To implement in n8n:
 * 1. Add a Code node before the main workflow
 * 2. Use Redis or in-memory store for tracking
 * 3. Return 429 if rate limit exceeded
 */
const RATE_LIMITS = {
  // Per IP address
  perIP: {
    requests: 60,      // Max requests
    windowMs: 60000,   // Per minute
    blockDurationMs: 300000  // Block for 5 minutes if exceeded
  },

  // Per API key (if using authentication)
  perKey: {
    requests: 1000,
    windowMs: 3600000  // Per hour
  },

  // Global limits
  global: {
    requestsPerSecond: 100,
    maxConcurrent: 50
  }
};

/**
 * Example n8n Code node for rate limiting
 * Copy this to a Code node at the start of your workflow
 */
const N8N_RATE_LIMIT_CODE = `
// Rate Limiting Code Node for n8n
// Add this as the first node after webhook

const clientIP = $input.first().json.headers?.['x-forwarded-for']
  || $input.first().json.headers?.['x-real-ip']
  || 'unknown';

// Use workflow static data for simple rate limiting
const staticData = $getWorkflowStaticData('global');
const now = Date.now();
const windowMs = 60000; // 1 minute
const maxRequests = 60;

// Initialize or clean old entries
if (!staticData.requests) staticData.requests = {};
if (!staticData.requests[clientIP]) {
  staticData.requests[clientIP] = { count: 0, windowStart: now };
}

const clientData = staticData.requests[clientIP];

// Reset window if expired
if (now - clientData.windowStart > windowMs) {
  clientData.count = 0;
  clientData.windowStart = now;
}

// Check rate limit
clientData.count++;

if (clientData.count > maxRequests) {
  // Return 429 Too Many Requests
  return [{
    json: {
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((clientData.windowStart + windowMs - now) / 1000)
    },
    pairedItem: { item: 0 }
  }];
}

// Pass through if within limits
return $input.all();
`;

// =============================================================================
// SECURITY HEADERS
// =============================================================================

/**
 * Recommended security headers for API responses
 */
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'none'",
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache'
};

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Create audit log entry for CNJ 615/2025 compliance
 * @param {object} params - Audit parameters
 * @returns {object} Audit log entry
 */
function createAuditEntry({
  operacao,
  agente,
  inputHash,
  outputHash,
  confianca,
  scoreQA,
  tempoExecucaoMs,
  clientIP,
  userAgent
}) {
  return {
    timestamp: new Date().toISOString(),
    audit_id: `LEX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    operacao: operacao || 'GERACAO_MINUTA',
    agente,
    classificacao_risco: calculateRisk(confianca, scoreQA),
    confianca_classificacao: confianca,
    score_qa: scoreQA,
    requer_revisao_humana: true,  // Always true per CNJ 615/2025
    hash_input: inputHash,
    hash_output: outputHash,
    tempo_execucao_ms: tempoExecucaoMs,
    metadata: {
      client_ip: anonymizeIP(clientIP),
      user_agent: userAgent?.substring(0, 100)
    }
  };
}

/**
 * Calculate risk classification per CNJ 615/2025
 */
function calculateRisk(confianca, scoreQA) {
  if (confianca >= 0.85 && scoreQA >= 85) return 'BAIXO';
  if (confianca >= 0.65 && scoreQA >= 70) return 'MEDIO';
  return 'ALTO';
}

/**
 * Anonymize IP for LGPD compliance
 */
function anonymizeIP(ip) {
  if (!ip) return 'unknown';
  // Keep only first two octets for IPv4
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.x.x`;
  }
  return 'anonymized';
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  LIMITS,
  RATE_LIMITS,
  SECURITY_HEADERS,
  validateInput,
  sanitizeText,
  createAuditEntry,
  calculateRisk,
  anonymizeIP,
  N8N_RATE_LIMIT_CODE
};
