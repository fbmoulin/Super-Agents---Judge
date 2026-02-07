'use client'

import { useState, useCallback } from 'react'
import { Sparkles, Loader2, AlertCircle, Lightbulb } from 'lucide-react'
import { useBuilderStore } from '@/store/builder-store'
import type { GenerateAgentResponse } from '@/types/agent-builder'

interface AgentGenerationFormProps {
  onGenerated?: () => void
}

const themeSuggestions = [
  { theme: 'Direito Ambiental', description: 'Ações civis públicas, danos ambientais' },
  { theme: 'Direito do Trabalho', description: 'Reclamações trabalhistas, verbas rescisórias' },
  { theme: 'Direito Tributário', description: 'Execuções fiscais, repetição de indébito' },
  { theme: 'Direito Previdenciário', description: 'Aposentadoria, benefícios do INSS' },
  { theme: 'Direito Imobiliário', description: 'Compra e venda, financiamento, usucapião' },
  { theme: 'Direito Digital', description: 'Crimes cibernéticos, proteção de dados' },
]

export function AgentGenerationForm({ onGenerated }: AgentGenerationFormProps) {
  const [theme, setTheme] = useState('')
  const [context, setContext] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { isGenerating, setIsGenerating, setCurrentAgent, saveDraft } = useBuilderStore()

  const handleGenerate = useCallback(async () => {
    if (!theme.trim()) {
      setError('Por favor, informe um tema para o agente.')
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const response = await fetch('/api/builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: theme.trim(), context: context.trim() || undefined }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao gerar agente')
      }

      const data: GenerateAgentResponse = await response.json()

      // Create new agent with generated data
      const now = new Date().toISOString()
      const agentId = theme
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')

      const newAgent = {
        id: agentId,
        version: '1.0.0',
        status: 'draft' as const,
        createdAt: now,
        updatedAt: now,
        titulo: data.agent.titulo || `AGENTE JUDICIAL: ${theme.toUpperCase()}`,
        funcao: data.agent.funcao || '',
        regras: data.agent.regras || [],
        sumulas: data.agent.sumulas || [],
        baseLegal: data.agent.baseLegal || [],
        parametros: data.agent.parametros || {},
        tags: data.agent.tags || [],
        description: data.agent.description || '',
      }

      setCurrentAgent(newAgent)
      saveDraft(newAgent)

      // Clear form
      setTheme('')
      setContext('')

      onGenerated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao gerar agente')
    } finally {
      setIsGenerating(false)
    }
  }, [theme, context, setIsGenerating, setCurrentAgent, saveDraft, onGenerated])

  const handleSuggestionClick = useCallback((suggestion: (typeof themeSuggestions)[0]) => {
    setTheme(suggestion.theme)
    setContext(suggestion.description)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Criar Novo Agente com IA
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Informe o tema e deixe a IA propor a estrutura inicial do agente.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Theme input */}
        <div className="space-y-2">
          <label
            htmlFor="theme"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Tema do Agente *
          </label>
          <input
            id="theme"
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            disabled={isGenerating}
            placeholder="Ex: Direito Ambiental, Direito do Trabalho..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
          />
        </div>

        {/* Context input */}
        <div className="space-y-2">
          <label
            htmlFor="context"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Contexto Adicional (opcional)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={isGenerating}
            rows={3}
            placeholder="Descreva o contexto específico, tipos de ações, particularidades..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !theme.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-medium text-white transition-all hover:from-blue-700 hover:to-purple-700 disabled:from-zinc-400 disabled:to-zinc-500"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando agente...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Gerar Agente com IA
            </>
          )}
        </button>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Lightbulb className="h-4 w-4" />
          Sugestões de temas:
        </div>
        <div className="grid grid-cols-2 gap-2">
          {themeSuggestions.map((suggestion) => (
            <button
              key={suggestion.theme}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isGenerating}
              className="rounded-md border border-zinc-200 bg-white p-3 text-left text-sm transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
            >
              <div className="font-medium text-zinc-900 dark:text-zinc-100">{suggestion.theme}</div>
              <div className="mt-0.5 text-xs text-zinc-500">{suggestion.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
        <p>
          A IA irá analisar o tema e propor:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Título e função do agente</li>
          <li>Regras obrigatórias para a área</li>
          <li>Súmulas relevantes do STJ/STF</li>
          <li>Base legal aplicável</li>
          <li>Parâmetros de valores (quando aplicável)</li>
        </ul>
        <p className="mt-2">
          Você poderá revisar e ajustar tudo antes de aprovar.
        </p>
      </div>
    </div>
  )
}
