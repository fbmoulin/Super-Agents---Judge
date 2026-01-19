# N8N WORKFLOW VALIDATION REPORT

**Workflow:** Lex Intelligentia Judiciário v2.1 - Agentes Otimizados
**Version:** 2.1.1
**Date:** 2026-01-14
**Status:** ✅ **PASSED**

---

## Executive Summary

The n8n workflow has been thoroughly validated across 5 comprehensive test categories:

1. ✅ **JSON Structure Validation** - PASSED
2. ✅ **JavaScript Syntax Check** - PASSED
3. ✅ **Connection Graph Validation** - PASSED
4. ✅ **Data Flow Simulation** - PASSED
5. ✅ **Credential Placeholder Check** - PASSED

**Overall Quality Score: 95/100**

### Key Findings

- **0 Critical Errors**
- **0 Warnings**
- **12 Success Paths** identified from webhook to response
- **2 Error Handling Paths** properly configured
- **8 Code Nodes** all validated with proper return statements
- **38 Total Nodes** with unique IDs and proper structure

---

## Test Results Details

### 1. JSON Structure Validation ✅

#### Results
- ✅ All required top-level fields present (`name`, `nodes`, `connections`)
- ✅ 38 nodes found, all properly structured
- ✅ All node IDs unique (no duplicates)
- ✅ Connections object properly formatted

#### Node Type Breakdown
- Webhook triggers: 1
- Error triggers: 1
- Code nodes: 8
- AI Agent nodes: 6
- LLM nodes: 6
- HTTP Request nodes: 3 (Gemini API calls)
- Switch nodes: 1
- IF condition nodes: 2
- Google Sheets nodes: 2
- Response nodes: 3
- Sticky notes: 5 (documentation)

---

### 2. JavaScript Syntax Check ✅

All 8 Code nodes validated successfully:

#### Code Node Analysis

**1. Set Context Buffer**
- ✅ Has proper return statement
- ✅ Return format: `[{ json: {...} }]`
- ✅ Null safety: Optional chaining + try-catch
- 📦 Uses: `$()`, `$execution`
- 🔗 References: `Webhook: Recebe FIRAC`, `Gemini Router`
- 📊 121 lines, ~413 tokens, complexity: 9
- ℹ️ 6 console.log statements (debugging)

**2. Set System Prompt**
- ✅ Has proper return statement
- ✅ Return format correct
- 📦 Uses: `$input`
- 📊 214 lines, ~882 tokens, complexity: 25

**3. Prepare for QA**
- ✅ Has proper return statement
- ✅ Return format correct
- 📦 Uses: `$input`, `$()`
- 🔗 References: `Set System Prompt`
- 📊 18 lines, ~55 tokens, complexity: 0

**4. QA Estrutural**
- ✅ Has proper return statement
- ✅ Return format correct
- 📦 Uses: `$input`
- 📊 105 lines, ~274 tokens, complexity: 4

**5. QA Consolidado**
- ✅ Has proper return statement
- ✅ Return format correct
- ✅ Null safety: Optional chaining + try-catch
- 📦 Uses: `$input`, `$()`
- 🔗 References: `IF: Executar QA Semântico?`, `QA Estrutural`
- 📊 130 lines, ~440 tokens, complexity: 18
- ℹ️ 2 console.log statements

**6. Audit Log CNJ 615**
- ✅ Has proper return statement
- ✅ Return format correct
- ✅ Null safety: Optional chaining + try-catch
- 📦 Uses: `$input`, `$execution`
- 📊 119 lines, ~353 tokens, complexity: 14

**7. Build Response**
- ✅ Has proper return statement
- ✅ Return format correct
- 📦 Uses: `$input`
- 📊 68 lines, ~139 tokens, complexity: 6

**8. Handle Error**
- ✅ Has proper return statement
- ✅ Return format correct
- ✅ Null safety: Optional chaining + try-catch
- 📦 Uses: `$input`, `$execution`
- 📊 74 lines, ~204 tokens, complexity: 5
- ℹ️ 1 console.log statement

#### Code Quality Assessment
- ✅ All nodes have proper return statements
- ✅ All nodes return correct format: `[{ json: {...} }]`
- ✅ Null safety implemented where needed (optional chaining, try-catch)
- ✅ All node references are valid (no broken references)
- ℹ️ Console.log statements present for debugging (acceptable)

---

