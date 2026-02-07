'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Settings, GitCompare } from 'lucide-react'
import { useBuilderStore } from '@/store/builder-store'
import { TestCaseInput } from '@/components/sandbox/TestCaseInput'
import { SandboxChat } from '@/components/sandbox/SandboxChat'
import { QualityMetrics } from '@/components/sandbox/QualityMetrics'
import { TestHistory, TestStats } from '@/components/sandbox/TestHistory'
import type {
  TestCaseInput as TestCaseInputType,
  TestRun,
  SandboxTestResponse,
} from '@/types/agent-builder'

export default function SandboxPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.agentId as string

  const {
    currentAgent,
    drafts,
    loadDraft,
    testRuns,
    addTestRun,
    isTesting,
    setIsTesting,
  } = useBuilderStore()

  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null)
  const [showSettings, setShowSettings] = useState(false)

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

  // Filter test runs for current agent
  const agentTestRuns = testRuns.filter((r) => r.agentId === agentId)

  // Handle test submission
  const handleTest = useCallback(
    async (testCase: TestCaseInputType) => {
      if (!currentAgent) return

      setIsTesting(true)

      try {
        const response = await fetch('/api/sandbox/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: currentAgent,
            testCase,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Test failed')
        }

        const data: SandboxTestResponse = await response.json()

        const newRun: TestRun = {
          id: data.runId,
          agentId: currentAgent.id,
          agentVersion: currentAgent.version,
          timestamp: new Date().toISOString(),
          input: testCase,
          output: data.output,
          metrics: data.metrics,
          qualityScores: data.qualityScores,
        }

        addTestRun(newRun)
        setSelectedRun(newRun)
      } catch (error) {
        console.error('Test error:', error)
        alert(error instanceof Error ? error.message : 'Erro ao executar teste')
      } finally {
        setIsTesting(false)
      }
    },
    [currentAgent, setIsTesting, addTestRun]
  )

  // Handle run selection
  const handleSelectRun = useCallback((run: TestRun) => {
    setSelectedRun(run)
  }, [])

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
              Sandbox: {currentAgent.titulo}
            </h1>
            <p className="text-xs text-zinc-500">
              v{currentAgent.version} | {agentTestRuns.length} testes realizados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/builder/${agentId}/compare`)}
            className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <GitCompare className="h-4 w-4" />
            Comparar
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`rounded-md p-2 transition-colors ${
              showSettings
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Test input */}
        <aside className="w-96 flex-shrink-0 overflow-auto border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <TestCaseInput onSubmit={handleTest} isLoading={isTesting} />
        </aside>

        {/* Center panel - Output */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <SandboxChat
            output={selectedRun?.output || null}
            isLoading={isTesting}
          />
        </main>

        {/* Right panel - Metrics and history */}
        <aside className="w-80 flex-shrink-0 overflow-auto border-l border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {selectedRun ? (
            <div className="space-y-6">
              <QualityMetrics
                scores={selectedRun.qualityScores}
                metrics={selectedRun.metrics}
                wordCount={selectedRun.output.palavras}
              />

              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <TestHistory
                  runs={agentTestRuns}
                  selectedRunId={selectedRun.id}
                  onSelectRun={handleSelectRun}
                />
              </div>
            </div>
          ) : agentTestRuns.length > 0 ? (
            <div className="space-y-6">
              <TestStats runs={agentTestRuns} />

              <TestHistory
                runs={agentTestRuns}
                onSelectRun={handleSelectRun}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm text-zinc-500">
                Execute um teste para ver as métricas de qualidade.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
