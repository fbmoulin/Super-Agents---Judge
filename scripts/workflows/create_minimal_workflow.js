#!/usr/bin/env node
/**
 * Create Minimal n8n Workflow (without AI Agent nodes)
 * Lex Intelligentia Judiciário
 *
 * This script creates a workflow with just the infrastructure:
 * - Webhook trigger
 * - Gemini Router
 * - Context Buffer
 * - Switch for agent routing
 * - Placeholder Code nodes instead of AI Agents
 *
 * After importing, manually add AI Agent nodes via n8n UI.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const INPUT_FILE = path.join(
  repoRoot,
  'archive',
  'workflows',
  'n8n_workflow_agentes_especializados_v2.2.json'
);
const OUTPUT_FILE = path.join(repoRoot, 'n8n_workflow_MINIMAL_v2.3.json');

// Node types to REMOVE (will be replaced with placeholder)
const NODES_TO_REMOVE = [
  '@n8n/n8n-nodes-langchain.agent',
  '@n8n/n8n-nodes-langchain.lmChatAnthropic'
];

// Agent IDs for creating placeholder connections
const AGENT_IDS = [
  'agent-bancario', 'agent-consumidor', 'agent-possessorias', 'agent-locacao',
  'agent-execucao', 'agent-generico', 'saude_cobertura_agent', 'saude_contratual_agent',
  'transito_agent', 'usucapiao_agent', 'incorporacao_agent'
];

function createMinimalWorkflow() {
  console.log('🔧 Creating Minimal n8n Workflow');
  console.log('================================\n');

  const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
  const workflow = JSON.parse(rawData);

  console.log(`📖 Original workflow: ${workflow.nodes.length} nodes`);

  // Separate nodes
  const nodesToKeep = [];
  const nodesToRemove = [];
  const agentPositions = {};

  workflow.nodes.forEach(node => {
    if (NODES_TO_REMOVE.includes(node.type)) {
      nodesToRemove.push(node);
      // Save position for placeholder
      if (node.type === '@n8n/n8n-nodes-langchain.agent') {
        agentPositions[node.id] = {
          name: node.name,
          position: node.position,
          id: node.id
        };
      }
    } else {
      nodesToKeep.push(node);
    }
  });

  console.log(`   Keeping: ${nodesToKeep.length} nodes`);
  console.log(`   Removing: ${nodesToRemove.length} LangChain nodes`);

  // Create placeholder Code nodes for each agent
  const placeholderNodes = Object.values(agentPositions).map(agent => ({
    parameters: {
      jsCode: `// ============================================
// PLACEHOLDER: ${agent.name}
// ============================================
// Este node é um placeholder.
//
// INSTRUÇÕES:
// 1. DELETE este node
// 2. Adicione um "AI Agent" node do menu
// 3. Configure:
//    - Agent Type: Tools Agent
//    - Prompt: {{ $json.human_message }}
//    - System Message: {{ $json.system_prompt }}
// 4. Adicione um sub-node "Anthropic Chat Model"
//    - Model: claude-sonnet-4-20250514
// 5. Conecte ao Merge: Coleta Outputs
// ============================================

// Passthrough for now (remove this node!)
return $input.all();`
    },
    id: agent.id,
    name: `⚠️ ADD: ${agent.name}`,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: agent.position,
    notes: `PLACEHOLDER - Delete and add AI Agent node manually`
  }));

  console.log(`   Created: ${placeholderNodes.length} placeholder nodes\n`);

  // Update workflow
  workflow.nodes = [...nodesToKeep, ...placeholderNodes];
  workflow.name = 'Lex Intelligentia v2.3 - MINIMAL (Add AI Agents Manually)';

  // Update sticky note
  const stickyNote = workflow.nodes.find(n => n.id === 'sticky-header');
  if (stickyNote && stickyNote.parameters?.content) {
    stickyNote.parameters.content = `# 🏛️ LEX INTELLIGENTIA JUDICIÁRIO v2.3 MINIMAL
## ⚠️ WORKFLOW INCOMPLETO - ADICIONE AI AGENTS MANUALMENTE

**Versão:** 2.3.0 - Janeiro 2026
**Status:** MINIMAL - Precisa configuração manual

### ⚠️ AÇÃO NECESSÁRIA:
1. Procure os nodes "⚠️ ADD: AI Agent: ..."
2. DELETE cada placeholder
3. Adicione "AI Agent" node do menu
4. Configure conforme instruções no placeholder

### Nodes a adicionar (11 total):
- AI Agent: Bancário
- AI Agent: Consumidor
- AI Agent: Possessórias
- AI Agent: Locação
- AI Agent: Execução
- AI Agent: Saúde Cobertura
- AI Agent: Saúde Contratual
- AI Agent: Trânsito
- AI Agent: Usucapião
- AI Agent: Incorporação
- AI Agent: Genérico

### Herdado v2.2:
- ✅ Gemini 2.5 Flash Router
- ✅ Context Buffer
- ✅ Switch de Agentes
- ✅ QA Híbrido
- ✅ Audit Log`;
  }

  // Clean up connections that reference removed nodes
  // (keep connections to placeholder nodes since they have same IDs)

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workflow, null, 2), 'utf8');

  console.log(`💾 Saved: ${OUTPUT_FILE}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total nodes: ${workflow.nodes.length}`);
  console.log(`   Infrastructure nodes: ${nodesToKeep.length}`);
  console.log(`   Placeholder nodes: ${placeholderNodes.length}`);
  console.log(`\n✅ Workflow minimal criado!`);
  console.log(`\n📋 Próximos passos:`);
  console.log(`   1. Importe ${path.basename(OUTPUT_FILE)} no n8n`);
  console.log(`   2. Configure credenciais (Gemini, Google Sheets)`);
  console.log(`   3. Substitua cada placeholder por AI Agent node`);
  console.log(`   4. Adicione Anthropic Chat Model a cada agent`);
  console.log(`   5. Teste o workflow`);
}

try {
  createMinimalWorkflow();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
