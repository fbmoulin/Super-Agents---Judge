'use client'

import { useCallback, useState, useMemo } from 'react'
import { Search, X, Check, Info } from 'lucide-react'
import type { AgentDefinition } from '@/types/agent-builder'

interface Sumula {
  numero: string
  texto: string
  domains: string[]
  keywords?: string[]
  tribunal?: 'STJ' | 'STF'
}

interface SumulasSelectorProps {
  agent: AgentDefinition
  onChange: (updates: Partial<AgentDefinition>) => void
  disabled?: boolean
  availableSumulas?: Record<string, Record<string, Sumula>>
}

// Default súmulas (can be overridden via props)
const defaultSumulas: Record<string, Record<string, Sumula>> = {
  STJ: {
    '297': {
      numero: '297',
      texto: 'O Código de Defesa do Consumidor é aplicável às instituições financeiras.',
      domains: ['bancario', 'consumidor'],
      tribunal: 'STJ',
    },
    '381': {
      numero: '381',
      texto:
        'Nos contratos bancários, é vedado ao julgador conhecer, de ofício, da abusividade das cláusulas.',
      domains: ['bancario'],
      tribunal: 'STJ',
    },
    '382': {
      numero: '382',
      texto:
        'A estipulação de juros remuneratórios superiores a 12% ao ano, por si só, não indica abusividade.',
      domains: ['bancario'],
      tribunal: 'STJ',
    },
    '302': {
      numero: '302',
      texto:
        'É abusiva a cláusula contratual de plano de saúde que limita no tempo a internação hospitalar do segurado.',
      domains: ['saude'],
      tribunal: 'STJ',
    },
    '469': {
      numero: '469',
      texto:
        'Aplica-se o Código de Defesa do Consumidor aos contratos de plano de saúde.',
      domains: ['saude', 'consumidor'],
      tribunal: 'STJ',
    },
    '629': {
      numero: '629',
      texto:
        'Quanto ao dano ambiental, é admitida a condenação do réu à obrigação de fazer ou não fazer cumulada com a de indenizar.',
      domains: ['ambiental'],
      tribunal: 'STJ',
    },
    '623': {
      numero: '623',
      texto:
        'As obrigações ambientais possuem natureza propter rem, sendo possível responsabilizar o atual proprietário por danos causados por antigos possuidores.',
      domains: ['ambiental'],
      tribunal: 'STJ',
    },
  },
  STF: {
    '736': {
      numero: '736',
      texto:
        'Compete à Justiça do Trabalho julgar as ações que tenham como causa de pedir o descumprimento de normas trabalhistas relativas à segurança, higiene e saúde dos trabalhadores.',
      domains: ['trabalhista'],
      tribunal: 'STF',
    },
  },
}

export function SumulasSelector({
  agent,
  onChange,
  disabled = false,
  availableSumulas = defaultSumulas,
}: SumulasSelectorProps) {
  const [search, setSearch] = useState('')
  const [selectedTribunal, setSelectedTribunal] = useState<'all' | 'STJ' | 'STF'>('all')
  const [expandedSumula, setExpandedSumula] = useState<string | null>(null)

  // Flatten súmulas for easier searching
  const allSumulas = useMemo(() => {
    const result: Sumula[] = []
    Object.entries(availableSumulas).forEach(([tribunal, sumulas]) => {
      Object.values(sumulas).forEach((sumula) => {
        result.push({ ...sumula, tribunal: tribunal as 'STJ' | 'STF' })
      })
    })
    return result
  }, [availableSumulas])

  // Filter súmulas based on search and tribunal
  const filteredSumulas = useMemo(() => {
    return allSumulas.filter((sumula) => {
      // Tribunal filter
      if (selectedTribunal !== 'all' && sumula.tribunal !== selectedTribunal) {
        return false
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        return (
          sumula.numero.includes(search) ||
          sumula.texto.toLowerCase().includes(searchLower) ||
          sumula.domains.some((d) => d.includes(searchLower)) ||
          sumula.keywords?.some((k) => k.includes(searchLower))
        )
      }

      return true
    })
  }, [allSumulas, search, selectedTribunal])

  const handleToggleSumula = useCallback(
    (numero: string) => {
      const isSelected = agent.sumulas.includes(numero)
      if (isSelected) {
        onChange({ sumulas: agent.sumulas.filter((s) => s !== numero) })
      } else {
        onChange({ sumulas: [...agent.sumulas, numero] })
      }
    },
    [agent.sumulas, onChange]
  )

  const handleRemoveSumula = useCallback(
    (numero: string) => {
      onChange({ sumulas: agent.sumulas.filter((s) => s !== numero) })
    },
    [agent.sumulas, onChange]
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Súmulas Aplicáveis
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Selecione as súmulas do STJ/STF que o agente deve considerar.
        </p>
      </div>

      {/* Selected súmulas */}
      {agent.sumulas.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Súmulas Selecionadas ({agent.sumulas.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {agent.sumulas.map((numero) => {
              const sumula = allSumulas.find((s) => s.numero === numero)
              return (
                <span
                  key={numero}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  Súmula {numero}
                  {sumula?.tribunal && (
                    <span className="text-xs opacity-70">({sumula.tribunal})</span>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSumula(numero)}
                      className="ml-1 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Search and filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={disabled}
            placeholder="Buscar por número, texto ou domínio..."
            className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
          />
        </div>

        <select
          value={selectedTribunal}
          onChange={(e) => setSelectedTribunal(e.target.value as 'all' | 'STJ' | 'STF')}
          disabled={disabled}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:disabled:bg-zinc-800"
        >
          <option value="all">Todos</option>
          <option value="STJ">STJ</option>
          <option value="STF">STF</option>
        </select>
      </div>

      {/* Súmulas list */}
      <div className="max-h-[400px] space-y-2 overflow-y-auto">
        {filteredSumulas.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800/50">
            Nenhuma súmula encontrada para a busca.
          </div>
        ) : (
          filteredSumulas.map((sumula) => {
            const isSelected = agent.sumulas.includes(sumula.numero)
            const isExpanded = expandedSumula === sumula.numero

            return (
              <div
                key={`${sumula.tribunal}-${sumula.numero}`}
                className={`rounded-md border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
                }`}
              >
                <div
                  className="flex cursor-pointer items-start gap-3 p-3"
                  onClick={() => !disabled && handleToggleSumula(sumula.numero)}
                >
                  {/* Checkbox */}
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-zinc-300 dark:border-zinc-600'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        Súmula {sumula.numero}
                      </span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {sumula.tribunal}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-sm text-zinc-600 dark:text-zinc-400 ${
                        isExpanded ? '' : 'line-clamp-2'
                      }`}
                    >
                      {sumula.texto}
                    </p>
                    {sumula.domains && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {sumula.domains.map((domain) => (
                          <span
                            key={domain}
                            className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                          >
                            {domain}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expand button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedSumula(isExpanded ? null : sumula.numero)
                    }}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          {filteredSumulas.length} súmulas disponíveis
        </span>
        <span>
          {agent.sumulas.length} selecionadas
        </span>
      </div>
    </div>
  )
}
