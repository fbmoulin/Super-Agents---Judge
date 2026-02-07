'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Upload,
  ChevronLeft,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { useBuilderStore, selectDraftsSorted } from '@/store/builder-store'
import { AgentEditor } from '@/components/builder/AgentEditor'
import { AgentCard, AgentCardCompact } from '@/components/builder/AgentCard'
import { AgentGenerationForm } from '@/components/builder/AgentGenerationForm'
import type { AgentDefinition, ExportedAgent } from '@/types/agent-builder'

type ViewMode = 'grid' | 'list'
type StatusFilter = 'all' | 'draft' | 'testing' | 'approved'

export default function BuilderPage() {
  const router = useRouter()

  const {
    currentAgent,
    setCurrentAgent,
    createNewAgent,
    duplicateAgent,
    deleteDraft,
    loadDraft,
    testRuns,
  } = useBuilderStore()

  const drafts = useBuilderStore(selectDraftsSorted)

  const [showGenerator, setShowGenerator] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Filter drafts
  const filteredDrafts = drafts.filter((draft) => {
    // Status filter
    if (statusFilter !== 'all' && draft.status !== statusFilter) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        draft.titulo.toLowerCase().includes(query) ||
        draft.funcao?.toLowerCase().includes(query) ||
        draft.tags?.some((tag) => tag.includes(query)) ||
        draft.id.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Get latest score for an agent
  const getLatestScore = useCallback(
    (agentId: string) => {
      const run = testRuns.find((r) => r.agentId === agentId)
      return run?.qualityScores.overall
    },
    [testRuns]
  )

  // Handle file import
  const handleImport = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data: ExportedAgent = JSON.parse(text)

        if (!data.agent || !data.agent.id) {
          throw new Error('Formato de arquivo inválido')
        }

        // Generate new ID to avoid conflicts
        const now = new Date().toISOString()
        const importedAgent: AgentDefinition = {
          ...data.agent,
          id: `${data.agent.id}_IMPORT_${Date.now().toString(36).toUpperCase()}`,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        }

        setCurrentAgent(importedAgent)
      } catch (err) {
        console.error('Import error:', err)
        alert('Erro ao importar arquivo. Verifique o formato.')
      }
    }

    input.click()
  }, [setCurrentAgent])

  // Handle test navigation
  const handleTest = useCallback(
    (agent: AgentDefinition) => {
      router.push(`/builder/${agent.id}/sandbox`)
    },
    [router]
  )

  // Handle agent generation complete
  const handleGenerated = useCallback(() => {
    setShowGenerator(false)
  }, [])

  // Show generator when no agents exist
  useEffect(() => {
    if (drafts.length === 0 && !currentAgent) {
      setShowGenerator(true)
    }
  }, [drafts.length, currentAgent])

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Agent Builder
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleImport}
            className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Upload className="h-4 w-4" />
            Importar
          </button>

          <button
            onClick={() => {
              setShowGenerator(true)
              setCurrentAgent(null)
            }}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Novo Agente
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Agent list */}
        <aside className="w-80 flex-shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {/* Search and filters */}
          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar agentes..."
                className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-10 pr-10 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:placeholder:text-zinc-500"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 ${
                  showFilters
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {showFilters && (
              <div className="mt-3 flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="all">Todos</option>
                  <option value="draft">Rascunhos</option>
                  <option value="testing">Em teste</option>
                  <option value="approved">Aprovados</option>
                </select>

                <div className="flex rounded-md border border-zinc-200 dark:border-zinc-700">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 ${
                      viewMode === 'grid'
                        ? 'bg-zinc-100 dark:bg-zinc-800'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 ${
                      viewMode === 'list'
                        ? 'bg-zinc-100 dark:bg-zinc-800'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Agent list */}
          <div className="h-full overflow-auto p-4">
            {filteredDrafts.length === 0 ? (
              <div className="text-center text-sm text-zinc-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Nenhum agente encontrado com os filtros atuais.'
                  : 'Nenhum agente criado ainda.'}
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'space-y-4'
                    : 'space-y-2'
                }
              >
                {filteredDrafts.map((draft) =>
                  viewMode === 'grid' ? (
                    <AgentCard
                      key={draft.id}
                      agent={draft}
                      latestScore={getLatestScore(draft.id)}
                      isSelected={currentAgent?.id === draft.id}
                      onClick={() => {
                        loadDraft(draft.id)
                        setShowGenerator(false)
                      }}
                      onEdit={() => {
                        loadDraft(draft.id)
                        setShowGenerator(false)
                      }}
                      onTest={() => handleTest(draft)}
                      onDuplicate={() => duplicateAgent(draft)}
                      onDelete={() => {
                        if (confirm(`Excluir agente "${draft.titulo}"?`)) {
                          deleteDraft(draft.id)
                        }
                      }}
                    />
                  ) : (
                    <AgentCardCompact
                      key={draft.id}
                      agent={draft}
                      latestScore={getLatestScore(draft.id)}
                      isSelected={currentAgent?.id === draft.id}
                      onClick={() => {
                        loadDraft(draft.id)
                        setShowGenerator(false)
                      }}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main panel */}
        <main className="flex-1 overflow-hidden">
          {showGenerator ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="w-full max-w-xl">
                <AgentGenerationForm onGenerated={handleGenerated} />
              </div>
            </div>
          ) : currentAgent ? (
            <AgentEditor
              agent={currentAgent}
              onTest={handleTest}
              showPreview
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
                <Plus className="h-8 w-8 text-zinc-400" />
              </div>
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Selecione ou Crie um Agente
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Escolha um agente da lista ou crie um novo para começar.
              </p>
              <button
                onClick={() => setShowGenerator(true)}
                className="mt-4 flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Criar Novo Agente
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
