#!/usr/bin/env node
/**
 * N8N WORKFLOW TEST SCENARIOS
 * Specific validation tests for common issues
 */

const fs = require('fs');
const path = require('path');

const workflow = JSON.parse(
  fs.readFileSync(process.argv[2] || 'n8n_workflow_agentes_especializados_v2.1.json', 'utf8')
);

console.log('🧪 N8N WORKFLOW TEST SCENARIOS\n');
console.log('='.repeat(80));

// ============================================================================
// SCENARIO 1: Windows Line Ending Compatibility
// ============================================================================

console.log('\n📝 SCENARIO 1: Windows Line Ending Compatibility\n');

const qaEstruturalNode = workflow.nodes.find(n => n.name === 'QA Estrutural');

if (qaEstruturalNode) {
  const code = qaEstruturalNode.parameters?.jsCode || '';

  // Check for line ending normalization
  const hasNormalization = /replace\(\/\\r\\n\/g,\s*'\\n'\)/.test(code) &&
                           /replace\(\/\\r\/g,\s*'\\n'\)/.test(code);

  if (hasNormalization) {
    console.log('✅ Line ending normalization found');
    console.log('   Code properly handles Windows (\\r\\n) and Mac (\\r) line endings');
  } else {
    console.log('❌ No line ending normalization');
    console.log('   Regex patterns may fail on Windows systems');
    console.log('   FIX: Add minuta.replace(/\\r\\n/g, \'\\n\').replace(/\\r/g, \'\\n\')');
  }

  // Check regex patterns use normalized string
  const regexPatterns = code.match(/\/.*?\/[igm]*/g) || [];
  console.log(`   Found ${regexPatterns.length} regex patterns`);

  // Test with sample Windows text
  const testText = 'I - RELATÓRIO\r\nTexto\r\nII - FUNDAMENTAÇÃO\r\nTexto\r\nIII - DISPOSITIVO';
  const normalized = testText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const relatorioRegex = /(?:^|\n)\s*(?:I\s*[-–.]\s*|1[.)\s]\s*)?RELAT[ÓO]RIO/im;
  const worksOnWindows = relatorioRegex.test(normalized);

  console.log(`   Test: Detects RELATÓRIO on Windows text: ${worksOnWindows ? '✅' : '❌'}`);
} else {
  console.log('⚠️  QA Estrutural node not found');
}

// ============================================================================
// SCENARIO 2: Null Safety in Data Flow
// ============================================================================

console.log('\n📝 SCENARIO 2: Null Safety in Data Flow\n');

const criticalNodes = [
  'Set Context Buffer',
  'QA Consolidado',
  'Audit Log CNJ 615',
  'Handle Error'
];

