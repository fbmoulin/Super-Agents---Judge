# Superagents Judge - Project Structure Overview

## Project Summary
- **Name:** Lex Intelligentia Judiciário
- **Version:** 2.8.0
- **Type:** Multi-Agent System for Judicial Document Automation
- **Compliance:** CNJ 615/2025 (Brazilian judicial system)
- **Quality Score:** 95/100
- **Target:** 2ª Vara Cível de Cariacica/ES

## Key Technologies
- **Orchestration:** n8n Cloud
- **AI Models:** Claude Sonnet 4 (Anthropic), Gemini 2.5 Flash (Google)
- **Vector Store:** Qdrant 1.7+
- **Persistence:** Google Sheets
- **UI:** Next.js 15.2.8
- **Python Backend:** Agent OS with Flask/FastAPI structure

## Directory Structure

### Root Level Files
- `package.json` - Node.js project config
- `jest.config.js` - Jest testing configuration
- `requirements.txt` - Python dependencies
- `.env.keys.template` - Environment variable template
- `.gitignore` - Git ignore rules
- `README.md` - Main documentation

### Key Directories

#### `/config`
- `index.js` - Configuration loader with agent/prompt management
- `security.js` - Security validation functions
- `settings.json` - Centralized settings (21 agents, API configs, validation thresholds)
- `/config/prompts` - System prompts for agents

#### `/docker`
- `docker-compose-qdrant.yml` - Qdrant + Redis setup

#### `/tests`
- `setup.js` - Jest setup file
- `/unit` - Unit tests (5 existing: config, http-client, logger, security, validation-criteria)
- `/integration` - Integration test directory (exists, no files yet)
- `/fixtures` - Test fixtures
- `/mocks` - Mock data for API responses

#### `/scripts`
- `/validators` - n8n workflow validators, agent validators
- `/evaluators` - LLM evaluation scripts
- `/utils` - PDF extraction, cache invalidation
- `/data` - STJ downloader, Qdrant ingestion scripts
- `/workflows` - Workflow creation and integration helpers

#### `/agent-os` (Python)
- `/agents` - Individual agent implementations
- `/app` - Main application
- `pyproject.toml` - Python package config
- `.venv` - Virtual environment

#### `/agent-ui` (Next.js)
- Next.js 15.2.8 application
- Tailwind CSS + Radix UI components
- Supabase integration
- `/src` - Source code directory

#### `/n8n_nodes`
- Custom n8n node implementations

#### `/data`
- `/stj_raw` - Raw STJ data
- `/stj_chunks` - Processed chunks for vector store

#### `/test_cases`
- Multiple subdirectories by area: alimentos, bancario, cobranca, consumidor, divorcio, execucao, etc.
- `/processos_reais` - Real judicial process test cases
- `/focused` - Focused test cases

#### `/docs`
- Comprehensive documentation (52+ markdown files)
- `/guides` - Integration and setup guides
- `/plans` - Development roadmaps and planning docs
- `/validation` - Validation reports and checklists
- Topics: Security, RAG integration, prompt engineering, testing plans, etc.

#### `/migrations`
- Database migration scripts

## GitHub Actions CI/CD

### Current Workflow (`.github/workflows/ci.yml`)
**Jobs:**
1. **test** - Unit tests with coverage reporting
2. **validate-workflows** - n8n workflow JSON validation
3. **lint-config** - Configuration file validation
4. **security-check** - Secret exposure detection, .gitignore validation
5. **all-checks** - Consolidated check aggregation

### Environment
- Node 20
- Test timeout: 10s
- Coverage reports: text, lcov, html

## Configuration Management

### agents/settings.json Structure
```json
{
  "api": {
    "anthropic": { "model": "claude-sonnet-4-20250514", "maxTokens": 8192 },
    "gemini": { "model": "gemini-2.0-flash" }
  },
  "validation": { "threshold": 75, "targetScore": 90 },
  "agents": {
    "core": ["BANCARIO", "CONSUMIDOR", "EXECUCAO", "LOCACAO", "POSSESSORIAS", "GENERICO"],
    "saude": ["SAUDE_COBERTURA", "SAUDE_CONTRATUAL", "SAUDE_MEDICAMENTOS"],
    "familia": ["ALIMENTOS", "GUARDA", "PATERNIDADE", "DIVORCIO", "INVENTARIO"],
    "especializado": ["TRANSITO", "USUCAPIAO", "INCORPORACAO", "SEGUROS", "COBRANCA", "REPARACAO_DANOS"],
    "fazendaPublica": ["EXECUCAO_FISCAL", "RESP_CIVIL_ESTADO", "MANDADO_SEGURANCA"]
  }
}
```

## Environment Variables (.env.keys.template)

**API Keys Required:**
- GEMINI_API_KEY (Google AI)
- ANTHROPIC_API_KEY (Claude)
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (OAuth2)
- OPENAI_API_KEY (Embeddings)

**Infrastructure:**
- QDRANT_HOST, QDRANT_PORT
- REDIS_HOST, REDIS_PORT (Optional - Phase 4.0)

