'use client'

import { useMemo } from 'react'
import { Copy, Check, FileText } from 'lucide-react'
import { useState, useCallback } from 'react'
import type { AgentDefinition } from '@/types/agent-builder'

interface PreviewPanelProps {
  agent: AgentDefinition
  compact?: boolean
}

/**
 * Generates the system prompt from an agent definition
 * This mirrors the logic in config/index.js getPrompt()
 */
function generateSystemPrompt(agent: AgentDefinition): string {
  const lines: string[] = []

  // Title
  lines.push(`# ${agent.titulo}`)
  lines.push('')

  // Function
  if (agent.funcao) {
    lines.push(`## Função`)
    lines.push(agent.funcao)
    lines.push('')
  }

  // Rules
  if (agent.regras.length > 0) {
    lines.push(`## Regras Obrigatórias`)
    agent.regras.forEach((regra, index) => {
      lines.push(`${index + 1}. ${regra}`)
    })
    lines.push('')
  }

  // Súmulas
  if (agent.sumulas.length > 0) {
    lines.push(`## Súmulas Aplicáveis`)
    lines.push(`Súmulas STJ/STF: ${agent.sumulas.join(', ')}`)
    lines.push('')
  }

  // Base Legal
  if (agent.baseLegal.length > 0) {
    lines.push(`## Base Legal`)
    agent.baseLegal.forEach((base) => {
      lines.push(`- ${base}`)
    })
    lines.push('')
  }

  // Parameters
  if (agent.parametros && Object.keys(agent.parametros).length > 0) {
    lines.push(`## Parâmetros de Referência`)
    Object.entries(agent.parametros).forEach(([key, param]) => {
      const formatted = `R$ ${param.min.toLocaleString('pt-BR')} - R$ ${param.max.toLocaleString('pt-BR')}`
      const desc = param.description ? ` (${param.description})` : ''
      lines.push(`- ${key}: ${formatted}${desc}`)
    })
    lines.push('')
  }

  // Standard structure reminder
  lines.push(`## Estrutura da Minuta`)
  lines.push(`A minuta DEVE seguir a estrutura:`)
  lines.push(`I - RELATÓRIO: Resumo dos fatos e pedidos`)
  lines.push(`II - FUNDAMENTAÇÃO: Análise jurídica com citação de legislação e jurisprudência`)
  lines.push(`III - DISPOSITIVO: Decisão final com determinações específicas`)
  lines.push('')

  // Compliance note
  lines.push(`## Conformidade`)
  lines.push(`Este agente opera em conformidade com a Resolução CNJ 615/2025.`)
  lines.push(`Todas as minutas geradas requerem supervisão humana obrigatória.`)

  return lines.join('\n')
}

export function PreviewPanel({ agent, compact = false }: PreviewPanelProps) {
  const [copied, setCopied] = useState(false)

  const prompt = useMemo(() => generateSystemPrompt(agent), [agent])

  const wordCount = useMemo(() => {
    return prompt.split(/\s+/).filter((w) => w.length > 0).length
  }, [prompt])

  const charCount = prompt.length

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [prompt])

  if (compact) {
    return (
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Preview do Prompt
          </span>
          <span className="text-xs text-zinc-500">
            {wordCount} palavras | {charCount} caracteres
          </span>
        </div>
        <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap font-mono text-xs text-zinc-600 dark:text-zinc-400">
          {prompt}
        </pre>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-zinc-400" />
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
            Preview do System Prompt
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500">
            {wordCount} palavras | {charCount} caracteres
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-700 dark:text-zinc-300">
            {prompt}
          </pre>
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-700">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {agent.regras.length}
            </div>
            <div className="text-xs text-zinc-500">Regras</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {agent.sumulas.length}
            </div>
            <div className="text-xs text-zinc-500">Súmulas</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {agent.baseLegal.length}
            </div>
            <div className="text-xs text-zinc-500">Base Legal</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {Object.keys(agent.parametros || {}).length}
            </div>
            <div className="text-xs text-zinc-500">Parâmetros</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export the prompt generator for use in other components
export { generateSystemPrompt }
