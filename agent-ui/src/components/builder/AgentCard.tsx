'use client'

import { useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  FileText,
  FlaskConical,
  CheckCircle2,
  MoreVertical,
  Copy,
  Trash2,
  Play,
  Edit2,
  Download,
} from 'lucide-react'
import type { AgentDefinition, AgentStatus } from '@/types/agent-builder'
import { InlineScore } from './ScoreGauge'

interface AgentCardProps {
  agent: AgentDefinition
  latestScore?: number
  isSelected?: boolean
  onClick?: () => void
  onEdit?: () => void
  onTest?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onExport?: () => void
}

const statusConfig: Record<
  AgentStatus,
  { icon: typeof FileText; label: string; className: string }
> = {
  draft: {
    icon: FileText,
    label: 'Rascunho',
    className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  },
  testing: {
    icon: FlaskConical,
    label: 'Em teste',
    className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  approved: {
    icon: CheckCircle2,
    label: 'Aprovado',
    className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
}

export function AgentCard({
  agent,
  latestScore,
  isSelected = false,
  onClick,
  onEdit,
  onTest,
  onDuplicate,
  onDelete,
  onExport,
}: AgentCardProps) {
  const status = statusConfig[agent.status]
  const StatusIcon = status.icon

  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(agent.updatedAt), {
        addSuffix: true,
        locale: ptBR,
      })
    } catch {
      return ''
    }
  }, [agent.updatedAt])

  return (
    <div
      className={`group relative rounded-lg border transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/20'
          : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
            <span className="text-xs text-zinc-400">v{agent.version}</span>
          </div>

          {/* Actions dropdown */}
          <div className="relative">
            <button
              onClick={(e) => e.stopPropagation()}
              className="rounded p-1 opacity-0 transition-opacity hover:bg-zinc-100 group-hover:opacity-100 dark:hover:bg-zinc-800"
            >
              <MoreVertical className="h-4 w-4 text-zinc-500" />
            </button>

            {/* Dropdown menu - simplified for now, can be enhanced with Radix dropdown */}
            <div className="absolute right-0 top-full z-10 mt-1 hidden w-40 rounded-md border border-zinc-200 bg-white py-1 shadow-lg group-hover:group-focus-within:block dark:border-zinc-700 dark:bg-zinc-900">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar
                </button>
              )}
              {onTest && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTest()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Play className="h-3.5 w-3.5" />
                  Testar
                </button>
              )}
              {onDuplicate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicar
                </button>
              )}
              {onExport && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onExport()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar
                </button>
              )}
              {onDelete && (
                <>
                  <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">{agent.titulo}</h3>

        {/* Description */}
        {agent.funcao && (
          <p className="mb-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {agent.funcao}
          </p>
        )}

        {/* Tags */}
        {agent.tags && agent.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {agent.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
            {agent.tags.length > 3 && (
              <span className="text-xs text-zinc-400">+{agent.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>{agent.regras.length} regras</span>
            <span>{agent.sumulas.length} súmulas</span>
          </div>

          {latestScore !== undefined && <InlineScore score={latestScore} />}
        </div>

        {/* Time ago */}
        {timeAgo && (
          <div className="mt-2 text-xs text-zinc-400">Atualizado {timeAgo}</div>
        )}
      </div>
    </div>
  )
}

// Compact variant for lists
interface AgentCardCompactProps {
  agent: AgentDefinition
  latestScore?: number
  isSelected?: boolean
  onClick?: () => void
}

export function AgentCardCompact({
  agent,
  latestScore,
  isSelected = false,
  onClick,
}: AgentCardCompactProps) {
  const status = statusConfig[agent.status]
  const StatusIcon = status.icon

  return (
    <div
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/20'
          : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
      }`}
      onClick={onClick}
    >
      <StatusIcon className={`h-5 w-5 ${status.className.split(' ').pop()}`} />

      <div className="flex-1 min-w-0">
        <h4 className="truncate font-medium text-zinc-900 dark:text-zinc-100">{agent.titulo}</h4>
        <p className="text-xs text-zinc-500">
          {agent.regras.length} regras | {agent.sumulas.length} súmulas
        </p>
      </div>

      {latestScore !== undefined && <InlineScore score={latestScore} />}
    </div>
  )
}
