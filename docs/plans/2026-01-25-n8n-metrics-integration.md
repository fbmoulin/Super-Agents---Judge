# n8n Metrics Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Quality Validator and Metrics Logger nodes to n8n workflow v3.1, enabling real-time metrics tracking in Supabase with dashboard visualization.

**Architecture:** Quality Validator (Code node) validates decision structure/citations/reasoning after each agent → Metrics Logger (HTTP node) sends execution data + scores to Supabase via `log_execution()` RPC → Dashboard receives real-time updates.

**Tech Stack:** n8n Cloud, Supabase (PostgreSQL + Realtime), Next.js dashboard

---

## Prerequisites

- [x] Supabase tables created (`executions`, `quality_scores`)
- [x] `log_execution()` RPC function deployed
- [x] Realtime enabled on both tables
- [x] Dashboard UI operational at `/dashboard`
- [ ] n8n Cloud environment variables configured

---

## Task 1: Configure n8n Supabase Credentials

**Files:**
- Configure: n8n Cloud → Settings → Variables

**Step 1: Add Supabase URL variable**

In n8n Cloud Dashboard:
1. Go to Settings → Variables
2. Add variable:
   - Name: `SUPABASE_URL`
   - Value: `https://uxhfwlerodittdmrcgnp.supabase.co`

**Step 2: Add Supabase Anon Key variable**

Add variable:
   - Name: `SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aGZ3bGVyb2RpdHRkbXJjZ25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjEwNDYsImV4cCI6MjA4MzQ5NzA0Nn0.C8_ouc3D2eRgpjkbfifnfpSwIK8ZIiYL-tbDDLZgUek`

**Step 3: Verify configuration**

Run: Test workflow execution to confirm variables are accessible via `$env.SUPABASE_URL`

---

## Task 2: Add Quality Validator Code Node

**Files:**
- Modify: `n8n_workflow_v3.1_metrics.json` (add node after "QA Consolidado")

**Step 1: Create Quality Validator node definition**

Add this node to the `nodes` array:

```json
{
  "parameters": {
    "jsCode": "// ============================================================================\n// QUALITY VALIDATOR - Structure, Citations, Reasoning\n// Lex Intelligentia Judiciário v3.1 - Metrics Integration\n// ============================================================================\n\nconst data = $input.first().json;\nconst minuta = data.minuta_gerada || '';\nconst ctx = data.contexto || {};\n\n// ============================================================================\n// 1. STRUCTURE VALIDATION\n// ============================================================================\n\nconst requiredSections = [\n  { name: 'RELATÓRIO', pattern: /^##?\\s*I\\s*[-–]?\\s*REL[AÁ]T[OÓ]RIO|^##?\\s*REL[AÁ]T[OÓ]RIO/mi },\n  { name: 'FUNDAMENTAÇÃO', pattern: /^##?\\s*II\\s*[-–]?\\s*FUNDAMENTA[CÇ][AÃ]O|^##?\\s*FUNDAMENTA[CÇ][AÃ]O/mi },\n  { name: 'DISPOSITIVO', pattern: /^##?\\s*III\\s*[-–]?\\s*DISPOSITIVO|^##?\\s*DISPOSITIVO/mi }\n];\n\nconst structureIssues = [];\nlet structureScore = 1.0;\n\nfor (const section of requiredSections) {\n  if (!section.pattern.test(minuta)) {\n    structureIssues.push(`Missing: ${section.name}`);\n    structureScore -= 0.33;\n  }\n}\n\nstructureScore = Math.max(0, structureScore);\n\n// ============================================================================\n// 2. CITATION VALIDATION\n// ============================================================================\n\n// Extract cited súmulas and temas\nconst citedSumulas = minuta.match(/S[úu]mula\\s+(\\d+)/gi) || [];\nconst citedTemas = minuta.match(/Tema\\s+(\\d+)/gi) || [];\nconst citedArtigos = minuta.match(/art(?:igo)?\\.?\\s*(\\d+)/gi) || [];\n\n// Score based on presence of citations\nlet citationScore = 0.5; // Base score\nconst citationIssues = [];\n\nif (citedSumulas.length > 0 || citedTemas.length > 0) {\n  citationScore += 0.3;\n}\nif (citedArtigos.length > 0) {\n  citationScore += 0.2;\n}\n\n// Check for empty/generic citations\nif (minuta.includes('[REVISAR: jurisprudência]') || minuta.includes('[REVISAR: fundamentação]')) {\n  citationScore -= 0.15;\n  citationIssues.push('Contains unverified citation markers');\n}\n\ncitationScore = Math.min(1, Math.max(0, citationScore));\n\n// ============================================================================\n// 3. REASONING VALIDATION\n// ============================================================================\n\n// Split by sections and count paragraphs\nconst fundamentacaoMatch = minuta.match(/FUNDAMENTA[CÇ][AÃ]O[\\s\\S]*?(?=DISPOSITIVO|$)/i);\nconst fundamentacaoText = fundamentacaoMatch ? fundamentacaoMatch[0] : '';\n\nconst paragraphs = fundamentacaoText.split(/\\n\\n+/).filter(p => p.trim().length > 50);\nlet reasoningScore = 0.5;\nconst reasoningIssues = [];\n\n// Check paragraph depth (minimum 3 substantial paragraphs in fundamentação)\nif (paragraphs.length >= 5) {\n  reasoningScore += 0.3;\n} else if (paragraphs.length >= 3) {\n  reasoningScore += 0.15;\n} else {\n  reasoningIssues.push(`Fundamentação shallow: only ${paragraphs.length} paragraphs`);\n}\n\n// Check for legal reasoning patterns (citation → application → conclusion)\nconst hasLegalPattern = /(?:conforme|nos termos|segundo|de acordo com)[\\s\\S]{10,200}(?:portanto|assim|desta forma|destarte)/i.test(fundamentacaoText);\nif (hasLegalPattern) {\n  reasoningScore += 0.2;\n}\n\nreasoningScore = Math.min(1, Math.max(0, reasoningScore));\n\n// ============================================================================\n// 4. COMPILE QUALITY RESULT\n// ============================================================================\n\nconst overallScore = (structureScore + citationScore + reasoningScore) / 3;\n\nconst allIssues = [\n  ...structureIssues.map(i => ({ type: 'structure', message: i })),\n  ...citationIssues.map(i => ({ type: 'citation', message: i })),\n  ...reasoningIssues.map(i => ({ type: 'reasoning', message: i }))\n];\n\nconst quality = {\n  structure_score: Math.round(structureScore * 100) / 100,\n  citation_score: Math.round(citationScore * 100) / 100,\n  reasoning_score: Math.round(reasoningScore * 100) / 100,\n  overall_score: Math.round(overallScore * 100) / 100,\n  issues: allIssues,\n  citations_found: {\n    sumulas: citedSumulas.length,\n    temas: citedTemas.length,\n    artigos: citedArtigos.length\n  }\n};\n\n// Pass through all data with quality scores added\nreturn [{\n  json: {\n    ...data,\n    quality_validation: quality\n  }\n}];"
  },
  "id": "quality-validator",
  "name": "Quality Validator",
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [4340, 400],
  "notes": "Validates structure/citations/reasoning for metrics dashboard"
}
```

