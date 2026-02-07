#!/usr/bin/env node
/**
 * LEX INTELLIGENTIA JUDICIÁRIO - Production Readiness Checklist
 *
 * Automated verification of all production requirements.
 * Run: node scripts/production-checklist.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('../lib/logger');

// ============================================================================
// UTILITIES
// ============================================================================

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return null;
  }
}

// ============================================================================
// CHECKS
// ============================================================================

const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function check(name, condition, details = '') {
  const passed = typeof condition === 'function' ? condition() : condition;
  logger.testResult(name, passed, details);
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
  return passed;
}

function warn(name, condition, details = '') {
  const passed = typeof condition === 'function' ? condition() : condition;
  if (!passed) {
    logger.warn(name, { detail: details });
    results.warnings++;
  } else {
    logger.testResult(name, true, details);
    results.passed++;
  }
  return passed;
}

// ============================================================================
// MAIN CHECKS
// ============================================================================

logger.section('LEX INTELLIGENTIA - Production Readiness Checker v2.8.0');

// ----------------------------------------------------------------------------
// 1. ENVIRONMENT
// ----------------------------------------------------------------------------

logger.section('1. ENVIRONMENT');

check('Node.js version >= 18',
  () => {
    const version = process.version.match(/v(\d+)/);
    return version && parseInt(version[1]) >= 18;
  },
  `Current: ${process.version}`
);

check('package.json exists',
  () => fs.existsSync('package.json'),
  'Project root'
);

check('node_modules installed',
  () => fs.existsSync('node_modules'),
  'Run: npm ci'
);

check('.env file exists',
  () => fs.existsSync('.env') || fs.existsSync('.env.keys'),
  'Copy from .env.keys.template'
);

// ----------------------------------------------------------------------------
// 2. API KEYS
// ----------------------------------------------------------------------------

logger.section('2. API KEYS');

const envFile = fs.existsSync('.env') ? '.env' : (fs.existsSync('.env.keys') ? '.env.keys' : null);
let envContent = '';
if (envFile) {
  envContent = fs.readFileSync(envFile, 'utf8');
}

function checkEnvVar(name) {
  const regex = new RegExp(`^${name}=(.+)$`, 'm');
  const match = envContent.match(regex);
  if (!match) return false;
  const value = match[1].trim();
  // Check if it's a placeholder
  return value && !value.includes('YOUR_') && !value.includes('_HERE');
}

warn('GEMINI_API_KEY configured',
  () => checkEnvVar('GEMINI_API_KEY'),
  'Required for router classification'
);

warn('ANTHROPIC_API_KEY configured',
  () => checkEnvVar('ANTHROPIC_API_KEY'),
  'Required for agent draft generation'
);

warn('AUDIT_SHEET_ID configured',
  () => checkEnvVar('AUDIT_SHEET_ID'),
  'Required for audit logging'
);

warn('Google OAuth2 configured',
  () => checkEnvVar('GOOGLE_CLIENT_ID') && checkEnvVar('GOOGLE_CLIENT_SECRET'),
  'Required for Google Sheets integration'
);

// ----------------------------------------------------------------------------
// 3. CONFIGURATION
// ----------------------------------------------------------------------------

logger.section('3. CONFIGURATION');

let config;
try {
  config = require(path.join(process.cwd(), 'config'));
  check('Config module loads', true);
} catch (error) {
  check('Config module loads', false, error.message);
  config = null;
}

if (config) {
  const agents = config.getAgentNames();
  check('23+ agents defined',
    () => agents.length >= 23,
    `Found: ${agents.length} agents`
  );

  check('Anthropic API config valid',
    () => {
      const api = config.getApiConfig('anthropic');
      return api.model && api.maxTokens && api.temperature !== undefined;
    },
    'Model, maxTokens, temperature'
  );
}

// ----------------------------------------------------------------------------
// 4. TESTS
// ----------------------------------------------------------------------------

logger.section('4. TESTS');

logger.info('Running unit tests');
const testResult = runCommand('npm test 2>&1');

if (testResult) {
  const passMatch = testResult.match(/(\d+) passed/);
  const failMatch = testResult.match(/(\d+) failed/);
  const passed = passMatch ? parseInt(passMatch[1]) : 0;
  const failed = failMatch ? parseInt(failMatch[1]) : 0;

  check('Unit tests passing',
    () => failed === 0 && passed > 0,
    `${passed} passed, ${failed} failed`
  );
} else {
  check('Unit tests passing', false, 'Test execution failed');
}

// ----------------------------------------------------------------------------
// 5. WORKFLOW VALIDATION
// ----------------------------------------------------------------------------

logger.section('5. WORKFLOW VALIDATION');

const workflowV51 = 'n8n_workflow_v5.1_improved_prompts.json';
const workflowV26 = 'n8n_workflow_v2.6_fazenda_publica.json';

check('Main workflow exists (v5.1)',
  () => fs.existsSync(workflowV51),
  workflowV51
);

check('Fazenda Pública workflow exists (v2.6)',
  () => fs.existsSync(workflowV26),
  workflowV26
);

logger.info('Validating workflows');
const validateResult = runCommand('npm run validate 2>&1');

if (validateResult) {
  check('Main workflow valid',
    () => validateResult.includes('PASSED'),
    'v5.1 validation'
  );
} else {
  check('Main workflow valid', false, 'Validation failed');
}

// ----------------------------------------------------------------------------
// 6. SECURITY
// ----------------------------------------------------------------------------

logger.section('6. SECURITY');

check('.gitignore includes .env',
  () => {
    const gitignore = fs.existsSync('.gitignore') ?
      fs.readFileSync('.gitignore', 'utf8') : '';
    return gitignore.includes('.env');
  },
  'Prevents credential exposure'
);

check('No API keys in source code',
  () => {
    const configContent = fs.existsSync('config/settings.json') ?
      fs.readFileSync('config/settings.json', 'utf8') : '';
    return !configContent.includes('sk-ant-') &&
           !configContent.includes('AIzaSy');
  },
  'Scanning config files'
);

// ----------------------------------------------------------------------------
// 7. DOCKER
// ----------------------------------------------------------------------------

logger.section('7. DOCKER (Optional)');

warn('docker-compose.yml exists',
  () => fs.existsSync('docker/docker-compose.yml'),
  'Full stack deployment'
);

warn('docker-compose-qdrant.yml exists',
  () => fs.existsSync('docker/docker-compose-qdrant.yml'),
  'Vector database setup'
);

// ----------------------------------------------------------------------------
// 8. DOCUMENTATION
// ----------------------------------------------------------------------------

logger.section('8. DOCUMENTATION');

warn('DEPLOYMENT.md exists',
  () => fs.existsSync('docs/DEPLOYMENT.md'),
  'Deployment guide'
);

warn('README.md exists',
  () => fs.existsSync('README.md'),
  'Project documentation'
);

// ============================================================================
// SUMMARY
// ============================================================================

logger.section('SUMMARY');

const total = results.passed + results.failed + results.warnings;
const score = Math.round((results.passed / total) * 100);

logger.info('Results', {
  passed: results.passed,
  warnings: results.warnings,
  failed: results.failed,
  readiness: `${score}%`
});

if (results.failed === 0) {
  logger.success('READY FOR PRODUCTION');
  logger.info('Next steps: 1) Configure n8n credentials, 2) Import workflows, 3) Set webhook to Production, 4) Test');
  process.exit(0);
} else {
  logger.error('NOT READY FOR PRODUCTION');
  logger.warn('Fix the failed checks above before deploying');
  process.exit(1);
}
