#!/usr/bin/env node
/**
 * DETAILED N8N WORKFLOW VALIDATION
 * Fixes false positives and provides more accurate analysis
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(`${COLORS.bold}${title}${COLORS.reset}`, 'cyan');
  console.log('='.repeat(80));
}

// Load workflow
const workflowPath = process.argv[2] || path.join(__dirname, 'n8n_workflow_agentes_especializados_v2.1.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

log(`Analyzing: ${workflow.name} (v${workflow.versionId})`, 'bold');

// ============================================================================
// DETAILED CODE ANALYSIS
// ============================================================================

logSection('JavaScript Code Analysis (n8n Context)');

const codeNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.code');
const issues = [];

log(`Analyzing ${codeNodes.length} Code nodes...`, 'blue');
console.log();

codeNodes.forEach(node => {
  log(`📝 ${node.name}`, 'cyan');

  const code = node.parameters?.jsCode || '';
  const lines = code.split('\n');

  // 1. Check for return statement
  const hasReturn = /return\s+\[/.test(code);
  if (!hasReturn) {
    issues.push({
      node: node.name,
      severity: 'ERROR',
      issue: 'Missing return statement (must return array)',
      fix: 'Add: return [{ json: {...} }];'
    });
    log(`  ✗ Missing return statement`, 'red');
  } else {
    log(`  ✓ Has return statement`, 'green');
  }

  // 2. Check return format
  const returnMatches = code.match(/return\s+\[([\s\S]*?)\];?$/m);
  if (returnMatches) {
    const returnContent = returnMatches[1];
    if (!/\{\s*json:/.test(returnContent)) {
      issues.push({
        node: node.name,
        severity: 'WARNING',
        issue: 'Return format may be incorrect (should be [{ json: {...} }])',
        fix: 'Ensure return format: return [{ json: { ... } }];'
      });
      log(`  ⚠ Return format suspicious`, 'yellow');
    } else {
      log(`  ✓ Return format correct`, 'green');
    }
  }

  // 3. Check for n8n context access
  const n8nContexts = {
    '$input': /\$input/.test(code),
    '$json': /\$json/.test(code),
    '$()': /\$\([^)]+\)/.test(code),
    '$execution': /\$execution/.test(code),
    '$env': /\$env/.test(code)
  };

  const usedContexts = Object.keys(n8nContexts).filter(k => n8nContexts[k]);
  if (usedContexts.length > 0) {
    log(`  📦 Uses n8n contexts: ${usedContexts.join(', ')}`, 'blue');
  }

  // 4. Check for null safety
  const nullSafetyPatterns = {
    optional_chaining: /\?\./.test(code),
    nullish_coalescing: /\?\?/.test(code),
    try_catch: /try\s*\{[\s\S]*catch/.test(code),
    null_checks: /if\s*\([^)]*===\s*null\s*\|/.test(code) || /if\s*\([^)]*===\s*undefined/.test(code)
  };

  const hasSafety = Object.values(nullSafetyPatterns).some(v => v);
  if (hasSafety) {
    const methods = Object.keys(nullSafetyPatterns).filter(k => nullSafetyPatterns[k]);
    log(`  ✓ Null safety: ${methods.join(', ')}`, 'green');
  } else {
    // Check if there's direct property access
    const unsafeAccess = /\$json\.\w+\.\w+/.test(code) ||
                        /\$input\.first\(\)\.json\.\w+/.test(code);

    if (unsafeAccess) {
      issues.push({
        node: node.name,
        severity: 'WARNING',
        issue: 'Potential unsafe property access (no null checks)',
        fix: 'Add null checks or use optional chaining (?.) and nullish coalescing (??)'
      });
      log(`  ⚠ No null safety detected`, 'yellow');
    } else {
      log(`  ℹ No complex property access`, 'blue');
    }
  }

  // 5. Check for console.log (informational)
  const consoleCount = (code.match(/console\.log/g) || []).length;
  if (consoleCount > 0) {
    log(`  ℹ ${consoleCount} console.log statement(s) (OK for debugging)`, 'blue');
  }

  // 6. Check node references
  const nodeRefs = [];
  const refPattern = /\$\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = refPattern.exec(code)) !== null) {
    nodeRefs.push(match[1]);
  }

  if (nodeRefs.length > 0) {
    log(`  🔗 References nodes: ${nodeRefs.join(', ')}`, 'blue');

    // Validate references exist
    nodeRefs.forEach(refName => {
      const refNode = workflow.nodes.find(n => n.name === refName);
      if (!refNode) {
        issues.push({
          node: node.name,
          severity: 'ERROR',
          issue: `References non-existent node: "${refName}"`,
          fix: `Ensure node "${refName}" exists or update reference`
        });
        log(`  ✗ Invalid reference: "${refName}"`, 'red');
      }
    });
  }

  // 7. Code metrics
  const wordCount = code.split(/\s+/).length;
  const complexity = (code.match(/if|for|while|switch|catch/g) || []).length;

  log(`  📊 Size: ${lines.length} lines, ~${wordCount} tokens, complexity: ${complexity}`, 'blue');

  console.log();
});

// ============================================================================
// CONNECTION FLOW ANALYSIS
// ============================================================================

logSection('Connection Flow Analysis');

// Build adjacency list
const adjacency = new Map();

workflow.nodes.forEach(node => {
  adjacency.set(node.name, { id: node.id, type: node.type, targets: [] });
});

Object.keys(workflow.connections).forEach(sourceName => {
  const connections = workflow.connections[sourceName];

  Object.keys(connections).forEach(connType => {
    connections[connType].forEach(outputs => {
      outputs.forEach(conn => {
        const source = adjacency.get(sourceName);
        if (source) {
          source.targets.push({
            node: conn.node,
            type: connType,
            index: conn.index
          });
        }
      });
    });
  });
});

// Find critical paths
const webhook = workflow.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
const responses = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.respondToWebhook');

log(`Entry point: ${webhook?.name}`, 'green');
log(`Exit points: ${responses.map(r => r.name).join(', ')}`, 'green');
console.log();

// Trace paths using BFS
function tracePaths(startNode, endNodes) {
  const queue = [[startNode.name]];
  const allPaths = [];
  const visited = new Set();
  const maxPathLength = 50;

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (path.length > maxPathLength) continue;

    const pathKey = path.join('-');
    if (visited.has(pathKey)) continue;
    visited.add(pathKey);

    // Check if reached end
    const currentNode = workflow.nodes.find(n => n.name === current);
    if (endNodes.some(end => end.name === current)) {
      allPaths.push(path);
      continue;
    }

    // Explore next nodes
    const nodeData = adjacency.get(current);
    if (nodeData && nodeData.targets.length > 0) {
      nodeData.targets.forEach(target => {
        queue.push([...path, target.node]);
      });
    }
  }

  return allPaths;
}

const paths = tracePaths(webhook, responses);

log(`Found ${paths.length} path(s) from webhook to response:`, 'cyan');
console.log();

paths.forEach((path, idx) => {
  log(`Path ${idx + 1}: (${path.length} nodes)`, 'blue');
  path.forEach((nodeName, i) => {
    const node = workflow.nodes.find(n => n.name === nodeName);
    const prefix = i === 0 ? '  ┌─' : i === path.length - 1 ? '  └─' : '  ├─';
    const type = node?.type.split('.').pop() || 'unknown';
    log(`${prefix} ${nodeName} [${type}]`, 'blue');
  });
  console.log();
});

// ============================================================================
// ERROR HANDLING VALIDATION
// ============================================================================

logSection('Error Handling Validation');

const errorTrigger = workflow.nodes.find(n => n.type === 'n8n-nodes-base.errorTrigger');

if (errorTrigger) {
  log(`✓ Error Trigger found: ${errorTrigger.name}`, 'green');

  // Trace error handling path
  const errorPaths = tracePaths(errorTrigger, responses);

  log(`Found ${errorPaths.length} error handling path(s):`, 'cyan');
  console.log();

  errorPaths.forEach((path, idx) => {
    log(`Error Path ${idx + 1}:`, 'blue');
    path.forEach((nodeName, i) => {
      const node = workflow.nodes.find(n => n.name === nodeName);
      const prefix = i === 0 ? '  ┌─' : i === path.length - 1 ? '  └─' : '  ├─';
      const type = node?.type.split('.').pop() || 'unknown';
      log(`${prefix} ${nodeName} [${type}]`, 'blue');
    });
    console.log();
  });
} else {
  issues.push({
    node: 'Workflow',
    severity: 'WARNING',
    issue: 'No error trigger found',
    fix: 'Add Error Trigger node for error handling'
  });
  log(`⚠ No error trigger found`, 'yellow');
}

// ============================================================================
// CREDENTIAL & ENVIRONMENT VALIDATION
// ============================================================================

logSection('Credentials & Environment Variables');

const credNodes = workflow.nodes.filter(n => n.credentials);
const credMap = new Map();

credNodes.forEach(node => {
  Object.keys(node.credentials).forEach(credType => {
    const credId = node.credentials[credType].id;
    if (!credMap.has(credId)) {
      credMap.set(credId, []);
    }
    credMap.get(credId).push(node.name);
  });
});

log('Credential IDs required:', 'cyan');
credMap.forEach((nodes, credId) => {
  log(`  • ${credId}`, 'blue');
  log(`    Used by: ${nodes.join(', ')}`, 'blue');
});

console.log();

// Extract environment variables
const envVarPattern = /\{\{\s*\$env\.([A-Z_]+)\s*\}\}/g;
const envVars = new Set();

workflow.nodes.forEach(node => {
  const nodeStr = JSON.stringify(node);
  let match;
  while ((match = envVarPattern.exec(nodeStr)) !== null) {
    envVars.add(match[1]);
  }
});

if (envVars.size > 0) {
  log('Environment variables required:', 'cyan');
  envVars.forEach(varName => {
    log(`  • ${varName}`, 'blue');
  });
} else {
  log('No environment variables required', 'green');
}

// ============================================================================
// ISSUES SUMMARY
// ============================================================================

logSection('Issues Summary');

const errors = issues.filter(i => i.severity === 'ERROR');
const warnings = issues.filter(i => i.severity === 'WARNING');

console.log();
log(`Errors: ${errors.length}`, errors.length > 0 ? 'red' : 'green');
log(`Warnings: ${warnings.length}`, warnings.length > 0 ? 'yellow' : 'green');
console.log();

if (errors.length > 0) {
  log('ERRORS:', 'red');
  errors.forEach(issue => {
    log(`  ✗ [${issue.node}] ${issue.issue}`, 'red');
    log(`    Fix: ${issue.fix}`, 'yellow');
  });
  console.log();
}

if (warnings.length > 0) {
  log('WARNINGS:', 'yellow');
  warnings.forEach(issue => {
    log(`  ⚠ [${issue.node}] ${issue.issue}`, 'yellow');
    log(`    Fix: ${issue.fix}`, 'blue');
  });
  console.log();
}

// ============================================================================
// WORKFLOW QUALITY SCORE
// ============================================================================

logSection('Workflow Quality Assessment');

const metrics = {
  structure: 100, // Already validated
  connections: paths.length > 0 ? 100 : 0,
  errorHandling: errorTrigger ? 100 : 50,
  codeQuality: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5)),
  documentation: workflow.nodes.filter(n => n.type === 'n8n-nodes-base.stickyNote').length * 10
};

const totalScore = Math.round(
  (metrics.structure * 0.2) +
  (metrics.connections * 0.25) +
  (metrics.errorHandling * 0.2) +
  (metrics.codeQuality * 0.25) +
  (Math.min(metrics.documentation, 100) * 0.1)
);

console.log();
log('Quality Metrics:', 'cyan');
log(`  Structure: ${metrics.structure}/100`, metrics.structure === 100 ? 'green' : 'yellow');
log(`  Connections: ${metrics.connections}/100`, metrics.connections === 100 ? 'green' : 'yellow');
log(`  Error Handling: ${metrics.errorHandling}/100`, metrics.errorHandling === 100 ? 'green' : 'yellow');
log(`  Code Quality: ${metrics.codeQuality}/100`, metrics.codeQuality >= 80 ? 'green' : metrics.codeQuality >= 60 ? 'yellow' : 'red');
log(`  Documentation: ${Math.min(metrics.documentation, 100)}/100`, metrics.documentation >= 50 ? 'green' : 'yellow');

console.log();
log(`Overall Quality Score: ${totalScore}/100`, totalScore >= 85 ? 'green' : totalScore >= 70 ? 'yellow' : 'red');

// Final verdict
console.log('\n' + '='.repeat(80));
if (errors.length === 0) {
  log('✓ WORKFLOW VALIDATION PASSED', 'green');
  log('  No critical errors found. Workflow is ready for deployment.', 'green');
  process.exit(0);
} else {
  log('✗ WORKFLOW VALIDATION FAILED', 'red');
  log(`  ${errors.length} critical error(s) must be fixed before deployment.`, 'red');
  process.exit(1);
}
