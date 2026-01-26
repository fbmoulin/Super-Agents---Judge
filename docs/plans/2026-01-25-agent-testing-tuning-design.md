# Agent Testing & Tuning System Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Test and validate 6 specialized legal agents, improving prompts until all achieve ≥90% quality score.

**Architecture:** Hybrid approach using direct Claude API calls for fast prompt iteration, followed by n8n workflow validation. LLM-as-judge for automated scoring with human review for final approval.

**Tech Stack:** Node.js, Anthropic SDK (Claude), Google Generative AI (Gemini for evaluation)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT TESTING & TUNING SYSTEM                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 1: Direct API Testing (Fast Iteration)                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │ Test Case│───▶│  Claude  │───▶│ Evaluator│                  │
│  │  (JSON)  │    │   API    │    │  (LLM)   │                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│                                       │                         │
│                                       ▼                         │
│                              ┌──────────────┐                   │
│                              │ Score Report │                   │
│                              │ + Suggestions│                   │
│                              └──────────────┘                   │
│                                                                 │
│  Phase 2: n8n Workflow Validation (Full Flow)                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │ Test Case│───▶│  v5.0    │───▶│ Human    │                  │
│  │  (JSON)  │    │ Workflow │    │ Review   │                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Components:**
- **Test Runner Script** - Sends cases to Claude API, collects outputs
- **LLM Evaluator** - Scores outputs on structure/legal/utility (uses Gemini for cost efficiency)
- **Prompt Library** - Agent system prompts as separate files for easy editing
- **Results Tracker** - JSON/Markdown reports tracking scores per agent

---

## Scoring System

**Three evaluation dimensions, weighted equally:**

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| **Structure** | 33% | Has RELATÓRIO, FUNDAMENTAÇÃO, DISPOSITIVO sections; proper formatting |
| **Legal** | 33% | Correct súmulas cited; appropriate articles; sound reasoning |
| **Utility** | 33% | Minimal [REVISAR] markers; actionable dispositivo; ready for use |

**Scoring rubric (per dimension):**

| Score | Meaning |
|-------|---------|
| 100% | Excellent - no issues |
| 85% | Good - minor issues only |
| 70% | Acceptable - needs editing |
| 50% | Poor - significant gaps |
| 0% | Fail - missing or wrong |

**Pass threshold:** Overall score ≥ 90%

**Evaluation prompt for LLM-as-judge:**
```
Avalie esta minuta judicial:
1. ESTRUTURA (0-100): Tem Relatório, Fundamentação, Dispositivo?
2. JURIDICO (0-100): Súmulas e artigos corretos para o domínio?
3. UTILIDADE (0-100): Pronta para uso com mínima edição?

Retorne JSON: {"estrutura": N, "juridico": N, "utilidade": N, "problemas": [...]}
```

---

## Test Cases

### A. Focused Cases (for prompt tuning)

One simple, one complex per agent:

| Agent | Simple Case | Complex Case |
|-------|-------------|--------------|
| Bancário | Juros abusivos simples | Empréstimo consignado fraudulento |
| Consumidor | Produto defeituoso | Negativação indevida + danos |
| Execução | Cheque prescrito | Título extrajudicial contestado |
| Locação | Despejo falta pagamento | Renovatória comercial |
| Saúde | Negativa cobertura simples | Urgência + dano moral |
| Genérico | Ação declaratória | Caso atípico misto |

**Total: 12 focused cases** (2 per agent)

### B. Existing Cases (for validation)

Use `test_cases/` folder after prompts are tuned - broader coverage.

### Case Format (JSON):

```json
{
  "id": "bancario_01_juros",
  "agent": "BANCARIO",
  "fatos": "O autor contratou empréstimo...",
  "questoes": "Há cobrança de juros abusivos?",
  "pedidos": "Revisão contratual...",
  "expected": {
    "sumulas": ["382/STJ", "379/STJ"],
    "resultado": "PROCEDENTE"
  }
}
```

---

## Iteration Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  ITERATION CYCLE (repeat until 90%+ on all agents)         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. RUN TEST                                                │
│     node scripts/test_agent.js bancario                     │
│     → Sends 2 cases to Claude API                           │
│     → Saves outputs to test_results/                        │
│                                                             │
│  2. AUTO-EVALUATE                                           │
│     node scripts/evaluate.js bancario                       │
│     → LLM scores each output                                │
│     → Generates report with problems list                   │
│                                                             │
│  3. REVIEW REPORT                                           │
│     You review: scores + flagged problems                   │
│     Decision: accept OR request prompt changes              │
│                                                             │
│  4. IMPROVE PROMPT (if needed)                              │
│     Edit agents/agent_BANCARIO.md                           │
│     → Add missing súmulas                                   │
│     → Clarify structure requirements                        │
│     → Adjust tone/style                                     │
│                                                             │
│  5. REPEAT until score ≥ 90%                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Files generated per iteration:**
- `test_results/bancario_2026-01-25_run1.json` - Raw outputs
- `test_results/bancario_2026-01-25_run1_eval.md` - Score report

---

## File Structure

**New files to create:**

```
scripts/
├── test_agent.js          # Runs test cases against Claude API
├── evaluate.js            # LLM-as-judge scoring
└── run_all_tests.js       # Runs all agents, generates summary

test_cases/focused/
├── bancario_01_simple.json
├── bancario_02_complex.json
├── consumidor_01_simple.json
├── consumidor_02_complex.json
└── ... (12 total)

agents/                    # Already exists, will update
├── agent_BANCARIO.md      # System prompts (editable)
├── agent_CONSUMIDOR.md
└── ...

test_results/              # Generated outputs
├── YYYY-MM-DD_summary.md  # Overall scores per agent
└── [agent]_[date]_[run].json
```

**Dependencies:**
- `@anthropic-ai/sdk` - Claude API calls
- `@google/generative-ai` - Gemini for evaluation (cheaper)
- Existing: Node.js environment

---

## Success Criteria

- [ ] All 6 agents score ≥ 90% on focused test cases
- [ ] Prompts documented and version-controlled
- [ ] Ready for n8n workflow validation

---

*Design created: 2026-01-25 | Validated by user*
