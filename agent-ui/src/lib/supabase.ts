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
