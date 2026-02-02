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
// PROMPT INJECTION DETECTION (SEC-HIGH-002)
// =============================================================================

/**
 * Patterns that indicate potential prompt injection attempts
 * These patterns are designed to detect common attack vectors while
 * minimizing false positives in legitimate legal text
 */
const PROMPT_INJECTION_PATTERNS = [
  // Direct instruction override attempts
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|guidelines?)/i,
  /disregard\s+(all\s+)?(previous|prior|above|earlier)/i,
  /forget\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|context)/i,

  // Role manipulation attempts
  /you\s+are\s+now\s+(a|an|acting\s+as)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /act\s+as\s+if\s+you/i,
  /roleplay\s+as/i,
  /assume\s+the\s+role\s+of/i,

  // System prompt extraction attempts
  /what\s+(is|are)\s+your\s+(system\s+)?(instructions?|prompt)/i,
  /reveal\s+(your\s+)?(system\s+)?(prompt|instructions?)/i,
  /show\s+(me\s+)?(your\s+)?(system\s+)?(instructions?|prompt)/i,
  /print\s+(your\s+)?(system\s+)?(prompt|instructions?)/i,
  /output\s+(your\s+)?(system\s+)?(instructions?|prompt)/i,

  // Delimiter injection
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /<<SYS>>/i,
  /<\/SYS>>/i,
  /\[SYSTEM\]/i,

  // Explicit override keywords
  /system\s*:\s*override/i,
  /admin\s*:\s*execute/i,
  /debug\s*:\s*true/i,
  /jailbreak/i,
  /DAN\s*mode/i,

  // Code execution attempts
  /```(python|javascript|bash|sh|exec)/i,
  /eval\s*\(/i,
  /exec\s*\(/i,
  /__import__/i
];

/**
 * Detect potential prompt injection attempts in text
 * @param {string} text - Text to analyze
 * @returns {{ detected: boolean, patterns: string[], severity: string }}
 */
function detectPromptInjection(text) {
  if (!text || typeof text !== 'string') {
    return { detected: false, patterns: [], severity: 'NONE' };
  }

  const detectedPatterns = [];

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      detectedPatterns.push(pattern.toString());
    }
  }

  if (detectedPatterns.length === 0) {
    return { detected: false, patterns: [], severity: 'NONE' };
  }

  // Determine severity based on number and type of patterns
  let severity = 'LOW';
  if (detectedPatterns.length >= 3) {
    severity = 'CRITICAL';
  } else if (detectedPatterns.length >= 2) {
    severity = 'HIGH';
  } else if (detectedPatterns.some(p =>
    p.includes('INST') || p.includes('im_start') || p.includes('SYS')
  )) {
    severity = 'HIGH';
  }

  return {
    detected: true,
    patterns: detectedPatterns,
    severity
  };
}

/**
 * Validate input for prompt injection before processing
 * Combines sanitization with injection detection
 * @param {object} input - Input object with text fields
 * @returns {{ safe: boolean, issues: object[], sanitized: object }}
 */
function validateAndSanitizeInput(input) {
  const issues = [];
  const sanitized = {};
  const fieldsToCheck = ['fatos', 'questoes', 'pedidos', 'classe_processual', 'assunto'];

  for (const field of fieldsToCheck) {
    if (input[field]) {
      // First sanitize
      const sanitizedValue = sanitizeText(input[field]);

      // Then check for injection
      const injectionCheck = detectPromptInjection(sanitizedValue);

      if (injectionCheck.detected) {
        issues.push({
          field,
          type: 'PROMPT_INJECTION',
          severity: injectionCheck.severity,
          patterns: injectionCheck.patterns.length
        });
      }

      sanitized[field] = sanitizedValue;
    }
  }

  // Block if any HIGH or CRITICAL severity issues
  const hasCritical = issues.some(i =>
    i.severity === 'CRITICAL' || i.severity === 'HIGH'
  );

  return {
    safe: !hasCritical,
    issues,
    sanitized
  };
}

// =============================================================================
// WEBHOOK AUTHENTICATION (SEC-HIGH-001)
// =============================================================================

/**
 * Webhook authentication configuration
 * Supports multiple authentication methods
 */
const WEBHOOK_AUTH_CONFIG = {
  // API Key authentication (recommended)
  apiKey: {
    headerName: 'X-API-Key',
    envVar: 'WEBHOOK_API_KEY'
  },

  // Bearer token authentication
  bearer: {
    headerName: 'Authorization',
    prefix: 'Bearer ',
    envVar: 'WEBHOOK_BEARER_TOKEN'
  },

  // HMAC signature verification (for webhooks from known sources)
  hmac: {
    headerName: 'X-Signature',
    algorithm: 'sha256',
    envVar: 'WEBHOOK_HMAC_SECRET'
  }
};

/**
 * Validate webhook authentication
 * @param {object} headers - Request headers
 * @param {string} body - Request body (for HMAC)
 * @param {string} method - Authentication method ('apiKey', 'bearer', 'hmac')
 * @returns {{ authenticated: boolean, error?: string }}
 */
function validateWebhookAuth(headers, body = '', method = 'apiKey') {
  const config = WEBHOOK_AUTH_CONFIG[method];
  if (!config) {
    return { authenticated: false, error: 'Invalid authentication method' };
  }

  const expectedValue = process.env[config.envVar];
  if (!expectedValue) {
    // If no auth configured, log warning but allow (for development)
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SECURITY] ${config.envVar} not configured - webhook auth disabled`);
      return { authenticated: true, warning: 'Auth disabled in development' };
    }
    return { authenticated: false, error: 'Authentication not configured' };
  }

  switch (method) {
    case 'apiKey': {
      const providedKey = headers[config.headerName.toLowerCase()] ||
                          headers[config.headerName];
      if (!providedKey) {
        return { authenticated: false, error: 'API key not provided' };
      }
      if (providedKey !== expectedValue) {
        return { authenticated: false, error: 'Invalid API key' };
      }
      return { authenticated: true };
    }

    case 'bearer': {
      const authHeader = headers['authorization'] || headers['Authorization'];
      if (!authHeader) {
        return { authenticated: false, error: 'Authorization header not provided' };
      }
      if (!authHeader.startsWith(config.prefix)) {
        return { authenticated: false, error: 'Invalid authorization format' };
      }
      const token = authHeader.slice(config.prefix.length);
      if (token !== expectedValue) {
        return { authenticated: false, error: 'Invalid bearer token' };
      }
      return { authenticated: true };
    }

    case 'hmac': {
      const crypto = require('crypto');
      const providedSignature = headers[config.headerName.toLowerCase()] ||
                                headers[config.headerName];
      if (!providedSignature) {
        return { authenticated: false, error: 'Signature not provided' };
      }
      const expectedSignature = crypto
        .createHmac(config.algorithm, expectedValue)
        .update(body)
        .digest('hex');
      if (providedSignature !== expectedSignature) {
        return { authenticated: false, error: 'Invalid signature' };
      }
      return { authenticated: true };
    }

    default:
      return { authenticated: false, error: 'Unknown authentication method' };
  }
}

