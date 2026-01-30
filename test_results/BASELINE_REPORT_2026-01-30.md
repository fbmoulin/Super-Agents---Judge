# Agent Testing Baseline Report

**Date:** 2026-01-30
**Target Score:** 90%
**Test Cases:** 12 (2 per agent)

---

## Summary

| Agent | Avg Score | Structure | Legal | Utility | Status |
|-------|-----------|-----------|-------|---------|--------|
| BANCARIO | 83% | 93 | 85 | 70 | ❌ Below target |
| CONSUMIDOR | 80% | 85 | 85 | 70 | ❌ Below target |
| EXECUCAO | 83% | 93 | 85 | 70 | ❌ Below target |
| LOCACAO | 85% | 100 | 85 | 70 | ❌ Below target |
| SAUDE | 78% | 85 | 78 | 70 | ❌ Below target |
| GENERICO | 83% | 93 | 85 | 70 | ❌ Below target |
| **Overall** | **82%** | **91** | **84** | **70** | ❌ |

**Passed:** 0/6 agents | **Average Gap:** 8 points to target

---

## Key Findings

### Strengths
- **Structure (91%):** Minutas consistently have Relatório, Fundamentação, Dispositivo sections
- **Legal (84%):** Correct súmulas and articles being cited for each domain

### Critical Issues (Utility at 70%)

1. **Missing Process Details**
   - All agents: número do processo, nome das partes not populated
   - Impact: Requires significant manual editing

2. **[REVISAR] Markers Penalized**
   - Evaluator flags [REVISAR] as reducing utility
   - Current prompts instruct agents to use [REVISAR] liberally for uncertainty
   - Trade-off: accuracy vs. perceived completeness

3. **Calculation Methodology**
   - BANCARIO/EXECUCAO: Need atuarial/contábil calculation specifications
   - Missing methodology for determining exact values

4. **Defense/Contestation Handling**
   - Most cases don't mention contestação
   - Agents assume or don't address defendant's arguments

---

## Per-Agent Issues

### BANCARIO (83%)
- Simple: Need actuarial calculation for interest differential
- Complex: Missing process number, party names

### CONSUMIDOR (80%)
- Both cases: [REVISAR] markers reducing utility
- Need economic condition analysis for danos morais

### EXECUCAO (83%)
- Simple: Prescription verification needed
- Complex: Interest calculation verification needed

### LOCACAO (85%) - Closest to target
- Simple: Mora purgation verification
- Complex: Benfeitorias authorization missing

### SAUDE (78%) - Lowest score
- Simple: Lowest legal score (70) - missing specific coverage arguments
- Complex: [REVISAR] markers + missing party info

### GENERICO (83%)
- Simple: Jurisprudence update verification
- Complex: Dispositivo lacks deadline/compliance details

---

## Improvement Strategy

### Priority 1: Utility (target +20 points)
1. Add instructions to populate placeholder format for process details
2. Clarify when [REVISAR] is appropriate vs. making reasonable assumptions
3. Add calculation methodology templates

### Priority 2: Legal (target +6 points)
1. SAUDE agent needs stronger coverage argument templates
2. Ensure all agents cite expected súmulas

### Priority 3: Structure (target +9 points)
1. Minor improvements to section formatting
2. Ensure consistent dispositivo structure

---

## Next Steps

1. **Prompt Iteration Cycle:**
   - Start with LOCACAO (closest to target at 85%)
   - Then BANCARIO, EXECUCAO, GENERICO (at 83%)
   - Then CONSUMIDOR (80%)
   - Finally SAUDE (78%)

2. **Per-Iteration:**
   - Modify agent system prompt
   - Re-run 2 test cases
   - Evaluate scores
   - Repeat until 90%+

3. **Estimated iterations:** 2-4 per agent

---

## Raw Results Files

- `bancario_2026-01-30_ml0761rk.json`
- `consumidor_2026-01-30_ml077kky.json`
- `execucao_2026-01-30_ml078sma.json`
- `locacao_2026-01-30_ml07a3zy.json`
- `saude_2026-01-30_ml07bogz.json`
- `generico_2026-01-30_ml07d8ck.json`

---

*Report generated: 2026-01-30 | Testing Framework: Claude Sonnet 4 (generation) + Gemini 2.0 Flash (evaluation)*
