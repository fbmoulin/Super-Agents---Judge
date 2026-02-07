'use client'

import { useState, useCallback } from 'react'
import { Download, FileJson, FileText, Clipboard, Check, Loader2 } from 'lucide-react'
import type { AgentDefinition, TestRun, ExportedAgent } from '@/types/agent-builder'
import { createExportPayload } from '@/types/agent-builder'

interface ResultExportProps {
  agent: AgentDefinition
  testRuns?: TestRun[]
  onCommit?: (agent: AgentDefinition) => void
  canCommit?: boolean
  isCommitting?: boolean
}

type ExportFormat = 'json' | 'markdown' | 'clipboard'

export function ResultExport({
  agent,
  testRuns = [],
  onCommit,
  canCommit = false,
  isCommitting = false,
}: ResultExportProps) {
  const [copied, setCopied] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')

  const generateMarkdown = useCallback(() => {
    const lines: string[] = []

    lines.push(`# ${agent.titulo}`)
    lines.push('')
    lines.push(`**ID:** ${agent.id}`)
    lines.push(`**Versão:** ${agent.version}`)
    lines.push(`**Status:** ${agent.status}`)
    lines.push('')

    if (agent.funcao) {
      lines.push(`## Função`)
      lines.push(agent.funcao)
      lines.push('')
    }

    if (agent.regras.length > 0) {
      lines.push(`## Regras`)
      agent.regras.forEach((regra, i) => {
        lines.push(`${i + 1}. ${regra}`)
      })
      lines.push('')
    }

    if (agent.sumulas.length > 0) {
      lines.push(`## Súmulas`)
      lines.push(agent.sumulas.join(', '))
      lines.push('')
    }

    if (agent.baseLegal.length > 0) {
      lines.push(`## Base Legal`)
      agent.baseLegal.forEach((base) => {
        lines.push(`- ${base}`)
      })
      lines.push('')
    }

    if (agent.parametros && Object.keys(agent.parametros).length > 0) {
      lines.push(`## Parâmetros`)
      Object.entries(agent.parametros).forEach(([key, param]) => {
        lines.push(
          `- **${key}:** R$ ${param.min.toLocaleString()} - R$ ${param.max.toLocaleString()}`
        )
      })
      lines.push('')
    }

    if (testRuns.length > 0) {
      lines.push(`## Histórico de Testes`)
      lines.push('')
      lines.push(`| Data | Score | Estrutura | Citações | Raciocínio |`)
      lines.push(`|------|-------|-----------|----------|------------|`)

      testRuns.slice(0, 10).forEach((run) => {
        const date = new Date(run.timestamp).toLocaleDateString('pt-BR')
        lines.push(
          `| ${date} | ${run.qualityScores.overall} | ${run.qualityScores.structure}/45 | ${run.qualityScores.citation}/30 | ${run.qualityScores.reasoning}/25 |`
        )
      })
      lines.push('')
    }

    lines.push('---')
    lines.push(`*Exportado em ${new Date().toLocaleString('pt-BR')}*`)

    return lines.join('\n')
  }, [agent, testRuns])

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (format === 'clipboard') {
        const payload = createExportPayload(agent, testRuns)
        await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        return
      }

      let content: string
      let filename: string
      let mimeType: string

      if (format === 'json') {
        const payload = createExportPayload(agent, testRuns)
        content = JSON.stringify(payload, null, 2)
        filename = `${agent.id.toLowerCase()}.json`
        mimeType = 'application/json'
      } else {
        content = generateMarkdown()
        filename = `${agent.id.toLowerCase()}.md`
        mimeType = 'text/markdown'
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    [agent, testRuns, generateMarkdown]
  )

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Exportar Agente</h4>

      {/* Export format buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleExport('json')}
          className="flex flex-col items-center gap-1 rounded-md border border-zinc-200 bg-white p-3 text-sm transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
        >
          <FileJson className="h-5 w-5 text-blue-500" />
          <span className="text-zinc-700 dark:text-zinc-300">JSON</span>
        </button>

        <button
          onClick={() => handleExport('markdown')}
          className="flex flex-col items-center gap-1 rounded-md border border-zinc-200 bg-white p-3 text-sm transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
        >
          <FileText className="h-5 w-5 text-green-500" />
          <span className="text-zinc-700 dark:text-zinc-300">Markdown</span>
        </button>

        <button
          onClick={() => handleExport('clipboard')}
          className="flex flex-col items-center gap-1 rounded-md border border-zinc-200 bg-white p-3 text-sm transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
        >
          {copied ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Clipboard className="h-5 w-5 text-purple-500" />
          )}
          <span className="text-zinc-700 dark:text-zinc-300">
            {copied ? 'Copiado!' : 'Clipboard'}
          </span>
        </button>
      </div>

      {/* Commit to production */}
      {onCommit && (
        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <button
            onClick={() => onCommit(agent)}
            disabled={!canCommit || isCommitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700"
          >
            {isCommitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Salvar em Produção
              </>
            )}
          </button>

          {!canCommit && (
            <p className="mt-2 text-center text-xs text-zinc-500">
              Score mínimo de 75 necessário para aprovar em produção.
            </p>
          )}
        </div>
      )}

      {/* Export info */}
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p>
          <strong>JSON:</strong> Arquivo completo para importação
        </p>
        <p className="mt-1">
          <strong>Markdown:</strong> Documentação legível
        </p>
        <p className="mt-1">
          <strong>Clipboard:</strong> Copia JSON para área de transferência
        </p>
      </div>
    </div>
  )
}
