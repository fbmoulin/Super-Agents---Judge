# RAG Integration Guide - Lex Intelligentia

## Overview

This guide covers the integration of RAG (Retrieval Augmented Generation) with STJ jurisprudence into the Lex Intelligentia workflow.

## Architecture

```
[Input] → [Generate Embedding] → [Search Qdrant] → [Format Context] → [AI Agent]
                                                            ↓
                                              [Merge: RAG Context + Input]
```

## Prerequisites

1. **Qdrant Vector Store Running**
   ```bash
   docker-compose -f docker/docker-compose-qdrant.yml up -d
   ```

2. **Data Ingested**
   ```bash
   # Process local knowledge base
   python scripts/stj_downloader.py --process --processed-output data/stj_chunks/

   # Ingest into Qdrant (requires OPENAI_API_KEY)
   python scripts/qdrant_ingest.py --ingest --collection stj_precedentes
   ```

3. **OpenAI API Key** configured for embeddings

## n8n Workflow Integration

### Option 1: AI Agent Tool (Recommended)

Add the RAG search as a tool available to the AI Agent:

```javascript
// Tool Configuration
{
  "name": "busca_jurisprudencia_stj",
  "description": "Busca jurisprudencia relevante do STJ por similaridade semantica",
  "parameters": {
    "query": "string - descricao do caso ou questao juridica"
  }
}
```

The agent can invoke this tool when it needs to cite jurisprudence.

### Option 2: Pre-Agent RAG Search

Add RAG search before each specialized agent:

1. **Extract Query** from input (fatos + questoes)
2. **Generate Embedding** via OpenAI API
3. **Search Qdrant** for top 5 similar precedents
4. **Merge Context** with original input

### Workflow Nodes

Import `n8n_nodes/rag_search_tool.json` for pre-built nodes.

## API Endpoints

### Generate Embedding (OpenAI)

```bash
curl -X POST https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "contrato bancario juros abusivos"
  }'
```

### Search Qdrant

```bash
curl -X POST http://localhost:6333/collections/stj_precedentes/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.123, -0.456, ...],
    "limit": 5,
    "with_payload": true,
    "score_threshold": 0.7
  }'
```

## Testing

### Local Test

```bash
python scripts/qdrant_ingest.py --search "contrato bancario juros abusivos" --limit 5
```

### Expected Output

```json
[
  {
    "id": 1,
    "score": 0.89,
    "payload": {
      "tipo": "sumula",
      "tribunal": "STJ",
      "numero": "297",
      "text": "O Codigo de Defesa do Consumidor e aplicavel as instituicoes financeiras"
    }
  }
]
```

## Context Formatting

The RAG results are formatted as:

```markdown
## PRECEDENTES STJ RELEVANTES

[1] Sumula 297/STJ: O Codigo de Defesa do Consumidor e aplicavel...
[2] Tema 972/STJ: Abusividade da exigencia de contratacao de seguro...

---
Fonte: Vector Store STJ (score >= 0.7)
```

This context is prepended to the agent's system prompt or user message.

## Filters

You can filter by domain in the Qdrant query:

```json
{
  "filter": {
    "must": [
      {"key": "domains", "match": {"value": "bancario"}}
    ]
  }
}
```

Available domains:
- bancario
- saude
- incorporacao
- consumidor
- processual
- obrigacional

## Troubleshooting

### No Results

1. Check Qdrant is running: `curl http://localhost:6333/collections`
2. Verify data ingested: `python scripts/qdrant_ingest.py --stats`
3. Lower score_threshold (default 0.7)

### Slow Queries

1. Check Qdrant container resources
2. Consider reducing vector dimension or using quantization
3. Add HNSW index for faster search

## Metrics

Track RAG performance:
- Average similarity score
- Results count per query
- Query latency
- Cache hit rate (if caching enabled)
