#!/usr/bin/env node
/**
 * N8N WORKFLOW VALIDATION SUITE
 * Lex Intelligentia Judiciário v2.1
 *
 * Tests:
 * 1. JSON Structure Validation
 * 2. JavaScript Syntax Check
 * 3. Connection Graph Validation
 * 4. Data Flow Simulation
 * 5. Credential Placeholder Check
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================================
// TEST UTILITIES
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80));
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  if (details) {
    log(`  ${details}`, 'yellow');
  }
}

// ============================================================================
// LOAD WORKFLOW
// ============================================================================

const workflowPath = process.argv[2] || path.join(__dirname, 'n8n_workflow_agentes_especializados_v2.1.json');

let workflow;
let nodeByName;  // O(1) lookup map
let nodeById;    // O(1) lookup map

try {
  const rawData = fs.readFileSync(workflowPath, 'utf8');
  workflow = JSON.parse(rawData);

  // Build O(1) lookup maps for performance
  nodeByName = new Map(workflow.nodes.map(n => [n.name, n]));
  nodeById = new Map(workflow.nodes.map(n => [n.id, n]));

  log(`✓ Loaded workflow: ${workflowPath}`, 'green');
} catch (error) {
  log(`✗ Failed to load workflow: ${error.message}`, 'red');
  process.exit(1);
}

// ============================================================================
// TEST 1: JSON STRUCTURE VALIDATION
// ============================================================================

logSection('TEST 1: JSON Structure Validation');

const errors = [];
const warnings = [];

// Check required top-level fields
const requiredFields = ['name', 'nodes', 'connections'];
requiredFields.forEach(field => {
  if (!workflow[field]) {
    errors.push(`Missing required field: ${field}`);
  }
});

logTest('Required top-level fields', errors.length === 0,
  errors.length > 0 ? errors.join(', ') : 'All required fields present');

// Validate nodes
if (!Array.isArray(workflow.nodes)) {
  errors.push('nodes must be an array');
} else {
  logTest('Nodes is array', true, `${workflow.nodes.length} nodes found`);

  // Check each node structure
  const nodeIds = new Set();
  workflow.nodes.forEach((node, idx) => {
    // Required node fields
    if (!node.id) {
      errors.push(`Node at index ${idx} missing id`);
    } else {
      // Check for duplicate IDs
      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);
    }

    if (!node.name) {
      warnings.push(`Node ${node.id || idx} missing name`);
    }

    if (!node.type) {
      errors.push(`Node ${node.id || idx} missing type`);
    }

    if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
      warnings.push(`Node ${node.id || node.name} has invalid position`);
    }
  });

  logTest('Node IDs unique', errors.filter(e => e.includes('Duplicate')).length === 0,
    `${nodeIds.size} unique node IDs`);
}

// Validate connections
if (typeof workflow.connections !== 'object') {
  errors.push('connections must be an object');
} else {
  logTest('Connections is object', true);
}

// Summary
console.log('\n' + '-'.repeat(80));
log(`Errors: ${errors.length}`, errors.length > 0 ? 'red' : 'green');
log(`Warnings: ${warnings.length}`, warnings.length > 0 ? 'yellow' : 'green');

if (errors.length > 0) {
  log('\nERRORS:', 'red');
  errors.forEach(e => log(`  - ${e}`, 'red'));
}

if (warnings.length > 0) {
  log('\nWARNINGS:', 'yellow');
  warnings.forEach(w => log(`  - ${w}`, 'yellow'));
}

// ============================================================================
// TEST 2: JAVASCRIPT SYNTAX CHECK
// ============================================================================

logSection('TEST 2: JavaScript Syntax Check');

const jsErrors = [];
const codeNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.code');

log(`Found ${codeNodes.length} Code nodes to validate`, 'blue');

codeNodes.forEach(node => {
  const code = node.parameters?.jsCode;

  if (!code) {
    jsErrors.push({
      node: node.name || node.id,
      error: 'No jsCode parameter found'
    });
    return;
  }

  try {
    // Create a sandbox with n8n-like globals
    const sandbox = {
      $input: { first: () => ({ json: {} }), all: () => [] },
      $: (nodeName) => ({ item: { json: {} }, first: () => ({ json: {} }) }),
      $json: {},
      $execution: { id: 'test' },
      console: console,
      Date: Date,
      Math: Math,
      JSON: JSON,
      Number: Number,
      String: String,
      Array: Array,
      Object: Object
    };

    // Try to compile the code
    new vm.Script(code);

    // Try to create function
    const func = new Function('$input', '$', '$json', '$execution', 'console', code);

    logTest(`${node.name || node.id}`, true, `${code.length} chars`);

  } catch (error) {
    jsErrors.push({
      node: node.name || node.id,
      error: error.message,
      location: error.stack?.split('\n')[0]
    });

    logTest(`${node.name || node.id}`, false, error.message);
  }
});

// Check for common issues
log('\nChecking for common code patterns...', 'blue');

const commonIssues = [];

codeNodes.forEach(node => {
  const code = node.parameters?.jsCode || '';

  // Check for undefined variable access
  if (/\$\w+\.\w+(?!\?)/.test(code) && !/try\s*\{/.test(code)) {
    commonIssues.push({
      node: node.name || node.id,
      issue: 'Potential undefined access without try-catch',
      severity: 'warning'
    });
  }

  // Check for console.log (OK but worth noting)
  const consoleMatches = code.match(/console\.log/g);
  if (consoleMatches && consoleMatches.length > 3) {
    commonIssues.push({
      node: node.name || node.id,
      issue: `${consoleMatches.length} console.log statements`,
      severity: 'info'
    });
  }

  // Check for return statement
  if (!/return\s+\[/.test(code)) {
    commonIssues.push({
      node: node.name || node.id,
      issue: 'Missing return statement',
      severity: 'error'
    });
  }
});

if (commonIssues.length > 0) {
  log('\nCommon issues found:', 'yellow');
  commonIssues.forEach(issue => {
    const color = issue.severity === 'error' ? 'red' :
                  issue.severity === 'warning' ? 'yellow' : 'blue';
    log(`  [${issue.severity.toUpperCase()}] ${issue.node}: ${issue.issue}`, color);
  });
}

console.log('\n' + '-'.repeat(80));
log(`JavaScript Errors: ${jsErrors.length}`, jsErrors.length > 0 ? 'red' : 'green');
log(`Code Issues: ${commonIssues.filter(i => i.severity === 'error').length}`,
    commonIssues.filter(i => i.severity === 'error').length > 0 ? 'red' : 'green');

if (jsErrors.length > 0) {
  log('\nJAVASCRIPT ERRORS:', 'red');
  jsErrors.forEach(e => {
    log(`  Node: ${e.node}`, 'red');
    log(`  Error: ${e.error}`, 'red');
    if (e.location) log(`  Location: ${e.location}`, 'red');
  });
}

// ============================================================================
// TEST 3: CONNECTION GRAPH VALIDATION
// ============================================================================

logSection('TEST 3: Connection Graph Validation');

const graphErrors = [];
const graphWarnings = [];

// Build node ID map
const nodeMap = new Map();
workflow.nodes.forEach(node => {
  nodeMap.set(node.id, node);
});

// Validate all connections
Object.keys(workflow.connections).forEach(sourceId => {
  const sourceNode = nodeByName.get(sourceId) || nodeById.get(sourceId);

  if (!sourceNode) {
    graphErrors.push(`Connection source not found: ${sourceId}`);
    return;
  }

  const connections = workflow.connections[sourceId];

  // Check each connection type
  Object.keys(connections).forEach(connectionType => {
    const connList = connections[connectionType];

    if (!Array.isArray(connList)) {
      graphErrors.push(`Invalid connection list for ${sourceId}.${connectionType}`);
      return;
    }

    connList.forEach((outputConnections, outputIdx) => {
      if (!Array.isArray(outputConnections)) {
        graphErrors.push(`Invalid output connections for ${sourceId}.${connectionType}[${outputIdx}]`);
        return;
      }

      outputConnections.forEach(conn => {
        // Validate target node exists (O(1) lookup)
        const targetNode = nodeByName.get(conn.node) || nodeById.get(conn.node);

        if (!targetNode) {
          graphErrors.push(`Connection target not found: ${sourceId} -> ${conn.node}`);
        }

        // Validate connection structure
        if (conn.type === undefined) {
          graphWarnings.push(`Connection missing type: ${sourceId} -> ${conn.node}`);
        }

        if (conn.index === undefined) {
          graphWarnings.push(`Connection missing index: ${sourceId} -> ${conn.node}`);
        }
      });
    });
  });
});

logTest('All connection targets exist', graphErrors.filter(e => e.includes('not found')).length === 0);

// Find orphan nodes (no incoming or outgoing connections)
const nodesWithIncoming = new Set();
const nodesWithOutgoing = new Set();

Object.keys(workflow.connections).forEach(sourceId => {
  const sourceNode = nodeByName.get(sourceId) || nodeById.get(sourceId);
  if (sourceNode) {
    nodesWithOutgoing.add(sourceNode.id);
  }

  const connections = workflow.connections[sourceId];
  Object.keys(connections).forEach(connectionType => {
    const connList = connections[connectionType];
    connList.forEach(outputConnections => {
      outputConnections.forEach(conn => {
        const targetNode = nodeByName.get(conn.node) || nodeById.get(conn.node);
        if (targetNode) {
          nodesWithIncoming.add(targetNode.id);
        }
      });
    });
  });
});

// Identify orphans (excluding trigger and response nodes)
const excludedTypes = [
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.errorTrigger',
  'n8n-nodes-base.respondToWebhook',
  'n8n-nodes-base.stickyNote',
  '@n8n/n8n-nodes-langchain.lmChatAnthropic'
];

const orphanNodes = workflow.nodes.filter(node => {
  if (excludedTypes.includes(node.type)) return false;
  return !nodesWithIncoming.has(node.id) || !nodesWithOutgoing.has(node.id);
});

if (orphanNodes.length > 0) {
  log('\nPotential orphan nodes:', 'yellow');
  orphanNodes.forEach(node => {
    const hasIn = nodesWithIncoming.has(node.id);
    const hasOut = nodesWithOutgoing.has(node.id);
    const status = !hasIn && !hasOut ? 'NO CONNECTIONS' :
                   !hasIn ? 'NO INCOMING' : 'NO OUTGOING';
    log(`  - ${node.name || node.id} (${node.type}): ${status}`, 'yellow');
  });
}

logTest('No orphan nodes', orphanNodes.length === 0,
        `${orphanNodes.length} potential orphans (may be intentional)`);

// Check for circular references
function detectCycles() {
  const visited = new Set();
  const recStack = new Set();
  const cycles = [];

  function dfs(nodeId, path = []) {
    if (recStack.has(nodeId)) {
      cycles.push([...path, nodeId]);
      return;
    }

    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    // Find node name (O(1) lookup)
    const node = nodeById.get(nodeId);
    const nodeName = node?.name || nodeId;

    // Get outgoing connections
    const connections = workflow.connections[nodeName];
    if (connections) {
      Object.keys(connections).forEach(type => {
        connections[type].forEach(outputs => {
          outputs.forEach(conn => {
            const targetNode = nodeByName.get(conn.node);
            if (targetNode) {
              dfs(targetNode.id, [...path]);
            }
          });
        });
      });
    }

    recStack.delete(nodeId);
  }

  workflow.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });

  return cycles;
}

const cycles = detectCycles();
logTest('No circular references', cycles.length === 0,
        cycles.length > 0 ? `${cycles.length} cycle(s) detected` : '');

if (cycles.length > 0) {
  log('\nCircular references:', 'red');
  cycles.forEach((cycle, idx) => {
    log(`  Cycle ${idx + 1}: ${cycle.join(' -> ')}`, 'red');
  });
}

console.log('\n' + '-'.repeat(80));
log(`Graph Errors: ${graphErrors.length}`, graphErrors.length > 0 ? 'red' : 'green');
log(`Graph Warnings: ${graphWarnings.length}`, graphWarnings.length > 0 ? 'yellow' : 'green');

if (graphErrors.length > 0) {
  log('\nGRAPH ERRORS:', 'red');
  graphErrors.forEach(e => log(`  - ${e}`, 'red'));
}

// ============================================================================
// TEST 4: DATA FLOW SIMULATION
// ============================================================================

logSection('TEST 4: Data Flow Simulation');

const dataFlowIssues = [];

// Trace main flow from webhook to response
function traceFlow() {
  const webhook = workflow.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
  const responses = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.respondToWebhook');

  if (!webhook) {
    dataFlowIssues.push('No webhook trigger found');
    return;
  }

  if (responses.length === 0) {
    dataFlowIssues.push('No response nodes found');
    return;
  }

  log(`Starting trace from: ${webhook.name}`, 'blue');
  log(`Target responses: ${responses.map(r => r.name).join(', ')}`, 'blue');

  // BFS to find paths
  const queue = [[webhook.id]];
  const paths = [];
  const visited = new Set();

  while (queue.length > 0) {
    const path = queue.shift();
    const currentId = path[path.length - 1];

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const currentNode = nodeById.get(currentId);
    if (!currentNode) continue;

    // Check if this is a response node
    if (currentNode.type === 'n8n-nodes-base.respondToWebhook') {
      paths.push(path);
      continue;
    }

    // Find outgoing connections (O(1) lookup)
    const connections = workflow.connections[currentNode.name];
    if (connections && connections.main) {
      connections.main.forEach(outputs => {
        outputs.forEach(conn => {
          const targetNode = nodeByName.get(conn.node);
          if (targetNode) {
            queue.push([...path, targetNode.id]);
          }
        });
      });
    }
  }

  logTest('Paths from webhook to response', paths.length > 0,
          `${paths.length} path(s) found`);

  if (paths.length === 0) {
    dataFlowIssues.push('No complete path from webhook to response');
  }

  return paths;
}

const paths = traceFlow();

// Check for null/undefined access in Code nodes
log('\nChecking for potential null/undefined access...', 'blue');

codeNodes.forEach(node => {
  const code = node.parameters?.jsCode || '';

  // Look for direct property access without optional chaining or checks
  const unsafePatterns = [
    /\$json\.\w+\.\w+(?!\?)/g,
    /\$input\.first\(\)\.json\.\w+(?!\?)/g,
    /\$\([^)]+\)\.item\.json\.\w+(?!\?)/g
  ];

  let hasUnsafe = false;
  unsafePatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      // Check if there's null checking nearby
      const hasNullCheck = /if\s*\(.*\)/.test(code) || /try\s*\{/.test(code) || /\?\?/.test(code) || /\?\./.test(code);

      if (!hasNullCheck) {
        dataFlowIssues.push({
          node: node.name || node.id,
          issue: `Potential unsafe property access: ${matches[0]}`,
          severity: 'warning'
        });
        hasUnsafe = true;
      }
    }
  });

  logTest(`${node.name || node.id} - null safety`, !hasUnsafe);
});

// Check variable references between nodes
log('\nChecking inter-node variable references...', 'blue');

const nodeReferences = new Map();

codeNodes.forEach(node => {
  const code = node.parameters?.jsCode || '';

  // Extract node references like $('Node Name')
  const refPattern = /\$\(['"]([^'"]+)['"]\)/g;
  let match;
  const refs = [];

  while ((match = refPattern.exec(code)) !== null) {
    refs.push(match[1]);
  }

  if (refs.length > 0) {
    nodeReferences.set(node.name || node.id, refs);

    // Verify each reference exists (O(1) lookup)
    refs.forEach(refName => {
      const refNode = nodeByName.get(refName);
      if (!refNode) {
        dataFlowIssues.push({
          node: node.name || node.id,
          issue: `References non-existent node: ${refName}`,
          severity: 'error'
        });
      }
    });
  }
});

if (nodeReferences.size > 0) {
  log('\nNode cross-references:', 'blue');
  nodeReferences.forEach((refs, nodeName) => {
    log(`  ${nodeName} references: ${refs.join(', ')}`, 'blue');
  });
}

console.log('\n' + '-'.repeat(80));
const dataFlowErrors = dataFlowIssues.filter(i => typeof i === 'object' && i.severity === 'error').length;
const dataFlowWarnings = dataFlowIssues.filter(i => typeof i === 'object' && i.severity === 'warning').length;

log(`Data Flow Errors: ${dataFlowErrors}`, dataFlowErrors > 0 ? 'red' : 'green');
log(`Data Flow Warnings: ${dataFlowWarnings}`, dataFlowWarnings > 0 ? 'yellow' : 'green');

// ============================================================================
// TEST 5: CREDENTIAL PLACEHOLDER CHECK
// ============================================================================

logSection('TEST 5: Credential Placeholder Check');

const credentialIssues = [];
const credentialNodes = workflow.nodes.filter(n => n.credentials);

log(`Found ${credentialNodes.length} nodes with credentials`, 'blue');

credentialNodes.forEach(node => {
  const creds = node.credentials;

  Object.keys(creds).forEach(credType => {
    const credConfig = creds[credType];

    // Check for placeholder patterns
    if (credConfig.id && typeof credConfig.id === 'string') {
      if (credConfig.id.includes('ID') || credConfig.id.includes('PLACEHOLDER')) {
        credentialIssues.push({
          node: node.name || node.id,
          type: credType,
          id: credConfig.id,
          status: 'placeholder'
        });
      } else if (credConfig.id.length < 5) {
        credentialIssues.push({
          node: node.name || node.id,
          type: credType,
          id: credConfig.id,
          status: 'suspicious'
        });
      }
    }

    logTest(`${node.name || node.id} - ${credType}`,
            credConfig.id !== undefined,
            `ID: ${credConfig.id}`);
  });
});

// Check for environment variables
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
  log('\nEnvironment variables required:', 'blue');
  envVars.forEach(varName => {
    log(`  - ${varName}`, 'cyan');
  });
}

console.log('\n' + '-'.repeat(80));
log(`Credential Placeholders: ${credentialIssues.filter(i => i.status === 'placeholder').length}`, 'yellow');
log(`Suspicious Credentials: ${credentialIssues.filter(i => i.status === 'suspicious').length}`, 'yellow');

if (credentialIssues.length > 0) {
  log('\nCREDENTIAL ISSUES:', 'yellow');
  credentialIssues.forEach(issue => {
    log(`  [${issue.status.toUpperCase()}] ${issue.node} (${issue.type}): ${issue.id}`, 'yellow');
  });
}

// ============================================================================
// FINAL SUMMARY
// ============================================================================

logSection('VALIDATION SUMMARY');

const totalErrors = errors.length + jsErrors.length + graphErrors.length + dataFlowErrors;
const totalWarnings = warnings.length + graphWarnings.length + dataFlowWarnings + credentialIssues.length;

console.log();
log(`Total Errors: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green');
log(`Total Warnings: ${totalWarnings}`, totalWarnings > 0 ? 'yellow' : 'green');
console.log();

if (totalErrors === 0) {
  log('✓ Workflow validation PASSED', 'green');
  process.exit(0);
} else {
  log('✗ Workflow validation FAILED', 'red');
  process.exit(1);
}
