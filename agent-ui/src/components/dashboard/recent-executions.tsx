// agent-ui/src/components/dashboard/recent-executions.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ExecutionWithQuality } from '@/lib/supabase'

type RecentExecutionsProps = {
  executions: ExecutionWithQuality[]
}

export function RecentExecutions({ executions }: RecentExecutionsProps) {
  const getStatusBadge = (status: string, quality?: number) => {
    if (status === 'error') {
      return <Badge variant="destructive">Erro</Badge>
    }
    if (quality && quality < 0.7) {
      return <Badge variant="secondary" className="bg-yellow-500">⚠️ {(quality * 100).toFixed(0)}%</Badge>
    }
    return <Badge variant="default" className="bg-green-500">✅ {quality ? (quality * 100).toFixed(0) + '%' : 'OK'}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execuções Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {executions.slice(0, 10).map((exec) => {
            const quality = exec.quality_scores?.[0]?.overall_score
            return (
              <div key={exec.id} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{exec.agent_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(exec.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{(exec.duration_ms / 1000).toFixed(1)}s</span>
                  {getStatusBadge(exec.status, quality)}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