### 3. Connection Graph Validation ✅

#### Connection Structure
- ✅ All connection targets exist
- ✅ No orphan nodes (excluding intentional nodes like LLMs, sticky notes)
- ✅ No circular references detected

#### Flow Paths Analysis

**Entry Point:** `Webhook: Recebe FIRAC`
**Exit Points:**
- `Respond: Success` (normal completion)
- `Respond: Error` (max retries exceeded)
- `Respond: Retry` (transient error, retry available)

**Main Success Paths: 12 total**

Each path follows this general structure:
```
Webhook → Gemini Router → Context Buffer → System Prompt → Switch →
[One of 6 AI Agents] → Prepare QA → QA Estrutural → IF Semantic QA? →
[Optional: QA Semântico] → QA Consolidado → Audit Log → Sheets →
Build Response → Respond Success
```

**Path Variations:**
- 6 paths through different specialized agents:
  - AI Agent: Bancário
  - AI Agent: Consumidor
  - AI Agent: Possessórias
  - AI Agent: Locação
  - AI Agent: Execução
  - AI Agent: Genérico
- For each agent: 2 paths (with/without semantic QA)
- Total: 6 agents × 2 QA options = 12 paths

**Typical Path Length:** 14-15 nodes

---

### 4. Data Flow Simulation ✅

#### Data Flow Tracing

**Starting Data:** Webhook receives FIRAC input
```json
{
  "fatos": "...",
  "questoes": "...",
  "regras_aplicaveis": "...",
  "aplicacao": "...",
  "conclusao": "...",
  "processo_numero": "...",
  "classe_processual": "...",
  "assunto": "..."
}
```

**Data Transformation Steps:**

1. **Gemini Router** → Classifies case into category
   - Output: `{ categoria, confianca, subcategoria, entidades_extraidas }`

2. **Context Buffer** → Creates persistent memory structure
   - Combines FIRAC + classification + entidades
   - Output: Complete context object with 5 blocks

3. **System Prompt** → Builds agent-specific prompts
   - Output: `{ system_prompt, human_message, agente, context }`

4. **Switch** → Routes to appropriate specialized agent

5. **AI Agent** → Generates legal draft
   - Output: Minuta de sentença/decisão

6. **QA Pipeline** → Quality validation
   - Estrutural: Regex checks for structure
   - Semântico (optional): Gemini evaluates legal quality
   - Consolidado: Combines scores

7. **Audit Log** → CNJ 615/2025 compliance tracking
   - Creates audit record with hashes

8. **Response** → Returns structured result

#### Variable Reference Validation

All inter-node variable references validated:

| Node | References | Status |
|------|-----------|--------|
| Set Context Buffer | Webhook: Recebe FIRAC, Gemini Router | ✅ Valid |
| Prepare for QA | Set System Prompt | ✅ Valid |
| QA Consolidado | IF: Executar QA Semântico?, QA Estrutural | ✅ Valid |

#### Null Safety Analysis

**Nodes with Null Safety Implemented:**
- ✅ Set Context Buffer (optional chaining + try-catch)
- ✅ QA Consolidado (optional chaining + try-catch)
- ✅ Audit Log CNJ 615 (optional chaining + try-catch)
- ✅ Handle Error (optional chaining + try-catch)

**Nodes without Complex Property Access:**
- Set System Prompt
- Prepare for QA
- QA Estrutural
- Build Response

**Verdict:** ✅ No potential null/undefined access issues

---

### 5. Credential & Environment Check ✅

#### Credentials Required

**3 Credential Types** must be configured in n8n:

1. **GEMINI_CREDENTIALS_ID** (httpHeaderAuth)
   - Used by: Gemini Router, QA Semântico - Gemini
   - Purpose: Google Gemini 2.5 Flash API access
   - Format: API Key in HTTP Header

2. **ANTHROPIC_CREDENTIALS_ID** (anthropicApi)
   - Used by: All 6 Claude nodes (Bancário, Consumidor, Possessórias, Locação, Execução, Genérico)
   - Purpose: Anthropic Claude Sonnet 4 API access
   - Format: Anthropic API credentials

3. **GOOGLE_SHEETS_CREDENTIALS_ID** (googleSheetsOAuth2Api)
   - Used by: Google Sheets: Audit Log, Google Sheets: Error Log
   - Purpose: Audit log persistence
   - Format: Google OAuth2 credentials

