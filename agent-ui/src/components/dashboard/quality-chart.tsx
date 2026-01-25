// agent-ui/src/components/dashboard/quality-chart.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type QualityChartProps = {
  structureAvg: number
  citationAvg: number
  reasoningAvg: number
}

export function QualityChart({ structureAvg, citationAvg, reasoningAvg }: QualityChartProps) {
  const data = [
    { name: 'Estrutura', score: structureAvg, fill: '#22c55e' },
    { name: 'Citações', score: citationAvg, fill: '#3b82f6' },
    { name: 'Raciocínio', score: reasoningAvg, fill: '#a855f7' },
  ]

  const getColor = (score: number) => {
    if (score >= 0.85) return '#22c55e' // green
    if (score >= 0.70) return '#eab308' // yellow
    return '#ef4444' // red
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scores de Qualidade</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
