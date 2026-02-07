#!/usr/bin/env node
/**
 * RAG Integration Script for n8n Workflow
 * Adds STJ jurisprudence search capability to AI agents via Qdrant
 *
 * Usage: node scripts/integrate_rag_workflow.js
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const WORKFLOW_FILE = path.join(repoRoot, 'n8n_workflow_v2.6_fazenda_publica.json');
const OUTPUT_FILE = path.join(repoRoot, 'n8n_workflow_v3.0_rag.json');

// RAG Tool definition for AI Agents
const RAG_TOOL_NODE = {
  "parameters": {
    "name": "busca_jurisprudencia_stj",
    "description": "Busca jurisprudência relevante do STJ (súmulas, temas repetitivos e acórdãos) por similaridade semântica. Use ANTES de fundamentar a decisão para encontrar precedentes aplicáveis ao caso.",
    "workflowId": {
      "__rl": true,
      "value": "",
      "mode": "list",
      "cachedResultName": ""
    },
    "fields": {
      "values": [
        {
          "name": "query",
          "description": "Descrição do caso ou questão jurídica para buscar precedentes. Exemplo: 'contrato bancário juros abusivos capitalização mensal'",
          "type": "string",
          "required": true
        }
      ]
    }
  },
  "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
  "typeVersion": 2.1,
  "position": [0, 0],
  "name": "RAG STJ Search Tool"
};

// HTTP Request node for embedding generation
const EMBEDDING_NODE = {
  "parameters": {
    "method": "POST",
    "url": "https://api.openai.com/v1/embeddings",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "openAiApi",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"model\": \"text-embedding-3-small\",\n  \"input\": \"{{ $json.query }}\",\n  \"dimensions\": 1024\n}"
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [0, 0],
  "name": "Generate Query Embedding"
};

// HTTP Request node for Qdrant search
const QDRANT_SEARCH_NODE = {
  "parameters": {
    "method": "POST",
    "url": "http://localhost:6333/collections/stj_jurisprudencia/points/search",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"vector\": {{ JSON.stringify($json.data[0].embedding) }},\n  \"limit\": 5,\n  \"with_payload\": true,\n  \"score_threshold\": 0.6\n}"
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [0, 0],
  "name": "Search Qdrant STJ"
};

// Code node for formatting RAG results
const FORMAT_RESULTS_NODE = {
  "parameters": {
    "jsCode": `// Format RAG results for agent context
const results = $input.first().json.result || [];

if (results.length === 0) {
  return [{ json: { rag_context: 'Nenhum precedente do STJ encontrado para esta questão específica.' } }];
}

const formatted = results.map((r, i) => {
  const p = r.payload;
  const score = (r.score * 100).toFixed(1);
  let text = \`[\${i + 1}] (Relevância: \${score}%)\\n\`;

  if (p.tipo === 'sumula') {
    text += \`Súmula \${p.numero}/STJ: \${p.ementa || p.text_preview}\`;
  } else if (p.tipo === 'tema_repetitivo') {
    text += \`Tema \${p.numero_tema}: \${p.tese_firmada || p.questao_submetida || p.text_preview}\`;
  } else if (p.tipo === 'acordao') {
    text += \`Acórdão - \${p.orgao_julgador || 'STJ'}:\\n\${p.ementa || p.text_preview}\`;
  } else {
    text += p.text_preview || p.ementa || 'Conteúdo não disponível';
  }

  return text;
}).join('\\n\\n---\\n\\n');

const context = \`## PRECEDENTES STJ RELEVANTES (RAG)

\${formatted}

---
Fonte: Vector Store STJ Jurisprudência (score >= 60%)\`;

return [{ json: { rag_context: context, results_count: results.length } }];`
  },
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [0, 0],
  "name": "Format RAG Results"
};

function loadWorkflow(filepath) {
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

function saveWorkflow(workflow, filepath) {
  fs.writeFileSync(filepath, JSON.stringify(workflow, null, 2), 'utf8');
  console.log(`✓ Saved workflow to ${path.relative(repoRoot, filepath)}`);
}

function findAgentNodes(workflow) {
  return workflow.nodes.filter(n =>
    n.type === '@n8n/n8n-nodes-langchain.agent'
  );
}

function addRAGSubworkflow(workflow) {
  // Create RAG subworkflow nodes
  const ragWorkflowId = `rag_subworkflow_${Date.now()}`;

  // Add instruction to use RAG in agent system prompts
  const agents = findAgentNodes(workflow);

  agents.forEach(agent => {
    if (agent.parameters && agent.parameters.systemMessage) {
      // Add RAG instruction to system prompt
      const ragInstruction = `

## BUSCA DE JURISPRUDÊNCIA (RAG)
IMPORTANTE: Antes de fundamentar sua decisão, utilize a ferramenta "busca_jurisprudencia_stj" para buscar precedentes relevantes no vector store. A busca semântica retornará súmulas, temas repetitivos e acórdãos do STJ relacionados à questão jurídica.`;

      if (!agent.parameters.systemMessage.includes('busca_jurisprudencia_stj')) {
        agent.parameters.systemMessage += ragInstruction;
        console.log(`✓ Added RAG instruction to agent: ${agent.name}`);
      }
    }
  });

  return workflow;
}

function main() {
  console.log('=== RAG Integration Script ===\n');

  // Load workflow
  const workflow = loadWorkflow(WORKFLOW_FILE);
  console.log(`Loaded workflow: ${path.relative(repoRoot, WORKFLOW_FILE)}`);
  console.log(`Total nodes: ${workflow.nodes.length}`);

  // Find agents
  const agents = findAgentNodes(workflow);
  console.log(`Found ${agents.length} AI agents`);

  // Add RAG integration
  const updatedWorkflow = addRAGSubworkflow(workflow);

  // Update version
  updatedWorkflow.meta = updatedWorkflow.meta || {};
  updatedWorkflow.meta.instanceId = updatedWorkflow.meta.instanceId || '';
  updatedWorkflow.name = 'Lex Intelligentia v3.0 - RAG Integration';

  // Save updated workflow
  saveWorkflow(updatedWorkflow, OUTPUT_FILE);

  console.log('\n=== Integration Complete ===');
  console.log(`Output: ${path.relative(repoRoot, OUTPUT_FILE)}`);
  console.log('\nNext steps:');
  console.log('1. Import workflow into n8n');
  console.log('2. Configure OpenAI API credentials');
  console.log('3. Verify Qdrant connection (localhost:6333)');
  console.log('4. Add RAG tool subworkflow to each agent');
}

main();
