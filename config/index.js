/**
 * Configuration Loader for Lex Intelligentia
 *
 * Usage:
 *   const config = require('./config');
 *   const prompt = config.getPrompt('BANCARIO');
 *   const settings = config.settings;
 */

const fs = require('fs');
const path = require('path');

// Load configuration files
const settingsPath = path.join(__dirname, 'settings.json');
const promptsPath = path.join(__dirname, 'prompts', 'system_prompts.json');

let settings = {};
let prompts = {};

try {
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
} catch (e) {
  console.error('Error loading settings.json:', e.message);
}

try {
  prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));
} catch (e) {
  console.error('Error loading system_prompts.json:', e.message);
}

/**
 * Build a full system prompt from the structured data
 * @param {string} agentName - Agent identifier (e.g., 'BANCARIO', 'CONSUMIDOR')
 * @returns {string} Full formatted system prompt
 */
function getPrompt(agentName) {
  const agent = prompts.agents?.[agentName];
  if (!agent) {
    console.warn(`Unknown agent: ${agentName}, using GENERICO`);
    return getPrompt('GENERICO');
  }

  let prompt = `# ${agent.titulo}\n`;
  prompt += `## ${agent.funcao}\n\n`;

  // Add rules if present
  if (agent.regras) {
    prompt += `### REGRAS OBRIGATÓRIAS\n`;
    agent.regras.forEach((r, i) => {
      prompt += `${i + 1}. ${r}\n`;
    });
    prompt += '\n';
  }

  // Add competencies if present
  if (agent.competencias) {
    prompt += `### COMPETÊNCIAS\n`;
    agent.competencias.forEach(c => {
      prompt += `- ${c}\n`;
    });
    prompt += '\n';
  }

  // Add súmulas if present
  if (agent.sumulas && agent.sumulas.length > 0) {
    prompt += `### SÚMULAS PRIORITÁRIAS\n`;
    prompt += agent.sumulas.join(', ') + '/STJ\n\n';
  }

  // Add base legal if present
  if (agent.baseLegal) {
    prompt += `### BASE LEGAL\n`;
    const leis = Array.isArray(agent.baseLegal) ? agent.baseLegal : [agent.baseLegal];
    leis.forEach(l => {
      prompt += `- ${l}\n`;
    });
    prompt += '\n';
  }

  // Add structure reminder
  prompt += `### ESTRUTURA\n${prompts.common?.estruturaObrigatoria || 'I - RELATÓRIO / II - FUNDAMENTAÇÃO / III - DISPOSITIVO'}\n`;
  prompt += `Marcar ${prompts.common?.marcadorRevisao || '[REVISAR: motivo]'} para incertezas.\n`;

  return prompt;
}

/**
 * Get minimal prompt for v5.x workflow (more concise)
 * @param {string} agentName - Agent identifier
 * @returns {string} Minimal formatted prompt
 */
function getMinimalPrompt(agentName) {
  const agent = prompts.agents?.[agentName];
  if (!agent) return getMinimalPrompt('GENERICO');

  let prompt = `Agente ${agentName} especializado. ${agent.funcao}\n\n`;

  if (agent.sumulas && agent.sumulas.length > 0) {
    prompt += `SÚMULAS: ${agent.sumulas.join(', ')}/STJ\n\n`;
  }

  if (agent.regras) {
    prompt += `REGRAS:\n`;
    agent.regras.slice(0, 5).forEach((r, i) => {
      prompt += `${i + 1}. ${r}\n`;
    });
    prompt += '\n';
  }

  prompt += `ESTRUTURA: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO\n`;
  prompt += `NUNCA use [REVISAR] - faça presunções razoáveis.`;

  return prompt;
}

/**
 * Get all agent names
 * @returns {string[]} List of agent names
 */
function getAgentNames() {
  return Object.keys(prompts.agents || {});
}

/**
 * Get agent parameters (damage values, deadlines, etc.)
 * @param {string} agentName
 * @returns {object} Parameters object
 */
function getParameters(agentName) {
  return prompts.agents?.[agentName]?.parametros || {};
}

/**
 * Get API configuration
 * @param {string} provider - 'anthropic' or 'gemini'
 * @returns {object} API config
 */
function getApiConfig(provider) {
  return settings.api?.[provider] || {};
}

/**
 * Get validation settings
 * @returns {object} Validation config
 */
function getValidationConfig() {
  return settings.validation || {};
}

module.exports = {
  settings,
  prompts,
  getPrompt,
  getMinimalPrompt,
  getAgentNames,
  getParameters,
  getApiConfig,
  getValidationConfig
};