**Integration:**
- AUDIT_SHEET_ID (Google Sheets for audit logs)
- N8N_WEBHOOK_URL

## Existing Test Setup

### Jest Configuration
- Test environment: Node
- Test patterns: `**/tests/**/*.test.js`, `**/tests/**/*.spec.js`
- Coverage: config/, scripts/ directories
- Setup file: tests/setup.js

### Existing Tests (14 suites, 328 tests)
**Unit (13):** cache, config, entity-extraction, graph, hallucination-detector, http-client, hybrid-search, logger, parallel-qa, pipeline, rag, security, validation-criteria
**Integration (1):** pipeline.integration

### Test Fixtures
- `/tests/fixtures/test-cases.js` - Test case data

### Mocks
- `/tests/mocks/anthropic.js` - Anthropic API mocks
- `/tests/mocks/gemini.js` - Gemini API mocks

## 23 Specialized Agents (100% Validated)

**Core (7):** BANCARIO, CONSUMIDOR, EXECUCAO, LOCACAO, POSSESSORIAS, OBRIGACIONAL, GENERICO
**Health (3):** SAUDE_COBERTURA, SAUDE_CONTRATUAL, SAUDE_MEDICAMENTOS
**Family (5):** ALIMENTOS, GUARDA, PATERNIDADE, DIVORCIO, INVENTARIO
**Specialized (7):** TRANSITO, USUCAPIAO, INCORPORACAO, SEGUROS, COBRANCA, REPARACAO_DANOS, RESPONSABILIDADE_CIVIL
**Public Sector (3):** EXECUCAO_FISCAL, RESP_CIVIL_ESTADO, MANDADO_SEGURANCA

## NPM Scripts Available

```json
{
  "test": "jest",
  "test:coverage": "jest --coverage",
  "validate": "node scripts/validators/validate_workflow.js n8n_workflow_v5.1_improved_prompts.json",
  "validate:v26": "node scripts/validators/validate_workflow.js n8n_workflow_v2.6_fazenda_publica.json",
  "validate:agent": "node scripts/validators/agent_validator.js",
  "validate:all": "node scripts/validators/agent_validator.js --all",
  "evaluate": "node scripts/evaluators/llm_evaluator.js",
  "test:agent": "node scripts/evaluators/test_and_evaluate.js",
  "test:real": "node scripts/validators/agent_validator.js --all --real",
  "download:stj": "python scripts/data/stj_downloader.py --download-all",
  "ingest:qdrant": "python scripts/data/qdrant_ingest.py"
}
```

## What Needs to be Created (Deployment Plan)

### Configuration & Environment
- [ ] `.env.keys` file (copy from template, populate values)
- [ ] Kubernetes deployment manifests (if containerized)
- [ ] Docker build files (if deploying to cloud)
- [ ] Production environment config
- [ ] SSL/TLS certificates config
- [ ] Rate limiting config

### Deployment Infrastructure
- [ ] Docker Compose production setup (beyond qdrant-only)
- [ ] Kubernetes manifests (k8s deployment YAML files)
- [ ] CI/CD enhancement for production deployments
- [ ] Health check endpoints
- [ ] Monitoring/logging setup
- [ ] Backup strategies for persistent data

### Documentation
- [ ] Deployment guide
- [ ] Production setup instructions
- [ ] Disaster recovery plan
- [ ] Architecture diagrams for deployment
- [ ] Runbook for common operations

### Testing
- [ ] Integration tests for full workflow
- [ ] Load testing scripts
- [ ] End-to-end test suite
- [ ] Performance benchmarks
- [ ] Security testing/penetration test prep

### Observability & Monitoring
- [ ] Prometheus metrics setup
- [ ] ELK stack configuration (or alternative logging)
- [ ] Alert rules
- [ ] Dashboard definitions
- [ ] APM setup (Application Performance Monitoring)

### Security & Compliance
- [ ] API rate limiting
- [ ] CORS configuration
- [ ] SSL/TLS setup
- [ ] Audit log encryption
- [ ] Secret management (Vault/AWS Secrets)
- [ ] Network policies

### Database & Persistence
- [ ] Qdrant production setup/cluster config
- [ ] Google Sheets API auth and quota management
- [ ] Backup automation for vector store
- [ ] Migration automation scripts
- [ ] Database connection pooling config

### Operational Documentation
- [ ] Deployment checklist
- [ ] Incident response procedures
- [ ] Scaling guidelines
- [ ] Performance tuning guide

## Quality Metrics
- **Test Coverage:** 328 tests across 14 suites (Jest 30)
- **Code Quality:** 95/100 (current)
- **Agent Validation:** 32+ test cases, 98.5% score
- **Agents Complete:** 23/23 (100% validated)

## Project Status
- ✅ Core agents implemented and validated
- ✅ n8n integration architecture complete
- ✅ Testing framework mature (Jest 30, 328 tests, 14 suites)
- ✅ Config management system in place
- ✅ Security validation in CI/CD
- ⏳ Deployment infrastructure (PENDING)
- ⏳ Production documentation (PENDING)
- ⏳ Advanced monitoring/observability (PENDING)
