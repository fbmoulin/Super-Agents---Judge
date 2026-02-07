'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Check, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import type { TestOutput } from '@/types/agent-builder'

interface SandboxChatProps {
  output: TestOutput | null
  isLoading?: boolean
}

export function SandboxChat({ output, isLoading = false }: SandboxChatProps) {
  const [copied, setCopied] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (containerRef.current && output) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [output])

  const handleCopy = async () => {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output.minuta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!output && !isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
          <FileText className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Nenhuma Minuta Gerada
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Execute um teste para ver a minuta gerada pelo agente.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]"></div>
          <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]"></div>
          <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500"></div>
        </div>
        <p className="text-sm text-zinc-500">Gerando minuta...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 p-3 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-500" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Minuta Gerada</span>
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
            {output?.palavras.toLocaleString()} palavras
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-4"
        >
          <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert">
            {/* Render minuta with proper formatting */}
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {output?.minuta}
            </pre>
          </div>
        </div>
      )}

      {/* Collapsed state */}
      {isCollapsed && (
        <div className="p-4 text-center text-sm text-zinc-500">
          <button
            onClick={() => setIsCollapsed(false)}
            className="hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Clique para expandir ({output?.palavras.toLocaleString()} palavras)
          </button>
        </div>
      )}
    </div>
  )
}

// Section highlighter component for structured view
interface MinutaSectionProps {
  title: string
  content: string
  isExpanded?: boolean
  onToggle?: () => void
}

export function MinutaSection({
  title,
  content,
  isExpanded = true,
  onToggle,
}: MinutaSectionProps) {
  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-700">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-zinc-50 px-4 py-2 text-left dark:bg-zinc-800"
      >
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
        {onToggle && (
          isExpanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          )
        )}
      </button>
      {isExpanded && (
        <div className="p-4 text-sm text-zinc-700 dark:text-zinc-300">
          {content}
        </div>
      )}
    </div>
  )
}
