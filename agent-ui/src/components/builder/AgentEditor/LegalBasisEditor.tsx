'use client'

import { useCallback, useState } from 'react'
import { Plus, Trash2, BookOpen, Scale } from 'lucide-react'
import type { AgentDefinition } from '@/types/agent-builder'

interface LegalBasisEditorProps {
  agent: AgentDefinition
  onChange: (updates: Partial<AgentDefinition>) => void
  disabled?: boolean
}

// Common legal references for quick add
const commonLegalBases = [
  { category: 'Códigos', items: ['Código Civil', 'Código de Processo Civil', 'Código de Defesa do Consumidor', 'Código Penal', 'Código de Processo Penal'] },
  { category: 'Constituição', items: ['Art. 5º CF', 'Art. 37 CF', 'Art. 170 CF', 'Art. 225 CF'] },
  { category: 'Leis Especiais', items: ['Lei 8.078/90 (CDC)', 'Lei 9.605/98 (Crimes Ambientais)', 'Lei 10.406/02 (CC)', 'Lei 13.105/15 (CPC)'] },
]

export function LegalBasisEditor({ agent, onChange, disabled = false }: LegalBasisEditorProps) {
  const [newBasis, setNewBasis] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleAddBasis = useCallback(() => {
    if (!newBasis.trim()) return
    if (agent.baseLegal.includes(newBasis.trim())) return
    onChange({ baseLegal: [...agent.baseLegal, newBasis.trim()] })
    setNewBasis('')
  }, [newBasis, agent.baseLegal, onChange])

  const handleRemoveBasis = useCallback(
    (index: number) => {
      onChange({ baseLegal: agent.baseLegal.filter((_, i) => i !== index) })
    },
    [agent.baseLegal, onChange]
  )

  const handleQuickAdd = useCallback(
    (basis: string) => {
      if (agent.baseLegal.includes(basis)) return
      onChange({ baseLegal: [...agent.baseLegal, basis] })
    },
    [agent.baseLegal, onChange]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Base Legal
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Defina as leis, artigos e dispositivos legais que o agente deve referenciar.
        </p>
      </div>

      {/* Current legal bases */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Referências Legais ({agent.baseLegal.length})
        </label>

        {agent.baseLegal.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800/50">
            <Scale className="h-4 w-4" />
            Nenhuma base legal definida. Adicione leis e artigos relevantes.
          </div>
        ) : (
          <div className="space-y-2">
            {agent.baseLegal.map((basis, index) => (
              <div
                key={index}
                className="group flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <BookOpen className="h-4 w-4 flex-shrink-0 text-zinc-400" />
                <span className="flex-1 text-sm text-zinc-900 dark:text-zinc-100">{basis}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBasis(index)}
                    className="rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new basis */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Adicionar Referência Legal
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newBasis}
            onChange={(e) => setNewBasis(e.target.value)}
            disabled={disabled}
            placeholder="Ex: Art. 927 do Código Civil"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddBasis()
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddBasis}
            disabled={disabled || !newBasis.trim()}
            className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Quick add suggestions */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {showSuggestions ? 'Ocultar sugestões' : 'Mostrar sugestões comuns'}
        </button>

        {showSuggestions && (
          <div className="space-y-4 rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            {commonLegalBases.map((category) => (
              <div key={category.category}>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {category.category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((item) => {
                    const isAdded = agent.baseLegal.includes(item)
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleQuickAdd(item)}
                        disabled={disabled || isAdded}
                        className={`rounded-full px-3 py-1 text-xs transition-colors ${
                          isAdded
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-white text-zinc-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                        } border border-zinc-200 dark:border-zinc-700`}
                      >
                        {isAdded ? '✓ ' : '+ '}
                        {item}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Format tips */}
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Dicas de Formatação
        </h4>
        <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          <li>• Leis: "Lei 8.078/90" ou "Lei nº 8.078/1990"</li>
          <li>• Artigos: "Art. 927 do CC" ou "Art. 5º, II da CF"</li>
          <li>• Parágrafos: "Art. 20, §1º do CPC"</li>
          <li>• Incisos: "Art. 37, III da CF"</li>
          <li>• Decretos: "Decreto 3.048/99"</li>
        </ul>
      </div>
    </div>
  )
}
