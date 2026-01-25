// agent-ui/src/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase, type ExecutionWithQuality } from '@/lib/supabase'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { QualityChart } from '@/components/dashboard/quality-chart'
import { RecentExecutions } from '@/components/dashboard/recent-executions'

export default function DashboardPage() {
  const [executions, setExecutions] = useState<ExecutionWithQuality[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    fetchExecutions()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('executions-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'executions' },
        (payload) => {
          fetchExecutions() // Refresh on new execution
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchExecutions() {
    const { data, error } = await supabase
      .from('executions')
      .select('*, quality_scores(*)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setExecutions(data as ExecutionWithQuality[])
    }
    setLoading(false)
  }

  // Calculate stats
  const today = new Date().toISOString().split('T')[0]
  const todayExecutions = executions.filter(e => e.created_at.startsWith(today))
  const totalToday = todayExecutions.length
  const avgLatency = executions.length > 0
    ? executions.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / executions.length
    : 0
  const successRate = executions.length > 0
    ? executions.filter(e => e.status === 'success').length / executions.length
    : 0

  const qualityScores = executions
    .flatMap(e => e.quality_scores || [])
    .filter(q => q.overall_score !== null)

  const avgQuality = qualityScores.length > 0
    ? qualityScores.reduce((sum, q) => sum + q.overall_score, 0) / qualityScores.length
    : 0
  const structureAvg = qualityScores.length > 0
    ? qualityScores.reduce((sum, q) => sum + q.structure_score, 0) / qualityScores.length
    : 0
  const citationAvg = qualityScores.length > 0
    ? qualityScores.reduce((sum, q) => sum + q.citation_score, 0) / qualityScores.length
    : 0
  const reasoningAvg = qualityScores.length > 0
    ? qualityScores.reduce((sum, q) => sum + q.reasoning_score, 0) / qualityScores.length
    : 0

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Lex Intelligentia - Metrics Dashboard</h1>

      <StatsCards
        totalToday={totalToday}
        avgLatency={avgLatency}
        successRate={successRate}
        avgQuality={avgQuality}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <QualityChart
          structureAvg={structureAvg}
          citationAvg={citationAvg}
          reasoningAvg={reasoningAvg}
        />
        <RecentExecutions executions={executions} />
      </div>
    </div>
  )
}
