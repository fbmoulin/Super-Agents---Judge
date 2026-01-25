# Metrics Dashboard & Redis Caching Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a real-time metrics dashboard with quality validation, then add multi-layer Redis caching to optimize performance.

**Architecture:** n8n Cloud workflows send execution metrics and quality scores to Supabase via HTTP. A Next.js dashboard consumes this data with real-time subscriptions. Redis Cloud caches RAG results and embeddings with hybrid TTL/event-based invalidation.

**Tech Stack:** Supabase (PostgreSQL + Realtime), Next.js App Router, shadcn/ui, Recharts, Redis Cloud, n8n Cloud

---

## Phase 3.1: Metrics Dashboard

### Task 1: Supabase Schema Setup

**Files:**
- Create: `migrations/001_metrics_schema.sql`

**Step 1: Write the schema migration**

```sql
-- migrations/001_metrics_schema.sql
-- Execution metrics (ops monitoring)
CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  duration_ms INT,
  status TEXT CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  tokens_used INT DEFAULT 0,
  rag_results_count INT DEFAULT 0,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality scores (QA monitoring)
CREATE TABLE IF NOT EXISTS quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,
  structure_score DECIMAL(3,2) CHECK (structure_score >= 0 AND structure_score <= 1),
  citation_score DECIMAL(3,2) CHECK (citation_score >= 0 AND citation_score <= 1),
  reasoning_score DECIMAL(3,2) CHECK (reasoning_score >= 0 AND reasoning_score <= 1),
  overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 1),
  issues JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_executions_agent ON executions(agent_name);
CREATE INDEX IF NOT EXISTS idx_executions_domain ON executions(domain);
CREATE INDEX IF NOT EXISTS idx_executions_created ON executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_quality_execution ON quality_scores(execution_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE executions;
ALTER PUBLICATION supabase_realtime ADD TABLE quality_scores;
```

**Step 2: Run migration in Supabase**

1. Open Supabase Dashboard → SQL Editor
2. Paste the migration SQL
3. Click "Run"
Expected: "Success. No rows returned"

**Step 3: Commit**

```bash
git add migrations/001_metrics_schema.sql
git commit -m "db: add executions and quality_scores tables"
```

---

### Task 2: Supabase RPC Function

**Files:**
- Create: `migrations/002_log_execution_function.sql`

**Step 1: Write the RPC function**

```sql
-- migrations/002_log_execution_function.sql
CREATE OR REPLACE FUNCTION log_execution(
  p_workflow_id TEXT,
  p_agent_name TEXT,
  p_domain TEXT,
  p_started_at TIMESTAMPTZ,
  p_finished_at TIMESTAMPTZ,
  p_duration_ms INT,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_tokens_used INT DEFAULT 0,
  p_rag_results_count INT DEFAULT 0,
  p_cache_hit BOOLEAN DEFAULT FALSE,
  p_quality JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  exec_id UUID;
  v_structure DECIMAL(3,2);
  v_citation DECIMAL(3,2);
  v_reasoning DECIMAL(3,2);
BEGIN
  -- Insert execution record
  INSERT INTO executions (
    workflow_id, agent_name, domain, started_at, finished_at,
    duration_ms, status, error_message, tokens_used, rag_results_count, cache_hit
  ) VALUES (
    p_workflow_id, p_agent_name, p_domain, p_started_at, p_finished_at,
    p_duration_ms, p_status, p_error_message, p_tokens_used, p_rag_results_count, p_cache_hit
  ) RETURNING id INTO exec_id;

  -- Insert quality scores if provided
  IF p_quality IS NOT NULL THEN
    v_structure := COALESCE((p_quality->>'structure_score')::DECIMAL, 0);
    v_citation := COALESCE((p_quality->>'citation_score')::DECIMAL, 0);
    v_reasoning := COALESCE((p_quality->>'reasoning_score')::DECIMAL, 0);

    INSERT INTO quality_scores (
      execution_id, structure_score, citation_score, reasoning_score,
      overall_score, issues
    ) VALUES (
      exec_id,
      v_structure,
      v_citation,
      v_reasoning,
      ROUND((v_structure + v_citation + v_reasoning) / 3, 2),
      COALESCE(p_quality->'issues', '[]'::JSONB)
    );
  END IF;

  RETURN exec_id;
END;
$$ LANGUAGE plpgsql;
```

**Step 2: Run migration in Supabase**

