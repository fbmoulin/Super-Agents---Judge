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
