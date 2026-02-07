'use client'

import { useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, FileText, Trash2 } from 'lucide-react'
import type { TestRun } from '@/types/agent-builder'
import { QualityMetricsCompact } from './QualityMetrics'

interface TestHistoryProps {
  runs: TestRun[]
  selectedRunId?: string
  onSelectRun: (run: TestRun) => void
  onDeleteRun?: (runId: string) => void
}

export function TestHistory({
  runs,
  selectedRunId,
  onSelectRun,
  onDeleteRun,
}: TestHistoryProps) {
  const sortedRuns = useMemo(() => {
    return [...runs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [runs])

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-3 rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
          <Clock className="h-6 w-6 text-zinc-400" />
        </div>
        <p className="text-sm text-zinc-500">
          Nenhum teste executado ainda.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Histórico de Testes
        </h4>
        <span className="text-xs text-zinc-500">{runs.length} execuções</span>
      </div>

      <div className="space-y-2">
        {sortedRuns.map((run) => (
          <TestHistoryItem
            key={run.id}
            run={run}
            isSelected={run.id === selectedRunId}
            onSelect={() => onSelectRun(run)}
            onDelete={onDeleteRun ? () => onDeleteRun(run.id) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

interface TestHistoryItemProps {
  run: TestRun
  isSelected?: boolean
  onSelect: () => void
  onDelete?: () => void
}

function TestHistoryItem({
  run,
  isSelected = false,
  onSelect,
  onDelete,
}: TestHistoryItemProps) {
  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(run.timestamp), {
        addSuffix: true,
        locale: ptBR,
      })
    } catch {
      return ''
    }
  }, [run.timestamp])

  return (
    <div
      className={`group cursor-pointer rounded-md border p-3 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/20'
          : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Score and metrics */}
          <QualityMetricsCompact scores={run.qualityScores} />

          {/* Test case preview */}
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
            <FileText className="h-3 w-3" />
            <span className="truncate">{run.input.fatos.substring(0, 50)}...</span>
          </div>

          {/* Metadata */}
          <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
            <span>{run.output.palavras} palavras</span>
            <span>{(run.metrics.executionTimeMs / 1000).toFixed(1)}s</span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Summary stats component
interface TestStatsProps {
  runs: TestRun[]
}

export function TestStats({ runs }: TestStatsProps) {
  const stats = useMemo(() => {
    if (runs.length === 0) {
      return null
    }

    const scores = runs.map((r) => r.qualityScores.overall)
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const maxScore = Math.max(...scores)
    const minScore = Math.min(...scores)

    const avgTime = Math.round(
      runs.reduce((a, r) => a + r.metrics.executionTimeMs, 0) / runs.length
    )

    const avgWords = Math.round(
      runs.reduce((a, r) => a + r.output.palavras, 0) / runs.length
    )

    return {
      count: runs.length,
      avgScore,
      maxScore,
      minScore,
      avgTime,
      avgWords,
    }
  }, [runs])

  if (!stats) {
    return null
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="text-xs text-zinc-500">Score Médio</div>
        <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {stats.avgScore}
        </div>
        <div className="mt-0.5 text-xs text-zinc-400">
          min: {stats.minScore} | max: {stats.maxScore}
        </div>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="text-xs text-zinc-500">Tempo Médio</div>
        <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {(stats.avgTime / 1000).toFixed(1)}s
        </div>
        <div className="mt-0.5 text-xs text-zinc-400">{stats.count} execuções</div>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="text-xs text-zinc-500">Palavras Média</div>
        <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {stats.avgWords.toLocaleString()}
        </div>
        <div className="mt-0.5 text-xs text-zinc-400">por minuta</div>
      </div>
    </div>
  )
}
