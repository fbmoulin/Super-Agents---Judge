'use client'

import { useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Play, Save, Loader2 } from 'lucide-react'
import { useBuilderStore } from '@/store/builder-store'
import { AgentEditor } from '@/components/builder/AgentEditor'
import type { AgentDefinition } from '@/types/agent-builder'

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.agentId as string

  const {
    currentAgent,
    drafts,
    loadDraft,
    saveDraft,
    isSaving,
    setIsSaving,
  } = useBuilderStore()

  // Load agent if not current
  useEffect(() => {
    if (!currentAgent || currentAgent.id !== agentId) {
      const draft = drafts.find((d) => d.id === agentId)
      if (draft) {
        loadDraft(agentId)
      } else {
        router.push('/builder')
      }
    }
  }, [agentId, currentAgent, drafts, loadDraft, router])

  // Handle save
  const handleSave = useCallback(
    async (agent: AgentDefinition) => {
      setIsSaving(true)
      try {
        saveDraft(agent)
        // Show success (could use toast)
      } finally {
        setIsSaving(false)
      }
    },
    [saveDraft, setIsSaving]
  )

  // Handle test navigation
  const handleTest = useCallback(
    (agent: AgentDefinition) => {
      router.push(`/builder/${agent.id}/sandbox`)
    },
    [router]
  )

  if (!currentAgent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-zinc-500">Carregando agente...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/builder')}
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Editar Agente
            </h1>
            <p className="text-xs text-zinc-500">
              {currentAgent.titulo} | v{currentAgent.version}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTest(currentAgent)}
            className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            <Play className="h-4 w-4" />
            Testar no Sandbox
          </button>

          <button
            onClick={() => handleSave(currentAgent)}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-300"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </button>
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1 overflow-hidden">
        <AgentEditor
          agent={currentAgent}
          onSave={handleSave}
          onTest={handleTest}
          showPreview
        />
      </main>
    </div>
  )
}
