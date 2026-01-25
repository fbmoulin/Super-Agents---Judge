// scripts/add_metrics_to_workflow.js
const fs = require('fs');

const workflow = JSON.parse(fs.readFileSync('n8n_workflow_v3.0_rag.json', 'utf8'));

// Quality Validator node template
const qualityValidator = {
  parameters: {
    jsCode: fs.readFileSync('n8n_nodes/quality_validator.js', 'utf8')
  },
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [0, 0],
  name: "Quality Validator"
};

// Metrics Logger node template
const metricsLogger = JSON.parse(fs.readFileSync('n8n_nodes/metrics_logger_config.json', 'utf8'));

// Find all AI Agent nodes
const agentNodes = workflow.nodes.filter(n => n.type === '@n8n/n8n-nodes-langchain.agent');

console.log(`Found ${agentNodes.length} AI Agent nodes`);
console.log('Manual step: Add Quality Validator and Metrics Logger after each agent in n8n UI');
console.log('Or import the node configurations from n8n_nodes/ directory');

// Update workflow name
workflow.name = 'Lex Intelligentia v3.1 - Metrics Integration';

fs.writeFileSync('n8n_workflow_v3.1_metrics.json', JSON.stringify(workflow, null, 2));
console.log('Created n8n_workflow_v3.1_metrics.json');
