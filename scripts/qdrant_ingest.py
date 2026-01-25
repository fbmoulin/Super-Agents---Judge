#!/usr/bin/env python3
"""
Qdrant Ingestion Script
Ingest STJ chunks into Qdrant vector store.

Usage:
    python scripts/qdrant_ingest.py --input data/stj_chunks/ --collection stj_precedentes
    python scripts/qdrant_ingest.py --create-collection --collection stj_precedentes
    python scripts/qdrant_ingest.py --stats --collection stj_precedentes

Requirements:
    pip install qdrant-client openai python-dotenv
"""

import os
import json
import argparse
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_MODEL = "text-embedding-3-small"
VECTOR_SIZE = 1024  # text-embedding-3-small with dimensions param
BATCH_SIZE = 100


def get_qdrant_client():
    """Get Qdrant client instance."""
    try:
        from qdrant_client import QdrantClient
        return QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    except ImportError:
        logger.error("qdrant-client not installed. Run: pip install qdrant-client")
        raise


def get_embedding(text: str, client=None) -> List[float]:
    """Get embedding from OpenAI."""
    try:
        import openai
        if client is None:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text,
            dimensions=VECTOR_SIZE
        )
        return response.data[0].embedding
    except ImportError:
        logger.error("openai not installed. Run: pip install openai")
        raise


def get_embeddings_batch(texts: List[str], client=None) -> List[List[float]]:
    """Get embeddings for a batch of texts."""
    try:
        import openai
        if client is None:
            client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=texts,
            dimensions=VECTOR_SIZE
        )
        return [item.embedding for item in response.data]
    except ImportError:
        logger.error("openai not installed. Run: pip install openai")
        raise


def create_collection(client, collection_name: str):
    """Create Qdrant collection if not exists."""
    from qdrant_client.models import Distance, VectorParams

    collections = client.get_collections().collections
    existing_names = [c.name for c in collections]

    if collection_name not in existing_names:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE
            )
        )
        logger.info(f"Created collection: {collection_name}")
    else:
        logger.info(f"Collection {collection_name} already exists")


def load_chunks(chunks_dir: Path) -> List[Dict[str, Any]]:
    """Load chunks from JSON file."""
    chunks_file = chunks_dir / "stj_chunks_vectorstore.json"
    if not chunks_file.exists():
        raise FileNotFoundError(f"Chunks file not found: {chunks_file}")

    with open(chunks_file, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    logger.info(f"Loaded {len(chunks)} chunks from {chunks_file}")
    return chunks


def ingest_chunks(client, collection_name: str, chunks: List[Dict[str, Any]]):
    """Ingest chunks into Qdrant with embeddings."""
    from qdrant_client.models import PointStruct
    import openai

    openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
    total_ingested = 0

    # Process in batches
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        texts = [c.get("text_for_embedding", "") for c in batch]

        # Get embeddings for batch
        logger.info(f"Generating embeddings for batch {i // BATCH_SIZE + 1}...")
        embeddings = get_embeddings_batch(texts, openai_client)

        # Create points
        points = []
        for j, (chunk, embedding) in enumerate(zip(batch, embeddings)):
            point = PointStruct(
                id=i + j,
                vector=embedding,
                payload={
                    "id": chunk.get("id", ""),
                    "text": chunk.get("text_for_embedding", ""),
                    "tipo": chunk.get("tipo", ""),
                    "tribunal": chunk.get("tribunal", ""),
                    "numero": chunk.get("numero", ""),
                    "domains": chunk.get("domains", []),
                    "keywords": chunk.get("keywords", []),
                    "content_hash": chunk.get("content_hash", "")
                }
            )
            points.append(point)

        # Upsert batch
        client.upsert(collection_name=collection_name, points=points)
        total_ingested += len(points)
        logger.info(f"Ingested {total_ingested}/{len(chunks)} chunks")

    logger.info(f"Total chunks ingested: {total_ingested}")


def get_collection_stats(client, collection_name: str) -> Dict[str, Any]:
    """Get collection statistics."""
    try:
        info = client.get_collection(collection_name)
        return {
            "name": collection_name,
            "vectors_count": info.vectors_count,
            "points_count": info.points_count,
            "status": info.status.name,
            "config": {
                "vector_size": info.config.params.vectors.size,
                "distance": info.config.params.vectors.distance.name
            }
        }
    except Exception as e:
        return {"error": str(e)}


def search_similar(client, collection_name: str, query: str, limit: int = 5) -> List[Dict]:
    """Search for similar chunks."""
    import openai
    openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

    # Get query embedding
    query_embedding = get_embedding(query, openai_client)

    # Search
    results = client.search(
        collection_name=collection_name,
        query_vector=query_embedding,
        limit=limit
    )

    return [
        {
            "id": r.id,
            "score": r.score,
            "payload": r.payload
        }
        for r in results
    ]


def main():
    parser = argparse.ArgumentParser(description="Ingest STJ chunks into Qdrant")
    parser.add_argument("--input", type=str, default="data/stj_chunks/",
                        help="Input directory with chunks")
    parser.add_argument("--collection", type=str, default="stj_precedentes",
                        help="Collection name")
    parser.add_argument("--create-collection", action="store_true",
                        help="Only create collection (don't ingest)")
    parser.add_argument("--ingest", action="store_true",
                        help="Ingest chunks into collection")
    parser.add_argument("--stats", action="store_true",
                        help="Show collection statistics")
    parser.add_argument("--search", type=str,
                        help="Search for similar chunks")
    parser.add_argument("--limit", type=int, default=5,
                        help="Number of search results")
    args = parser.parse_args()

    # Check for OpenAI API key
    if not OPENAI_API_KEY and (args.ingest or args.search):
        logger.error("OPENAI_API_KEY environment variable not set")
        return

    client = get_qdrant_client()

    if args.create_collection:
        create_collection(client, args.collection)

    if args.ingest:
        create_collection(client, args.collection)
        chunks = load_chunks(Path(args.input))
        ingest_chunks(client, args.collection, chunks)

    if args.stats:
        stats = get_collection_stats(client, args.collection)
        print(json.dumps(stats, indent=2))

    if args.search:
        results = search_similar(client, args.collection, args.search, args.limit)
        print(json.dumps(results, indent=2, ensure_ascii=False))

    if not any([args.create_collection, args.ingest, args.stats, args.search]):
        parser.print_help()


if __name__ == "__main__":
    main()