**Step 2: Update workflow connections**

Update the connections to insert Quality Validator between "QA Consolidado" and "Audit Log CNJ 615":
- QA Consolidado → Quality Validator
- Quality Validator → Audit Log CNJ 615

**Step 3: Verify node placement**

Run: Visual inspection in n8n editor to confirm node is positioned correctly in flow

---

## Task 3: Add Metrics Logger HTTP Node

**Files:**
- Modify: `n8n_workflow_v3.1_metrics.json` (add node after "Quality Validator")

**Step 1: Create Metrics Logger node definition**

Add this node to the `nodes` array:

```json
{
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
          "name": "Authorization",
          "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        },
        {
          "name": "Prefer",
          "value": "return=representation"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ {\n  \"p_workflow_id\": $execution.id,\n  \"p_agent_name\": $json.compliance_cnj615?.agente_utilizado || 'agent_generico',\n  \"p_domain\": $json.contexto?.classificacao?.categoria || 'generico',\n  \"p_started_at\": $json.contexto?.execucao?.timestamp_inicio || new Date().toISOString(),\n  \"p_finished_at\": new Date().toISOString(),\n  \"p_duration_ms\": $json.audit_log?.tempo_execucao_ms || 0,\n  \"p_status\": $json.qa_result?.aprovado ? 'success' : 'warning',\n  \"p_error_message\": null,\n  \"p_tokens_used\": 0,\n  \"p_rag_results_count\": 0,\n  \"p_cache_hit\": false,\n  \"p_quality\": {\n    \"structure_score\": $json.quality_validation?.structure_score || 0,\n    \"citation_score\": $json.quality_validation?.citation_score || 0,\n    \"reasoning_score\": $json.quality_validation?.reasoning_score || 0,\n    \"issues\": $json.quality_validation?.issues || []\n  }\n} }}",
    "options": {
      "timeout": 10000,
      "allowUnauthorizedCerts": false
    }
  },
  "id": "metrics-logger",
  "name": "Metrics Logger",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [4560, 400],
  "notes": "Sends execution metrics to Supabase for dashboard"
}
```

**Step 2: Update workflow connections**

Update connections:
- Quality Validator → Metrics Logger
- Metrics Logger → Audit Log CNJ 615

**Step 3: Add error handling**

Configure the node to continue on fail (metrics logging should not block the main flow):
- Set `continueOnFail: true` in node parameters

---

## Task 4: Update Workflow JSON File

**Files:**
- Modify: `n8n_workflow_v3.1_metrics.json`

**Step 1: Read current workflow**

Read the entire workflow file to understand current structure.

**Step 2: Insert Quality Validator and Metrics Logger nodes**

Add both nodes after position 4300 (after QA Consolidado), before Audit Log (4520).

**Step 3: Update connections object**