1. Open Supabase Dashboard → SQL Editor
2. Paste the function SQL
3. Click "Run"
Expected: "Success. No rows returned"

**Step 3: Test the function**

```sql
SELECT log_execution(
  'test-workflow-123',
  'AI Agent: Bancário',
  'bancario',
  NOW() - INTERVAL '10 seconds',
  NOW(),
  10000,
  'success',
  NULL,
  1500,
  3,
  FALSE,
  '{"structure_score": 0.95, "citation_score": 0.88, "reasoning_score": 0.92, "issues": []}'::JSONB
);
```

Expected: Returns a UUID

**Step 4: Verify data inserted**

```sql
SELECT e.*, q.*
FROM executions e
LEFT JOIN quality_scores q ON q.execution_id = e.id
ORDER BY e.created_at DESC
LIMIT 1;
```

Expected: One row with all fields populated

**Step 5: Commit**

```bash
git add migrations/002_log_execution_function.sql
git commit -m "db: add log_execution RPC function"
```

---

### Task 3: Quality Validator Code Node

**Files:**
- Create: `n8n_nodes/quality_validator.js`

**Step 1: Write the quality validator**

```javascript
// n8n_nodes/quality_validator.js
// Copy this into n8n Code node after AI Agent output

const decisionText = $input.first().json.output || $input.first().json.text || '';
const knowledgeBase = {
  sumulas: [297, 283, 596, 382, 379, 381, 176, 356, 472, 548, 549, 550, 552],
  temas: [952, 929, 927, 928, 905, 246, 725, 936]
};

// === STRUCTURE VALIDATION ===
const requiredSections = [
  { name: 'RELATÓRIO', pattern: /^##?\s*REL[AÁ]T[OÓ]RIO/mi, weight: 0.33 },
  { name: 'FUNDAMENTAÇÃO', pattern: /^##?\s*FUNDAMENTA[CÇ][AÃ]O/mi, weight: 0.34 },
  { name: 'DISPOSITIVO', pattern: /^##?\s*DISPOSITIVO/mi, weight: 0.33 }
];

const structureIssues = [];
let structureScore = 0;

for (const section of requiredSections) {
  if (section.pattern.test(decisionText)) {
    structureScore += section.weight;
  } else {
    structureIssues.push(`Seção ausente: ${section.name}`);
  }
}

// === CITATION VALIDATION ===
const citedSumulas = decisionText.match(/S[úu]mula\s+n?[º°]?\s*(\d+)/gi) || [];
const citedTemas = decisionText.match(/Tema\s+n?[º°]?\s*(\d+)/gi) || [];

const citationIssues = [];
let validCitations = 0;
let totalCitations = citedSumulas.length + citedTemas.length;

for (const cited of citedSumulas) {
  const num = parseInt(cited.match(/\d+/)[0]);
  if (knowledgeBase.sumulas.includes(num)) {
    validCitations++;
  } else {
    citationIssues.push(`Súmula ${num} não encontrada na base`);
  }
}

for (const cited of citedTemas) {
  const num = parseInt(cited.match(/\d+/)[0]);
  if (knowledgeBase.temas.includes(num)) {
    validCitations++;
  } else {
    citationIssues.push(`Tema ${num} não encontrado na base`);
  }
}

const citationScore = totalCitations > 0 ? validCitations / totalCitations : 0.5;

// === REASONING VALIDATION ===
const paragraphs = decisionText.split(/\n\n+/).filter(p => p.trim().length > 50);
const reasoningIssues = [];
let reasoningScore = 1.0;

// Check minimum paragraph count
if (paragraphs.length < 5) {
  reasoningIssues.push(`Poucos parágrafos substantivos: ${paragraphs.length} (mínimo: 5)`);
  reasoningScore -= 0.3;
}

// Check for case-specific facts (numbers, dates, names)
const hasSpecificFacts = /R\$\s*[\d.,]+|(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})|processo\s+n[º°]?\s*[\d.-]+/i.test(decisionText);
if (!hasSpecificFacts) {
  reasoningIssues.push('Ausência de fatos específicos do caso (valores, datas, números de processo)');
  reasoningScore -= 0.2;
}

// Check for legal reasoning pattern
const hasLegalReasoning = /art(igo)?\.?\s*\d+|lei\s+n?[º°]?\s*[\d.]+|cpc|cc|cdc|cf/i.test(decisionText);
if (!hasLegalReasoning) {
  reasoningIssues.push('Ausência de fundamentação legal explícita');
  reasoningScore -= 0.3;
}

reasoningScore = Math.max(0, reasoningScore);

// === COMPILE RESULTS ===
const allIssues = [...structureIssues, ...citationIssues, ...reasoningIssues];
const overallScore = (structureScore + citationScore + reasoningScore) / 3;

return [{
  json: {
    ...$input.first().json,
    quality: {
      structure_score: Math.round(structureScore * 100) / 100,
      citation_score: Math.round(citationScore * 100) / 100,
      reasoning_score: Math.round(reasoningScore * 100) / 100,
      overall_score: Math.round(overallScore * 100) / 100,
      issues: allIssues,
      citations_found: totalCitations,
      citations_valid: validCitations
    }
  }
}];
```

