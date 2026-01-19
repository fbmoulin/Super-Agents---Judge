#!/usr/bin/env node
/**
 * Lex Intelligentia v2.1.1 - Production Test Runner
 * Executes all test cases against n8n Cloud webhook
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Lex Intelligentia n8n Cloud webhook (test mode)
  webhookUrl: process.env.WEBHOOK_URL || 'https://lexintel.app.n8n.cloud/webhook-test/lex-intelligentia-agentes',
  timeout: 120000, // 2 minutes per request
  delayBetweenTests: 5000, // 5 seconds between tests
  outputDir: './test_results',
  maxRetries: 3, // Maximum retry attempts
  retryBaseDelay: 2000 // Base delay for exponential backoff (ms)
};

// ============================================================================
// UTILITIES
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// HTTP REQUEST WITH RETRY
// ============================================================================

async function sendRequestWithRetry(testCase) {
  let lastError;

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    const result = await sendRequest(testCase);

    // Success or non-retryable error
    if (result.success || result.statusCode === 400 || result.statusCode === 422) {
      return result;
    }

    // Retryable error
    lastError = result;
    if (attempt < CONFIG.maxRetries) {
      const delay = CONFIG.retryBaseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      log(`  ⚠ Attempt ${attempt} failed: ${result.error || `HTTP ${result.statusCode}`}. Retrying in ${delay / 1000}s...`, 'yellow');
      await sleep(delay);
    }
  }

  // All retries exhausted
  return {
    ...lastError,
    error: `Max retries (${CONFIG.maxRetries}) exceeded. Last error: ${lastError?.error || 'Unknown'}`,
    retriesExhausted: true
  };
}

async function sendRequest(testCase) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      fatos: testCase.fatos,
      questoes: testCase.questoes,
      pedidos: testCase.pedidos,
      classe: testCase.classe,
      assunto: testCase.assunto,
      valor_causa: testCase.valor_causa
    });

    const url = new URL(CONFIG.webhookUrl);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: CONFIG.timeout
    };

    const startTime = Date.now();

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);

      res.on('end', () => {
        const endTime = Date.now();
        try {
          const response = JSON.parse(data);
          resolve({
            success: true,
            statusCode: res.statusCode,
            response,
            executionTime: endTime - startTime
          });
        } catch (e) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: 'Invalid JSON response',
            rawResponse: data,
            executionTime: endTime - startTime
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        success: false,
        error: e.message,
        executionTime: Date.now() - startTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        executionTime: CONFIG.timeout
      });
    });

    req.write(payload);
    req.end();
  });
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateResponse(testCase, result) {
  const validation = {
    passed: true,
    checks: []
  };

  if (!result.success || !result.response) {
    validation.passed = false;
    validation.checks.push({ name: 'Response received', passed: false, detail: result.error });
    return validation;
  }

  const response = result.response;

  // Check 1: Success flag
  const successCheck = response.success === true;
  validation.checks.push({
    name: 'Success flag',
    passed: successCheck,
    detail: successCheck ? 'true' : `false - ${response.error?.codigo || 'unknown'}`
  });
  if (!successCheck) validation.passed = false;

  // Check 2: Minuta present
  const minutaPresent = !!response.minuta?.conteudo;
  validation.checks.push({
    name: 'Minuta present',
    passed: minutaPresent,
    detail: minutaPresent ? `${response.minuta.palavras} words` : 'Missing'
  });
  if (!minutaPresent) validation.passed = false;

  // Check 3: QA Score
  const qaScore = response.qualidade?.score || 0;
  const qaCheck = qaScore >= (testCase.expectativa?.score_minimo || 70);
  validation.checks.push({
    name: 'QA Score',
    passed: qaCheck,
    detail: `${qaScore}/100 (min: ${testCase.expectativa?.score_minimo || 70})`
  });
  if (!qaCheck) validation.passed = false;

  // Check 4: Correct agent
  const expectedAgent = testCase.expectativa?.agente_esperado;
  const actualAgent = response.compliance?.agente;
  const agentCheck = !expectedAgent || actualAgent === expectedAgent;
  validation.checks.push({
    name: 'Correct agent',
    passed: agentCheck,
    detail: `${actualAgent} (expected: ${expectedAgent || 'any'})`
  });
  if (!agentCheck) validation.passed = false;

  // Check 5: Structure (I/II/III)
  const content = response.minuta?.conteudo || '';
  const hasRelatorio = /I\s*[-–.]\s*RELAT[ÓO]RIO/i.test(content);
  const hasFundamentacao = /II\s*[-–.]\s*FUNDAMENTA[ÇC][ÃA]O/i.test(content);
  const hasDispositivo = /III\s*[-–.]\s*DISPOSITIVO/i.test(content);
  const structureCheck = hasRelatorio && hasFundamentacao && hasDispositivo;
  validation.checks.push({
    name: 'Structure I/II/III',
    passed: structureCheck,
    detail: `R:${hasRelatorio ? '✓' : '✗'} F:${hasFundamentacao ? '✓' : '✗'} D:${hasDispositivo ? '✓' : '✗'}`
  });

  // Check 6: Compliance
  const risco = response.compliance?.risco;
  const riscoCheck = ['BAIXO', 'MEDIO'].includes(risco);
  validation.checks.push({
    name: 'Risk level',
    passed: riscoCheck,
    detail: risco || 'Not provided'
  });

  // Check 7: Audit ID
  const auditId = response.rastreabilidade?.audit_id;
  validation.checks.push({
    name: 'Audit ID',
    passed: !!auditId,
    detail: auditId || 'Missing'
  });

  return validation;
}

// ============================================================================
// MAIN
// ============================================================================

async function runTests() {
  log('\n' + '='.repeat(80), 'cyan');
  log('LEX INTELLIGENTIA v2.1.1 - PRODUCTION TEST RUNNER', 'cyan');
  log('='.repeat(80), 'cyan');

  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  // Load test cases
  const testCases = [];
  const categories = ['bancario', 'consumidor', 'execucao', 'generico', 'locacao', 'possessorias',
                      'saude_cobertura', 'saude_contratual', 'transito', 'usucapiao', 'incorporacao'];

  for (const category of categories) {
    const dir = path.join(__dirname, category);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        testCases.push(JSON.parse(content));
      }
    }
  }

  log(`\nLoaded ${testCases.length} test cases`, 'blue');
  log(`Webhook: ${CONFIG.webhookUrl}\n`, 'blue');

  // Run tests
  const results = [];
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];

    log(`\n[${i + 1}/${testCases.length}] Testing: ${testCase.caso_id}`, 'yellow');
    log(`Description: ${testCase.descricao}`, 'blue');

    const result = await sendRequestWithRetry(testCase);
    const validation = validateResponse(testCase, result);

    results.push({
      testCase,
      result,
      validation
    });

    // Print validation results
    for (const check of validation.checks) {
      const icon = check.passed ? '✓' : '✗';
      const color = check.passed ? 'green' : 'red';
      log(`  ${icon} ${check.name}: ${check.detail}`, color);
    }

    log(`  ⏱ Execution time: ${(result.executionTime / 1000).toFixed(2)}s`, 'blue');

    if (validation.passed) {
      passed++;
      log(`  ✅ TEST PASSED`, 'green');
    } else {
      failed++;
      log(`  ❌ TEST FAILED`, 'red');
    }

    // Delay between tests
    if (i < testCases.length - 1) {
      log(`  Waiting ${CONFIG.delayBetweenTests / 1000}s before next test...`, 'blue');
      await sleep(CONFIG.delayBetweenTests);
    }
  }

  // Save results
  const reportPath = path.join(CONFIG.outputDir, `test_report_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  // Summary
  log('\n' + '='.repeat(80), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(80), 'cyan');
  log(`\nTotal: ${testCases.length}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`, passed === testCases.length ? 'green' : 'yellow');
  log(`\nReport saved to: ${reportPath}`, 'blue');

  process.exit(failed > 0 ? 1 : 0);
}

// Run
runTests().catch(console.error);
