'use client'

import { useCallback, useState } from 'react'
import { GripVertical, Plus, Trash2, AlertCircle } from 'lucide-react'
import type { AgentDefinition } from '@/types/agent-builder'

interface RulesSectionProps {
  agent: AgentDefinition
  onChange: (updates: Partial<AgentDefinition>) => void
  disabled?: boolean
}

export function RulesSection({ agent, onChange, disabled = false }: RulesSectionProps) {
  const [newRule, setNewRule] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleAddRule = useCallback(() => {
    if (!newRule.trim()) return
    onChange({ regras: [...agent.regras, newRule.trim()] })
    setNewRule('')
  }, [newRule, agent.regras, onChange])

  const handleRemoveRule = useCallback(
    (index: number) => {
      onChange({ regras: agent.regras.filter((_, i) => i !== index) })
    },
    [agent.regras, onChange]
  )

  const handleUpdateRule = useCallback(
    (index: number, value: string) => {
      const newRules = [...agent.regras]
      newRules[index] = value
      onChange({ regras: newRules })
    },
    [agent.regras, onChange]
  )

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }, [])

  const handleDrop = useCallback(
    (dropIndex: number) => {
      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null)
        setDragOverIndex(null)
        return
      }

      const newRules = [...agent.regras]
      const [removed] = newRules.splice(draggedIndex, 1)
      newRules.splice(dropIndex, 0, removed)
      onChange({ regras: newRules })

      setDraggedIndex(null)
      setDragOverIndex(null)
    },
    [draggedIndex, agent.regras, onChange]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Regras do Agente
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Defina as regras que o agente deve seguir. Arraste para reordenar.
        </p>
      </div>

      {/* Rules list */}
      <div className="space-y-2">
        {agent.regras.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800/50">
            <AlertCircle className="h-4 w-4" />
            Nenhuma regra definida. Adicione pelo menos uma regra.
          </div>
        ) : (
          agent.regras.map((rule, index) => (
            <div
              key={index}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`group flex items-start gap-2 rounded-md border p-2 transition-all ${
                draggedIndex === index
                  ? 'border-blue-500 bg-blue-50 opacity-50 dark:bg-blue-950/20'
                  : dragOverIndex === index
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/10'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
              }`}
            >
              {/* Drag handle */}
              <button
                type="button"
                className="mt-2 cursor-grab text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-300"
                disabled={disabled}
              >
                <GripVertical className="h-4 w-4" />
              </button>

              {/* Rule number */}
              <span className="mt-2 min-w-[24px] text-xs font-medium text-zinc-400">
                {index + 1}.
              </span>

              {/* Rule input */}
              <textarea
                value={rule}
                onChange={(e) => handleUpdateRule(index, e.target.value)}
                disabled={disabled}
                rows={2}
                className="flex-1 resize-none border-0 bg-transparent p-0 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 dark:text-zinc-100"
                placeholder="Digite a regra..."
              />

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemoveRule(index)}
                disabled={disabled}
                className="mt-1 rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:pointer-events-none dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add new rule */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Adicionar Nova Regra
        </label>
        <div className="flex gap-2">
          <textarea
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            disabled={disabled}
            rows={2}
            placeholder="Digite uma nova regra..."
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault()
                handleAddRule()
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddRule}
            disabled={disabled || !newRule.trim()}
            className="flex h-fit items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
        <p className="text-xs text-zinc-500">Pressione Ctrl+Enter para adicionar rapidamente</p>
      </div>

      {/* Suggested rules */}
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Regras Recomendadas
        </h4>
        <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          <li>• Estrutura obrigatória: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO</li>
          <li>• Citar súmulas e base legal relevantes</li>
          <li>• Fundamentação clara e objetiva</li>
          <li>• Dispositivo com decisão expressa (procedente/improcedente)</li>
          <li>• Definir honorários advocatícios</li>
        </ul>
      </div>
    </div>
  )
}
