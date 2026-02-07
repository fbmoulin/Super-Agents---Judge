'use client'

import { useCallback, useState } from 'react'
import {
  FileText,
  ListChecks,
  Scale,
  BookOpen,
  DollarSign,
  Eye,
  Save,
  Play,
  Download,
  Loader2,
} from 'lucide-react'
import type { AgentDefinition } from '@/types/agent-builder'
import { useBuilderStore } from '@/store/builder-store'
import { BasicInfoSection } from './BasicInfoSection'
import { RulesSection } from './RulesSection'
import { SumulasSelector } from './SumulasSelector'
import { LegalBasisEditor } from './LegalBasisEditor'
import { ParametersEditor } from './ParametersEditor'
import { PreviewPanel } from './PreviewPanel'
import { createExportPayload } from '@/types/agent-builder'

type TabId = 'basic' | 'rules' | 'sumulas' | 'legal' | 'parameters'

interface Tab {
  id: TabId
  label: string
  icon: typeof FileText
}

const tabs: Tab[] = [
  { id: 'basic', label: 'Informações', icon: FileText },
  { id: 'rules', label: 'Regras', icon: ListChecks },
  { id: 'sumulas', label: 'Súmulas', icon: Scale },
  { id: 'legal', label: 'Base Legal', icon: BookOpen },
  { id: 'parameters', label: 'Parâmetros', icon: DollarSign },
]

interface AgentEditorProps {
  agent: AgentDefinition
  onSave?: (agent: AgentDefinition) => void
  onTest?: (agent: AgentDefinition) => void
  onExport?: (agent: AgentDefinition) => void
  disabled?: boolean
  showPreview?: boolean
}

export function AgentEditor({
  agent,
  onSave,
  onTest,
  onExport,
  disabled = false,
  showPreview = true,
}: AgentEditorProps) {
  const { activeEditorTab, setActiveEditorTab, updateCurrentAgent, isSaving, isTesting } =
    useBuilderStore()

  const [showPreviewPanel, setShowPreviewPanel] = useState(false)

  const handleChange = useCallback(
    (updates: Partial<AgentDefinition>) => {
      updateCurrentAgent(updates)
    },
    [updateCurrentAgent]
  )

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(agent)
      return
    }

    // Default export behavior
    const payload = createExportPayload(agent)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${agent.id.toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [agent, onExport])

  const renderTabContent = () => {
    switch (activeEditorTab) {
      case 'basic':
        return <BasicInfoSection agent={agent} onChange={handleChange} disabled={disabled} />
      case 'rules':
        return <RulesSection agent={agent} onChange={handleChange} disabled={disabled} />
      case 'sumulas':
        return <SumulasSelector agent={agent} onChange={handleChange} disabled={disabled} />
      case 'legal':
        return <LegalBasisEditor agent={agent} onChange={handleChange} disabled={disabled} />
      case 'parameters':
        return <ParametersEditor agent={agent} onChange={handleChange} disabled={disabled} />
      default:
        return null
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header with actions */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <div>
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{agent.titulo}</h2>
          <p className="text-xs text-zinc-500">
            v{agent.version} | {agent.status}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {showPreview && (
            <button
              onClick={() => setShowPreviewPanel(!showPreviewPanel)}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
                showPreviewPanel
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          )}

          <button
            onClick={handleExport}
            disabled={disabled}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>

          {onTest && (
            <button
              onClick={() => onTest(agent)}
              disabled={disabled || isTesting}
              className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Testar
            </button>
          )}

          {onSave && (
            <button
              onClick={() => onSave(agent)}
              disabled={disabled || isSaving}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor panel */}
        <div className={`flex flex-1 flex-col ${showPreviewPanel ? 'w-1/2' : 'w-full'}`}>
          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-700">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeEditorTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveEditorTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:hover:border-zinc-600 dark:hover:text-zinc-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto p-4">{renderTabContent()}</div>
        </div>

        {/* Preview panel */}
        {showPreviewPanel && (
          <div className="w-1/2 border-l border-zinc-200 dark:border-zinc-700">
            <PreviewPanel agent={agent} />
          </div>
        )}
      </div>
    </div>
  )
}

// Re-export sub-components
export { BasicInfoSection } from './BasicInfoSection'
export { RulesSection } from './RulesSection'
export { SumulasSelector } from './SumulasSelector'
export { LegalBasisEditor } from './LegalBasisEditor'
export { ParametersEditor } from './ParametersEditor'
export { PreviewPanel, generateSystemPrompt } from './PreviewPanel'
