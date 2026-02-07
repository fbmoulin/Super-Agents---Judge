-- ============================================================================
-- AUDIT LOGS CNJ 615/2025 - Lex Intelligentia Judiciário v2.1
-- Schema PostgreSQL para persistência de logs de auditoria
-- ============================================================================

-- Criar extensão para UUID (se não existir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABELA PRINCIPAL: audit_logs_cnj615
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs_cnj615 (
    -- Identificação
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Sistema
    sistema_nome VARCHAR(100) NOT NULL DEFAULT 'Lex Intelligentia Judiciário',
    sistema_versao VARCHAR(20) NOT NULL,
    workflow_id VARCHAR(100),
    ambiente VARCHAR(50) DEFAULT 'development',

    -- Processo
    processo_numero VARCHAR(50),
    processo_classe VARCHAR(200),
    processo_assunto VARCHAR(500),
    processo_valor_causa DECIMAL(15,2),

    -- Operação
    operacao_tipo VARCHAR(50) NOT NULL,
    operacao_agente VARCHAR(50) NOT NULL,
    operacao_categoria VARCHAR(50),
    operacao_subcategoria VARCHAR(100),

    -- Modelos utilizados
    modelo_router VARCHAR(100),
    modelo_router_provider VARCHAR(50),
    modelo_router_confianca DECIMAL(5,4),
    modelo_geracao VARCHAR(100),
    modelo_geracao_provider VARCHAR(50),
    modelo_qa VARCHAR(100),
    modelo_qa_provider VARCHAR(50),

    -- Qualidade
    qa_score_final INTEGER,
    qa_score_estrutural INTEGER,
    qa_score_semantico INTEGER,
    qa_aprovado BOOLEAN DEFAULT FALSE,
    qa_falhas_criticas TEXT[], -- Array de strings
    qa_marcadores_revisao INTEGER DEFAULT 0,
    qa_recomendacoes TEXT[],

    -- Classificação de Risco CNJ 615
    risco_classificacao VARCHAR(20) NOT NULL, -- BAIXO, MEDIO, ALTO
    risco_score_qa INTEGER,
    risco_confianca_router DECIMAL(5,4),
    risco_marcadores INTEGER,

    -- Supervisão Humana
    supervisao_requer_revisao BOOLEAN DEFAULT TRUE,
    supervisao_revisao_realizada BOOLEAN DEFAULT FALSE,
    supervisao_magistrado VARCHAR(200),
    supervisao_data_revisao TIMESTAMPTZ,
    supervisao_observacoes TEXT,

    -- Integridade
    hash_input VARCHAR(64) NOT NULL,
    hash_output VARCHAR(64) NOT NULL,
    hash_contexto VARCHAR(64),
    hash_algoritmo VARCHAR(50) DEFAULT 'sha256',

    -- Métricas
    metricas_palavras_minuta INTEGER,
    metricas_tempo_execucao_ms INTEGER,
    metricas_tentativa INTEGER DEFAULT 1,

    -- Payload completo (JSON)
    payload_json JSONB,

    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índice para busca por processo
CREATE INDEX IF NOT EXISTS idx_audit_processo_numero
ON audit_logs_cnj615(processo_numero);

-- Índice para busca por data
CREATE INDEX IF NOT EXISTS idx_audit_timestamp
ON audit_logs_cnj615(timestamp DESC);

-- Índice para busca por agente
CREATE INDEX IF NOT EXISTS idx_audit_agente
ON audit_logs_cnj615(operacao_agente);

-- Índice para busca por risco
CREATE INDEX IF NOT EXISTS idx_audit_risco
ON audit_logs_cnj615(risco_classificacao);

-- Índice para busca por aprovação
CREATE INDEX IF NOT EXISTS idx_audit_aprovado
ON audit_logs_cnj615(qa_aprovado);

-- Índice para busca por revisão pendente
CREATE INDEX IF NOT EXISTS idx_audit_revisao_pendente
ON audit_logs_cnj615(supervisao_requer_revisao, supervisao_revisao_realizada);

-- Índice GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_audit_payload_gin
ON audit_logs_cnj615 USING GIN(payload_json);

-- ============================================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_audit_logs_updated_at ON audit_logs_cnj615;

CREATE TRIGGER update_audit_logs_updated_at
    BEFORE UPDATE ON audit_logs_cnj615
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View: Logs pendentes de revisão
CREATE OR REPLACE VIEW vw_audit_pendentes_revisao AS
SELECT
    id,
    timestamp,
    processo_numero,
    operacao_agente,
    risco_classificacao,
    qa_score_final,
    qa_marcadores_revisao
FROM audit_logs_cnj615
WHERE supervisao_requer_revisao = TRUE
  AND supervisao_revisao_realizada = FALSE
ORDER BY
    CASE risco_classificacao
        WHEN 'ALTO' THEN 1
        WHEN 'MEDIO' THEN 2
        ELSE 3
    END,
    timestamp DESC;

-- View: Métricas por agente
CREATE OR REPLACE VIEW vw_metricas_por_agente AS
SELECT
    operacao_agente,
    COUNT(*) as total_execucoes,
    ROUND(AVG(qa_score_final), 2) as score_medio,
    ROUND(AVG(metricas_tempo_execucao_ms), 0) as tempo_medio_ms,
    SUM(CASE WHEN qa_aprovado THEN 1 ELSE 0 END) as aprovados,
    ROUND(100.0 * SUM(CASE WHEN qa_aprovado THEN 1 ELSE 0 END) / COUNT(*), 2) as taxa_aprovacao
FROM audit_logs_cnj615
GROUP BY operacao_agente
ORDER BY total_execucoes DESC;

-- View: Distribuição de risco
CREATE OR REPLACE VIEW vw_distribuicao_risco AS
SELECT
    risco_classificacao,
    COUNT(*) as total,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentual
FROM audit_logs_cnj615
GROUP BY risco_classificacao
ORDER BY
    CASE risco_classificacao
        WHEN 'BAIXO' THEN 1
        WHEN 'MEDIO' THEN 2
        ELSE 3
    END;

-- View: Logs recentes (últimas 24h)
CREATE OR REPLACE VIEW vw_audit_ultimas_24h AS
SELECT *
FROM audit_logs_cnj615
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- ============================================================================
-- FUNÇÃO: Registrar revisão do magistrado
-- ============================================================================

CREATE OR REPLACE FUNCTION registrar_revisao(
    p_audit_id VARCHAR(50),
    p_magistrado VARCHAR(200),
    p_observacoes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE audit_logs_cnj615
    SET
        supervisao_revisao_realizada = TRUE,
        supervisao_magistrado = p_magistrado,
        supervisao_data_revisao = NOW(),
        supervisao_observacoes = p_observacoes
    WHERE id = p_audit_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO: Buscar logs por processo
-- ============================================================================

CREATE OR REPLACE FUNCTION buscar_logs_processo(p_processo_numero VARCHAR(50))
RETURNS TABLE (
    id VARCHAR(50),
    timestamp TIMESTAMPTZ,
    operacao_agente VARCHAR(50),
    risco_classificacao VARCHAR(20),
    qa_score_final INTEGER,
    qa_aprovado BOOLEAN,
    supervisao_revisao_realizada BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.timestamp,
        a.operacao_agente,
        a.risco_classificacao,
        a.qa_score_final,
        a.qa_aprovado,
        a.supervisao_revisao_realizada
    FROM audit_logs_cnj615 a
    WHERE a.processo_numero = p_processo_numero
    ORDER BY a.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS (ajustar conforme usuário)
-- ============================================================================

-- Exemplo (descomentar e ajustar):
-- GRANT SELECT, INSERT, UPDATE ON audit_logs_cnj615 TO n8n_user;
-- GRANT SELECT ON vw_audit_pendentes_revisao TO n8n_user;
-- GRANT SELECT ON vw_metricas_por_agente TO n8n_user;
-- GRANT SELECT ON vw_distribuicao_risco TO n8n_user;
-- GRANT EXECUTE ON FUNCTION registrar_revisao TO n8n_user;
-- GRANT EXECUTE ON FUNCTION buscar_logs_processo TO n8n_user;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE audit_logs_cnj615 IS 'Logs de auditoria do Lex Intelligentia Judiciário - CNJ 615/2025';
COMMENT ON COLUMN audit_logs_cnj615.risco_classificacao IS 'BAIXO, MEDIO ou ALTO conforme CNJ 615/2025';
COMMENT ON COLUMN audit_logs_cnj615.supervisao_requer_revisao IS 'Sempre TRUE por compliance CNJ 615';
COMMENT ON VIEW vw_audit_pendentes_revisao IS 'Minutas aguardando revisão do magistrado';
COMMENT ON VIEW vw_metricas_por_agente IS 'Estatísticas de performance por agente especializado';