#### Environment Variables Required

**1 Environment Variable** must be set:

- **AUDIT_SHEET_ID**: Google Sheets document ID for audit logs
  - Used by: Google Sheets nodes
  - Format: Google Sheets document ID (from URL)
  - Example: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

#### Credential Status

All credential placeholders follow proper naming conventions:
- ✅ Descriptive names with `_ID` suffix
- ✅ Consistent naming across related nodes
- ⚠️ **Action Required:** Replace placeholders with actual credential IDs in n8n before deployment

---

## Error Handling Architecture ✅

### Error Flow Paths

**Error Trigger Node:** `Error Trigger` (catches any workflow error)

**2 Error Handling Paths Identified:**

#### Path 1: Retry Path
```
Error Trigger → Handle Error → IF: Retry? (TRUE) →
Google Sheets: Error Log → Respond: Retry (503)
```

#### Path 2: Final Failure Path
```
Error Trigger → Handle Error → IF: Retry? (FALSE) →
Respond: Error (500)
```

### Retry Logic

**Implementation in `Handle Error` node:**
- Max retries: 3
- Decision based on: `tentativa < MAX_TENTATIVAS`
- Retry response: HTTP 503 (Service Unavailable) with Retry-After header
- Final failure: HTTP 500 (Internal Server Error)

### Error Logging

All errors logged to Google Sheets (Errors tab) with:
- Timestamp
- Workflow ID
- Error node
- Error message
- Attempt number
- Action taken (RETRY/FAIL)

---

## Workflow Quality Metrics

### Overall Quality Score: 95/100

| Metric | Score | Weight | Assessment |
|--------|-------|--------|------------|
| **Structure** | 100/100 | 20% | ✅ Perfect JSON structure |
| **Connections** | 100/100 | 25% | ✅ All paths valid |
| **Error Handling** | 100/100 | 20% | ✅ Comprehensive error handling |
| **Code Quality** | 100/100 | 25% | ✅ All code validated |
| **Documentation** | 50/100 | 10% | ⚠️ Could use more sticky notes |

### Quality Assessment

**Strengths:**
- ✅ Robust error handling with retry logic
- ✅ Comprehensive null safety in critical nodes
- ✅ Proper data flow through all paths
- ✅ CNJ 615/2025 compliance built-in
- ✅ Dual QA system (structural + semantic)
- ✅ Complete audit trail with Google Sheets
- ✅ Multi-model architecture (Gemini + Claude)

**Minor Improvements:**
- ℹ️ Could add more sticky notes for documentation (current: 5)
- ℹ️ Console.log statements could be removed in production (9 total)

---

## Deployment Checklist

Before deploying this workflow to production:

### Configuration

- [ ] Set up Gemini API credentials in n8n
  - Credential ID: `GEMINI_CREDENTIALS_ID`
  - Type: HTTP Header Auth
  - Add header: `x-goog-api-key: YOUR_GEMINI_API_KEY`

- [ ] Set up Anthropic API credentials in n8n
  - Credential ID: `ANTHROPIC_CREDENTIALS_ID`
  - Type: Anthropic API
  - Add API key from Anthropic Console

- [ ] Set up Google Sheets OAuth2 credentials in n8n
  - Credential ID: `GOOGLE_SHEETS_CREDENTIALS_ID`
  - Type: Google Sheets OAuth2
  - Configure OAuth app and consent

- [ ] Create Google Sheets for audit logs
  - Create spreadsheet with tabs: `Logs` and `Errors`
  - Set environment variable `AUDIT_SHEET_ID`

- [ ] Configure environment variables in n8n
  - `AUDIT_SHEET_ID`: Your Google Sheets document ID

### Testing

- [ ] Test webhook endpoint with sample FIRAC data
- [ ] Test all 6 specialized agent paths
- [ ] Test error handling (simulate API failures)
- [ ] Test retry logic (verify 503 responses)
- [ ] Verify audit log persistence in Google Sheets
- [ ] Test QA scoring thresholds
- [ ] Validate CNJ 615/2025 compliance output

### Monitoring

- [ ] Set up monitoring for webhook endpoint
- [ ] Monitor Google Sheets audit log
- [ ] Set up alerts for error rates
- [ ] Monitor API quota usage (Gemini, Anthropic)
- [ ] Track QA score distributions

---

## Security Considerations

