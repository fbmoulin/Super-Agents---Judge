'use client'

import { useMemo } from 'react'
import { classifyRisk, type RiskLevel } from '@/types/agent-builder'

interface ScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showRisk?: boolean
  animated?: boolean
}

const sizeConfig = {
  sm: { width: 80, strokeWidth: 8, fontSize: 'text-lg', radius: 32 },
  md: { width: 120, strokeWidth: 10, fontSize: 'text-2xl', radius: 50 },
  lg: { width: 160, strokeWidth: 12, fontSize: 'text-4xl', radius: 68 },
}

const riskColors: Record<RiskLevel, { stroke: string; text: string; bg: string }> = {
  baixo: { stroke: '#22c55e', text: 'text-green-500', bg: 'bg-green-500/10' },
  medio: { stroke: '#eab308', text: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  alto: { stroke: '#f97316', text: 'text-orange-500', bg: 'bg-orange-500/10' },
  critico: { stroke: '#ef4444', text: 'text-red-500', bg: 'bg-red-500/10' },
}

export function ScoreGauge({
  score,
  size = 'md',
  showLabel = true,
  showRisk = true,
  animated = true,
}: ScoreGaugeProps) {
  const config = sizeConfig[size]
  const risk = useMemo(() => classifyRisk(score), [score])
  const colors = riskColors[risk.level]

  const circumference = 2 * Math.PI * config.radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        {/* Background circle */}
        <svg
          className="transform -rotate-90"
          width={config.width}
          height={config.width}
          viewBox={`0 0 ${config.width} ${config.width}`}
        >
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={config.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-zinc-200 dark:text-zinc-700"
          />
          {/* Score arc */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={config.radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? strokeDashoffset : circumference}
            className={animated ? 'transition-all duration-1000 ease-out' : ''}
            style={
              animated
                ? {
                    strokeDashoffset,
                  }
                : undefined
            }
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${config.fontSize} ${colors.text}`}>{score}</span>
        </div>
      </div>

      {showLabel && (
        <div className="text-center">
          <span className={`text-xs font-medium uppercase tracking-wider ${colors.text}`}>
            {risk.level}
          </span>
        </div>
      )}

      {showRisk && (
        <div className={`rounded-md px-3 py-1.5 text-xs ${colors.bg} ${colors.text}`}>
          {risk.recommendation}
        </div>
      )}
    </div>
  )
}

// Compact inline score for lists
interface InlineScoreProps {
  score: number
  showRisk?: boolean
}

export function InlineScore({ score, showRisk = false }: InlineScoreProps) {
  const risk = classifyRisk(score)
  const colors = riskColors[risk.level]

  return (
    <div className="inline-flex items-center gap-2">
      <div className={`rounded-full px-2 py-0.5 text-sm font-semibold ${colors.bg} ${colors.text}`}>
        {score}
      </div>
      {showRisk && (
        <span className={`text-xs font-medium uppercase ${colors.text}`}>{risk.level}</span>
      )}
    </div>
  )
}

// Score breakdown bars
interface ScoreBreakdownProps {
  structure: number
  citation: number
  reasoning: number
}

export function ScoreBreakdown({ structure, citation, reasoning }: ScoreBreakdownProps) {
  const categories = [
    { label: 'Estrutura', score: structure, max: 45 },
    { label: 'Citações', score: citation, max: 30 },
    { label: 'Raciocínio', score: reasoning, max: 25 },
  ]

  return (
    <div className="space-y-3">
      {categories.map(({ label, score, max }) => {
        const percentage = (score / max) * 100
        const risk = classifyRisk((score / max) * 100)
        const colors = riskColors[risk.level]

        return (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
              <span className={`font-medium ${colors.text}`}>
                {score}/{max}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colors.stroke,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
