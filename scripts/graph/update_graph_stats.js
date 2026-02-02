#!/usr/bin/env node
/**
 * Update Graph Statistics
 * Calculates and updates metadata.stats in legal_graph.json
 */

const fs = require('fs');
const path = require('path');

const GRAPH_PATH = path.join(__dirname, '../../knowledge_base/legal_graph.json');

function updateGraphStats() {
  const graph = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf-8'));

  // Count nodes by type
  const nodesByType = {};
  for (const node of graph.nodes) {
    nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
  }

  // Count edges by type
  const edgesByType = {};
  for (const edge of graph.edges) {
    edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1;
  }

  // Update metadata
  graph.metadata.stats = {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    nodesByType,
    edgesByType
  };
  graph.metadata.lastUpdate = new Date().toISOString().split('T')[0];

  // Write back
  fs.writeFileSync(GRAPH_PATH, JSON.stringify(graph, null, 2));

  // Print summary
  console.log('=== Legal Knowledge Graph Statistics ===\n');
  console.log(`Total Nodes: ${graph.metadata.stats.totalNodes}`);
  console.log(`Total Edges: ${graph.metadata.stats.totalEdges}\n`);

  console.log('Nodes by Type:');
  for (const [type, count] of Object.entries(nodesByType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  console.log('\nEdges by Type:');
  for (const [type, count] of Object.entries(edgesByType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  return graph.metadata.stats;
}

if (require.main === module) {
  updateGraphStats();
}

module.exports = { updateGraphStats };
