/**
 * Agent Builder & Sandbox Types
 * Sistema para criar, testar e aprovar novos agentes judiciais especializados
 */

// =============================================================================
// AGENT DEFINITION
// =============================================================================

export type AgentStatus = 'draft' | 'testing' | 'approved'

export interface ParameterRange {
  min: number
  max: number
  description?: string
}

export interface AgentDefinition {
  id: string // Ex: "DIREITO_AMBIENTAL"
  version: string // Semantic versioning: "1.0.0"
  status: AgentStatus
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp

  // Core
  titulo: string // Ex: "AGENTE JUDICIAL: AMBIENTAL"
  funcao: string // Descrição da função do agente
  regras: string[] // Regras obrigatórias

  // Jurídico
  sumulas: string[] // Ex: ["629", "623"]
  baseLegal: string[] // Ex: ["Lei 9.605/98", "Art. 225 CF"]
  parametros?: Record<string, ParameterRange> // Ex: { "danosAmbientais": { min: 10000, max: 500000 } }

  // Metadata
  tags?: string[] // Ex: ["ambiental", "civil-publica"]
  author?: string
  description?: string // Descrição adicional
}

// =============================================================================
// TEST CASE & TEST RUN
// =============================================================================

export interface TestCaseInput {
  fatos: string
  questoes: string
  pedidos: string
}

export interface TestOutput {
  minuta: string
  palavras: number
}

export interface ExecutionMetrics {
  executionTimeMs: number
  tokensUsed: number
  model?: string
}

export interface QualityScores {
  overall: number // 0-100
  structure: number // I/II/III sections (0-45)
  citation: number // Legal citations (0-30)
  reasoning: number // Decision quality (0-25)
  issues: string[] // Lista de problemas encontrados
}

export interface TestRun {
  id: string
  agentId: string
  agentVersion: string
  timestamp: string // ISO timestamp
  input: TestCaseInput
  output: TestOutput
  metrics: ExecutionMetrics
  qualityScores: QualityScores
}

// =============================================================================
// BUILDER STORE STATE
// =============================================================================

export interface BuilderState {
  // Current agent being edited
  currentAgent: AgentDefinition | null

  // All drafts (persisted in localStorage)
  drafts: AgentDefinition[]

  // Test history for current agent
  testRuns: TestRun[]

  // UI state
  isGenerating: boolean
  isTesting: boolean
  isComparing: boolean
  isSaving: boolean

  // Active tab in editor
  activeEditorTab: 'basic' | 'rules' | 'sumulas' | 'legal' | 'parameters'

  // Comparison state
  comparisonAgent: AgentDefinition | null
  comparisonRuns: TestRun[]
}

export interface BuilderActions {
  // Agent management
  setCurrentAgent: (agent: AgentDefinition | null) => void
  updateCurrentAgent: (updates: Partial<AgentDefinition>) => void
  createNewAgent: (theme?: string) => AgentDefinition
  duplicateAgent: (agent: AgentDefinition) => AgentDefinition

  // Drafts
  saveDraft: (agent: AgentDefinition) => void
  deleteDraft: (agentId: string) => void
  loadDraft: (agentId: string) => void

  // Test runs
  addTestRun: (run: TestRun) => void
  clearTestRuns: () => void

  // UI state
  setIsGenerating: (value: boolean) => void
  setIsTesting: (value: boolean) => void
  setIsComparing: (value: boolean) => void
  setIsSaving: (value: boolean) => void
  setActiveEditorTab: (tab: BuilderState['activeEditorTab']) => void

  // Comparison
  setComparisonAgent: (agent: AgentDefinition | null) => void
  addComparisonRun: (run: TestRun) => void
  clearComparison: () => void

  // Reset
  resetBuilder: () => void
}

export type BuilderStore = BuilderState & BuilderActions

// =============================================================================
// API TYPES
// =============================================================================

