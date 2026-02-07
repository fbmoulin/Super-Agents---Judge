'use client'

import { useCallback } from 'react'
import type { AgentDefinition } from '@/types/agent-builder'

interface BasicInfoSectionProps {
  agent: AgentDefinition
  onChange: (updates: Partial<AgentDefinition>) => void
  disabled?: boolean
}

export function BasicInfoSection({ agent, onChange, disabled = false }: BasicInfoSectionProps) {
  const handleChange = useCallback(
    (field: keyof AgentDefinition, value: string | string[]) => {
      onChange({ [field]: value })
    },
    [onChange]
  )

  const handleTagsChange = useCallback(
    (value: string) => {
      const tags = value
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
      onChange({ tags })
    },
    [onChange]
  )

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <label
          htmlFor="titulo"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Título do Agente
        </label>
        <input
          id="titulo"
          type="text"
          value={agent.titulo}
          onChange={(e) => handleChange('titulo', e.target.value)}
          disabled={disabled}
          placeholder="Ex: AGENTE JUDICIAL: DIREITO AMBIENTAL"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
        />
        <p className="text-xs text-zinc-500">
          Formato recomendado: AGENTE JUDICIAL: [ÁREA DO DIREITO]
        </p>
      </div>

      {/* ID */}
      <div className="space-y-2">
        <label htmlFor="id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Identificador (ID)
        </label>
        <input
          id="id"
          type="text"
          value={agent.id}
          disabled
          className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-mono text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
        />
        <p className="text-xs text-zinc-500">Gerado automaticamente, não pode ser alterado</p>
      </div>

      {/* Function */}
      <div className="space-y-2">
        <label
          htmlFor="funcao"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Função / Objetivo
        </label>
        <textarea
          id="funcao"
          value={agent.funcao}
          onChange={(e) => handleChange('funcao', e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Descreva o objetivo principal deste agente..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
        />
        <p className="text-xs text-zinc-500">
          Ex: Gerar minutas de decisões/sentenças em ações ambientais
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Descrição Adicional (opcional)
        </label>
        <textarea
          id="description"
          value={agent.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          disabled={disabled}
          rows={2}
          placeholder="Informações adicionais sobre o agente..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Tags
        </label>
        <input
          id="tags"
          type="text"
          value={agent.tags?.join(', ') || ''}
          onChange={(e) => handleTagsChange(e.target.value)}
          disabled={disabled}
          placeholder="ambiental, civil-publica, meio-ambiente"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
        />
        <p className="text-xs text-zinc-500">Separe as tags com vírgulas</p>
      </div>

      {/* Version and Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="version"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Versão
          </label>
          <input
            id="version"
            type="text"
            value={agent.version}
            onChange={(e) => handleChange('version', e.target.value)}
            disabled={disabled}
            placeholder="1.0.0"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Status
          </label>
          <select
            id="status"
            value={agent.status}
            onChange={(e) => handleChange('status', e.target.value)}
            disabled={disabled || agent.status === 'approved'}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:disabled:bg-zinc-800"
          >
            <option value="draft">Rascunho</option>
            <option value="testing">Em teste</option>
            <option value="approved">Aprovado</option>
          </select>
        </div>
      </div>

      {/* Author */}
      <div className="space-y-2">
        <label
          htmlFor="author"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Autor (opcional)
        </label>
        <input
          id="author"
          type="text"
          value={agent.author || ''}
          onChange={(e) => handleChange('author', e.target.value)}
          disabled={disabled}
          placeholder="Nome do autor"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
        />
      </div>
    </div>
  )
}
