'use client'

import { useMemo } from 'react'
import { ArrowRight, Trophy, Minus, AlertTriangle } from 'lucide-react'
import { ScoreGauge } from '@/components/builder/ScoreGauge'
import type {
  AgentDefinition,
  SandboxTestResponse,
  CompareAgentsResponse,
} from '@/types/agent-builder'

interface ComparisonPanelProps {
  agentA: AgentDefinition
  agentB: AgentDefinition
  result: CompareAgentsResponse | null
  isLoading?: boolean
}

export function ComparisonPanel({
  agentA,
  agentB,
  result,
  isLoading = false,
}: ComparisonPanelProps) {
  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]"></div>
          <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]"></div>
          <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500"></div>
        </div>
        <p className="text-sm text-zinc-500">Executando comparação...</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 text-4xl">⚖️</div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Comparação de Agentes
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Execute um teste para comparar os dois agentes lado a lado.
        </p>
      </div>
    )
  }

  const { runA, runB, comparison } = result

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Winner banner */}
      <div
        className={`border-b p-4 ${
          comparison.winner === 'tie'
            ? 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50'
            : comparison.winner === 'A'
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
              : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
        }`}
      >
        <div className="flex items-center justify-center gap-4">
          {comparison.winner === 'tie' ? (
            <>
              <Minus className="h-6 w-6 text-zinc-500" />
              <span className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
                Empate
              </span>
            </>
          ) : (
            <>
              <Trophy
                className={`h-6 w-6 ${
                  comparison.winner === 'A'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}
              />
              <span
                className={`text-lg font-medium ${
                  comparison.winner === 'A'
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-blue-700 dark:text-blue-300'
                }`}
              >
                {comparison.winner === 'A' ? agentA.titulo : agentB.titulo} venceu
              </span>
            </>
          )}
        </div>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Diferença de {Math.abs(comparison.scoreDiff)} pontos
        </p>
      </div>

      {/* Comparison grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Agent A */}
        <AgentComparisonColumn
          agent={agentA}
          run={runA}
          label="A"
          isWinner={comparison.winner === 'A'}
        />

        {/* Divider */}
        <div className="flex w-px flex-col items-center justify-center bg-zinc-200 dark:bg-zinc-700">
          <div className="rounded-full bg-zinc-200 p-2 dark:bg-zinc-700">
            <ArrowRight className="h-4 w-4 text-zinc-500" />
          </div>
        </div>

        {/* Agent B */}
        <AgentComparisonColumn
          agent={agentB}
          run={runB}
          label="B"
          isWinner={comparison.winner === 'B'}
        />
      </div>

      {/* Analysis */}
      <div className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h4 className="mb-2 font-medium text-zinc-900 dark:text-zinc-100">Análise</h4>
        <p className="whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
          {comparison.analysis}
        </p>
      </div>
    </div>
  )
}

interface AgentComparisonColumnProps {
  agent: AgentDefinition
  run: SandboxTestResponse
  label: 'A' | 'B'
  isWinner: boolean
}

function AgentComparisonColumn({
  agent,
  run,
  label,
  isWinner,
}: AgentComparisonColumnProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div
        className={`border-b p-3 ${
          isWinner
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10'
            : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              isWinner
                ? 'bg-green-500 text-white'
                : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
            }`}
          >
            {label}
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{agent.titulo}</span>
          {isWinner && <Trophy className="h-4 w-4 text-green-500" />}
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center justify-center border-b border-zinc-200 p-4 dark:border-zinc-700">
        <ScoreGauge score={run.qualityScores.overall} size="md" showLabel showRisk={false} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 border-b border-zinc-200 p-3 dark:border-zinc-700">
        <MetricCell label="Estrutura" value={run.qualityScores.structure} max={45} />
        <MetricCell label="Citações" value={run.qualityScores.citation} max={30} />
        <MetricCell label="Raciocínio" value={run.qualityScores.reasoning} max={25} />
      </div>

      {/* Issues */}
      {run.qualityScores.issues.length > 0 && (
        <div className="border-b border-zinc-200 p-3 dark:border-zinc-700">
          <div className="mb-2 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-3 w-3" />
            {run.qualityScores.issues.length} problemas
          </div>
          <ul className="space-y-1 text-xs text-zinc-500">
            {run.qualityScores.issues.slice(0, 3).map((issue, i) => (
              <li key={i}>• {issue}</li>
            ))}
            {run.qualityScores.issues.length > 3 && (
              <li className="text-zinc-400">
                +{run.qualityScores.issues.length - 3} mais...
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Output preview */}
      <div className="flex-1 overflow-auto p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Minuta</span>
          <span className="text-zinc-400">{run.output.palavras} palavras</span>
        </div>
        <pre className="whitespace-pre-wrap font-sans text-xs text-zinc-600 dark:text-zinc-400">
          {run.output.minuta.substring(0, 500)}...
        </pre>
      </div>

      {/* Execution info */}
      <div className="border-t border-zinc-200 p-3 text-xs text-zinc-400 dark:border-zinc-700">
        {(run.metrics.executionTimeMs / 1000).toFixed(1)}s | {run.metrics.tokensUsed} tokens
      </div>
    </div>
  )
}

interface MetricCellProps {
  label: string
  value: number
  max: number
}

function MetricCell({ label, value, max }: MetricCellProps) {
  const percentage = (value / max) * 100

  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {value}
        <span className="text-xs text-zinc-400">/{max}</span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className={`h-full rounded-full ${
            percentage >= 80
              ? 'bg-green-500'
              : percentage >= 60
                ? 'bg-yellow-500'
                : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  )
}