**Step 2: Test locally**

Create a test file and run with Node:

```bash
node -e "
const decisionText = '## RELATÓRIO\nTexto...\n## FUNDAMENTAÇÃO\nConforme Súmula 297/STJ e art. 51 do CDC...\n## DISPOSITIVO\nJulgo procedente...';
// ... paste validator code and test
console.log(JSON.stringify(result, null, 2));
"
```

Expected: Quality scores between 0 and 1

**Step 3: Commit**

```bash
git add n8n_nodes/quality_validator.js
git commit -m "feat: add quality validator code node"
```

---

### Task 4: Metrics Logger HTTP Node Config

**Files:**
- Create: `n8n_nodes/metrics_logger_config.json`

**Step 1: Write the HTTP node configuration**

```json
{
  "name": "Metrics Logger",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [0, 0],
  "parameters": {
    "method": "POST",
    "url": "={{ $env.SUPABASE_URL }}/rest/v1/rpc/log_execution",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "apikey",
          "value": "={{ $env.SUPABASE_ANON_KEY }}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"p_workflow_id\": \"{{ $workflow.id }}\",\n  \"p_agent_name\": \"{{ $json.agent_name || $node.name }}\",\n  \"p_domain\": \"{{ $json.domain || 'generico' }}\",\n  \"p_started_at\": \"{{ $json.started_at || $now.minus(10, 'seconds').toISO() }}\",\n  \"p_finished_at\": \"{{ $now.toISO() }}\",\n  \"p_duration_ms\": {{ $json.duration_ms || 10000 }},\n  \"p_status\": \"{{ $json.error ? 'error' : 'success' }}\",\n  \"p_error_message\": {{ $json.error ? JSON.stringify($json.error.message || 'Unknown error') : 'null' }},\n  \"p_tokens_used\": {{ $json.tokens_used || 0 }},\n  \"p_rag_results_count\": {{ $json.rag_context?.results_count || 0 }},\n  \"p_cache_hit\": {{ $json.cache_hit || false }},\n  \"p_quality\": {{ $json.quality ? JSON.stringify($json.quality) : 'null' }}\n}"
  },
  "credentials": {},
  "notes": "Sends execution metrics and quality scores to Supabase. Requires SUPABASE_URL and SUPABASE_ANON_KEY environment variables."
}
```

**Step 2: Document environment variables needed**

Create `docs/ENV_VARIABLES.md`:

```markdown
# Environment Variables for n8n Cloud

## Supabase (Metrics Dashboard)
- `SUPABASE_URL`: Your Supabase project URL (e.g., https://xxxxx.supabase.co)
- `SUPABASE_ANON_KEY`: Supabase anonymous/public key

## Redis Cloud (Caching - Phase 4.0)
- `REDIS_URL`: Redis Cloud REST API URL
- `REDIS_TOKEN`: Redis Cloud API token
```

**Step 3: Commit**

```bash
git add n8n_nodes/metrics_logger_config.json docs/ENV_VARIABLES.md
git commit -m "feat: add metrics logger HTTP node config"
```

---

### Task 5: Dashboard - Project Setup

**Files:**
- Modify: `agent-ui/package.json`
- Create: `agent-ui/app/dashboard/page.tsx`
- Create: `agent-ui/lib/supabase.ts`

**Step 1: Install dependencies**

```bash
cd agent-ui
bun add @supabase/supabase-js recharts date-fns
```

Expected: Packages added to package.json

**Step 2: Create Supabase client**

