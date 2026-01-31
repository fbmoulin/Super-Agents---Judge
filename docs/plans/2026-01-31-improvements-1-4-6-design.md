# Implementation Plan: Improvements 1-4 + 6

**Date:** 2026-01-31
**Scope:** HTTP Client, Tests, Scripts Reorganization, Python Setup, Logging

---

## Executive Summary

This plan addresses 5 improvement categories identified in the codebase analysis:
1. **HTTP Client Refactor** - Extract ~100 lines of duplicate code
2. **Test Coverage** - Add tests for 3 critical scripts (currently 0% coverage)
3. **Scripts Organization** - Reorganize 14+ scripts into logical subdirectories
4. **Python Setup** - Document dependencies for Python scripts
6. **Logging Infrastructure** - Replace 324 console.log instances with structured logging

**Estimated Total Effort:** 12-16 hours

---

## Task Dependencies

```
┌─────────────────┐
│ #7 HTTP Client  │ ◄── Foundation (no deps)
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ #11 Logging     │     │ #10 Python Deps │ ◄── Independent
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ #8 Tests        │ ◄── Needs HTTP client for mocking
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ #9 Reorganize   │ ◄── Final step after all modules ready
└─────────────────┘
```

---

## Task #7: HTTP Client Utility Module

### Current State
- `agent_validator.js` lines 187-243: Full implementation with 120s timeout
- `test_and_evaluate.js` lines 67-130: Partial implementation, no timeout
- `invalidate_cache.js`: Uses fetch() with no error handling

### Target Architecture

```
lib/
└── http-client.js
    ├── anthropicRequest(options) - Claude API calls
    ├── geminiRequest(options)    - Gemini API calls (optional)
    └── fetchWithRetry(url, opts) - Generic fetch with retries
```

### Implementation

```javascript
// lib/http-client.js
const https = require('https');

const DEFAULT_TIMEOUT = 120000; // 120s
const MAX_RETRIES = 3;

async function anthropicRequest({ systemPrompt, userMessage, model, maxTokens, temperature }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const body = JSON.stringify({
    model: model || 'claude-sonnet-4-20250514',
    max_tokens: maxTokens || 4096,
    temperature: temperature || 0.3,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }]
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(DEFAULT_TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(body);
    req.end();
  });
}

module.exports = { anthropicRequest, DEFAULT_TIMEOUT, MAX_RETRIES };
```

### Files to Update
- `scripts/agent_validator.js` - Replace callClaude() with import
- `scripts/test_and_evaluate.js` - Replace callClaude() with import

### Estimated Time: 2 hours

---

## Task #11: Logging Infrastructure

### Current State
- 324 instances of console.log/error/warn across scripts
- No log levels, no structured output
- Hard to filter or parse logs

### Target Architecture

```
lib/
└── logger.js
    ├── logger.debug(msg, meta)
    ├── logger.info(msg, meta)
    ├── logger.warn(msg, meta)
    ├── logger.error(msg, meta)
    └── logger.timing(label, durationMs)
```

### Implementation

```javascript
// lib/logger.js
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];
const IS_JSON = process.env.LOG_FORMAT === 'json';

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();

  if (IS_JSON) {
    return JSON.stringify({ timestamp, level, message, ...meta });
  }

  const color = {
    debug: COLORS.dim,
    info: COLORS.green,
    warn: COLORS.yellow,
    error: COLORS.red
  }[level] || COLORS.reset;

  const metaStr = Object.keys(meta).length
    ? ` ${COLORS.dim}${JSON.stringify(meta)}${COLORS.reset}`
    : '';

  return `${COLORS.dim}${timestamp}${COLORS.reset} ${color}${level.toUpperCase()}${COLORS.reset} ${message}${metaStr}`;
}

function log(level, message, meta) {
  if (LOG_LEVELS[level] >= CURRENT_LEVEL) {
    const output = formatLog(level, message, meta);
    if (level === 'error') {
      console.error(output);
    } else {
      console.log(output);
    }
  }
}

module.exports = {
  debug: (msg, meta) => log('debug', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  timing: (label, ms) => log('info', `${label} completed`, { durationMs: ms })
};
```

### Files to Update (Priority Order)
1. `scripts/agent_validator.js` - 45 console calls
2. `scripts/validate_workflow.js` - 80+ console calls
3. `scripts/test_and_evaluate.js` - 30 console calls
4. Other scripts as time permits