// POST /api/builder/generate
export interface GenerateAgentRequest {
  theme: string
  context?: string
}

export interface SuggestedSumula {
  numero: string
  texto: string
  relevance: number // 0-1
}

export interface GenerateAgentResponse {
  agent: Partial<AgentDefinition>
  suggestedSumulas: SuggestedSumula[]
  confidence: number // 0-1
}

// POST /api/builder/validate
export interface ValidateAgentRequest {
  agent: AgentDefinition
}

export interface ValidationIssue {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface ValidateAgentResponse {
  isValid: boolean
  issues: ValidationIssue[]
}

// POST /api/sandbox/test
export interface SandboxTestRequest {
  agent: AgentDefinition
  testCase: TestCaseInput
}

export interface SandboxTestResponse {
  output: TestOutput
  qualityScores: QualityScores
  metrics: ExecutionMetrics
  runId: string
}

// POST /api/sandbox/compare
export interface CompareAgentsRequest {
  agentA: AgentDefinition
  agentB: AgentDefinition
  testCase: TestCaseInput
}

export interface CompareAgentsResponse {
  runA: SandboxTestResponse
  runB: SandboxTestResponse
  comparison: {
    scoreDiff: number
    winner: 'A' | 'B' | 'tie'
    analysis: string
  }
}

// POST /api/agents/commit
export interface CommitAgentRequest {
  agent: AgentDefinition
  message?: string
}

export interface CommitAgentResponse {
  success: boolean
  agentId: string
  version: string
  message?: string
}

// =============================================================================
// RISK CLASSIFICATION
// =============================================================================

export type RiskLevel = 'baixo' | 'medio' | 'alto' | 'critico'

export interface RiskClassification {
  level: RiskLevel
  score: number
  recommendation: string
}

export function classifyRisk(score: number): RiskClassification {
  if (score >= 85) {
    return {
      level: 'baixo',
      score,
      recommendation: 'Pronto para produção',
    }
  } else if (score >= 70) {
    return {
      level: 'medio',
      score,
      recommendation: 'Revisão recomendada antes de produção',
    }
  } else if (score >= 50) {
    return {
      level: 'alto',
      score,
      recommendation: 'Revisão obrigatória - não recomendado para produção',
    }
  } else {
    return {
      level: 'critico',
      score,
      recommendation: 'Reescrever agente - score muito baixo',
    }
  }
}

// =============================================================================
// QUALITY CALCULATION HELPERS
// =============================================================================

export interface StructureAnalysis {
  hasRelatorio: boolean
  hasFundamentacao: boolean
  hasDispositivo: boolean
  score: number // 0-45
}

export interface CitationAnalysis {
  hasBaseLegal: boolean
  hasSumulas: boolean
  hasJurisprudencia: boolean
  citationCount: number
  score: number // 0-30
}

export interface ReasoningAnalysis {
  hasDecisaoClara: boolean
  hasHonorarios: boolean
  hasExtensaoAdequada: boolean
  wordCount: number
  score: number // 0-25
}

export function analyzeStructure(minuta: string): StructureAnalysis {
  const hasRelatorio = /I\s*[-–]\s*RELAT[ÓO]RIO/i.test(minuta)
  const hasFundamentacao = /II\s*[-–]\s*FUNDAMENTA[ÇC][ÃA]O/i.test(minuta)
  const hasDispositivo = /III\s*[-–]\s*DISPOSITIVO/i.test(minuta)

  let score = 0
  if (hasRelatorio) score += 15
  if (hasFundamentacao) score += 15
  if (hasDispositivo) score += 15

  return { hasRelatorio, hasFundamentacao, hasDispositivo, score }
}

export function analyzeCitations(minuta: string, agent: AgentDefinition): CitationAnalysis {
  // Check for base legal references
  const hasBaseLegal = agent.baseLegal.some(
    (lei) => minuta.toLowerCase().includes(lei.toLowerCase().split(' ')[0]) // First word of law
  )

  // Check for súmulas
  const hasSumulas = agent.sumulas.some((sumula) =>
    new RegExp(`s[úu]mula\\s*(n[º°.]?\\s*)?${sumula}`, 'i').test(minuta)
  )

  // Check for jurisprudence citations
  const jurisprudencePatterns = [
    /REsp\s*\d+/i,
    /AgRg/i,
    /STJ/i,
    /STF/i,
    /TJ[A-Z]{2}/i,
    /Apela[çc][ãa]o\s*C[íi]vel/i,
  ]
  const hasJurisprudencia = jurisprudencePatterns.some((pattern) => pattern.test(minuta))

  // Count total citations
  const citationCount = (minuta.match(/(?:art\.|artigo|§|súmula|lei|decreto)/gi) || []).length

  let score = 0
  if (hasBaseLegal) score += 10
  if (hasSumulas) score += 10
  if (hasJurisprudencia) score += 10

  return { hasBaseLegal, hasSumulas, hasJurisprudencia, citationCount, score }
}

export function analyzeReasoning(minuta: string): ReasoningAnalysis {
  const wordCount = minuta.split(/\s+/).filter((w) => w.length > 0).length

  // Check for clear decision
  const decisaoPatterns = [
    /julgo\s*(procedente|improcedente)/i,
    /acolho\s*(o\s*pedido|a\s*pretensão)/i,
    /rejeito/i,
    /condeno/i,
    /determino/i,
  ]
  const hasDecisaoClara = decisaoPatterns.some((p) => p.test(minuta))

  // Check for honorários
  const hasHonorarios = /honor[áa]rios/i.test(minuta)

  // Check for adequate length (500-3000 words is ideal)
  const hasExtensaoAdequada = wordCount >= 500 && wordCount <= 3000

  let score = 0
  if (hasDecisaoClara) score += 10
  if (hasHonorarios) score += 5
  if (hasExtensaoAdequada) score += 10

  return { hasDecisaoClara, hasHonorarios, hasExtensaoAdequada, wordCount, score }
}

export function calculateQualityScores(minuta: string, agent: AgentDefinition): QualityScores {
  const structure = analyzeStructure(minuta)
  const citations = analyzeCitations(minuta, agent)
  const reasoning = analyzeReasoning(minuta)

  const issues: string[] = []

  // Structure issues
  if (!structure.hasRelatorio) issues.push('Seção I - RELATÓRIO não encontrada')
  if (!structure.hasFundamentacao) issues.push('Seção II - FUNDAMENTAÇÃO não encontrada')
  if (!structure.hasDispositivo) issues.push('Seção III - DISPOSITIVO não encontrado')

  // Citation issues
  if (!citations.hasBaseLegal) issues.push('Base legal do agente não citada')
  if (!citations.hasSumulas) issues.push('Súmulas do agente não citadas')
  if (!citations.hasJurisprudencia) issues.push('Falta jurisprudência de apoio')

  // Reasoning issues
  if (!reasoning.hasDecisaoClara) issues.push('Decisão não está clara')
  if (!reasoning.hasHonorarios) issues.push('Honorários não mencionados')
  if (!reasoning.hasExtensaoAdequada) {
    if (reasoning.wordCount < 500) {
      issues.push(`Minuta muito curta (${reasoning.wordCount} palavras)`)
    } else {
      issues.push(`Minuta muito longa (${reasoning.wordCount} palavras)`)
    }
  }

  return {
    overall: structure.score + citations.score + reasoning.score,
    structure: structure.score,
    citation: citations.score,
    reasoning: reasoning.score,
    issues,
  }
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface ExportedAgent {
  version: '1.0'
  exportedAt: string
  agent: AgentDefinition
  testRuns?: TestRun[]
}

export function createExportPayload(agent: AgentDefinition, testRuns?: TestRun[]): ExportedAgent {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    agent,
    testRuns,
  }
}