```typescript
// agent-ui/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Execution = {
  id: string
  workflow_id: string
  agent_name: string
  domain: string
  started_at: string
  finished_at: string
  duration_ms: number
  status: 'success' | 'error' | 'timeout'
  error_message: string | null
  tokens_used: number
  rag_results_count: number
  cache_hit: boolean
  created_at: string
}

export type QualityScore = {
  id: string
  execution_id: string
  structure_score: number
  citation_score: number
  reasoning_score: number
  overall_score: number
  issues: string[]
  created_at: string
}

export type ExecutionWithQuality = Execution & {
  quality_scores: QualityScore[]
}
```

**Step 3: Create environment file**

```bash
# agent-ui/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Step 4: Commit**

```bash
git add agent-ui/package.json agent-ui/bun.lockb agent-ui/lib/supabase.ts
git commit -m "feat: add Supabase client for dashboard"
```

---

### Task 6: Dashboard - Stats Cards Component

**Files:**
- Create: `agent-ui/components/dashboard/stats-cards.tsx`

**Step 1: Write the stats cards component**

```typescript
// agent-ui/components/dashboard/stats-cards.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react'

type StatsCardsProps = {
  totalToday: number
  avgLatency: number
  successRate: number
  avgQuality: number
}

export function StatsCards({ totalToday, avgLatency, successRate, avgQuality }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Casos Hoje</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalToday}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(avgLatency / 1000).toFixed(1)}s</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(successRate * 100).toFixed(1)}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Qualidade Média</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(avgQuality * 100).toFixed(0)}%</div>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add agent-ui/components/dashboard/stats-cards.tsx
git commit -m "feat: add dashboard stats cards component"
```

---

### Task 7: Dashboard - Quality Chart Component

**Files:**
- Create: `agent-ui/components/dashboard/quality-chart.tsx`

**Step 1: Write the quality chart component**

```typescript
// agent-ui/components/dashboard/quality-chart.tsx
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
```

**Step 2: Commit**

```bash
git add agent-ui/components/dashboard/quality-chart.tsx
git commit -m "feat: add dashboard quality chart component"
```

---

### Task 8: Dashboard - Recent Executions Component

**Files:**
- Create: `agent-ui/components/dashboard/recent-executions.tsx`

**Step 1: Write the recent executions component**

```typescript
// agent-ui/components/dashboard/recent-executions.tsx
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
```

**Step 2: Commit**

```bash
git add agent-ui/components/dashboard/recent-executions.tsx
git commit -m "feat: add dashboard recent executions component"
```

---

### Task 9: Dashboard - Main Page with Realtime

**Files:**
- Create: `agent-ui/app/dashboard/page.tsx`

**Step 1: Write the main dashboard page**

```typescript
// agent-ui/app/dashboard/page.tsx
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
```

**Step 2: Run the dashboard**

```bash
cd agent-ui
bun dev
```

Open http://localhost:3000/dashboard
Expected: Dashboard renders (empty state initially)

**Step 3: Commit**

```bash
git add agent-ui/app/dashboard/page.tsx
git commit -m "feat: add main dashboard page with realtime subscriptions"
```

---

### Task 10: Update n8n Workflow with Quality Validator + Logger

**Files:**
- Modify: `n8n_workflow_v3.0_rag.json` → `n8n_workflow_v3.1_metrics.json`

**Step 1: Create workflow update script**

```javascript
// scripts/add_metrics_to_workflow.js
const fs = require('fs');

const workflow = JSON.parse(fs.readFileSync('n8n_workflow_v3.0_rag.json', 'utf8'));

// Quality Validator node template
const qualityValidator = {
  parameters: {
    jsCode: fs.readFileSync('n8n_nodes/quality_validator.js', 'utf8')
  },
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position: [0, 0],
  name: "Quality Validator"
};

// Metrics Logger node template
const metricsLogger = JSON.parse(fs.readFileSync('n8n_nodes/metrics_logger_config.json', 'utf8'));

// Find all AI Agent nodes
const agentNodes = workflow.nodes.filter(n => n.type === '@n8n/n8n-nodes-langchain.agent');

console.log(`Found ${agentNodes.length} AI Agent nodes`);
console.log('Manual step: Add Quality Validator and Metrics Logger after each agent in n8n UI');
console.log('Or import the node configurations from n8n_nodes/ directory');

// Update workflow name
workflow.name = 'Lex Intelligentia v3.1 - Metrics Integration';