/**
 * n8n Code node for webhook authentication
 * Add this as the first node after webhook trigger
 */
const N8N_WEBHOOK_AUTH_CODE = `
// Webhook Authentication Code Node for n8n
// Add this as the first node after webhook trigger

const headers = $input.first().json.headers || {};
const expectedApiKey = $env.WEBHOOK_API_KEY;

// Skip auth in test mode or if not configured
if (!expectedApiKey) {
  console.warn('[SECURITY] WEBHOOK_API_KEY not set - auth skipped');
  return $input.all();
}

const providedApiKey = headers['x-api-key'] || headers['X-API-Key'];

if (!providedApiKey) {
  throw new Error('Authentication required: X-API-Key header missing');
}

if (providedApiKey !== expectedApiKey) {
  throw new Error('Authentication failed: Invalid API key');
}

// Authentication successful - pass through
return $input.all();
`;

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
  // Constants
  LIMITS,
  RATE_LIMITS,
  SECURITY_HEADERS,
  WEBHOOK_AUTH_CONFIG,
  PROMPT_INJECTION_PATTERNS,

  // Input validation
  validateInput,
  sanitizeText,
  validateAndSanitizeInput,

  // Prompt injection detection (SEC-HIGH-002)
  detectPromptInjection,

  // Webhook authentication (SEC-HIGH-001)
  validateWebhookAuth,

  // Audit logging (CNJ 615/2025)
  createAuditEntry,
  calculateRisk,
  anonymizeIP,

  // n8n Code snippets
  N8N_RATE_LIMIT_CODE,
  N8N_WEBHOOK_AUTH_CODE
};
