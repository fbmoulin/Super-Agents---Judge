# Lex Intelligentia Judiciário - Deployment Guide

Complete deployment guide for the multi-agent judicial automation system (21 specialized agents for Brazilian courts, CNJ 615/2025 compliant).

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js   | 18.x    | 20.x LTS    |
| Python    | 3.11+   | 3.12+       |
| n8n       | 1.24+   | Latest      |
| RAM       | 4GB     | 8GB+        |
| Storage   | 10GB    | 50GB (with STJ data) |

## Required API Keys

| Service | Purpose | URL |
|---------|---------|-----|
| **Gemini API** | Router classification | https://aistudio.google.com/app/apikey |
| **Anthropic** | Agent draft generation | https://console.anthropic.com/settings/keys |
| **OpenAI** | Text embeddings (optional) | https://platform.openai.com/api-keys |
| **Google Cloud** | OAuth2 for Sheets audit | https://console.cloud.google.com |

---

## Quick Start (Docker)

```bash
# 1. Clone and configure
cd superagents-judge
cp .env.keys.template .env
# Edit .env with your API keys

# 2. Start all services
docker-compose -f docker/docker-compose.yml up -d

# 3. Access n8n
open http://localhost:5678
# Default: admin / lex2025!

# 4. Import workflows (see n8n Credential Setup below)
```

---

## Manual Installation

### Step 1: Install Dependencies

```bash
# Node.js dependencies
npm ci

# Python dependencies (for RAG pipeline)
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
cp .env.keys.template .env
# Edit .env with your credentials
```

Required variables:
```env
# === CRITICAL (Must Have) ===
ANTHROPIC_API_KEY=sk-ant-api03-...
GEMINI_API_KEY=AIzaSy...

# === AUDIT LOGGING ===
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUDIT_SHEET_ID=1ABC...xyz

# === OPTIONAL (for RAG) ===
OPENAI_API_KEY=sk-...
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

### Step 3: Verify Installation

```bash
# Run tests
npm test

# Validate workflows
npm run validate
npm run validate:v26

# Check config
node -e "console.log(require('./config').getAgentNames())"
```

---

## n8n Workflow Deployment

### Option A: n8n Cloud (Recommended)

1. Sign up at https://n8n.io/cloud
2. Create new workspace
3. Import workflows (see below)

### Option B: Self-Hosted (Docker)

```bash
docker-compose -f docker/docker-compose.yml up -d n8n
```

### Option C: Self-Hosted (npm)

```bash
npm install -g n8n
n8n start
```

### Credential Configuration

Create these credentials in n8n (Settings > Credentials):

#### 1. Gemini API (HTTP Header Auth)
- **Name:** Gemini API Key
- **Header Name:** x-goog-api-key
- **Header Value:** [Your Gemini API Key]

#### 2. Anthropic API
- **Name:** Anthropic API
- **API Key:** [Your Anthropic Key]

#### 3. Google Sheets OAuth2
- **Name:** Google Sheets OAuth2
- **Client ID:** [From Google Cloud Console]
- **Client Secret:** [From Google Cloud Console]
- **Scopes:** https://www.googleapis.com/auth/spreadsheets

### Import Workflows

1. Open n8n dashboard
2. Go to **Workflows** > **Import from File**
3. Import in order:
   - `n8n_workflow_v5.1_improved_prompts.json` (main production)
   - `n8n_workflow_v2.6_fazenda_publica.json` (public law extension)
4. Update credential references in each node

### Activate Webhook

1. Open the imported workflow
2. Find the **Webhook** node (first node)
3. Copy the webhook URL
4. Set webhook to **Production** mode

---

## Audit Log Setup

### Option A: Google Sheets

1. Create a new Google Sheet named "Lex Audit Log"
2. Create columns in Row 1:
   ```
   audit_id | timestamp | operacao | agente | classificacao_risco |
   confianca_classificacao | score_qa | requer_revisao_humana |
   hash_input | hash_output | tempo_execucaoMs | error
   ```
3. Copy Sheet ID from URL: `docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
4. Set `AUDIT_SHEET_ID` in your environment

