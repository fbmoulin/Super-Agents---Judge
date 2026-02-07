import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AgentDefinition, BuilderStore, TestRun } from '@/types/agent-builder'

/**
 * Generates a unique ID for new agents
 */
function generateAgentId(theme?: string): string {
  const base = theme
    ? theme
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
    : 'NOVO_AGENTE'

  const timestamp = Date.now().toString(36).toUpperCase()
  return `${base}_${timestamp}`
}

/**
 * Creates a new empty agent definition
 */
function createEmptyAgent(theme?: string): AgentDefinition {
  const now = new Date().toISOString()
  return {
    id: generateAgentId(theme),
    version: '1.0.0',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    titulo: theme ? `AGENTE JUDICIAL: ${theme.toUpperCase()}` : 'AGENTE JUDICIAL: NOVO',
    funcao: '',
    regras: [
      'Estrutura obrigatória: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO',
      'Citar súmulas e base legal relevantes',
      'Fundamentação clara e objetiva',
    ],
    sumulas: [],
    baseLegal: [],
    parametros: {},
    tags: [],
    author: '',
    description: '',
  }
}

/**
 * Initial state for the builder store
 */
const initialState = {
  currentAgent: null,
  drafts: [],
  testRuns: [],
  isGenerating: false,
  isTesting: false,
  isComparing: false,
  isSaving: false,
  activeEditorTab: 'basic' as const,
  comparisonAgent: null,
  comparisonRuns: [],
}

/**
 * Builder Store with persistence
 *
 * Persists drafts to localStorage for recovery between sessions.
 * Test runs are NOT persisted to avoid localStorage bloat.
 */
export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // =======================================================================
      // AGENT MANAGEMENT
      // =======================================================================

      setCurrentAgent: (agent) =>
        set({
          currentAgent: agent,
          testRuns: [], // Clear test runs when switching agents
          activeEditorTab: 'basic',
        }),

      updateCurrentAgent: (updates) =>
        set((state) => {
          if (!state.currentAgent) return state

          const updatedAgent: AgentDefinition = {
            ...state.currentAgent,
            ...updates,
            updatedAt: new Date().toISOString(),
          }

          // Auto-save draft
          const existingIndex = state.drafts.findIndex((d) => d.id === updatedAgent.id)
          const newDrafts =
            existingIndex >= 0
              ? state.drafts.map((d, i) => (i === existingIndex ? updatedAgent : d))
              : [...state.drafts, updatedAgent]

          return {
            currentAgent: updatedAgent,
            drafts: newDrafts,
          }
        }),

      createNewAgent: (theme) => {
        const agent = createEmptyAgent(theme)
        set((state) => ({
          currentAgent: agent,
          drafts: [...state.drafts, agent],
          testRuns: [],
          activeEditorTab: 'basic',
        }))
        return agent
      },

      duplicateAgent: (agent) => {
        const now = new Date().toISOString()
        const duplicated: AgentDefinition = {
          ...agent,
          id: generateAgentId(agent.titulo.replace('AGENTE JUDICIAL:', '').trim()),
          version: '1.0.0',
          status: 'draft',
          createdAt: now,
          updatedAt: now,
          titulo: `${agent.titulo} (Cópia)`,
        }
        set((state) => ({
          currentAgent: duplicated,
          drafts: [...state.drafts, duplicated],
          testRuns: [],
        }))
        return duplicated
      },

      // =======================================================================
      // DRAFTS
      // =======================================================================

      saveDraft: (agent) =>
        set((state) => {
          const updatedAgent = {
            ...agent,
            updatedAt: new Date().toISOString(),
          }
          const existingIndex = state.drafts.findIndex((d) => d.id === agent.id)

          if (existingIndex >= 0) {
            return {
              drafts: state.drafts.map((d, i) => (i === existingIndex ? updatedAgent : d)),
              currentAgent:
                state.currentAgent?.id === agent.id ? updatedAgent : state.currentAgent,
            }
          }

          return {
            drafts: [...state.drafts, updatedAgent],
          }
        }),

      deleteDraft: (agentId) =>
        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== agentId),
          currentAgent: state.currentAgent?.id === agentId ? null : state.currentAgent,
        })),

      loadDraft: (agentId) =>
        set((state) => {
          const draft = state.drafts.find((d) => d.id === agentId)
          if (!draft) return state

          return {
            currentAgent: draft,
            testRuns: [],
            activeEditorTab: 'basic',
          }
        }),

      // =======================================================================
      // TEST RUNS
      // =======================================================================

      addTestRun: (run) =>
        set((state) => ({
          testRuns: [run, ...state.testRuns].slice(0, 50), // Keep last 50 runs
        })),

      clearTestRuns: () => set({ testRuns: [] }),

      // =======================================================================
      // UI STATE
      // =======================================================================

      setIsGenerating: (value) => set({ isGenerating: value }),
      setIsTesting: (value) => set({ isTesting: value }),
      setIsComparing: (value) => set({ isComparing: value }),
      setIsSaving: (value) => set({ isSaving: value }),
      setActiveEditorTab: (tab) => set({ activeEditorTab: tab }),

      // =======================================================================
      // COMPARISON
      // =======================================================================

      setComparisonAgent: (agent) =>
        set({
          comparisonAgent: agent,
          comparisonRuns: [],
        }),

      addComparisonRun: (run) =>
        set((state) => ({
          comparisonRuns: [run, ...state.comparisonRuns].slice(0, 10),
        })),

      clearComparison: () =>
        set({
          comparisonAgent: null,
          comparisonRuns: [],
          isComparing: false,
        }),

      // =======================================================================
      // RESET
      // =======================================================================

      resetBuilder: () =>
        set({
          ...initialState,
          drafts: get().drafts, // Keep drafts on reset
        }),
    }),
    {
      name: 'agent-builder-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist drafts to avoid localStorage bloat
      partialize: (state) => ({
        drafts: state.drafts,
      }),
    }
  )
)

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Get current agent with null check
 */
export const selectCurrentAgent = (state: BuilderStore) => state.currentAgent

/**
 * Get all drafts sorted by update date (newest first)
 */
export const selectDraftsSorted = (state: BuilderStore) =>
  [...state.drafts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

/**
 * Get drafts by status
 */
export const selectDraftsByStatus = (status: AgentDefinition['status']) => (state: BuilderStore) =>
  state.drafts.filter((d) => d.status === status)

/**
 * Get test runs for current agent
 */
export const selectTestRunsForCurrentAgent = (state: BuilderStore) => {
  if (!state.currentAgent) return []
  return state.testRuns.filter((r) => r.agentId === state.currentAgent?.id)
}

/**
 * Get latest test run
 */
export const selectLatestTestRun = (state: BuilderStore) =>
  state.testRuns.length > 0 ? state.testRuns[0] : null

/**
 * Check if any operation is in progress
 */
export const selectIsLoading = (state: BuilderStore) =>
  state.isGenerating || state.isTesting || state.isComparing || state.isSaving

/**
 * Get average score from recent test runs
 */
export const selectAverageScore = (state: BuilderStore) => {
  const runs = state.testRuns.slice(0, 10)
  if (runs.length === 0) return null
  return Math.round(runs.reduce((sum, r) => sum + r.qualityScores.overall, 0) / runs.length)
}