### Credential Management
- ✅ Credentials stored as n8n credential objects (not in code)
- ✅ Environment variables used for sensitive IDs
- ⚠️ Ensure Google Sheets has proper access controls

### Data Privacy
- ⚠️ **IMPORTANT:** Workflow processes legal case data
- Ensure compliance with:
  - LGPD (Brazilian data protection law)
  - CNJ regulations for judicial data
  - Internal court data policies

### API Security
- ✅ All external API calls use HTTPS
- ✅ Proper authentication headers configured
- ⚠️ Monitor API rate limits:
  - Gemini 2.5 Flash: Check Google Cloud quotas
  - Claude Sonnet 4: Check Anthropic usage limits

---

## Performance Considerations

### Expected Latency

| Component | Est. Time | Notes |
|-----------|-----------|-------|
| Gemini Router | 1-3s | Classification + entity extraction |
| Context Buffer | <100ms | Pure JavaScript |
| AI Agent (Claude) | 5-15s | Depends on output length |
| QA Estrutural | <200ms | Regex-based validation |
| QA Semântico | 2-4s | Gemini evaluation |
| Audit Log | <100ms | Hash computation |
| Google Sheets | 1-2s | Network + write operation |

**Total Expected Time:** 10-25 seconds per request

### Optimization Opportunities

1. **Parallel QA Checks:** QA Estrutural and QA Semântico could run in parallel
2. **Async Audit Log:** Could use background execution for Sheets write
3. **Caching:** Consider caching classification results for similar cases

---

## Fixes Applied in v2.1.1

### Issue: Windows Line Endings in QA Estrutural

**Problem:**
- Regex patterns in QA Estrutural node failed on Windows (`\r\n` line endings)

**Fix Applied:**
```javascript
const normalizedMinuta = minuta.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
```

**Status:** ✅ Fixed

### Issue: QA Consolidado Data Flow

**Problem:**
- Data from both IF branches needed proper handling

**Fix Applied:**
```javascript
const inputData = $input.first().json;

if (inputData.candidates) {
  // Came from QA Semântico path
  geminiData = inputData;
  estruturalData = $('IF: Executar QA Semântico?').item?.json || $('QA Estrutural').item?.json;
} else if (inputData.qa_estrutural) {
  // Came from skip semantic path
  estruturalData = inputData;
  geminiData = null;
}
```

**Status:** ✅ Fixed

### Issue: Hash Function Uniqueness

**Problem:**
- Simple hash function could produce collisions

**Fix Applied:**
- Implemented djb2 + FNV-1a hybrid hash
- Added length component for additional uniqueness
- 32-character output with checksum

**Status:** ✅ Fixed

---

## Conclusion

**Workflow Status:** ✅ **PRODUCTION READY**

The Lex Intelligentia Judiciário v2.1.1 workflow has passed all validation tests with a quality score of **95/100**. The workflow is well-structured, properly handles errors, implements robust data flow, and includes comprehensive audit logging for CNJ 615/2025 compliance.

**Critical Actions Before Deployment:**
1. Configure all 3 credential types in n8n
2. Set `AUDIT_SHEET_ID` environment variable
3. Create Google Sheets with proper tabs (Logs, Errors)
4. Test all agent paths with sample data
5. Verify audit log persistence

**Recommended Actions:**
1. Add more documentation sticky notes
2. Consider removing console.log in production
3. Set up monitoring and alerting
4. Establish API quota monitoring

---

## Appendix: Validation Scripts

### Running Validation Scripts

**Comprehensive Validation:**
```bash
node validate_workflow.js [path-to-workflow.json]
```

**Detailed Analysis:**
```bash
node validate_detailed.js [path-to-workflow.json]
```

### Test Coverage

- ✅ JSON structure validation
- ✅ Node ID uniqueness
- ✅ Connection target validation
- ✅ JavaScript syntax checking
- ✅ n8n context usage validation
- ✅ Null safety analysis
- ✅ Return statement validation
- ✅ Inter-node reference validation
- ✅ Data flow path tracing
- ✅ Error handling path validation
- ✅ Credential configuration check
- ✅ Environment variable detection
- ✅ Code complexity metrics
- ✅ Quality scoring

---

**Report Generated:** 2026-01-14
**Validated By:** Automated validation suite v1.0
**Workflow Version:** 2.1.1
**Validation Result:** ✅ PASSED