### Option B: PostgreSQL

```sql
CREATE TABLE audit_logs (
    audit_id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operacao VARCHAR(50) NOT NULL,
    agente VARCHAR(50) NOT NULL,
    classificacao_risco VARCHAR(10) NOT NULL,
    confianca_classificacao DECIMAL(5,4),
    score_qa INTEGER,
    requer_revisao_humana BOOLEAN DEFAULT TRUE,
    hash_input VARCHAR(64),
    hash_output VARCHAR(64),
    tempo_execucao_ms INTEGER,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_agente ON audit_logs(agente);
CREATE INDEX idx_audit_risco ON audit_logs(classificacao_risco);
```

---

## Vector Database (RAG) - Optional

### Start Qdrant

```bash
docker-compose -f docker/docker-compose.yml up -d qdrant
# Verify: curl http://localhost:6333/health
```

### Download STJ Jurisprudence

```bash
source .venv/bin/activate
npm run download:stj
```

### Ingest into Qdrant

```bash
npm run ingest:qdrant
# Verify: curl http://localhost:6333/collections/stj_jurisprudence
```

---

## Testing

### Test Webhook

```bash
curl -X POST https://your-n8n-webhook-url \
  -H "Content-Type: application/json" \
  -d '{
    "classe": "Procedimento Comum Cível",
    "assunto": "Contratos bancários",
    "fatos": "Autor contratou empréstimo consignado...",
    "pedidos": "Revisão de cláusulas abusivas"
  }'
```

Expected response:
```json
{
  "minuta": "I - RELATÓRIO\n\n...",
  "agente": "BANCARIO",
  "score": 87,
  "risco": "BAIXO",
  "audit_id": "LEX-20260131-abc123"
}
```

---

## Production Checklist

### Pre-Production
- [ ] All unit tests passing (`npm test`)
- [ ] Workflow validation passing (`npm run validate`)
- [ ] API keys configured and tested
- [ ] Audit logging verified
- [ ] Webhook URL secured

### Security
- [ ] No API keys in source code
- [ ] `.env` file in `.gitignore`
- [ ] n8n credentials encrypted
- [ ] Rate limiting configured
- [ ] Input validation active

### Monitoring
- [ ] n8n execution logs accessible
- [ ] Audit log entries being recorded
- [ ] Error notifications configured

### Documentation
- [ ] Team trained on system usage
- [ ] CNJ 615/2025 compliance checklist completed
- [ ] Human review workflow established

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT REQUEST                         │
│         POST /webhook/lex-intelligentia                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   n8n WORKFLOW                              │
│  ┌─────────┐   ┌────────┐   ┌────────┐   ┌──────────────┐  │
│  │ Webhook │ → │ Router │ → │ Switch │ → │ Agent (1/21) │  │
│  └─────────┘   │(Gemini)│   │(6 cat) │   │  (Claude)    │  │
│                └────────┘   └────────┘   └──────┬───────┘  │
│                                                  │          │
│                              ┌───────────────────▼────────┐ │
│                              │ QA Check → Risk → Audit   │ │
│                              └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Common Issues

1. **"ANTHROPIC_API_KEY not set"**
   - Ensure `.env` file exists and is loaded
   - Verify key format: `sk-ant-api03-...`

2. **Webhook not responding**
   - Check n8n is running
   - Verify workflow is activated
   - Check webhook is in "Production" mode

3. **Low quality scores**
   - Review agent prompts
   - Check input data format
   - Run `npm run test:agent` for diagnostics

4. **Audit log not updating**
   - Verify Google Sheets OAuth2 credentials
   - Check Sheet ID is correct
   - Review n8n execution logs

---

## Support

- **Repository:** github.com/[org]/superagents-judge
- **Maintainer:** 2ª Vara Cível de Cariacica/ES
- **CNJ Reference:** Resolução 615/2025
