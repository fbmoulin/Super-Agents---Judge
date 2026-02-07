'use client'

import { useCallback, useState } from 'react'
import { Plus, Trash2, DollarSign, AlertCircle } from 'lucide-react'
import type { AgentDefinition, ParameterRange } from '@/types/agent-builder'

interface ParametersEditorProps {
  agent: AgentDefinition
  onChange: (updates: Partial<AgentDefinition>) => void
  disabled?: boolean
}

// Common parameter presets
const parameterPresets: Record<string, { description: string; defaultRange: ParameterRange }> = {
  danosmoraisLeve: {
    description: 'Danos morais - gravidade leve',
    defaultRange: { min: 3000, max: 10000, description: 'Casos de gravidade leve' },
  },
  danosmoraisMedio: {
    description: 'Danos morais - gravidade média',
    defaultRange: { min: 10000, max: 30000, description: 'Casos de gravidade média' },
  },
  danosmoraisGrave: {
    description: 'Danos morais - gravidade alta',
    defaultRange: { min: 30000, max: 100000, description: 'Casos de gravidade alta' },
  },
  negativacaoIndevida: {
    description: 'Danos morais - negativação indevida',
    defaultRange: { min: 5000, max: 15000, description: 'Inscrição indevida em cadastros' },
  },
  repeticaoIndebito: {
    description: 'Repetição de indébito (em dobro)',
    defaultRange: { min: 0, max: 0, description: 'Dobro do valor cobrado indevidamente' },
  },
  alimentos: {
    description: 'Pensão alimentícia (% do salário)',
    defaultRange: { min: 15, max: 33, description: 'Percentual sobre rendimentos' },
  },
  honorarios: {
    description: 'Honorários advocatícios (%)',
    defaultRange: { min: 10, max: 20, description: 'Percentual sobre o valor da causa' },
  },
  multaDiaria: {
    description: 'Multa diária (astreintes)',
    defaultRange: { min: 100, max: 1000, description: 'Valor por dia de descumprimento' },
  },
}

export function ParametersEditor({ agent, onChange, disabled = false }: ParametersEditorProps) {
  const [newParamKey, setNewParamKey] = useState('')
  const [newParamMin, setNewParamMin] = useState('')
  const [newParamMax, setNewParamMax] = useState('')
  const [newParamDesc, setNewParamDesc] = useState('')
  const [showPresets, setShowPresets] = useState(false)

  const parameters = agent.parametros || {}

  const handleAddParameter = useCallback(() => {
    if (!newParamKey.trim()) return

    const key = newParamKey
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    const newParam: ParameterRange = {
      min: parseFloat(newParamMin) || 0,
      max: parseFloat(newParamMax) || 0,
      description: newParamDesc.trim() || undefined,
    }

    onChange({
      parametros: {
        ...parameters,
        [key]: newParam,
      },
    })

    setNewParamKey('')
    setNewParamMin('')
    setNewParamMax('')
    setNewParamDesc('')
  }, [newParamKey, newParamMin, newParamMax, newParamDesc, parameters, onChange])

  const handleRemoveParameter = useCallback(
    (key: string) => {
      const newParams = { ...parameters }
      delete newParams[key]
      onChange({ parametros: newParams })
    },
    [parameters, onChange]
  )

  const handleUpdateParameter = useCallback(
    (key: string, field: 'min' | 'max' | 'description', value: string) => {
      const param = parameters[key]
      if (!param) return

      const updatedParam: ParameterRange = {
        ...param,
        [field]: field === 'description' ? value : parseFloat(value) || 0,
      }

      onChange({
        parametros: {
          ...parameters,
          [key]: updatedParam,
        },
      })
    },
    [parameters, onChange]
  )

  const handleAddPreset = useCallback(
    (key: string, preset: (typeof parameterPresets)[string]) => {
      if (parameters[key]) return

      onChange({
        parametros: {
          ...parameters,
          [key]: preset.defaultRange,
        },
      })
    },
    [parameters, onChange]
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Parâmetros de Valores
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Defina faixas de valores para indenizações, multas e outros parâmetros numéricos.
        </p>
      </div>

      {/* Current parameters */}
      <div className="space-y-3">
        {Object.keys(parameters).length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800/50">
            <DollarSign className="h-4 w-4" />
            Nenhum parâmetro definido. Adicione faixas de valores para orientar o agente.
          </div>
        ) : (
          Object.entries(parameters).map(([key, param]) => (
            <div
              key={key}
              className="group rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{key}</span>
                  {param.description && (
                    <p className="mt-0.5 text-xs text-zinc-500">{param.description}</p>
                  )}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveParameter(key)}
                    className="rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Mínimo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      R$
                    </span>
                    <input
                      type="number"
                      value={param.min}
                      onChange={(e) => handleUpdateParameter(key, 'min', e.target.value)}
                      disabled={disabled}
                      className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:disabled:bg-zinc-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">Máximo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      R$
                    </span>
                    <input
                      type="number"
                      value={param.max}
                      onChange={(e) => handleUpdateParameter(key, 'max', e.target.value)}
                      disabled={disabled}
                      className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:disabled:bg-zinc-700"
                    />
                  </div>
                </div>
              </div>

              {/* Range preview */}
              <div className="mt-3 flex items-center justify-between rounded bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-800">
                <span className="text-zinc-500">Faixa:</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {formatCurrency(param.min)} - {formatCurrency(param.max)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add new parameter */}
      <div className="space-y-4 rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Adicionar Novo Parâmetro
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1 block text-xs text-zinc-500">Nome do Parâmetro</label>
            <input
              type="text"
              value={newParamKey}
              onChange={(e) => setNewParamKey(e.target.value)}
              disabled={disabled}
              placeholder="Ex: danosmorais, multa, alimentos"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">Valor Mínimo (R$)</label>
            <input
              type="number"
              value={newParamMin}
              onChange={(e) => setNewParamMin(e.target.value)}
              disabled={disabled}
              placeholder="0"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">Valor Máximo (R$)</label>
            <input
              type="number"
              value={newParamMax}
              onChange={(e) => setNewParamMax(e.target.value)}
              disabled={disabled}
              placeholder="0"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-1 block text-xs text-zinc-500">Descrição (opcional)</label>
            <input
              type="text"
              value={newParamDesc}
              onChange={(e) => setNewParamDesc(e.target.value)}
              disabled={disabled}
              placeholder="Descrição do parâmetro..."
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddParameter}
          disabled={disabled || !newParamKey.trim()}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700"
        >
          <Plus className="h-4 w-4" />
          Adicionar Parâmetro
        </button>
      </div>

      {/* Presets */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {showPresets ? 'Ocultar predefinidos' : 'Mostrar parâmetros predefinidos'}
        </button>

        {showPresets && (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(parameterPresets).map(([key, preset]) => {
              const isAdded = !!parameters[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleAddPreset(key, preset)}
                  disabled={disabled || isAdded}
                  className={`rounded-md border p-3 text-left text-sm transition-colors ${
                    isAdded
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {isAdded ? '✓ ' : '+ '}
                    {key}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{preset.description}</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    {formatCurrency(preset.defaultRange.min)} - {formatCurrency(preset.defaultRange.max)}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <p>
          Os parâmetros servem como referência para o agente. Valores finais devem sempre
          considerar as particularidades de cada caso e a jurisprudência aplicável.
        </p>
      </div>
    </div>
  )
}
