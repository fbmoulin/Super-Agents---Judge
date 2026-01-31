#!/usr/bin/env node
/**
 * Fix n8n Workflow TypeVersions for n8n 2.0+ Compatibility
 * Lex Intelligentia Judiciário
 *
 * This script updates node typeVersions to be compatible with n8n 2.0+
 *
 * Changes:
 * - @n8n/n8n-nodes-langchain.agent: 1.7 → 2.0 (stable version)
 * - @n8n/n8n-nodes-langchain.lmChatAnthropic: 1.3 → 1.4
 */

const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = path.join(__dirname, '..', 'n8n_workflow_agentes_especializados_v2.2.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'n8n_workflow_agentes_especializados_v2.3_n8n2.0.json');

// TypeVersion mappings for n8n 2.0 compatibility
const TYPE_VERSION_FIXES = {
  '@n8n/n8n-nodes-langchain.agent': {
    from: 1.7,
    to: 2.0,  // Use 2.0 instead of 3.0 for better compatibility
    reason: 'AI Agent node v1.7 not compatible with n8n 2.0+'
  },
  '@n8n/n8n-nodes-langchain.lmChatAnthropic': {
    from: 1.3,
    to: 1.4,
    reason: 'Anthropic Chat Model needs update for compatibility'
  }
};

// Additional parameter fixes for AI Agent nodes
const AI_AGENT_PARAM_FIXES = {
  // Remove deprecated parameters
  removeParams: ['tools'],
  // Update agent type
  agentType: {
    from: 'conversationalAgent',
    to: 'toolsAgent'
  }
};

function fixWorkflow() {
  console.log('🔧 n8n Workflow TypeVersion Fixer');
  console.log('================================\n');

  // Read input file
  console.log(`📖 Reading: ${INPUT_FILE}`);
  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  const workflow = JSON.parse(rawData);

  console.log(`   Workflow: ${workflow.name}`);
  console.log(`   Nodes: ${workflow.nodes.length}\n`);

  // Track changes
  const changes = [];

  // Process each node
  workflow.nodes.forEach((node, index) => {
    const fix = TYPE_VERSION_FIXES[node.type];

    if (fix && node.typeVersion === fix.from) {
      console.log(`✏️  Fixing node: ${node.name}`);
      console.log(`   Type: ${node.type}`);
      console.log(`   Version: ${fix.from} → ${fix.to}`);

      // Update typeVersion
      node.typeVersion = fix.to;

      // If it's an AI Agent node, we need to restructure parameters
      if (node.type === '@n8n/n8n-nodes-langchain.agent') {
        // Update agent type for compatibility
        if (node.parameters?.agent === 'conversationalAgent') {
          node.parameters.agent = 'toolsAgent';
          console.log(`   Agent type: conversationalAgent → toolsAgent`);
        }

        // Fix tools structure if present
        if (node.parameters?.tools?.values) {
          // Keep tools but ensure they're in the right format
          console.log(`   Tools: ${node.parameters.tools.values.length} tool(s) preserved`);
        }
      }

      changes.push({
        node: node.name,
        type: node.type,
        from: fix.from,
        to: fix.to,
        reason: fix.reason
      });

      console.log('');
    }
  });

  // Update workflow version in name
  workflow.name = workflow.name.replace('v2.2', 'v2.3 (n8n 2.0 Compatible)');

  // Update sticky note with version info
  const stickyNote = workflow.nodes.find(n => n.id === 'sticky-header');
  if (stickyNote && stickyNote.parameters?.content) {
    stickyNote.parameters.content = stickyNote.parameters.content
      .replace('v2.2', 'v2.3')
      .replace('2.2.0', '2.3.0')
      + '\n\n### Mudanças v2.3.0:\n- ✅ TypeVersions atualizados para n8n 2.0\n- ✅ AI Agent nodes: 1.7 → 2.0\n- ✅ Anthropic Chat Model: 1.3 → 1.4';
  }

  // Write output file
  console.log(`💾 Writing: ${OUTPUT_FILE}`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workflow, null, 2), 'utf8');

  // Summary
  console.log('\n📊 Summary');
  console.log('==========');
  console.log(`   Total nodes: ${workflow.nodes.length}`);
  console.log(`   Nodes fixed: ${changes.length}`);

  if (changes.length > 0) {
    console.log('\n   Changes by type:');
    const byType = {};
    changes.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} node(s)`);
    });
  }

  console.log(`\n✅ Done! New workflow saved to:\n   ${OUTPUT_FILE}`);
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   Se ainda houver erros ao importar, os nodes precisam');
  console.log('   ser recriados manualmente no n8n Cloud.');

  return { workflow, changes };
}

// Run
try {
  fixWorkflow();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
