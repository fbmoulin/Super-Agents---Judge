# n8n Workflow Import Instructions

After starting the Docker stack, import the workflows into n8n.

## Workflow Files

Copy these files from the project root to this directory or import directly:

1. **Main Production Workflow** (Required)
   - `n8n_workflow_v5.1_improved_prompts.json`
   - 21 specialized agents for all legal categories

2. **Fazenda Pública Extension** (Optional)
   - `n8n_workflow_v2.6_fazenda_publica.json`
   - Additional agents for public sector law

## Import Steps

1. Open n8n: http://localhost:5678
2. Login with credentials (default: admin / lex2025!)
3. Go to **Workflows** > **Import from File**
4. Select the workflow JSON file
5. Update credentials in each node (see below)

## Credential Configuration

After import, configure these credentials in n8n Settings > Credentials:

### Gemini API (HTTP Header Auth)
- **Name:** Gemini API Key
- **Header Name:** x-goog-api-key
- **Header Value:** [Your Gemini API Key]

### Anthropic API
- **Name:** Anthropic API
- **API Key:** [Your Anthropic Key]

### Google Sheets OAuth2 (for audit logs)
- **Name:** Google Sheets OAuth2
- **Client ID:** [From Google Cloud Console]
- **Client Secret:** [From Google Cloud Console]
- **Scopes:** https://www.googleapis.com/auth/spreadsheets

## Webhook Activation

1. Open the imported workflow
2. Find the Webhook node (first node)
3. Set webhook to **Production** mode
4. Copy the webhook URL for integration
