# Lex Intelligentia v2.1.1 - Production Test Report (Session 2)

**Date:** 2026-01-19
**Workflow:** Lex Intelligentia v2.1.1 - FIXED FOR CLOUD
**Environment:** n8n Cloud (lexintel.app.n8n.cloud)

---

## Executive Summary

**Overall Result:** 3/4 agents tested PASSED (75%)

| Agent | Status | Confidence | Execution Time |
|-------|--------|------------|----------------|
| Bancário | ✅ PASS | 0.98 | ~30s |
| Consumidor | ✅ PASS | 0.98 | ~37s |
| Execução | ❌ FAIL | 0.30 | ~31s |
| Locação | ✅ PASS | 0.98 | ~27s |

---

## Detailed Results

### 1. Bancário Agent ✅
- **Test Case:** caso_01_emprestimo_consignado.json
- **Classification:** agent_BANCARIO
- **Subcategory:** Empréstimo fraudulento
- **Confidence:** 0.98
- **Router Status:** success
- **Entity Extraction:** Working (values, dates, parties)

### 2. Consumidor Agent ✅
- **Test Case:** caso_03_cobranca_indevida.json
- **Classification:** agent_CONSUMIDOR
- **Subcategory:** Falha de serviço
- **Confidence:** 0.98
- **Router Status:** success
- **Entities Extracted:**
  - Values: R$ 89,90 | R$ 29,90 | R$ 179,40 | R$ 358,80 | R$ 5.000,00
  - Dates: 6 dates from 2020-2026
  - Parties: Autora, operadora de telefonia Re
  - Laws: CDC

### 3. Execução Agent ❌ FAILED
- **Test Case:** caso_01_titulo_extrajudicial.json
- **Expected:** agent_EXECUCAO
- **Got:** agent_generico (FALLBACK)
- **Confidence:** 0.30 (very low)
- **Router Status:** fallback
- **Root Cause:** Gemini response truncated by MAX_TOKENS
- **Console Log:** `Gemini: Resposta truncada por MAX_TOKENS`
- **Impact:** Case routed to generic agent instead of specialized execução agent

### 4. Locação Agent ✅
- **Test Case:** caso_01_despejo_falta_pagamento.json
- **Classification:** agent_LOCACAO
- **Subcategory:** Despejo por falta de pagamento
- **Confidence:** 0.98
- **Router Status:** success
- **Entities Extracted:**
  - Values: R$ 2.500,00 | R$ 12.500,00 | 3 aluguéis
  - Dates: 7 dates from março 2023 to 15/11/2025
  - Parties: autor, réu, fiador
  - Laws: Lei 8.245/91

---

## Issues Found

### Issue 1: v2.2 Workflow Import Incompatibility (CRITICAL)

**Severity:** CRITICAL
**Status:** Requires manual resolution

**Description:**
Attempted to import v2.2 workflow (with 11 agents) to n8n Cloud via file import.
Import failed with error: `Could not find property option`

**Root Cause:**
The v2.2 workflow JSON contains node configurations that are incompatible with n8n Cloud's current version. Likely causes:
- Node property format differences between local and cloud versions
- Deprecated property names in Switch or AI Agent nodes
- Missing credential references

**Recommendation:**
1. Manually compare node configurations between v2.1.1 and v2.2
2. Export current v2.1.1 from n8n Cloud as reference
3. Recreate new agents manually in n8n Cloud interface
4. Add new agents one by one with testing

---

### Issue 2: Execução Router Truncation (HIGH)

**Severity:** HIGH
**Status:** Requires workflow adjustment

**Description:**
The Gemini Router is experiencing response truncation for certain case types (specifically execução), causing:
- Router fallback to generic agent
- Very low confidence (0.30)
- Entity extraction failures (all arrays empty)

**Console Evidence:**
```
[LOG] [Node: "Set Context Buffer"] 'Gemini: Resposta truncada por MAX_TOKENS'
```

**Root Cause Analysis:**
Gemini 2.5 Flash uses internal "thinking tokens" that consume the maxOutputTokens budget.
The execução case prompt may be triggering more internal reasoning, exhausting the token budget before output completion.

**Affected Output:**
```json
{
  "agente": "agent_generico",
  "categoria": "generico",
  "subcategoria": null,
  "confianca": 0.3,
  "router_status": "fallback"
}
```

**Recommended Fix:**
In the Gemini Router node:
1. Increase `maxOutputTokens` from 2000 to 3000
2. OR reduce prompt complexity
3. OR add retry logic for truncation detection

---

## Workflow Metrics

| Metric | Value |
|--------|-------|
| Average Execution Time | ~31s |
| Success Rate (Classification) | 75% (3/4) |
| Entity Extraction Success | 75% (3/4) |
| Router Confidence (Successful) | 0.98 average |

---

## Pending Tests

The following agents were NOT tested in this session:
- Possessórias (exists in v2.1.1)
- Genérico (exists in v2.1.1)
- Saúde Cobertura (v2.2 only)
- Saúde Contratual (v2.2 only)
- Trânsito (v2.2 only)
- Usucapião (v2.2 only)
- Incorporação (v2.2 only)

---

## Recommendations

1. **Immediate:** Increase Gemini Router maxOutputTokens to fix execução truncation
2. **Short-term:** Manually add v2.2 agents to n8n Cloud one by one
3. **Medium-term:** Implement token budget monitoring in Context Buffer
4. **Long-term:** Consider alternative routing strategies for edge cases

---

*Report generated: 2026-01-19 09:55 UTC*
*Test automation: Playwright MCP + curl*