Modify the `connections` section:
```json
{
  "QA Consolidado": {
    "main": [[{ "node": "Quality Validator", "type": "main", "index": 0 }]]
  },
  "Quality Validator": {
    "main": [[{ "node": "Metrics Logger", "type": "main", "index": 0 }]]
  },
  "Metrics Logger": {
    "main": [[{ "node": "Audit Log CNJ 615", "type": "main", "index": 0 }]]
  }
}
```

**Step 4: Update workflow version note**

Update the sticky note to reflect v3.1 changes:
- Add: "+ Quality Validator (structure/citations/reasoning)"
- Add: "+ Metrics Logger (Supabase integration)"

**Step 5: Verify JSON validity**

Run: `node -e "JSON.parse(require('fs').readFileSync('n8n_workflow_v3.1_metrics.json'))"`
Expected: No errors

**Step 6: Commit changes**

```bash
git add n8n_workflow_v3.1_metrics.json
git commit -m "feat(n8n): add Quality Validator and Metrics Logger nodes

- Quality Validator: structure/citations/reasoning validation
- Metrics Logger: Supabase RPC integration via log_execution()
- Dashboard receives real-time metrics

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Test Integration End-to-End

**Files:**
- Test: n8n workflow execution
- Verify: Supabase data
- Verify: Dashboard display

**Step 1: Deploy workflow to n8n Cloud**

1. Open n8n Cloud
2. Import updated `n8n_workflow_v3.1_metrics.json`
3. Activate workflow

**Step 2: Send test FIRAC request**

```bash
curl -X POST https://[N8N_WEBHOOK_URL]/webhook/lex-intelligentia-agentes \
  -H "Content-Type: application/json" \
  -d '{
    "fatos": "O autor celebrou contrato de financiamento com o réu...",
    "questoes": "Houve cobrança de juros abusivos?",
    "pedidos": "Revisão contratual e devolução em dobro",
    "classe_processual": "Procedimento Comum Cível",
    "assunto": "Contratos Bancários"
  }'
```

**Step 3: Verify Supabase data**

Run SQL in Supabase SQL Editor:
```sql
SELECT e.id, e.agent_name, e.domain, e.duration_ms, e.status,
       q.structure_score, q.citation_score, q.reasoning_score, q.overall_score
FROM executions e
JOIN quality_scores q ON e.id = q.execution_id
ORDER BY e.created_at DESC
LIMIT 5;
```

Expected: New execution row with quality scores

**Step 4: Verify dashboard updates**

1. Open `http://localhost:3000/dashboard`
2. Confirm new execution appears in "Execuções Recentes"
3. Confirm quality chart updates with new scores

**Step 5: Document test results**

Create test validation record with timestamp, execution ID, and scores.

---

## Task 6: Handle Error Path Metrics

**Files:**
- Modify: `n8n_workflow_v3.1_metrics.json` (add metrics to error handler)

**Step 1: Add Metrics Logger to error path**

Create a second metrics logger node for error cases:

```json
{
  "parameters": {
    "method": "POST",
    "url": "={{ $env.SUPABASE_URL }}/rest/v1/rpc/log_execution",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        { "name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}" },
        { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}" },
        { "name": "Content-Type", "value": "application/json" }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ {\n  \"p_workflow_id\": $execution.id,\n  \"p_agent_name\": $json.failed_node || 'unknown',\n  \"p_domain\": 'error',\n  \"p_started_at\": new Date().toISOString(),\n  \"p_finished_at\": new Date().toISOString(),\n  \"p_duration_ms\": 0,\n  \"p_status\": 'error',\n  \"p_error_message\": $json.original_error || 'Unknown error',\n  \"p_tokens_used\": 0,\n  \"p_rag_results_count\": 0,\n  \"p_cache_hit\": false,\n  \"p_quality\": null\n} }}"
  },
  "id": "metrics-logger-error",
  "name": "Metrics Logger (Error)",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [980, 700],
  "continueOnFail": true,
  "notes": "Logs failed executions to Supabase"
}
```

**Step 2: Connect to error handler**

Add connection from "Handle Error" node to "Metrics Logger (Error)"

**Step 3: Commit changes**

```bash
git add n8n_workflow_v3.1_metrics.json
git commit -m "feat(n8n): add error path metrics logging

- Track failed executions in Supabase
- Enables dashboard error rate monitoring

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

- [ ] n8n environment variables configured (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Quality Validator node validates structure/citations/reasoning
- [ ] Metrics Logger node sends data to Supabase successfully
- [ ] Dashboard displays new executions within 2 seconds
- [ ] Error executions are logged with status='error'
- [ ] All tests pass end-to-end

---

## Files Modified

| File | Action |
|------|--------|
| `n8n_workflow_v3.1_metrics.json` | Modify (add 3 nodes) |
| n8n Cloud environment variables | Configure (2 vars) |

---

## Dependencies

- Supabase project: `uxhfwlerodittdmrcgnp`
- n8n Cloud account with workflow access
- Dashboard running on localhost:3000