fs.writeFileSync('n8n_workflow_v3.1_metrics.json', JSON.stringify(workflow, null, 2));
console.log('Created n8n_workflow_v3.1_metrics.json');
```

**Step 2: Run the script**

```bash
node scripts/add_metrics_to_workflow.js
```

**Step 3: Manual integration in n8n**

1. Import `n8n_workflow_v3.1_metrics.json` into n8n Cloud
2. After each AI Agent node, add:
   - Code node with content from `n8n_nodes/quality_validator.js`
   - HTTP Request node with config from `n8n_nodes/metrics_logger_config.json`
3. Set environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
4. Test with a sample execution

**Step 4: Commit**

```bash
git add scripts/add_metrics_to_workflow.js n8n_workflow_v3.1_metrics.json
git commit -m "feat: create v3.1 workflow with metrics integration"
```

---

## Phase 4.0: Redis Caching

### Task 11: Redis Cache Helper Module

**Files:**
- Create: `n8n_nodes/redis_cache.js`

**Step 1: Write the cache helper**

```javascript
// n8n_nodes/redis_cache.js
// Helper functions for Redis Cloud caching in n8n

const REDIS_URL = $env.REDIS_URL;
const REDIS_TOKEN = $env.REDIS_TOKEN;

/**
 * Generate cache key from query
 */
function generateCacheKey(prefix, text) {
  const normalized = text.toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${prefix}:${Math.abs(hash).toString(16)}`;
}

/**
 * Check cache - returns cached value or null
 */
async function checkCache(key) {
  try {
    const response = await fetch(`${REDIS_URL}/get/${key}`, {
      headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
    });
    const data = await response.json();
    return data.result || null;
  } catch (e) {
    console.log('Cache miss:', key);
    return null;
  }
}

/**
 * Store in cache with TTL
 */
async function setCache(key, value, ttlSeconds) {
  try {
    await fetch(`${REDIS_URL}/set/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: typeof value === 'string' ? value : JSON.stringify(value),
        ex: ttlSeconds
      })
    });
    return true;
  } catch (e) {
    console.log('Cache set failed:', key);
    return false;
  }
}

/**
 * Invalidate cache keys by pattern
 */
async function invalidatePattern(pattern) {
  try {
    const response = await fetch(`${REDIS_URL}/keys/${pattern}`, {
      headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
    });
    const data = await response.json();
    const keys = data.result || [];

    for (const key of keys) {
      await fetch(`${REDIS_URL}/del/${key}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
      });
    }
    return keys.length;
  } catch (e) {
    console.log('Invalidation failed:', pattern);
    return 0;
  }
}

// Export for use in n8n Code nodes
return { generateCacheKey, checkCache, setCache, invalidatePattern };
```

**Step 2: Commit**

```bash
git add n8n_nodes/redis_cache.js
git commit -m "feat: add Redis cache helper module"
```

---

### Task 12: Cache Check Node (Before RAG)

**Files:**
- Create: `n8n_nodes/cache_check_node.js`

**Step 1: Write the cache check node**

```javascript
// n8n_nodes/cache_check_node.js
// Place this Code node BEFORE the RAG search in the workflow

const REDIS_URL = $env.REDIS_URL;
const REDIS_TOKEN = $env.REDIS_TOKEN;

const query = $input.first().json.query || $input.first().json.body?.query || '';

// Generate cache key
const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
let hash = 0;
for (let i = 0; i < normalized.length; i++) {
  hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
  hash = hash & hash;
}
const cacheKey = `rag:${Math.abs(hash).toString(16)}`;

// Check cache
let cached = null;
try {
  const response = await fetch(`${REDIS_URL}/get/${cacheKey}`, {
    headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
  });
  const data = await response.json();
  if (data.result) {
    cached = JSON.parse(data.result);
  }
} catch (e) {
  // Cache miss, continue to RAG
}

return [{
  json: {
    ...$input.first().json,
    cache_key: cacheKey,
    cache_hit: cached !== null,
    cached_result: cached
  }
}];
```

**Step 2: Commit**

```bash
git add n8n_nodes/cache_check_node.js
git commit -m "feat: add cache check node for RAG"
```

---

### Task 13: Cache Store Node (After RAG)

**Files:**
- Create: `n8n_nodes/cache_store_node.js`

**Step 1: Write the cache store node**

```javascript
// n8n_nodes/cache_store_node.js
// Place this Code node AFTER the RAG search (if not a cache hit)

const REDIS_URL = $env.REDIS_URL;
const REDIS_TOKEN = $env.REDIS_TOKEN;

const input = $input.first().json;
const cacheKey = input.cache_key;
const ragResult = input.rag_context || input.result;

// Only store if we have results and this wasn't a cache hit
if (!input.cache_hit && ragResult && cacheKey) {
  const TTL_SECONDS = 3600; // 1 hour for RAG results

  try {
    await fetch(`${REDIS_URL}/set/${cacheKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: JSON.stringify(ragResult),
        ex: TTL_SECONDS
      })
    });
    console.log('Cached RAG result:', cacheKey);
  } catch (e) {
    console.log('Cache store failed:', cacheKey);
  }
}

