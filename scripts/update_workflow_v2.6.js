#!/usr/bin/env node
/**
 * Update workflow to v2.6 with Fazenda Publica agents
 * Adds: agent_mandado_seguranca, agent_saude_medicamentos
 */

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(__dirname, '..', 'n8n_workflow_v2.6_fazenda_publica.json');

// Read workflow
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));

// Update workflow name
workflow.name = 'Lex Intelligentia Judiciario v2.6 - 23 Agentes';

// Find and update the Set System Prompt node
const setPromptNode = workflow.nodes.find(n => n.name === 'Set System Prompt');
if (setPromptNode) {
  // The jsCode contains the PROMPTS object - we need to add new agents before agent_generico
  let code = setPromptNode.parameters.jsCode;

  // Add the new agent prompts before agent_generico
  const newPrompts = `
  agent_mandado_seguranca: \`# AGENTE JUDICIAL: MANDADO DE SEGURANCA
## Vara de Fazenda Publica - TJES

### PAPEL
Agente especializado em mandados de seguranca.

### COMPETENCIAS
- MS Individual e Coletivo
- Liminar em MS
- Servidor publico: concurso, nomeacao
- Licitacao: habilitacao, desclassificacao
- Tributario: compensacao

### BASE JURISPRUDENCIAL
- Lei 12.016/2009
- Sumulas 266, 267, 271, 512, 625/STF
- Sumulas 105, 213, 333/STJ
- Prazo decadencial: 120 dias

### PARAMETROS
- Sem honorarios (Sumula 512/STF)
- Reexame necessario obrigatorio
- Liminar: fumus + periculum + reversibilidade

### ESTRUTURA
I - RELATORIO / II - FUNDAMENTACAO / III - DISPOSITIVO\`,

  agent_saude_medicamentos: \`# AGENTE JUDICIAL: SAUDE/MEDICAMENTOS
## Vara de Fazenda Publica - TJES

### PAPEL
Agente especializado em acoes de saude contra o Poder Publico.

### COMPETENCIAS
- Fornecimento de medicamentos (SUS e alto custo)
- Tratamentos medicos (cirurgias, terapias)
- Insumos e equipamentos
- Leitos de UTI

### BASE JURISPRUDENCIAL
- CF art. 196 (direito a saude)
- Lei 8.080/1990 (Lei do SUS)
- Tema 6/STF: Responsabilidade solidaria
- Tema 500/STF: Medicamentos sem ANVISA
- Tema 793/STF: Legitimidade passiva solidaria
- Tema 1234/STF: Medicamentos fora lista SUS

### PARAMETROS
- Multa medicamento: R$500-1.000/dia
- Multa UTI/cirurgia: R$5.000-10.000/dia
- Prazo medicamento: 15-30 dias
- Consultar NAT-JUS quando indicado

### ESTRUTURA
I - RELATORIO / II - FUNDAMENTACAO / III - DISPOSITIVO\`,

`;

  // Insert before agent_generico
  code = code.replace(
    'agent_generico: `# AGENTE JUDICIAL: GENÉRICO',
    newPrompts + '  agent_generico: `# AGENTE JUDICIAL: GENÉRICO'
  );

  // Update the comment about number of agents
  code = code.replace(
    '// PROMPTS POR AGENTE (11 agentes especializados)',
    '// PROMPTS POR AGENTE (13 agentes especializados)'
  );

  setPromptNode.parameters.jsCode = code;
  console.log('Updated Set System Prompt node');
}

// Find and update the Switch node
const switchNode = workflow.nodes.find(n => n.name === 'Switch: Seleciona Agente');
if (switchNode) {
  // Add new rules before agent_generico
  const genericoIndex = switchNode.parameters.rules.rules.findIndex(
    r => r.value === 'agent_generico'
  );

  const newRules = [
    { value: 'agent_mandado_seguranca', outputKey: 'Mandado de Seguranca' },
    { value: 'agent_saude_medicamentos', outputKey: 'Saude - Medicamentos' }
  ];

  // Insert before generico
  switchNode.parameters.rules.rules.splice(genericoIndex, 0, ...newRules);

  // Update notes
  switchNode.notes = 'v2.6: Expandido para 13 agentes + fallback. Inclui Mandado de Seguranca e Saude/Medicamentos';

  console.log('Updated Switch node with 2 new routes');
}

// Update sticky note header
const stickyNote = workflow.nodes.find(n => n.name && n.name.includes('INFO'));
if (stickyNote) {
  stickyNote.parameters.content = stickyNote.parameters.content
    .replace(/v2\.2/g, 'v2.6')
    .replace(/11 agentes/gi, '13 agentes')
    + '\n\n### Mudancas v2.6:\n- + agent_MANDADO_SEGURANCA\n- + agent_SAUDE_MEDICAMENTOS\n- Fazenda Publica completo';
  console.log('Updated sticky note');
}

// Write updated workflow
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));
console.log('Workflow saved to:', workflowPath);

// Verify
const updated = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
const agents = updated.nodes
  .find(n => n.name === 'Switch: Seleciona Agente')
  ?.parameters.rules.rules.map(r => r.value) || [];
console.log('Agents in workflow:', agents.length);
console.log(agents);
