# Python Setup Guide

This document explains how to set up Python for optional components of Lex Intelligentia Judiciário.

## Requirements

- **Python:** 3.11 or higher (3.12+ recommended)
- **Package Manager:** pip, uv, or pipx

## Python Components

The following scripts require Python:

| Script | Purpose |
|--------|---------|
| `stj_downloader.py` | Download STJ jurisprudence data |
| `qdrant_ingest.py` | Ingest documents into Qdrant vector database |

## Setup Instructions

### 1. Create Virtual Environment

Using `uv` (recommended):
```bash
cd /path/to/superagents-judge
uv venv .venv
source .venv/bin/activate  # Linux/Mac
# or .venv\Scripts\activate  # Windows
```

Using `pip`:
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or .venv\Scripts\activate  # Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

Or using `uv`:
```bash
uv pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy the environment template:
```bash
cp .env.keys.template .env.keys
```

Add the following variables to `.env.keys`:
```bash
# OpenAI for embeddings
OPENAI_API_KEY=sk-...

# Qdrant vector database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=  # Optional for local

# STJ downloader (optional)
STJ_BASE_URL=https://scon.stj.jus.br
```

## Usage

### STJ Downloader

Download jurisprudence from STJ:
```bash
npm run download:stj
# or directly:
python scripts/data/stj_downloader.py --download-all
```

Options:
- `--download-all` - Download all available documents
- `--query "tema"` - Search for specific topic
- `--limit 100` - Limit number of results

### Qdrant Ingest

Ingest documents into Qdrant:
```bash
npm run ingest:qdrant
# or directly:
python scripts/data/qdrant_ingest.py
```

Prerequisites:
1. Qdrant must be running (see `docker/docker-compose-qdrant.yml`)
2. Documents must be in the expected format

## Dependencies

From `requirements.txt`:

```
requests>=2.32.0      # HTTP client
python-dotenv>=1.0.0  # Environment variables
qdrant-client>=1.7.0  # Vector database client
openai>=1.0.0         # Embeddings API
```

## Troubleshooting

### Python version mismatch

Check your Python version:
```bash
python --version
```

If below 3.11, install a newer version or use pyenv:
```bash
pyenv install 3.12
pyenv local 3.12
```

### SSL Certificate errors

On some systems, you may need to update certificates:
```bash
pip install --upgrade certifi
```

### Qdrant connection refused

Ensure Qdrant is running:
```bash
docker compose -f docker/docker-compose-qdrant.yml up -d
```

Check the connection:
```bash
curl http://localhost:6333/collections
```
