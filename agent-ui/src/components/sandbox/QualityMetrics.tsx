'use client'

import { useMemo } from 'react'
import { Clock, Zap, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ScoreGauge, ScoreBreakdown } from '@/components/builder/ScoreGauge'
import type { QualityScores, ExecutionMetrics, classifyRisk } from '@/types/agent-builder'
import { classifyRisk as classifyRiskFn } from '@/types/agent-builder'

interface QualityMetricsProps {
  scores: QualityScores
  metrics: ExecutionMetrics
  wordCount: number
}

export function QualityMetrics({ scores, metrics, wordCount }: QualityMetricsProps) {
  const risk = useMemo(() => classifyRiskFn(scores.overall), [scores.overall])

  return (
    <div className="space-y-6">
      {/* Main score */}
      <div className="flex flex-col items-center">
        <ScoreGauge score={scores.overall} size="lg" showLabel showRisk />
      </div>

      {/* Score breakdown */}
      <div className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h4 className="mb-4 font-medium text-zinc-900 dark:text-zinc-100">Detalhamento</h4>
        <ScoreBreakdown
          structure={scores.structure}
          citation={scores.citation}
          reasoning={scores.reasoning}
        />
      </div>

      {/* Execution metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Tempo</span>
          </div>
          <div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {(metrics.executionTimeMs / 1000).toFixed(1)}s
          </div>
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500">
            <Zap className="h-4 w-4" />
            <span className="text-xs">Tokens</span>
          </div>
          <div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {metrics.tokensUsed.toLocaleString()}
          </div>
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-zinc-500">
            <FileText className="h-4 w-4" />
            <span className="text-xs">Palavras</span>
          </div>
          <div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {wordCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Issues */}
      {scores.issues.length > 0 && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="mb-2 flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Problemas Detectados ({scores.issues.length})</span>
          </div>
          <ul className="space-y-1 text-sm text-yellow-600 dark:text-yellow-300">
            {scores.issues.map((issue, index) => (
              <li key={index}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success message */}
      {scores.overall >= 85 && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Agente pronto para produção!</span>
        </div>
      )}

      {/* Score legend */}
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h5 className="mb-2 text-xs font-medium text-zinc-500">Classificação de Risco</h5>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span>85-100: BAIXO (produção)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            <span>70-84: MÉDIO (revisão)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
            <span>50-69: ALTO (obrigatório)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span>&lt;50: CRÍTICO (reescrever)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact version for lists
interface QualityMetricsCompactProps {
  scores: QualityScores
}

export function QualityMetricsCompact({ scores }: QualityMetricsCompactProps) {
  const risk = useMemo(() => classifyRiskFn(scores.overall), [scores.overall])

  const riskColors = {
    baixo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medio: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    alto: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    critico: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`rounded-full px-2 py-1 text-sm font-semibold ${riskColors[risk.level]}`}>
        {scores.overall}
      </div>
      <div className="flex gap-2 text-xs text-zinc-500">
        <span>E:{scores.structure}</span>
        <span>C:{scores.citation}</span>
        <span>R:{scores.reasoning}</span>
      </div>
      {scores.issues.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="h-3 w-3" />
          {scores.issues.length}
        </div>
      )}
    </div>
  )
}
