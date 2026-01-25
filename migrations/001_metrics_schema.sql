-- ============================================================================
-- METRICS SCHEMA - Lex Intelligentia Judiciario v3.0
-- Phase 3.1: Supabase Metrics Dashboard
-- Migration 001: executions and quality_scores tables
-- ============================================================================

-- Criar extensao para UUID (se nao existir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABELA: executions
-- Tracks AI agent execution metrics for performance monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS executions (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Execution context
    workflow_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    domain TEXT NOT NULL,

    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    duration_ms INT,

    -- Status with constraint
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
    error_message TEXT,

    -- Resource usage
    tokens_used INT NOT NULL DEFAULT 0,
    rag_results_count INT NOT NULL DEFAULT 0,
    cache_hit BOOLEAN NOT NULL DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABELA: quality_scores
-- Stores quality evaluation scores for each execution
-- ============================================================================

CREATE TABLE IF NOT EXISTS quality_scores (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key to executions
    execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,

    -- Quality scores (0.00 to 1.00)
    structure_score DECIMAL(3,2) CHECK (structure_score >= 0 AND structure_score <= 1),
    citation_score DECIMAL(3,2) CHECK (citation_score >= 0 AND citation_score <= 1),
    reasoning_score DECIMAL(3,2) CHECK (reasoning_score >= 0 AND reasoning_score <= 1),
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 1),

    -- Detailed issues as JSON array
    issues JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Indexes on executions table
CREATE INDEX IF NOT EXISTS idx_executions_agent_name
ON executions(agent_name);

CREATE INDEX IF NOT EXISTS idx_executions_domain
ON executions(domain);

CREATE INDEX IF NOT EXISTS idx_executions_created_at
ON executions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_executions_status
ON executions(status);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_executions_agent_domain_created
ON executions(agent_name, domain, created_at DESC);

-- Indexes on quality_scores table
CREATE INDEX IF NOT EXISTS idx_quality_scores_execution_id
ON quality_scores(execution_id);

CREATE INDEX IF NOT EXISTS idx_quality_scores_created_at
ON quality_scores(created_at DESC);

-- ============================================================================
-- REALTIME PUBLICATION
-- Enable Supabase Realtime for live dashboard updates
-- ============================================================================

-- Note: Run these commands in Supabase SQL Editor if the publication exists
-- If running fresh, create publication first
DO $$
BEGIN
    -- Check if publication exists before adding tables
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Add tables to existing publication (idempotent)
        ALTER PUBLICATION supabase_realtime ADD TABLE executions;
        ALTER PUBLICATION supabase_realtime ADD TABLE quality_scores;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Tables already in publication, ignore
        NULL;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE executions IS 'Tracks AI agent execution metrics for the Lex Intelligentia judicial system';
COMMENT ON COLUMN executions.workflow_id IS 'n8n workflow execution ID';
COMMENT ON COLUMN executions.agent_name IS 'Name of the specialized agent (e.g., fazenda_publica, trabalhista)';
COMMENT ON COLUMN executions.domain IS 'Legal domain category';
COMMENT ON COLUMN executions.status IS 'Execution result: success, error, or timeout';
COMMENT ON COLUMN executions.tokens_used IS 'Total LLM tokens consumed';
COMMENT ON COLUMN executions.rag_results_count IS 'Number of RAG documents retrieved';
COMMENT ON COLUMN executions.cache_hit IS 'Whether response was served from cache';

COMMENT ON TABLE quality_scores IS 'Quality evaluation scores for AI-generated legal documents';
COMMENT ON COLUMN quality_scores.structure_score IS 'Score for document structure compliance (0-1)';
COMMENT ON COLUMN quality_scores.citation_score IS 'Score for legal citation accuracy (0-1)';
COMMENT ON COLUMN quality_scores.reasoning_score IS 'Score for legal reasoning quality (0-1)';
COMMENT ON COLUMN quality_scores.overall_score IS 'Weighted overall quality score (0-1)';
COMMENT ON COLUMN quality_scores.issues IS 'JSON array of identified quality issues';