criticalNodes.forEach(nodeName => {
  const node = workflow.nodes.find(n => n.name === nodeName);

  if (node && node.type === 'n8n-nodes-base.code') {
    const code = node.parameters?.jsCode || '';

    // Check for null safety patterns
    const hasOptionalChaining = /\?\./.test(code);
    const hasNullishCoalescing = /\?\?/.test(code);
    const hasTryCatch = /try\s*\{[\s\S]*catch/.test(code);
    const hasNullChecks = /if\s*\([^)]*===\s*null\s*\|/.test(code) ||
                         /if\s*\([^)]*===\s*undefined/.test(code);

    const safetyScore = [hasOptionalChaining, hasNullishCoalescing, hasTryCatch, hasNullChecks]
                        .filter(Boolean).length;

    if (safetyScore >= 2) {
      console.log(`✅ ${nodeName}: ${safetyScore}/4 safety patterns`);

      if (hasOptionalChaining) console.log('   - Optional chaining (?.)');
      if (hasNullishCoalescing) console.log('   - Nullish coalescing (??)');
      if (hasTryCatch) console.log('   - Try-catch blocks');
      if (hasNullChecks) console.log('   - Explicit null checks');
    } else {
      console.log(`⚠️  ${nodeName}: Only ${safetyScore}/4 safety patterns`);
      console.log('   Consider adding more null safety checks');
    }
  }
});

// ============================================================================
// SCENARIO 3: Hash Uniqueness Test
// ============================================================================

console.log('\n📝 SCENARIO 3: Hash Function Uniqueness\n');

const auditNode = workflow.nodes.find(n => n.name === 'Audit Log CNJ 615');

if (auditNode) {
  const code = auditNode.parameters?.jsCode || '';

  // Extract hash function
  const hashFunctionMatch = code.match(/function\s+computeHash\s*\([^)]*\)\s*\{[\s\S]*?\n\}/);

  if (hashFunctionMatch) {
    console.log('✅ Hash function found');

    // Check for hash quality indicators
    const hasMultipleHashes = /hash1.*hash2/s.test(code);
    const hasLengthComponent = /\.length/.test(code);
    const hasChecksum = /checksum/.test(code);

    console.log(`   - Multiple hash algorithms: ${hasMultipleHashes ? '✅' : '❌'}`);
    console.log(`   - Length component: ${hasLengthComponent ? '✅' : '❌'}`);
    console.log(`   - Checksum validation: ${hasChecksum ? '✅' : '❌'}`);

    // Estimate hash output size
    const hashOutputMatch = code.match(/return\s+`([^`]+)`/);
    if (hashOutputMatch) {
      const templateStr = hashOutputMatch[1];
      // Count hex string placeholders
      const hexCount = (templateStr.match(/\$\{[^}]*toString\(16\)[^}]*\}/g) || []).length;
      console.log(`   - Hash components: ${hexCount}`);

      if (hexCount >= 3) {
        console.log('   ✅ Good hash entropy (multiple components)');
      } else {
        console.log('   ⚠️  Low hash entropy - consider adding more components');
      }
    }

    // Test hash function with samples
    try {
      // Extract just the function code
      const funcCode = hashFunctionMatch[0];

      // Create test function
      const testFunc = new Function('return ' + funcCode)();

      // Test with different inputs
      const samples = [
        'Sample text 1',
        'Sample text 2',
        'Sample text 1 ', // Same but with space
        'sample text 1',   // Different case
        ''                 // Empty string
      ];

      const hashes = samples.map(s => testFunc(s));

      // Check uniqueness
      const uniqueHashes = new Set(hashes);

      console.log(`\n   Hash Uniqueness Test:`);
      console.log(`   - Input samples: ${samples.length}`);
      console.log(`   - Unique hashes: ${uniqueHashes.size}`);
      console.log(`   - Hash length: ${hashes[0].length} chars`);

      if (uniqueHashes.size === samples.length) {
        console.log(`   ✅ All hashes unique`);
      } else {
        console.log(`   ❌ Hash collision detected!`);
      }

      // Show samples
      console.log(`\n   Sample hashes:`);
      samples.slice(0, 3).forEach((sample, i) => {
        console.log(`   "${sample}" → ${hashes[i].substring(0, 16)}...`);
      });

    } catch (e) {
      console.log(`   ⚠️  Could not test hash function: ${e.message}`);
    }

  } else {
    console.log('❌ Hash function not found');
    console.log('   Using simple hash may cause collisions');
  }
} else {
  console.log('⚠️  Audit Log node not found');
}

// ============================================================================
// SCENARIO 4: QA Consolidado Branch Handling
// ============================================================================

console.log('\n📝 SCENARIO 4: QA Consolidado Branch Handling\n');

const qaConsolidadoNode = workflow.nodes.find(n => n.name === 'QA Consolidado');

if (qaConsolidadoNode) {
  const code = qaConsolidadoNode.parameters?.jsCode || '';

  // Check for proper branch handling
  const hasCandidatesCheck = /inputData\.candidates/.test(code);
  const hasQaEstruturalCheck = /qa_estrutural/.test(code);
  const hasFallbackData = /estruturalData\s*=.*\|\|/.test(code);

  console.log('Branch detection logic:');
  console.log(`   - Checks for Gemini response: ${hasCandidatesCheck ? '✅' : '❌'}`);
  console.log(`   - Checks for structural data: ${hasQaEstruturalCheck ? '✅' : '❌'}`);
  console.log(`   - Has fallback mechanism: ${hasFallbackData ? '✅' : '❌'}`);

  // Check for proper data extraction
  const hasInputFirst = /\$input\.first\(\)/.test(code);
  const hasNodeReference = /\$\(['"](IF:|QA Estrutural)/.test(code);

  console.log('\nData extraction:');
  console.log(`   - Uses $input.first(): ${hasInputFirst ? '✅' : '❌'}`);
  console.log(`   - References previous nodes: ${hasNodeReference ? '✅' : '❌'}`);

  // Check score calculation
  const hasScoreMerge = /estrutural\.score.*semantico\.score/.test(code);
  const hasWeightedScore = /0\.\d.*0\.\d/.test(code);

  console.log('\nScore calculation:');
  console.log(`   - Merges both scores: ${hasScoreMerge ? '✅' : '❌'}`);
  console.log(`   - Uses weighted average: ${hasWeightedScore ? '✅' : '❌'}`);

  if (hasWeightedScore) {
    // Extract weights
    const weightsMatch = code.match(/(0\.\d+).*?(0\.\d+)/);
    if (weightsMatch) {
      console.log(`   - Weights: ${weightsMatch[1]} / ${weightsMatch[2]}`);
    }
  }

  const allChecksPass = hasCandidatesCheck && hasQaEstruturalCheck &&
                        hasFallbackData && hasInputFirst && hasNodeReference;

  if (allChecksPass) {
    console.log('\n✅ QA Consolidado properly handles both IF branches');
  } else {
    console.log('\n⚠️  QA Consolidado may have data flow issues');
  }
} else {
  console.log('⚠️  QA Consolidado node not found');
}

// ============================================================================
// SCENARIO 5: Return Statement Validation
// ============================================================================

console.log('\n📝 SCENARIO 5: Return Statement Validation\n');

const codeNodes = workflow.nodes.filter(n => n.type === 'n8n-nodes-base.code');

let allValid = true;

codeNodes.forEach(node => {
  const code = node.parameters?.jsCode || '';

  // Check for return statement
  const hasReturn = /return\s+\[/.test(code);

  if (!hasReturn) {
    console.log(`❌ ${node.name}: Missing return statement`);
    allValid = false;
    return;
  }

  // Check return format
  const returnMatch = code.match(/return\s+\[([\s\S]*?)\];?\s*$/m);

  if (!returnMatch) {
    console.log(`❌ ${node.name}: Invalid return format`);
    allValid = false;
    return;
  }

  const returnContent = returnMatch[1];

  // Check for json property
  if (!/\{\s*json:/.test(returnContent)) {
    console.log(`⚠️  ${node.name}: Return may be missing 'json' property`);
    allValid = false;
    return;
  }

  console.log(`✅ ${node.name}: Valid return statement`);
});

if (allValid) {
  console.log('\n✅ All Code nodes have valid return statements');
} else {
  console.log('\n❌ Some Code nodes have return statement issues');
}

// ============================================================================
// SCENARIO 6: Connection Coverage
// ============================================================================

console.log('\n📝 SCENARIO 6: Connection Coverage\n');

// Check that all agent outputs connect to Prepare for QA
const agentNodes = workflow.nodes.filter(n => n.name.startsWith('AI Agent:'));

console.log(`Found ${agentNodes.length} AI Agent nodes:`);

let allConnected = true;

agentNodes.forEach(agent => {
  // Check if agent has outgoing connection to Prepare for QA
  const connections = workflow.connections[agent.name];

  if (!connections || !connections.main) {
    console.log(`❌ ${agent.name}: No outgoing connections`);
    allConnected = false;
    return;
  }

  const targets = connections.main[0] || [];
  const hasQAConnection = targets.some(conn => conn.node === 'Prepare for QA');

  if (hasQAConnection) {
    console.log(`✅ ${agent.name} → Prepare for QA`);
  } else {
    console.log(`❌ ${agent.name}: Not connected to Prepare for QA`);
    console.log(`   Connects to: ${targets.map(t => t.node).join(', ')}`);
    allConnected = false;
  }
});

if (allConnected) {
  console.log('\n✅ All agents properly connected to QA pipeline');
} else {
  console.log('\n❌ Some agents not properly connected');
}

// ============================================================================
// SCENARIO 7: Error Handling Coverage
// ============================================================================

console.log('\n📝 SCENARIO 7: Error Handling Coverage\n');

const errorTrigger = workflow.nodes.find(n => n.type === 'n8n-nodes-base.errorTrigger');

if (!errorTrigger) {
  console.log('❌ No error trigger found');
} else {
  console.log('✅ Error trigger found:', errorTrigger.name);

  // Trace error handling path
  let currentNode = errorTrigger.name;
  const errorPath = [currentNode];

  for (let i = 0; i < 10; i++) { // Max 10 hops
    const connections = workflow.connections[currentNode];

    if (!connections || !connections.main || connections.main.length === 0) {
      break;
    }

    const nextNodes = connections.main[0] || [];

    if (nextNodes.length === 0) break;

    currentNode = nextNodes[0].node;
    errorPath.push(currentNode);

    // Stop if we reach a response node
    const node = workflow.nodes.find(n => n.name === currentNode);
    if (node && node.type === 'n8n-nodes-base.respondToWebhook') {
      break;
    }
  }

  console.log('\nError handling path:');
  errorPath.forEach((nodeName, i) => {
    const prefix = i === 0 ? '  ┌─' : i === errorPath.length - 1 ? '  └─' : '  ├─';
    console.log(`${prefix} ${nodeName}`);
  });

  // Check for retry logic
  const hasRetryNode = errorPath.some(n => n.includes('Retry'));
  const hasErrorResponse = errorPath.some(n => n.includes('Respond') && n.includes('Error'));

  console.log('\nError handling features:');
  console.log(`   - Retry logic: ${hasRetryNode ? '✅' : '❌'}`);
  console.log(`   - Error response: ${hasErrorResponse ? '✅' : '❌'}`);

  if (hasRetryNode && hasErrorResponse) {
    console.log('\n✅ Complete error handling with retry logic');
  } else {
    console.log('\n⚠️  Error handling may be incomplete');
  }
}

// ============================================================================
// FINAL REPORT
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('\n📊 SCENARIO TEST SUMMARY\n');

const scenarios = [
  'Windows Line Endings',
  'Null Safety',
  'Hash Uniqueness',
  'QA Branch Handling',
  'Return Statements',
  'Connection Coverage',
  'Error Handling'
];

console.log(`✅ Tested ${scenarios.length} critical scenarios`);
console.log('\nRecommendations:');
console.log('1. Review any ❌ or ⚠️  items above');
console.log('2. Test with actual n8n execution');
console.log('3. Monitor first production runs closely');
console.log('4. Keep audit logs for analysis');

console.log('\n' + '='.repeat(80));