### Estimated Time: 3 hours

---

## Task #10: Python Dependencies

### Current State
- No requirements.txt in project root
- Python imports scattered across 2 scripts
- No setup documentation

### Required Dependencies

```
# requirements.txt
# Python 3.11+ required

# Core dependencies
requests>=2.32.0
python-dotenv>=1.0.0

# Vector database
qdrant-client>=1.7.0
openai>=1.0.0

# Optional (ChromaDB alternative)
chromadb>=0.4.0
```

### Documentation (docs/PYTHON_SETUP.md)

```markdown
# Python Environment Setup

## Requirements
- Python 3.11 or higher
- pip or pipx for package management

## Installation

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or: .venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

## Environment Variables
Create `.env` file with:
OPENAI_API_KEY=your-key
QDRANT_URL=http://localhost:6333

## Usage
# Download STJ data
python scripts/stj_downloader.py --download-all

# Ingest to Qdrant
python scripts/qdrant_ingest.py
```

### Estimated Time: 1 hour

---

## Task #8: Critical Path Tests

### Test Files to Create

| File | Target | Priority |
|------|--------|----------|
| `tests/unit/http-client.test.js` | lib/http-client.js | HIGH |
| `tests/unit/validation-criteria.test.js` | 18 regex patterns | HIGH |
| `tests/unit/graph-algorithms.test.js` | Cycle detection | MEDIUM |
| `tests/integration/agent-validation.test.js` | Full pipeline | HIGH |

### Key Test Cases

**http-client.test.js:**
```javascript
describe('anthropicRequest', () => {
  test('should make successful API call', async () => {});
  test('should handle API errors', async () => {});
  test('should timeout after 120s', async () => {});
  test('should reject without API key', async () => {});
});
```

**validation-criteria.test.js:**
```javascript
describe('VALIDATION_CRITERIA', () => {
  describe('hasRelatorio', () => {
    test('matches "I - RELATÓRIO"', () => {});
    test('matches "RELATÓRIO" alone', () => {});
    test('rejects without section', () => {});
  });
  // ... 17 more criteria
});
```

### Estimated Time: 4-6 hours

---

## Task #9: Scripts Reorganization

### Target Structure

```
scripts/
├── lib/
│   ├── http-client.js      (NEW)
│   ├── logger.js           (NEW)
│   └── fs-utils.js         (future)
├── validators/
│   ├── agent_validator.js
│   ├── validate_workflow.js
│   └── validate_detailed.js
├── evaluators/
│   ├── llm_evaluator.js
│   └── test_and_evaluate.js
├── data/
│   ├── stj_downloader.py
│   └── qdrant_ingest.py
├── workflows/
│   ├── create_minimal_workflow.js
│   ├── fix_workflow_typeversions.js
│   ├── update_workflow_v2.6.js
│   └── integrate_rag_workflow.js
└── utils/
    ├── pdf_extractor.js
    └── invalidate_cache.js
```

### Package.json Updates

```json
{
  "scripts": {
    "validate": "node scripts/validators/validate_workflow.js",
    "validate:agent": "node scripts/validators/agent_validator.js",
    "evaluate": "node scripts/evaluators/llm_evaluator.js",
    "test:agent": "node scripts/evaluators/test_and_evaluate.js"
  }
}
```

### Estimated Time: 2 hours

---

## Implementation Order

1. **#7 HTTP Client** (2h) - Foundation for other work
2. **#11 Logging** (3h) - Can run parallel with #10
3. **#10 Python Deps** (1h) - Independent, quick win
4. **#8 Tests** (4-6h) - Depends on HTTP client
5. **#9 Reorganize** (2h) - Final step after all modules ready

**Total: 12-16 hours**

---

## Success Criteria

- [ ] HTTP client extracted and working in both scripts
- [ ] Logger integrated in at least 3 scripts
- [ ] requirements.txt created and documented
- [ ] 50%+ test coverage on critical paths
- [ ] Scripts reorganized with updated package.json
- [ ] All existing tests still passing
- [ ] CI pipeline validates new structure

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing scripts | Run tests after each change |
| Import path changes | Update all references systematically |
| Python version conflicts | Document 3.11+ requirement clearly |
| Test flakiness with API mocks | Use deterministic mock responses |
