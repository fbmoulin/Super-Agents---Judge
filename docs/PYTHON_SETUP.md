# Python Environment Setup

This document covers the setup for Python-based data pipeline scripts.

## Requirements

- Python 3.11 or higher
- pip for package management

## Installation

### 1. Create Virtual Environment

```bash
# Linux/Mac
python -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Optional: ChromaDB Support

If using ChromaDB instead of Qdrant:

```bash
pip install chromadb>=0.4.0
```

## Environment Variables

Create a `.env` file in the project root:

```env
# OpenAI API for embeddings
OPENAI_API_KEY=your-openai-api-key

# Qdrant vector database
QDRANT_URL=http://localhost:6333

# Optional: Qdrant Cloud
# QDRANT_API_KEY=your-qdrant-api-key
```

## Scripts

### STJ Data Downloader

Downloads jurisprudence from STJ (Superior Tribunal de Justiça):

```bash
# Download all available data
npm run download:stj
# or directly:
python scripts/stj_downloader.py --download-all

# Download specific categories
python scripts/stj_downloader.py --category acordaos
python scripts/stj_downloader.py --category sumulas
```

### Qdrant Ingestion

Ingests downloaded data into Qdrant vector store:

```bash
# Ingest all data
npm run ingest:qdrant
# or directly:
python scripts/qdrant_ingest.py

# With custom collection name
python scripts/qdrant_ingest.py --collection stj_jurisprudencia
```

## Qdrant Setup

### Local Installation

Using Docker:

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

### Cloud Setup

1. Create account at [Qdrant Cloud](https://cloud.qdrant.io)
2. Create a cluster
3. Set environment variables:
   - `QDRANT_URL` - Your cluster URL
   - `QDRANT_API_KEY` - Your API key

## Troubleshooting

### Import Errors

If you see import errors, ensure your virtual environment is activated:

```bash
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
```

### Connection Errors

- Verify Qdrant is running: `curl http://localhost:6333/health`
- Check environment variables are set correctly
- Ensure API keys are valid

### Memory Issues

For large datasets, increase batch size in ingestion:

```bash
python scripts/qdrant_ingest.py --batch-size 50
```