return [{
  json: {
    ...input,
    cache_stored: !input.cache_hit
  }
}];
```

**Step 2: Commit**

```bash
git add n8n_nodes/cache_store_node.js
git commit -m "feat: add cache store node for RAG results"
```

---

### Task 14: KB Update Invalidation Webhook

**Files:**
- Create: `scripts/invalidate_cache.js`

**Step 1: Write the invalidation script**

```javascript
// scripts/invalidate_cache.js
// Run this when knowledge_base files are updated

const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.REDIS_TOKEN;

async function invalidateCache() {
  console.log('Invalidating precedent cache...');

  // Get all precedent keys
  const response = await fetch(`${REDIS_URL}/keys/prec:*`, {
    headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
  });
  const data = await response.json();
  const keys = data.result || [];

  console.log(`Found ${keys.length} cached precedents`);

  // Delete each key
  for (const key of keys) {
    await fetch(`${REDIS_URL}/del/${key}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
    });
  }

  console.log(`Invalidated ${keys.length} cache entries`);
}

invalidateCache().catch(console.error);
```

**Step 2: Commit**

```bash
git add scripts/invalidate_cache.js
git commit -m "feat: add cache invalidation script for KB updates"
```

---

### Task 15: Update Workflow with Caching

**Files:**
- Create: `n8n_workflow_v4.0_cached.json`

**Step 1: Document the workflow changes**

Create `docs/WORKFLOW_V4_CACHING.md`:

```markdown
# Workflow v4.0 Caching Integration

## Node Changes

### Before RAG Search (each agent)
1. Add "Cache Check" Code node
   - Source: `n8n_nodes/cache_check_node.js`
   - Outputs: cache_key, cache_hit, cached_result

### Conditional Branch
2. Add IF node after Cache Check
   - Condition: `{{ $json.cache_hit }} === true`
   - True: Skip to Format Results (use cached_result)
   - False: Continue to RAG Search

### After RAG Search
3. Add "Cache Store" Code node
   - Source: `n8n_nodes/cache_store_node.js`
   - Only runs on cache miss

### Environment Variables
```
REDIS_URL=https://your-redis-cloud-url
REDIS_TOKEN=your-redis-token
```

## Flow Diagram

```
Input → Cache Check → [Cache Hit?]
                          ↓ Yes → Use Cached → Format Results
                          ↓ No  → RAG Search → Cache Store → Format Results
```
```

**Step 2: Commit**

```bash
git add docs/WORKFLOW_V4_CACHING.md
git commit -m "docs: add workflow v4.0 caching integration guide"
```

---

### Task 16: Final Integration Test

**Step 1: Test metrics flow**

1. Run a test case through n8n workflow
2. Check Supabase `executions` table for new row
3. Check Supabase `quality_scores` table for quality data
4. Verify dashboard shows the execution

**Step 2: Test caching flow**

1. Run same query twice
2. First: cache_hit should be false
3. Second: cache_hit should be true
4. Verify Redis has the key

**Step 3: Verify success metrics**

- [ ] Dashboard shows real-time executions within 2s
- [ ] Quality scores calculated correctly
- [ ] Cache hit tracked in metrics
- [ ] Latency reduced on cache hits

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 3.1/4.0 metrics and caching implementation"
```

---

## Summary

| Phase | Tasks | Files Created |
|-------|-------|---------------|
| 3.1 Metrics | 10 | migrations/, n8n_nodes/, agent-ui/components/dashboard/ |
| 4.0 Caching | 6 | n8n_nodes/redis_*, scripts/invalidate_cache.js |

**Total: 16 tasks, ~25 files**
